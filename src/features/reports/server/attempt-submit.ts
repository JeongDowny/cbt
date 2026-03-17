"use server";

import { LEGACY_BIRTH_DATE_FALLBACK, createReportsAdminClient } from "./admin-client";

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

  const supabase = createReportsAdminClient();

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
