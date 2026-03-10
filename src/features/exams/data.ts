import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { SolveQuestion } from "@/features/exams/types";

interface LegacyQuestionRow {
  id: string;
  question_no: number;
  stem: string;
  image_url: string | null;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  choice_5?: string | null;
}

interface NextQuestionRow {
  id: string;
  question_no: number;
  stem: string;
  image_path: string | null;
  choice_count: number;
}

interface ChoiceRow {
  question_id: string;
  choice_no: number;
  content: string;
}

function resolveImageUrl(imagePath: string | null): string | null {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const supabase = createSupabasePublicClient();
  const { data } = supabase.storage.from("question-images").getPublicUrl(imagePath);
  return data.publicUrl;
}

async function fetchQuestionsFromNextSchema(examId: string): Promise<SolveQuestion[] | null> {
  const supabase = createSupabasePublicClient();

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, question_no, stem, image_path, choice_count")
    .eq("exam_id", examId)
    .order("question_no", { ascending: true });

  if (questionError) {
    return null;
  }

  const typedQuestions = (questions ?? []) as NextQuestionRow[];
  if (typedQuestions.length === 0) {
    return [];
  }

  const questionIds = typedQuestions.map((question) => question.id);
  const { data: choices, error: choiceError } = await supabase
    .from("choices")
    .select("question_id, choice_no, content")
    .in("question_id", questionIds)
    .order("choice_no", { ascending: true });

  if (choiceError) {
    return null;
  }

  const typedChoices = (choices ?? []) as ChoiceRow[];

  return typedQuestions.map((question) => {
    const choicesForQuestion = typedChoices
      .filter((choice) => choice.question_id === question.id)
      .filter((choice) => choice.choice_no >= 1 && choice.choice_no <= question.choice_count)
      .sort((a, b) => a.choice_no - b.choice_no)
      .map((choice) => ({
        no: choice.choice_no,
        text: choice.content,
      }));

    return {
      id: question.id,
      questionNo: question.question_no,
      stem: question.stem,
      imageUrl: resolveImageUrl(question.image_path),
      choices: choicesForQuestion,
    };
  });
}

async function fetchQuestionsFromLegacySchema(examId: string): Promise<SolveQuestion[]> {
  const supabase = createSupabasePublicClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question_no, stem, image_url, choice_1, choice_2, choice_3, choice_4")
    .eq("exam_id", examId)
    .order("question_no", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((questions ?? []) as LegacyQuestionRow[]).map((question) => {
    const choices = [question.choice_1, question.choice_2, question.choice_3, question.choice_4]
      .map((text, idx) => ({
        no: idx + 1,
        text,
      }))
      .filter((choice) => choice.text && choice.text.trim().length > 0);

    if (question.choice_5 && question.choice_5.trim().length > 0) {
      choices.push({ no: 5, text: question.choice_5 });
    }

    return {
      id: question.id,
      questionNo: question.question_no,
      stem: question.stem,
      imageUrl: question.image_url,
      choices,
    };
  });
}

export async function fetchSolveData(examId: string): Promise<{ examTitle: string; questions: SolveQuestion[] }> {
  const supabase = createSupabasePublicClient();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, title")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    throw new Error(examError?.message ?? "시험 정보를 찾을 수 없습니다.");
  }

  const nextQuestions = await fetchQuestionsFromNextSchema(examId);
  const questions = nextQuestions ?? (await fetchQuestionsFromLegacySchema(examId));

  return {
    examTitle: String(exam.title ?? "CBT Exam"),
    questions,
  };
}
