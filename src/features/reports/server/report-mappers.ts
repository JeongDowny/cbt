import { formatClassGroupLabel } from "@/features/classes/data";
import type { AttemptAnswerReview, AttemptReport, LookupAttemptRow } from "@/features/reports/types";
import { toSupabasePublicStorageUrl } from "@/lib/supabase/storage";
import type { Json } from "@/types/database";

import { ATTEMPT_WORK_IMAGES_BUCKET } from "./admin-client";

export interface AttemptAnswerReviewRow {
  id: string;
  attempt_subject_id: string;
  question_no: number;
  subject_name_snapshot: string;
  stem_snapshot: string;
  choice_1_snapshot: string;
  choice_2_snapshot: string;
  choice_3_snapshot: string;
  choice_4_snapshot: string;
  correct_answer_snapshot: number;
  selected_answer: number | null;
  is_correct: boolean;
  explanation_snapshot: string;
  explanation_video_url_snapshot: string | null;
  image_paths_snapshot: Json;
  work_image_path_snapshot: string | null;
}

export function toAttemptAnswerReview(answer: AttemptAnswerReviewRow): AttemptAnswerReview {
  return {
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
    imagePaths: (Array.isArray(answer.image_paths_snapshot) ? answer.image_paths_snapshot : []).map((path) =>
      typeof path === "string" ? toSupabasePublicStorageUrl("question-images", path) ?? path : ""
    ).filter((path): path is string => Boolean(path)),
    workImagePath: answer.work_image_path_snapshot,
    workImageUrl: toSupabasePublicStorageUrl(ATTEMPT_WORK_IMAGES_BUCKET, answer.work_image_path_snapshot),
  };
}

export function toClassLabel(classYear: number | null, cohortNo: number | null, className: string | null) {
  return classYear && className && cohortNo ? formatClassGroupLabel(classYear, cohortNo, className) : "반 미지정";
}

export function toLookupAttemptRow(input: {
  id: string;
  examId: string;
  classYear: number | null;
  className: string | null;
  cohortNo: number | null;
  score: number | null;
  passed: boolean;
  submittedAt: string | null;
  examMap: Map<string, { title: string; certificationName: string }>;
}): LookupAttemptRow {
  return {
    id: input.id,
    examTitle: input.examMap.get(input.examId)?.title ?? "시험",
    certificationName: input.examMap.get(input.examId)?.certificationName ?? "자격",
    classLabel: toClassLabel(input.classYear, input.cohortNo, input.className),
    score: Number(input.score),
    passed: input.passed,
    submittedAt: input.submittedAt,
  };
}

export function toAttemptReport(input: {
  attempt: {
    id: string;
    exam_id: string;
    user_name: string;
    class_year_snapshot: number | null;
    class_name_snapshot: string | null;
    cohort_no_snapshot: number | null;
    total_score: number | null;
    passed: boolean;
    submitted_at: string | null;
  };
  examTitle: string;
  certificationName: string;
  subjects: Array<{ id: string; subjectName: string; score: number; passed: boolean }>;
  reviews: AttemptAnswerReview[];
}): AttemptReport {
  const { attempt, examTitle, certificationName, subjects, reviews } = input;
  return {
    id: attempt.id,
    examId: attempt.exam_id,
    examTitle,
    certificationName,
    userName: attempt.user_name,
    classLabel: toClassLabel(attempt.class_year_snapshot, attempt.cohort_no_snapshot, attempt.class_name_snapshot),
    classYear: attempt.class_year_snapshot,
    className: attempt.class_name_snapshot,
    cohortNo: attempt.cohort_no_snapshot,
    score: Number(attempt.total_score),
    passed: attempt.passed,
    correctCount: reviews.filter((review) => review.isCorrect).length,
    totalQuestions: reviews.length,
    submittedAt: attempt.submitted_at,
    subjects,
    reviews,
  };
}
