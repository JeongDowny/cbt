"use server";

import { randomUUID } from "node:crypto";

import type { AdminExamFormValues, SaveExamResult } from "@/features/admin/exams/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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

async function ensureCertification(certificationName: string): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("certifications")
    .select("id")
    .eq("name", certificationName)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase.from("certifications").insert({ name: certificationName }).select("id").single();
  if (error || !data) {
    throw new Error(`자격증 저장 실패: ${error?.message ?? "unknown_error"}`);
  }

  return data.id;
}

export async function saveExamAction(payload: {
  examId?: string;
  values: AdminExamFormValues;
}): Promise<SaveExamResult> {
  const { examId, values } = payload;
  const supabase = createSupabaseAdminClient();

  const certificationName = values.certificationName.trim();
  if (!certificationName) {
    throw new Error("자격명을 입력해 주세요.");
  }

  const certificationId = await ensureCertification(certificationName);

  let targetExamId = examId;

  if (targetExamId) {
    const { error } = await supabase
      .from("exams")
      .update({
        certification_id: certificationId,
        exam_year: values.examYear,
        exam_round: values.examRound,
        status: values.status,
        is_public: values.isPublic,
      })
      .eq("id", targetExamId);

    if (error) {
      throw new Error(`시험 수정 실패: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("exams")
      .insert({
        certification_id: certificationId,
        exam_year: values.examYear,
        exam_round: values.examRound,
        status: values.status,
        is_public: values.isPublic,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`시험 생성 실패: ${error?.message ?? "unknown_error"}`);
    }

    targetExamId = data.id;
  }

  const { error: deleteSubjectError } = await supabase.from("exam_subjects").delete().eq("exam_id", targetExamId);
  if (deleteSubjectError) {
    throw new Error(`기존 과목 정리 실패: ${deleteSubjectError.message}`);
  }

  const grouped = new Map<string, { timeLimitMinutes: number; questions: AdminExamFormValues["questions"] }>();

  for (const question of values.questions) {
    const subjectName = question.subjectName.trim() || "공통";

    const existing = grouped.get(subjectName);
    if (!existing) {
      grouped.set(subjectName, {
        timeLimitMinutes: question.subjectTimeLimitMinutes || 30,
        questions: [question],
      });
    } else {
      existing.questions.push(question);
    }
  }

  const subjectEntries = Array.from(grouped.entries());

  for (let subjectIndex = 0; subjectIndex < subjectEntries.length; subjectIndex += 1) {
    const [subjectName, subjectData] = subjectEntries[subjectIndex];

    const { data: subject, error: subjectError } = await supabase
      .from("exam_subjects")
      .insert({
        exam_id: targetExamId,
        subject_order: subjectIndex + 1,
        name: subjectName,
        time_limit_minutes: subjectData.timeLimitMinutes,
      })
      .select("id")
      .single();

    if (subjectError || !subject) {
      throw new Error(`과목 저장 실패(${subjectName}): ${subjectError?.message ?? "unknown_error"}`);
    }

    for (let questionIndex = 0; questionIndex < subjectData.questions.length; questionIndex += 1) {
      const question = subjectData.questions[questionIndex];

      const { data: insertedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          exam_subject_id: subject.id,
          question_no: questionIndex + 1,
          stem: question.stem,
          choice_1: question.choices[0]?.content ?? "",
          choice_2: question.choices[1]?.content ?? "",
          choice_3: question.choices[2]?.content ?? "",
          choice_4: question.choices[3]?.content ?? "",
          correct_answer: question.correctChoiceNo,
          explanation: question.explanation,
        })
        .select("id")
        .single();

      if (questionError || !insertedQuestion) {
        throw new Error(`문항 저장 실패(${subjectName} ${questionIndex + 1}번): ${questionError?.message ?? "unknown_error"}`);
      }

      if (question.imagePath) {
        const { error: imageError } = await supabase.from("question_images").insert({
          question_id: insertedQuestion.id,
          image_order: 1,
          image_path: question.imagePath,
        });

        if (imageError) {
          throw new Error(`문항 이미지 저장 실패(${subjectName} ${questionIndex + 1}번): ${imageError.message}`);
        }
      }
    }
  }

  return { examId: targetExamId };
}
