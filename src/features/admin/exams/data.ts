import type { AdminExamFormValues, QuestionForm, SubjectForm } from "@/features/admin/exams/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export function buildDefaultSubject(): SubjectForm {
  return {
    name: "",
    timeLimitMinutes: 30,
    questions: [],
  };
}

export function createEmptyExamFormValues(): AdminExamFormValues {
  return {
    certificationName: "",
    examYear: new Date().getFullYear(),
    examRound: 1,
    status: "draft",
    isPublic: false,
    subjects: [],
  };
}

export async function getExamFormValuesById(examId: string): Promise<AdminExamFormValues | null> {
  const supabase = createSupabaseAdminClient();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, exam_year, exam_round, status, is_public, certifications(name)")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return null;
  }

  const certification = Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications;

  const { data: subjects } = await supabase
    .from("exam_subjects")
    .select("id, subject_order, name, time_limit_minutes")
    .eq("exam_id", examId)
    .order("subject_order", { ascending: true });

  const subjectIds = (subjects ?? []).map((subject) => subject.id);
  const { data: questions } = subjectIds.length
    ? await supabase
        .from("questions")
        .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation, explanation_video_url")
        .in("exam_subject_id", subjectIds)
        .order("question_no", { ascending: true })
    : { data: [] };

  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: images } = questionIds.length
    ? await supabase
        .from("question_images")
        .select("question_id, image_order, image_path")
        .in("question_id", questionIds)
        .order("image_order", { ascending: true })
    : { data: [] };

  const subjectQuestionMap = new Map<string, QuestionForm[]>();

  (questions ?? []).forEach((question) => {
    const image = (images ?? []).find((item) => item.question_id === question.id && item.image_order === 1);
    const existingQuestions = subjectQuestionMap.get(question.exam_subject_id) ?? [];

    existingQuestions.push({
      stem: question.stem,
      correctChoiceNo: question.correct_answer as 1 | 2 | 3 | 4,
      imagePath: image?.image_path ?? null,
      explanation: question.explanation,
      explanationVideoUrl: question.explanation_video_url ?? "",
      choices: [
        { choiceNo: 1, content: question.choice_1 },
        { choiceNo: 2, content: question.choice_2 },
        { choiceNo: 3, content: question.choice_3 },
        { choiceNo: 4, content: question.choice_4 },
      ],
    });

    subjectQuestionMap.set(question.exam_subject_id, existingQuestions);
  });

  const formSubjects: SubjectForm[] = (subjects ?? []).map((subject) => ({
    name: subject.name,
    timeLimitMinutes: subject.time_limit_minutes,
    questions: subjectQuestionMap.get(subject.id) ?? [],
  }));

  return {
    certificationName: certification?.name ?? "",
    examYear: exam.exam_year,
    examRound: exam.exam_round,
    status: exam.status,
    isPublic: exam.is_public,
    subjects: formSubjects.length ? formSubjects : [],
  };
}
