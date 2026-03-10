import type { AdminExamFormValues, QuestionForm } from "@/features/admin/exams/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function buildDefaultQuestion(): QuestionForm {
  const baseChoices: QuestionForm["choices"] = [
    { choiceNo: 1, content: "" },
    { choiceNo: 2, content: "" },
    { choiceNo: 3, content: "" },
    { choiceNo: 4, content: "" },
  ];

  return {
    stem: "",
    choiceCount: 4,
    correctChoiceNo: 1,
    imagePath: null,
    explanation: "",
    choices: baseChoices,
  };
}

export function createEmptyExamFormValues(): AdminExamFormValues {
  return {
    certificationName: "",
    title: "",
    examYear: new Date().getFullYear(),
    examRound: 1,
    defaultTimeLimitMinutes: 60,
    isPublished: false,
    questions: [buildDefaultQuestion()],
  };
}

export async function getExamFormValuesById(examId: string): Promise<AdminExamFormValues | null> {
  const supabase = createSupabaseAdminClient();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, certification_name, title, exam_year, exam_round, default_time_limit_minutes, is_published")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return null;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_no, stem, image_path, choice_count, explanation, correct_choice_id")
    .eq("exam_id", examId)
    .order("question_no", { ascending: true });

  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: choices } = questionIds.length
    ? await supabase
        .from("choices")
        .select("id, question_id, choice_no, content")
        .in("question_id", questionIds)
        .order("choice_no", { ascending: true })
    : { data: [] as { id: string; question_id: string; choice_no: number; content: string }[] };

  const formQuestions: QuestionForm[] = (questions ?? []).map((question) => {
    const relatedChoices = (choices ?? [])
      .filter((choice) => choice.question_id === question.id)
      .sort((a, b) => a.choice_no - b.choice_no);

    const normalizedChoices = Array.from({ length: question.choice_count }, (_, idx) => {
      const choiceNo = (idx + 1) as 1 | 2 | 3 | 4 | 5;
      const found = relatedChoices.find((choice) => choice.choice_no === choiceNo);
      return {
        choiceNo,
        content: found?.content ?? "",
      };
    });

    const correctChoice = relatedChoices.find((choice) => choice.id === question.correct_choice_id);

    return {
      stem: question.stem,
      choiceCount: question.choice_count as 4 | 5,
      correctChoiceNo: (correctChoice?.choice_no ?? 1) as 1 | 2 | 3 | 4 | 5,
      imagePath: question.image_path,
      explanation: question.explanation ?? "",
      choices: normalizedChoices,
    };
  });

  return {
    certificationName: exam.certification_name,
    title: exam.title,
    examYear: exam.exam_year,
    examRound: exam.exam_round,
    defaultTimeLimitMinutes: exam.default_time_limit_minutes,
    isPublished: exam.is_published,
    questions: formQuestions.length ? formQuestions : [buildDefaultQuestion()],
  };
}
