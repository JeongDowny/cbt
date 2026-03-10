"use server";

import { createClient } from "@supabase/supabase-js";

import type { LookupSubmissionReportRow, ReportQuestionReview, SubmissionReport } from "@/features/reports/types";

function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 서버 설정이 누락되었습니다.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface LegacyQuestionRow {
  id: string;
  question_no: number;
  stem: string;
  image_url: string | null;
  correct_answer: number;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
}

interface NextQuestionRow {
  id: string;
  question_no: number;
  stem: string;
  image_path: string | null;
}

interface NextChoiceRow {
  question_id: string;
  choice_no: number;
  content: string;
  is_correct: boolean;
}

function toImageUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) {
    return null;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const url = process.env.SUPABASE_URL;
  if (!url) {
    return pathOrUrl;
  }

  const normalized = pathOrUrl.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/question-images/${normalized}`;
}

function orderedQuestionIds(questionIds: string[]) {
  const seen = new Set<string>();
  const list: string[] = [];

  for (const id of questionIds) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    list.push(id);
  }

  return list;
}

async function fetchReviewRows(questionIds: string[]): Promise<
  Array<{
    questionId: string;
    questionNo: number;
    stem: string;
    imageUrl: string | null;
    choices: Array<{ no: number; text: string }>;
    correctAnswer: number;
  }>
> {
  const supabase = createAdminClient();
  const ids = orderedQuestionIds(questionIds);

  if (ids.length === 0) {
    return [];
  }

  const { data: nextQuestions, error: nextQuestionError } = await supabase
    .from("questions")
    .select("id, question_no, stem, image_path")
    .in("id", ids);

  if (!nextQuestionError && (nextQuestions ?? []).length > 0) {
    const typedQuestions = (nextQuestions ?? []) as NextQuestionRow[];

    const { data: nextChoices, error: nextChoiceError } = await supabase
      .from("choices")
      .select("question_id, choice_no, content, is_correct")
      .in(
        "question_id",
        typedQuestions.map((question) => question.id)
      )
      .order("choice_no", { ascending: true });

    if (!nextChoiceError) {
      const typedChoices = (nextChoices ?? []) as NextChoiceRow[];

      const mapped = typedQuestions.map((question) => {
        const related = typedChoices.filter((choice) => choice.question_id === question.id);
        const correct = related.find((choice) => choice.is_correct);

        return {
          questionId: question.id,
          questionNo: question.question_no,
          stem: question.stem,
          imageUrl: toImageUrl(question.image_path),
          choices: related.map((choice) => ({ no: choice.choice_no, text: choice.content })),
          correctAnswer: correct?.choice_no ?? 1,
        };
      });

      const map = new Map(mapped.map((row) => [row.questionId, row]));
      return ids.map((id) => map.get(id)).filter((row): row is NonNullable<typeof row> => Boolean(row));
    }
  }

  const { data: legacyQuestions, error: legacyError } = await supabase
    .from("questions")
    .select("id, question_no, stem, image_url, correct_answer, choice_1, choice_2, choice_3, choice_4")
    .in("id", ids);

  if (legacyError) {
    throw new Error(legacyError.message);
  }

  const mappedLegacy = ((legacyQuestions ?? []) as LegacyQuestionRow[]).map((question) => ({
    questionId: question.id,
    questionNo: question.question_no,
    stem: question.stem,
    imageUrl: toImageUrl(question.image_url),
    choices: [question.choice_1, question.choice_2, question.choice_3, question.choice_4].map((text, idx) => ({
      no: idx + 1,
      text,
    })),
    correctAnswer: question.correct_answer,
  }));

  const map = new Map(mappedLegacy.map((row) => [row.questionId, row]));
  return ids.map((id) => map.get(id)).filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export async function submitReportAction(input: {
  examId: string;
  userName: string;
  birthDate: string;
  answers: Record<string, number>;
  questionIds: string[];
}): Promise<{ reportId: string }> {
  const userName = input.userName.trim();
  const birthDate = input.birthDate.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.");
  }

  const questionIds = orderedQuestionIds(input.questionIds);
  if (questionIds.length === 0) {
    throw new Error("채점할 문항이 없습니다.");
  }

  const reviewBaseRows = await fetchReviewRows(questionIds);
  const reviews: ReportQuestionReview[] = reviewBaseRows.map((row) => {
    const userAnswer = input.answers[row.questionId] ?? null;
    const isCorrect = userAnswer !== null && userAnswer === row.correctAnswer;

    return {
      questionId: row.questionId,
      questionNo: row.questionNo,
      stem: row.stem,
      imageUrl: row.imageUrl,
      choices: row.choices,
      correctAnswer: row.correctAnswer,
      userAnswer,
      isCorrect,
    };
  });

  const totalQuestions = reviews.length;
  const correctCount = reviews.filter((review) => review.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;

  const supabase = createAdminClient();
  const { data: exam } = await supabase.from("exams").select("title").eq("id", input.examId).maybeSingle();

  const { data, error } = await supabase
    .from("submission_reports")
    .insert({
      exam_id: input.examId,
      exam_title: String(exam?.title ?? "CBT 시험"),
      user_name: userName,
      birth_date: birthDate,
      score,
      correct_count: correctCount,
      total_questions: totalQuestions,
      answers: input.answers,
      reviews,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "결과 저장에 실패했습니다.");
  }

  return { reportId: data.id as string };
}

export async function getSubmissionReportAction(reportId: string): Promise<SubmissionReport | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("submission_reports")
    .select("id, exam_id, exam_title, user_name, birth_date, score, correct_count, total_questions, answers, reviews, created_at")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    examId: data.exam_id,
    examTitle: data.exam_title,
    userName: data.user_name,
    birthDate: data.birth_date,
    score: Number(data.score),
    correctCount: data.correct_count,
    totalQuestions: data.total_questions,
    answers: (data.answers ?? {}) as Record<string, number>,
    reviews: (data.reviews ?? []) as ReportQuestionReview[],
    createdAt: data.created_at,
  };
}

export async function lookupSubmissionReportsAction(input: {
  userName: string;
  birthDate: string;
}): Promise<LookupSubmissionReportRow[]> {
  const userName = input.userName.trim();
  const birthDate = input.birthDate.trim();

  if (!userName) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("생년월일 형식을 확인해 주세요.");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("submission_reports")
    .select("id, exam_title, score, correct_count, total_questions, created_at")
    .eq("user_name", userName)
    .eq("birth_date", birthDate)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    examTitle: row.exam_title,
    score: Number(row.score),
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
  }));
}
