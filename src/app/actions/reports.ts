"use server";

import { createClient } from "@supabase/supabase-js";

import type { AttemptAnswerReview, AttemptReport, LookupAttemptRow } from "@/features/reports/types";
import type { Database } from "@/types/database";

function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 서버 설정이 누락되었습니다.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toPublicImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const url = process.env.SUPABASE_URL;
  if (!url) {
    return path;
  }

  const normalized = path.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/question-images/${normalized}`;
}

export async function submitAttemptAction(input: {
  examId: string;
  userName: string;
  birthDate: string;
  answers: Record<string, number>;
  questionIds: string[];
}): Promise<{ attemptId: string }> {
  const userName = input.userName.trim();
  const birthDate = input.birthDate.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("생년월일 형식을 확인해 주세요.");
  }

  const questionIds = Array.from(new Set(input.questionIds));
  if (questionIds.length === 0) {
    throw new Error("제출할 문항이 없습니다.");
  }

  const supabase = createAdminClient();

  const { data: exam } = await supabase.from("exams").select("id").eq("id", input.examId).maybeSingle();
  if (!exam) {
    throw new Error("시험 정보를 찾을 수 없습니다.");
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation")
    .in("id", questionIds);

  if (questionError) {
    throw new Error(questionError.message);
  }

  const typedQuestions = questions ?? [];
  if (typedQuestions.length === 0) {
    throw new Error("문항 정보를 찾을 수 없습니다.");
  }

  const subjectIds = Array.from(new Set(typedQuestions.map((question) => question.exam_subject_id)));
  const { data: subjects, error: subjectError } = await supabase
    .from("exam_subjects")
    .select("id, exam_id, name")
    .in("id", subjectIds);

  if (subjectError) {
    throw new Error(subjectError.message);
  }

  const subjectMap = new Map((subjects ?? []).map((subject) => [subject.id, subject]));

  for (const question of typedQuestions) {
    const subject = subjectMap.get(question.exam_subject_id);
    if (!subject || subject.exam_id !== input.examId) {
      throw new Error("시험/과목/문항 관계가 올바르지 않습니다.");
    }
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      exam_id: input.examId,
      user_name: userName,
      birth_date: birthDate,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    throw new Error(attemptError?.message ?? "응시 생성에 실패했습니다.");
  }

  const attemptId = attempt.id;

  const { data: insertedSubjects, error: attemptSubjectsError } = await supabase
    .from("attempt_subjects")
    .insert(
      subjectIds.map((subjectId) => ({
        attempt_id: attemptId,
        exam_subject_id: subjectId,
        subject_name_snapshot: subjectMap.get(subjectId)?.name ?? "미분류",
      }))
    )
    .select("id, exam_subject_id");

  if (attemptSubjectsError) {
    throw new Error(attemptSubjectsError.message);
  }

  const attemptSubjectMap = new Map((insertedSubjects ?? []).map((item) => [item.exam_subject_id, item.id]));

  const { data: images } = await supabase
    .from("question_images")
    .select("question_id, image_order, image_path")
    .in("question_id", typedQuestions.map((question) => question.id))
    .order("image_order", { ascending: true });

  const answersPayload = typedQuestions.map((question) => ({
    attempt_subject_id: attemptSubjectMap.get(question.exam_subject_id) as string,
    question_id: question.id,
    question_no: question.question_no,
    subject_name_snapshot: subjectMap.get(question.exam_subject_id)?.name ?? "미분류",
    stem_snapshot: question.stem,
    choice_1_snapshot: question.choice_1,
    choice_2_snapshot: question.choice_2,
    choice_3_snapshot: question.choice_3,
    choice_4_snapshot: question.choice_4,
    correct_answer_snapshot: question.correct_answer,
    explanation_snapshot: question.explanation,
    image_paths_snapshot: (images ?? [])
      .filter((image) => image.question_id === question.id)
      .map((image) => image.image_path),
    selected_answer: input.answers[question.id] ?? null,
    answered_at: input.answers[question.id] ? new Date().toISOString() : null,
  }));

  const { error: answerError } = await supabase.from("attempt_answers").insert(answersPayload);
  if (answerError) {
    throw new Error(answerError.message);
  }

  const { error: finalizeError } = await supabase.rpc("finalize_attempt", {
    p_attempt_id: attemptId,
  });

  if (finalizeError) {
    throw new Error(finalizeError.message);
  }

  return { attemptId };
}

export async function getAttemptReportAction(attemptId: string): Promise<AttemptReport | null> {
  const supabase = createAdminClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("id, exam_id, user_name, birth_date, total_score, passed, submitted_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError) {
    throw new Error(attemptError.message);
  }

  if (!attempt) {
    return null;
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, certifications(name)")
    .eq("id", attempt.exam_id)
    .maybeSingle();

  const certification = exam
    ? Array.isArray(exam.certifications)
      ? exam.certifications[0]
      : exam.certifications
    : null;

  const { data: subjects } = await supabase
    .from("attempt_subjects")
    .select("id, subject_name_snapshot, score, passed")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select(
      "id, question_no, subject_name_snapshot, stem_snapshot, choice_1_snapshot, choice_2_snapshot, choice_3_snapshot, choice_4_snapshot, correct_answer_snapshot, selected_answer, is_correct, explanation_snapshot, image_paths_snapshot"
    )
    .in("attempt_subject_id", (subjects ?? []).map((subject) => subject.id))
    .order("question_no", { ascending: true });

  const reviews: AttemptAnswerReview[] = (answers ?? []).map((answer) => ({
    id: answer.id,
    questionNo: answer.question_no,
    subjectName: answer.subject_name_snapshot,
    stem: answer.stem_snapshot,
    choices: [
      { no: 1, text: answer.choice_1_snapshot },
      { no: 2, text: answer.choice_2_snapshot },
      { no: 3, text: answer.choice_3_snapshot },
      { no: 4, text: answer.choice_4_snapshot },
    ],
    correctAnswer: answer.correct_answer_snapshot,
    selectedAnswer: answer.selected_answer,
    isCorrect: answer.is_correct,
    explanation: answer.explanation_snapshot,
    imagePaths: ((answer.image_paths_snapshot as string[] | null) ?? []).map((path) => toPublicImageUrl(path)),
  }));

  const correctCount = reviews.filter((review) => review.isCorrect).length;

  return {
    id: attempt.id,
    examId: attempt.exam_id,
    examTitle: exam?.title ?? "시험",
    certificationName: certification?.name ?? "자격",
    userName: attempt.user_name,
    birthDate: attempt.birth_date,
    score: Number(attempt.total_score),
    passed: attempt.passed,
    correctCount,
    totalQuestions: reviews.length,
    submittedAt: attempt.submitted_at,
    subjects: (subjects ?? []).map((subject) => ({
      id: subject.id,
      subjectName: subject.subject_name_snapshot,
      score: Number(subject.score),
      passed: subject.passed,
    })),
    reviews,
  };
}

export async function lookupAttemptsAction(input: {
  userName: string;
  birthDate: string;
}): Promise<LookupAttemptRow[]> {
  const userName = input.userName.trim();
  const birthDate = input.birthDate.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("생년월일 형식을 확인해 주세요.");
  }

  const supabase = createAdminClient();

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("id, exam_id, total_score, passed, submitted_at")
    .eq("user_name", userName)
    .eq("birth_date", birthDate)
    .eq("status", "submitted")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const examIds = Array.from(new Set((attempts ?? []).map((attempt) => attempt.exam_id)));
  const { data: exams } = examIds.length
    ? await supabase
        .from("exams")
        .select("id, title, certifications(name)")
        .in("id", examIds)
    : { data: [] };

  const examMap = new Map(
    (exams ?? []).map((exam) => [
      exam.id,
      {
        title: exam.title,
        certification: Array.isArray(exam.certifications) ? exam.certifications[0]?.name : exam.certifications?.name,
      },
    ])
  );

  return (attempts ?? []).map((attempt) => ({
    id: attempt.id,
    examTitle: examMap.get(attempt.exam_id)?.title ?? "시험",
    certificationName: examMap.get(attempt.exam_id)?.certification ?? "자격",
    score: Number(attempt.total_score),
    passed: attempt.passed,
    submittedAt: attempt.submitted_at,
  }));
}
