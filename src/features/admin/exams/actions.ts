"use server";

import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AdminExamFormValues, SaveExamResult } from "@/features/admin/exams/types";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadQuestionImageAction(formData: FormData) {
  const file = formData.get("file");
  const examId = String(formData.get("examId") ?? "draft");

  if (!(file instanceof File)) {
    throw new Error("업로드할 파일이 없습니다.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `exams/${examId}/${randomUUID()}-${safeName}`;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from("question-images").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  return { imagePath: path };
}

export async function saveExamAction(payload: {
  examId?: string;
  values: AdminExamFormValues;
}): Promise<SaveExamResult> {
  const { examId, values } = payload;
  const supabase = createSupabaseAdminClient();

  let targetExamId = examId;

  if (targetExamId) {
    const { error } = await supabase
      .from("exams")
      .update({
        certification_name: values.certificationName,
        title: values.title,
        exam_year: values.examYear,
        exam_round: values.examRound,
        default_time_limit_minutes: values.defaultTimeLimitMinutes,
        is_published: values.isPublished,
      })
      .eq("id", targetExamId);

    if (error) {
      throw new Error(`시험 수정 실패: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("exams")
      .insert({
        certification_name: values.certificationName,
        title: values.title,
        exam_year: values.examYear,
        exam_round: values.examRound,
        default_time_limit_minutes: values.defaultTimeLimitMinutes,
        is_published: values.isPublished,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`시험 생성 실패: ${error?.message ?? "unknown_error"}`);
    }

    targetExamId = data.id;
  }

  const { error: deleteError } = await supabase.from("questions").delete().eq("exam_id", targetExamId);
  if (deleteError) {
    throw new Error(`기존 문항 정리 실패: ${deleteError.message}`);
  }

  for (let questionIndex = 0; questionIndex < values.questions.length; questionIndex += 1) {
    const question = values.questions[questionIndex];
    const questionId = randomUUID();

    const choices = question.choices.slice(0, question.choiceCount).map((choice, idx) => {
      const choiceId = randomUUID();
      return {
        id: choiceId,
        question_id: questionId,
        choice_no: idx + 1,
        content: choice.content,
      };
    });

    const correctChoice = choices.find((choice) => choice.choice_no === question.correctChoiceNo);
    if (!correctChoice) {
      throw new Error(`정답 선택이 올바르지 않습니다. question_no=${questionIndex + 1}`);
    }

    const { error: questionError } = await supabase.from("questions").insert({
      id: questionId,
      exam_id: targetExamId,
      question_no: questionIndex + 1,
      stem: question.stem,
      image_path: question.imagePath,
      choice_count: question.choiceCount,
      correct_choice_id: correctChoice.id,
      explanation: question.explanation || null,
    });

    if (questionError) {
      throw new Error(`문항 저장 실패(${questionIndex + 1}번): ${questionError.message}`);
    }

    const { error: choiceError } = await supabase.from("choices").insert(
      choices.map((choice) => ({
        ...choice,
        is_correct: choice.choice_no === question.correctChoiceNo,
      }))
    );

    if (choiceError) {
      throw new Error(`선택지 저장 실패(${questionIndex + 1}번): ${choiceError.message}`);
    }
  }

  return { examId: targetExamId };
}
