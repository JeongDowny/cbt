import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { SolveQuestion } from "@/features/exams/types";

interface ExamSubjectRow {
  id: string;
  subject_order: number;
  name: string;
}

function toImageUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const supabase = createSupabasePublicClient();
  const { data } = supabase.storage.from("question-images").getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

export async function fetchSolveData(examId: string): Promise<{ examTitle: string; questions: SolveQuestion[] }> {
  const supabase = createSupabasePublicClient();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, title, is_public, status")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    throw new Error(examError?.message ?? "시험 정보를 찾을 수 없습니다.");
  }

  if (!exam.is_public || exam.status !== "published") {
    throw new Error("공개된 시험만 응시할 수 있습니다.");
  }

  const { data: subjects, error: subjectError } = await supabase
    .from("exam_subjects")
    .select("id, subject_order, name")
    .eq("exam_id", examId)
    .order("subject_order", { ascending: true });

  if (subjectError) {
    throw new Error(subjectError.message);
  }

  const typedSubjects = (subjects ?? []) as ExamSubjectRow[];
  const subjectIds = typedSubjects.map((subject) => subject.id);
  if (subjectIds.length === 0) {
    return { examTitle: exam.title, questions: [] };
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4")
    .in("exam_subject_id", subjectIds)
    .order("question_no", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: images, error: imageError } = questionIds.length
    ? await supabase
        .from("question_images")
        .select("question_id, image_order, image_path")
        .in("question_id", questionIds)
        .order("image_order", { ascending: true })
    : { data: [], error: null };

  if (imageError) {
    throw new Error(imageError.message);
  }

  const subjectById = new Map(typedSubjects.map((subject) => [subject.id, subject]));

  const mappedQuestions: SolveQuestion[] = (questions ?? []).map((question) => {
    const subject = subjectById.get(question.exam_subject_id);
    const questionImages = (images ?? [])
      .filter((image) => image.question_id === question.id)
      .map((image) => toImageUrl(image.image_path));

    return {
      id: question.id,
      examSubjectId: question.exam_subject_id,
      subjectName: subject?.name ?? "미분류",
      subjectOrder: subject?.subject_order ?? 999,
      questionNo: question.question_no,
      stem: question.stem,
      imagePaths: questionImages,
      choices: [
        { no: 1, text: question.choice_1 },
        { no: 2, text: question.choice_2 },
        { no: 3, text: question.choice_3 },
        { no: 4, text: question.choice_4 },
      ],
    };
  });

  mappedQuestions.sort((a, b) => {
    if (a.subjectOrder !== b.subjectOrder) {
      return a.subjectOrder - b.subjectOrder;
    }
    return a.questionNo - b.questionNo;
  });

  return {
    examTitle: exam.title,
    questions: mappedQuestions,
  };
}
