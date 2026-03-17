"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SolveQuestion, WorkImageProcessingState, WorkImageState } from "@/features/exams/types";
import { formatFileSize } from "@/features/exams/hooks/use-attempt-work-images";
import { formatRemain } from "@/features/exams/hooks/use-exam-timer";

interface ExamQuestionPanelProps {
  examTitle: string;
  question: SolveQuestion;
  currentIndex: number;
  totalCount: number;
  progressPercent: number;
  remainSeconds: number | null;
  selectedChoiceNo: number | undefined;
  onChooseAnswer: (choiceNo: number) => void;
  workImage: WorkImageState | null;
  processing: WorkImageProcessingState | null;
  workImageError: string | null;
  onAttachWorkImage: (file: File | null) => void;
  onClearWorkImage: () => void;
}

export function ExamQuestionPanel({
  examTitle,
  question,
  currentIndex,
  totalCount,
  progressPercent,
  remainSeconds,
  selectedChoiceNo,
  onChooseAnswer,
  workImage,
  processing,
  workImageError,
  onAttachWorkImage,
  onClearWorkImage,
}: ExamQuestionPanelProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{examTitle}</CardTitle>
            <CardDescription>
              {question.subjectName} · 문제 {currentIndex + 1} / {totalCount}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <span className="status-chip">진행률 {progressPercent}%</span>
            {remainSeconds !== null ? <span className="status-chip">남은 시간 {formatRemain(remainSeconds)}</span> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold leading-8 md:text-2xl md:leading-9">
            {question.questionNo}. {question.stem}
          </h2>
          {question.imagePaths.map((imagePath, index) => (
            <div key={`${question.id}-image-${index}`} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePath} alt={`문항 ${question.questionNo} 이미지 ${index + 1}`} className="h-auto w-full" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {question.choices.map((choice) => {
            const selected = selectedChoiceNo === choice.no;

            return (
              <button
                key={`${question.id}-${choice.no}`}
                type="button"
                onClick={() => onChooseAnswer(choice.no)}
                className={[
                  "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition md:px-4 md:py-4",
                  selected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-muted)]",
                ].join(" ")}
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-xs font-semibold text-[var(--color-primary)]">
                  {choice.no}
                </span>
                <span className="leading-6 text-[15px]">{choice.text}</span>
              </button>
            );
          })}
        </div>

        {question.explanationVideoUrl ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
            <p className="text-sm font-semibold">해설 링크</p>
            <p className="mt-2 text-sm">
              <a
                href={question.explanationVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--color-primary)] underline underline-offset-2"
              >
                {question.explanationVideoUrl}
              </a>
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">손풀이 이미지</p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">종이에 푼 내용을 촬영해서 현재 문항에 첨부할 수 있습니다.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)]">
              {processing?.stage === "compressing"
                ? "압축 중..."
                : processing?.stage === "uploading"
                  ? "업로드 중..."
                  : workImage
                    ? "이미지 교체"
                    : "이미지 선택"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={Boolean(processing)}
                onChange={(event) => {
                  onAttachWorkImage(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {workImage ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
                <span>
                  {workImage.fileName}
                  {typeof workImage.sizeBytes === "number" ? ` · ${formatFileSize(workImage.sizeBytes)}` : ""}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={onClearWorkImage}>
                  이미지 제거
                </Button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={workImage.publicUrl} alt={`문항 ${question.questionNo} 손풀이 이미지`} className="h-auto max-h-[420px] w-full object-contain" />
              </div>
            </div>
          ) : null}

          {processing ? (
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              {processing.stage === "compressing" ? "이미지를 1MB 이하로 자동 압축하는 중입니다." : "압축된 이미지를 업로드하는 중입니다."}
            </p>
          ) : null}
          {workImageError ? <p className="mt-3 text-sm text-red-700">{workImageError}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
