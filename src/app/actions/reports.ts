"use server";

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { formatClassGroupLabel } from "@/features/classes/data";
import type { AttemptAnswerReview, AttemptReport, LookupAttemptRow } from "@/features/reports/types";
import { toSupabasePublicStorageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

const LEGACY_BIRTH_DATE_FALLBACK = "1900-01-01";
const ATTEMPT_WORK_IMAGES_BUCKET = "attempt-work-images";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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

export async function uploadAttemptWorkImageAction(formData: FormData): Promise<{ path: string; publicUrl: string }> {
  const file = formData.get("file");
  const draftId = String(formData.get("draftId") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();

  if (!(file instanceof File)) {
    throw new Error("업로드할 손풀이 이미지가 없습니다.");
  }

  if (!draftId || !questionId) {
    throw new Error("손풀이 업로드 정보가 올바르지 않습니다.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `draft-attempts/${draftId}/${questionId}/${randomUUID()}-${safeName}`;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(ATTEMPT_WORK_IMAGES_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(`손풀이 이미지 업로드 실패: ${error.message}`);
  }

  return {
    path,
    publicUrl: toSupabasePublicStorageUrl(ATTEMPT_WORK_IMAGES_BUCKET, path) ?? path,
  };
}

export async function deleteAttemptWorkImageAction(formData: FormData): Promise<void> {
  const path = String(formData.get("path") ?? "").trim();
  if (!path) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(ATTEMPT_WORK_IMAGES_BUCKET).remove([path]);
  if (error) {
    throw new Error(`손풀이 이미지 삭제 실패: ${error.message}`);
  }
}

export async function submitAttemptAction(input: {
  examId: string;
  classGroupId: string;
  userName: string;
  answers: Record<string, number>;
  questionIds: string[];
  workImagePaths: Record<string, string | null>;
}): Promise<{ attemptId: string }> {
  const userName = input.userName.trim();
  const classGroupId = input.classGroupId.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!classGroupId) {
    throw new Error("반을 선택해 주세요.");
  }

  const questionIds = Array.from(new Set(input.questionIds));
  if (questionIds.length === 0) {
    throw new Error("제출할 문항이 없습니다.");
  }

  const supabase = createAdminClient();

  const [{ data: exam }, { data: classGroup, error: classGroupError }] = await Promise.all([
    supabase.from("exams").select("id").eq("id", input.examId).maybeSingle(),
    supabase
      .from("class_groups")
      .select("id, class_years(year), class_names(name), class_cohorts(cohort_no)")
      .eq("id", classGroupId)
      .maybeSingle(),
  ]);

  if (!exam) {
    throw new Error("시험 정보를 찾을 수 없습니다.");
  }

  if (classGroupError) {
    throw new Error(classGroupError.message);
  }

  if (!classGroup) {
    throw new Error("선택한 반 정보를 찾을 수 없습니다.");
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, exam_subject_id, question_no, stem, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation, explanation_video_url")
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
    .select("id, exam_id, name, subject_order")
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
      class_group_id: classGroupId,
      user_name: userName,
      // Legacy DBs may still require this column even though the UI no longer uses it.
      birth_date: LEGACY_BIRTH_DATE_FALLBACK,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    throw new Error(attemptError?.message ?? "응시 생성에 실패했습니다.");
  }

  const attemptId = attempt.id;

  const orderedSubjectIds = (subjects ?? [])
    .slice()
    .sort((a, b) => a.subject_order - b.subject_order)
    .map((subject) => subject.id);

  const { data: insertedSubjects, error: attemptSubjectsError } = await supabase
    .from("attempt_subjects")
    .insert(
      orderedSubjectIds.map((subjectId) => ({
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
    explanation_video_url_snapshot: question.explanation_video_url,
    image_paths_snapshot: (images ?? [])
      .filter((image) => image.question_id === question.id)
      .map((image) => image.image_path),
    work_image_path_snapshot: input.workImagePaths[question.id] ?? null,
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
    .select("id, exam_id, user_name, class_year_snapshot, class_name_snapshot, cohort_no_snapshot, total_score, passed, submitted_at")
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
    .select("id, exam_subject_id, subject_name_snapshot, score, passed")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  const examSubjectIds = Array.from(new Set((subjects ?? []).map((subject) => subject.exam_subject_id)));
  const { data: examSubjects } = examSubjectIds.length
    ? await supabase.from("exam_subjects").select("id, subject_order").in("id", examSubjectIds)
    : { data: [] };

  const examSubjectOrderMap = new Map((examSubjects ?? []).map((subject) => [subject.id, subject.subject_order]));

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select(
      "id, attempt_subject_id, question_no, subject_name_snapshot, stem_snapshot, choice_1_snapshot, choice_2_snapshot, choice_3_snapshot, choice_4_snapshot, correct_answer_snapshot, selected_answer, is_correct, explanation_snapshot, explanation_video_url_snapshot, image_paths_snapshot, work_image_path_snapshot"
    )
    .in("attempt_subject_id", (subjects ?? []).map((subject) => subject.id))
    .order("question_no", { ascending: true });

  const reviews: AttemptAnswerReview[] = (answers ?? []).map((answer) => ({
    id: answer.id,
    attemptSubjectId: answer.attempt_subject_id,
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
    explanationVideoUrl: answer.explanation_video_url_snapshot,
    imagePaths: ((answer.image_paths_snapshot as string[] | null) ?? []).map(
      (path) => toSupabasePublicStorageUrl("question-images", path) ?? path
    ),
    workImagePath: answer.work_image_path_snapshot,
    workImageUrl: toSupabasePublicStorageUrl(ATTEMPT_WORK_IMAGES_BUCKET, answer.work_image_path_snapshot),
  }));

  const correctCount = reviews.filter((review) => review.isCorrect).length;
  const classLabel =
    attempt.class_year_snapshot && attempt.class_name_snapshot && attempt.cohort_no_snapshot
      ? formatClassGroupLabel(attempt.class_year_snapshot, attempt.cohort_no_snapshot, attempt.class_name_snapshot)
      : "반 미지정";

  return {
    id: attempt.id,
    examId: attempt.exam_id,
    examTitle: exam?.title ?? "시험",
    certificationName: certification?.name ?? "자격",
    userName: attempt.user_name,
    classLabel,
    classYear: attempt.class_year_snapshot,
    className: attempt.class_name_snapshot,
    cohortNo: attempt.cohort_no_snapshot,
    score: Number(attempt.total_score),
    passed: attempt.passed,
    correctCount,
    totalQuestions: reviews.length,
    submittedAt: attempt.submitted_at,
    subjects: (subjects ?? [])
      .slice()
      .sort(
        (a, b) =>
          (examSubjectOrderMap.get(a.exam_subject_id) ?? Number.MAX_SAFE_INTEGER) -
          (examSubjectOrderMap.get(b.exam_subject_id) ?? Number.MAX_SAFE_INTEGER)
      )
      .map((subject) => ({
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
  classGroupId: string;
}): Promise<LookupAttemptRow[]> {
  const userName = input.userName.trim();
  const classGroupId = input.classGroupId.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!classGroupId) {
    throw new Error("반을 선택해 주세요.");
  }

  const supabase = createAdminClient();

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("id, exam_id, class_year_snapshot, class_name_snapshot, cohort_no_snapshot, total_score, passed, submitted_at")
    .eq("user_name", userName)
    .eq("class_group_id", classGroupId)
    .eq("status", "submitted")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const examIds = Array.from(new Set((attempts ?? []).map((attempt) => attempt.exam_id)));
  const { data: exams } = examIds.length
    ? await supabase.from("exams").select("id, title, certifications(name)").in("id", examIds)
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
    classLabel:
      attempt.class_year_snapshot && attempt.class_name_snapshot && attempt.cohort_no_snapshot
        ? formatClassGroupLabel(attempt.class_year_snapshot, attempt.cohort_no_snapshot, attempt.class_name_snapshot)
        : "반 미지정",
    score: Number(attempt.total_score),
    passed: attempt.passed,
    submittedAt: attempt.submitted_at,
  }));
}
