"use server";

import type { AttemptReport, LookupAttemptRow } from "@/features/reports/types";

import { createReportsAdminClient } from "./admin-client";
import { toAttemptAnswerReview, toAttemptReport, toLookupAttemptRow, type AttemptAnswerReviewRow } from "./report-mappers";

export async function getAttemptReportAction(attemptId: string): Promise<AttemptReport | null> {
  const supabase = createReportsAdminClient();

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

  const { data: exam } = await supabase.from("exams").select("id, title, certifications(name)").eq("id", attempt.exam_id).maybeSingle();
  const certification = exam ? (Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications) : null;

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

  const reviews = ((answers ?? []) as AttemptAnswerReviewRow[]).map(toAttemptAnswerReview);
  const orderedSubjects = (subjects ?? [])
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
    }));

  return toAttemptReport({
    attempt,
    examTitle: exam?.title ?? "시험",
    certificationName: certification?.name ?? "자격",
    subjects: orderedSubjects,
    reviews,
  });
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

  const supabase = createReportsAdminClient();

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
        certificationName: Array.isArray(exam.certifications) ? exam.certifications[0]?.name ?? "자격" : exam.certifications?.name ?? "자격",
      },
    ])
  );

  return (attempts ?? []).map((attempt) =>
    toLookupAttemptRow({
      id: attempt.id,
      examId: attempt.exam_id,
      classYear: attempt.class_year_snapshot,
      className: attempt.class_name_snapshot,
      cohortNo: attempt.cohort_no_snapshot,
      score: attempt.total_score,
      passed: attempt.passed,
      submittedAt: attempt.submitted_at,
      examMap,
    })
  );
}
