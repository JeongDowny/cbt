"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { AdminExamFormValues, SaveExamResult } from "@/features/admin/exams/types";
import { routes } from "@/lib/constants/routes";
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

  const normalizedSubjects = values.subjects
    .map((subject) => ({
      name: subject.name.trim(),
      timeLimitMinutes: subject.timeLimitMinutes || 30,
      questions: subject.questions,
    }))
    .filter((subject) => subject.name);

  if (normalizedSubjects.length === 0) {
    throw new Error("최소 1개 이상의 과목을 추가해 주세요.");
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

  const { data: existingSubjects, error: existingSubjectsError } = await supabase
    .from("exam_subjects")
    .select("id, name, subject_order")
    .eq("exam_id", targetExamId)
    .order("subject_order", { ascending: true });

  if (existingSubjectsError) {
    throw new Error(`기존 과목 조회 실패: ${existingSubjectsError.message}`);
  }

  const existingSubjectIds = (existingSubjects ?? []).map((subject) => subject.id);

  if (existingSubjectIds.length > 0) {
    const { error: deleteQuestionError } = await supabase.from("questions").delete().in("exam_subject_id", existingSubjectIds);
    if (deleteQuestionError) {
      throw new Error(`기존 문항 정리 실패: ${deleteQuestionError.message}`);
    }
  }

  const remainingSubjects = [...(existingSubjects ?? [])];
  const assignedSubjects: Array<{
    subjectId?: string;
    currentName?: string;
    nextName: string;
    nextOrder: number;
    timeLimitMinutes: number;
    questions: AdminExamFormValues["subjects"][number]["questions"];
  }> = [];

  for (let subjectIndex = 0; subjectIndex < normalizedSubjects.length; subjectIndex += 1) {
    const subjectData = normalizedSubjects[subjectIndex];
    const matchedByNameIndex = remainingSubjects.findIndex((subject) => subject.name === subjectData.name);
    const matchedSubject = matchedByNameIndex >= 0 ? remainingSubjects.splice(matchedByNameIndex, 1)[0] : remainingSubjects.shift();

    assignedSubjects.push({
      subjectId: matchedSubject?.id,
      currentName: matchedSubject?.name,
      nextName: subjectData.name,
      nextOrder: subjectIndex + 1,
      timeLimitMinutes: subjectData.timeLimitMinutes,
      questions: subjectData.questions,
    });
  }

  for (let existingIndex = 0; existingIndex < (existingSubjects ?? []).length; existingIndex += 1) {
    const existingSubject = (existingSubjects ?? [])[existingIndex];
    const matchedAssignedSubject = assignedSubjects.find((subject) => subject.subjectId === existingSubject.id);
    const temporaryName =
      matchedAssignedSubject?.currentName && matchedAssignedSubject.currentName !== matchedAssignedSubject.nextName
        ? `__tmp__${randomUUID()}`
        : existingSubject.name;

    const { error: tempRenameError } = await supabase
      .from("exam_subjects")
      .update({
        subject_order: 1000 + existingIndex,
        ...(temporaryName ? { name: temporaryName } : {}),
      })
      .eq("id", existingSubject.id);

    if (tempRenameError) {
      throw new Error(`과목 정리 준비 실패: ${tempRenameError.message}`);
    }
  }

  for (const assignedSubject of assignedSubjects) {
    let activeSubjectId = assignedSubject.subjectId;

    if (activeSubjectId) {
      const { error: updateSubjectError } = await supabase
        .from("exam_subjects")
        .update({
          subject_order: assignedSubject.nextOrder,
          name: assignedSubject.nextName,
          time_limit_minutes: assignedSubject.timeLimitMinutes,
        })
        .eq("id", activeSubjectId);

      if (updateSubjectError) {
        throw new Error(`과목 저장 실패(${assignedSubject.nextName}): ${updateSubjectError.message}`);
      }
    } else {
      const { data: insertedSubject, error: insertSubjectError } = await supabase
        .from("exam_subjects")
        .insert({
          exam_id: targetExamId,
          subject_order: assignedSubject.nextOrder,
          name: assignedSubject.nextName,
          time_limit_minutes: assignedSubject.timeLimitMinutes,
        })
        .select("id")
        .single();

      if (insertSubjectError || !insertedSubject) {
        throw new Error(`과목 저장 실패(${assignedSubject.nextName}): ${insertSubjectError?.message ?? "unknown_error"}`);
      }

      activeSubjectId = insertedSubject.id;
    }

    for (let questionIndex = 0; questionIndex < assignedSubject.questions.length; questionIndex += 1) {
      const question = assignedSubject.questions[questionIndex];

      const { data: insertedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          exam_subject_id: activeSubjectId,
          question_no: questionIndex + 1,
          stem: question.stem,
          choice_1: question.choices[0]?.content ?? "",
          choice_2: question.choices[1]?.content ?? "",
          choice_3: question.choices[2]?.content ?? "",
          choice_4: question.choices[3]?.content ?? "",
          correct_answer: question.correctChoiceNo,
          explanation: question.explanation,
          explanation_video_url: question.explanationVideoUrl.trim() || null,
        })
        .select("id")
        .single();

      if (questionError || !insertedQuestion) {
        throw new Error(`문항 저장 실패(${assignedSubject.nextName} ${questionIndex + 1}번): ${questionError?.message ?? "unknown_error"}`);
      }

      if (question.imagePath) {
        const { error: imageError } = await supabase.from("question_images").insert({
          question_id: insertedQuestion.id,
          image_order: 1,
          image_path: question.imagePath,
        });

        if (imageError) {
          throw new Error(`문항 이미지 저장 실패(${assignedSubject.nextName} ${questionIndex + 1}번): ${imageError.message}`);
        }
      }
    }
  }

  return { examId: targetExamId };
}

export async function deleteExamAction(payload: { examId: string }): Promise<void> {
  const examId = payload.examId.trim();
  if (!examId) {
    throw new Error("삭제할 시험 정보를 찾을 수 없습니다.");
  }

  const supabase = createSupabaseAdminClient();

  const { count, error: attemptCountError } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId);

  if (attemptCountError) {
    throw new Error(`응시 기록 확인 실패: ${attemptCountError.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error("이미 응시 기록이 있는 시험은 삭제할 수 없습니다.");
  }

  const { data: subjects, error: subjectError } = await supabase.from("exam_subjects").select("id").eq("exam_id", examId);
  if (subjectError) {
    throw new Error(`과목 조회 실패: ${subjectError.message}`);
  }

  const subjectIds = (subjects ?? []).map((subject) => subject.id);
  if (subjectIds.length > 0) {
    const { data: questions, error: questionLookupError } = await supabase
      .from("questions")
      .select("id")
      .in("exam_subject_id", subjectIds);

    if (questionLookupError) {
      throw new Error(`문항 조회 실패: ${questionLookupError.message}`);
    }

    const questionIds = (questions ?? []).map((question) => question.id);
    if (questionIds.length > 0) {
      const { error: questionImageDeleteError } = await supabase.from("question_images").delete().in("question_id", questionIds);
      if (questionImageDeleteError) {
        throw new Error(`문항 이미지 정리 실패: ${questionImageDeleteError.message}`);
      }

      const { error: questionDeleteError } = await supabase.from("questions").delete().in("exam_subject_id", subjectIds);
      if (questionDeleteError) {
        throw new Error(`문항 정리 실패: ${questionDeleteError.message}`);
      }
    }

    const { error: subjectDeleteError } = await supabase.from("exam_subjects").delete().eq("exam_id", examId);
    if (subjectDeleteError) {
      throw new Error(`과목 정리 실패: ${subjectDeleteError.message}`);
    }
  }

  const { error: examDeleteError } = await supabase.from("exams").delete().eq("id", examId);
  if (examDeleteError) {
    throw new Error(`시험 삭제 실패: ${examDeleteError.message}`);
  }

  revalidatePath(routes.adminDashboard);
}
