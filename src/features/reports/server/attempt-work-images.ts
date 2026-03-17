"use server";

import { randomUUID } from "node:crypto";

import { toSupabasePublicStorageUrl } from "@/lib/supabase/storage";

import { ATTEMPT_WORK_IMAGES_BUCKET, createReportsAdminClient, sanitizeFileName } from "./admin-client";

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
  const supabase = createReportsAdminClient();

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

  const supabase = createReportsAdminClient();
  const { error } = await supabase.storage.from(ATTEMPT_WORK_IMAGES_BUCKET).remove([path]);
  if (error) {
    throw new Error(`손풀이 이미지 삭제 실패: ${error.message}`);
  }
}
