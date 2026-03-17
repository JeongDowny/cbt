"use client";

import { useEffect, useState } from "react";

import { deleteAttemptWorkImageAction, uploadAttemptWorkImageAction } from "@/app/actions/reports";
import { compressImageToMaxSize } from "@/features/exams/utils/compress-image";
import type { WorkImageProcessingState, WorkImageState } from "@/features/exams/types";

const WORK_IMAGE_STORAGE_KEY_PREFIX = "exam-work-images";
const WORK_IMAGE_DRAFT_KEY_PREFIX = "exam-work-draft";
const MAX_WORK_IMAGE_BYTES = 1024 * 1024;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export function useAttemptWorkImages(examId: string) {
  const [workImages, setWorkImages] = useState<Record<string, WorkImageState>>({});
  const [clientDraftId, setClientDraftId] = useState("");
  const [processing, setProcessing] = useState<WorkImageProcessingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `${WORK_IMAGE_STORAGE_KEY_PREFIX}:${examId}`;
    const draftKey = `${WORK_IMAGE_DRAFT_KEY_PREFIX}:${examId}`;
    const existingDraftId = window.sessionStorage.getItem(draftKey);
    const nextDraftId = existingDraftId || window.crypto.randomUUID();

    if (!existingDraftId) {
      window.sessionStorage.setItem(draftKey, nextDraftId);
    }

    setClientDraftId(nextDraftId);

    const storedImages = window.sessionStorage.getItem(storageKey);
    if (!storedImages) {
      return;
    }

    try {
      const parsed = JSON.parse(storedImages) as Record<string, WorkImageState>;
      setWorkImages(parsed);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [examId]);

  useEffect(() => {
    if (!clientDraftId) {
      return;
    }

    window.sessionStorage.setItem(`${WORK_IMAGE_STORAGE_KEY_PREFIX}:${examId}`, JSON.stringify(workImages));
  }, [clientDraftId, examId, workImages]);

  const attachWorkImage = async (questionId: string, file: File | null) => {
    if (!file) {
      return;
    }

    if (!clientDraftId) {
      setError("손풀이 업로드 준비가 아직 완료되지 않았습니다.");
      return;
    }

    setError(null);
    setProcessing({ questionId, stage: "compressing" });

    try {
      const compressedFile = await compressImageToMaxSize(file, { maxBytes: MAX_WORK_IMAGE_BYTES });
      setProcessing({ questionId, stage: "uploading" });

      const previousPath = workImages[questionId]?.path ?? null;
      const formData = new FormData();
      formData.set("file", compressedFile);
      formData.set("draftId", clientDraftId);
      formData.set("questionId", questionId);

      const result = await uploadAttemptWorkImageAction(formData);

      if (previousPath) {
        const deleteFormData = new FormData();
        deleteFormData.set("path", previousPath);
        await deleteAttemptWorkImageAction(deleteFormData).catch(() => undefined);
      }

      setWorkImages((prev) => ({
        ...prev,
        [questionId]: {
          path: result.path,
          publicUrl: result.publicUrl,
          fileName: compressedFile.name,
          sizeBytes: compressedFile.size,
        },
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "손풀이 이미지 업로드에 실패했습니다.");
    } finally {
      setProcessing(null);
    }
  };

  const clearWorkImage = (questionId: string) => {
    const existingPath = workImages[questionId]?.path;

    setWorkImages((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });

    if (!existingPath) {
      return;
    }

    const formData = new FormData();
    formData.set("path", existingPath);
    void deleteAttemptWorkImageAction(formData).catch(() => undefined);
  };

  const resetWorkImages = () => {
    window.sessionStorage.removeItem(`${WORK_IMAGE_STORAGE_KEY_PREFIX}:${examId}`);
    window.sessionStorage.removeItem(`${WORK_IMAGE_DRAFT_KEY_PREFIX}:${examId}`);
    setWorkImages({});
  };

  return {
    workImages,
    processing,
    error,
    attachWorkImage,
    clearWorkImage,
    resetWorkImages,
  };
}
