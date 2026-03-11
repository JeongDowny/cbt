import type { AdminExamFormValues, QuestionForm } from "@/features/admin/exams/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function buildDefaultQuestion(): QuestionForm {
  return {
    subjectName: "전기자기학",
    subjectTimeLimitMinutes: 30,
    stem: "",
    correctChoiceNo: 1,
    imagePath: null,
    explanation: "",
    choices: [
      { choiceNo: 1, content: "" },
      { choiceNo: 2, content: "" },
      { choiceNo: 3, content: "" },
      { choiceNo: 4, content: "" },
    ],
  };
}

export function createEmptyExamFormValues(): AdminExamFormValues {
  return {
    certificationName: "",
    examYear: new Date().getFullYear(),
    examRound: 1,
    status: "draft",
    isPublic: false,
    questions: [buildDefaultQuestion()],
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
        .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation")
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

  const subjectById = new Map(
    (subjects ?? []).map((subject) => [subject.id, { name: subject.name, timeLimitMinutes: subject.time_limit_minutes }])
  );

  const formQuestions: QuestionForm[] = (questions ?? []).map((question) => {
    const subject = subjectById.get(question.exam_subject_id);
    const image = (images ?? []).find((item) => item.question_id === question.id && item.image_order === 1);

    return {
      subjectName: subject?.name ?? "공통",
      subjectTimeLimitMinutes: subject?.timeLimitMinutes ?? 30,
      stem: question.stem,
      correctChoiceNo: question.correct_answer as 1 | 2 | 3 | 4,
      imagePath: image?.image_path ?? null,
      explanation: question.explanation,
      choices: [
        { choiceNo: 1, content: question.choice_1 },
        { choiceNo: 2, content: question.choice_2 },
        { choiceNo: 3, content: question.choice_3 },
        { choiceNo: 4, content: question.choice_4 },
      ],
    };
  });

  return {
    certificationName: certification?.name ?? "",
    examYear: exam.exam_year,
    examRound: exam.exam_round,
    status: exam.status,
    isPublic: exam.is_public,
    questions: formQuestions.length ? formQuestions : [buildDefaultQuestion()],
  };
}
