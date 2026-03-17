"use client";

import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuestionImageUpload } from "@/features/admin/exams/hooks/use-question-image-upload";
import type { AdminExamFormValues } from "@/features/admin/exams/types";

export function AdminExamQuestionCard({
  subjectIndex,
  questionIndex,
  control,
  register,
  setValue,
  examId,
  onRemoveQuestion,
}: {
  subjectIndex: number;
  questionIndex: number;
  control: Control<AdminExamFormValues>;
  register: UseFormRegister<AdminExamFormValues>;
  setValue: UseFormSetValue<AdminExamFormValues>;
  examId?: string;
  onRemoveQuestion: () => void;
}) {
  const imagePath = useWatch({
    control,
    name: `subjects.${subjectIndex}.questions.${questionIndex}.imagePath`,
  });

  const selectedChoiceNo = useWatch({
    control,
    name: `subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`,
  });

  const { fileInputRef, uploadError, isUploading, uploadImage } = useQuestionImageUpload({
    examId,
    onUploaded: (nextImagePath) => {
      setValue(`subjects.${subjectIndex}.questions.${questionIndex}.imagePath`, nextImagePath, { shouldDirty: true });
    },
  });

  return (
    <Card className="bg-[var(--color-surface-muted)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>문항 {questionIndex + 1}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onRemoveQuestion}>
            문항 삭제
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`question-stem-${subjectIndex}-${questionIndex}`}>문항 내용</Label>
          <textarea
            id={`question-stem-${subjectIndex}-${questionIndex}`}
            className="flex min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-3 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.stem`, { required: true })}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor={`question-file-${subjectIndex}-${questionIndex}`}>문항 이미지</Label>
          <input type="hidden" {...register(`subjects.${subjectIndex}.questions.${questionIndex}.imagePath`)} />
          <input
            ref={fileInputRef}
            id={`question-file-${subjectIndex}-${questionIndex}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => uploadImage(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? "업로드 중..." : imagePath ? "이미지 교체" : "이미지 첨부"}
            </Button>
            {imagePath ? <span className="text-xs text-[var(--color-muted-foreground)]">현재 이미지가 연결되어 있습니다.</span> : null}
          </div>
          {imagePath ? <p className="text-xs text-[var(--color-muted-foreground)]">저장된 이미지: {imagePath}</p> : null}
          {uploadError ? <p className="text-xs text-red-700">{uploadError}</p> : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">선택지 및 정답</p>
          <input type="hidden" {...register(`subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`, { valueAsNumber: true })} />
          {[0, 1, 2, 3].map((choiceIndex) => {
            const choiceNo = (choiceIndex + 1) as 1 | 2 | 3 | 4;
            return (
              <div key={`${subjectIndex}-${questionIndex}-${choiceNo}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-sm font-medium">{choiceNo}.</span>
                <Input {...register(`subjects.${subjectIndex}.questions.${questionIndex}.choices.${choiceIndex}.content`, { required: true })} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`question-correct-choice-${subjectIndex}-${questionIndex}`}
                    value={choiceNo}
                    checked={selectedChoiceNo === choiceNo}
                    onChange={() =>
                      setValue(`subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`, choiceNo, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                  />
                  정답
                </label>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-explanation-${subjectIndex}-${questionIndex}`}>해설</Label>
          <textarea
            id={`question-explanation-${subjectIndex}-${questionIndex}`}
            className="flex min-h-24 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-3 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.explanation`)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-explanation-video-url-${subjectIndex}-${questionIndex}`}>해설 영상 URL</Label>
          <Input
            id={`question-explanation-video-url-${subjectIndex}-${questionIndex}`}
            placeholder="https://www.youtube.com/watch?v=..."
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.explanationVideoUrl`)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
