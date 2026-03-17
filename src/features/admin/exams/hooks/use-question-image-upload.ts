"use client";

import { useRef, useState, useTransition } from "react";

import { uploadQuestionImageAction } from "@/features/admin/exams/actions";

export function useQuestionImageUpload({
  examId,
  onUploaded,
}: {
  examId?: string;
  onUploaded: (imagePath: string) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImage = (file: File | null) => {
    if (!file) {
      setUploadError("업로드할 파일을 먼저 선택해 주세요.");
      return;
    }

    setUploadError(null);

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("examId", examId ?? "draft");

        const result = await uploadQuestionImageAction(formData);
        onUploaded(result.imagePath);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch {
        setUploadError("이미지 업로드에 실패했습니다.");
      }
    });
  };

  return {
    fileInputRef,
    uploadError,
    isUploading,
    uploadImage,
  };
}
