import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toSupabasePublicStorageUrl } from "@/lib/supabase/storage";
import type { SolveQuestion } from "@/features/exams/types";

interface ExamRow {
  id: string;
  title: string;
  is_public: boolean;
  status: "draft" | "published" | "archived";
}

interface ExamSubjectRow {
  id: string;
  subject_order: number;
  name: string;
}

interface QuestionRow {
  id: string;
  exam_subject_id: string;
  question_no: number;
  stem: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  explanation_video_url: string | null;
}

interface QuestionImageRow {
  question_id: string;
  image_order: number;
  image_path: string;
}

function toImageUrl(pathOrUrl: string): string {
  return toSupabasePublicStorageUrl("question-images", pathOrUrl) ?? pathOrUrl;
}

function mapSolveQuestion(question: QuestionRow, subjectById: Map<string, ExamSubjectRow>, images: QuestionImageRow[]): SolveQuestion {
  const subject = subjectById.get(question.exam_subject_id);
  const questionImages = images.filter((image) => image.question_id === question.id).map((image) => toImageUrl(image.image_path));

  return {
    id: question.id,
    examSubjectId: question.exam_subject_id,
    subjectName: subject?.name ?? "미분류",
    subjectOrder: subject?.subject_order ?? 999,
    questionNo: question.question_no,
    stem: question.stem,
    imagePaths: questionImages,
    explanationVideoUrl: question.explanation_video_url,
    choices: [
      { no: 1, text: question.choice_1 },
      { no: 2, text: question.choice_2 },
      { no: 3, text: question.choice_3 },
      { no: 4, text: question.choice_4 },
    ],
  };
}

export async function fetchSolveData(examId: string): Promise<{ examTitle: string; questions: SolveQuestion[] }> {
  const supabase = createSupabasePublicClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, title, is_public, status")
    .eq("id", examId)
    .single();
  const typedExam = exam as ExamRow | null;

  if (examError || !typedExam) {
    throw new Error(examError?.message ?? "시험 정보를 찾을 수 없습니다.");
  }

  if (!user && (!typedExam.is_public || typedExam.status !== "published")) {
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
    return { examTitle: typedExam.title, questions: [] };
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4, explanation_video_url")
    .in("exam_subject_id", subjectIds)
    .order("question_no", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }
  const typedQuestions = (questions ?? []) as QuestionRow[];

  const questionIds = typedQuestions.map((question) => question.id);
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
  const typedImages = (images ?? []) as QuestionImageRow[];

  const mappedQuestions = typedQuestions.map((question) => mapSolveQuestion(question, subjectById, typedImages));

  mappedQuestions.sort((a, b) => {
    if (a.subjectOrder !== b.subjectOrder) {
      return a.subjectOrder - b.subjectOrder;
    }
    return a.questionNo - b.questionNo;
  });

  return {
    examTitle: typedExam.title,
    questions: mappedQuestions,
  };
}
