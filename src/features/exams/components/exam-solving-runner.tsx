"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { deleteAttemptWorkImageAction, submitAttemptAction, uploadAttemptWorkImageAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassGroupOption } from "@/features/classes/types";
import type { SolveQuestion } from "@/features/exams/types";
import { compressImageToMaxSize } from "@/features/exams/utils/compress-image";
import { routes } from "@/lib/constants/routes";
import { useExamSessionStore } from "@/stores/exam-session.store";

interface ExamSolvingRunnerProps {
  examId: string;
  examTitle: string;
  questions: SolveQuestion[];
  classGroupOptions: ClassGroupOption[];
}

type SubmitIdentityValues = {
  userName: string;
  classGroupId: string;
};

type WorkImageState = {
  path: string;
  publicUrl: string;
  fileName: string;
  sizeBytes?: number;
};

type WorkImageProcessingState = {
  questionId: string;
  stage: "compressing" | "uploading";
};

const WORK_IMAGE_STORAGE_KEY_PREFIX = "exam-work-images";
const WORK_IMAGE_DRAFT_KEY_PREFIX = "exam-work-draft";
const MAX_WORK_IMAGE_BYTES = 1024 * 1024;

function formatRemain(seconds: number) {
  const safe = Math.max(seconds, 0);
  const minute = String(Math.floor(safe / 60)).padStart(2, "0");
  const second = String(safe % 60).padStart(2, "0");
  return `${minute}:${second}`;
}

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let idx = copy.length - 1; idx > 0; idx -= 1) {
    const randomIndex = Math.floor(Math.random() * (idx + 1));
    [copy[idx], copy[randomIndex]] = [copy[randomIndex], copy[idx]];
  }
  return copy;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export function ExamSolvingRunner({ examId, examTitle, questions, classGroupOptions }: ExamSolvingRunnerProps) {
  const session = useExamSessionStore();

  const optionEnabled = session.examId === examId;
  const randomOrder = optionEnabled ? session.randomOrder : false;
  const questionCount = optionEnabled ? session.questionCount : null;
  const timeLimitMinutes = optionEnabled ? session.timeLimitMinutes : null;

  const activeQuestions = useMemo(() => {
    let base = [...questions];
    if (randomOrder) {
      base = shuffled(base);
    }

    if (questionCount && questionCount > 0) {
      base = base.slice(0, Math.min(questionCount, base.length));
    }

    return base;
  }, [questions, randomOrder, questionCount]);

  const totalCount = activeQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [manualSubmitRequested, setManualSubmitRequested] = useState(false);
  const [remainSeconds, setRemainSeconds] = useState<number | null>(
    timeLimitMinutes && timeLimitMinutes > 0 ? Math.floor(timeLimitMinutes * 60) : null
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [workImages, setWorkImages] = useState<Record<string, WorkImageState>>({});
  const [clientDraftId, setClientDraftId] = useState("");
  const [workImageProcessing, setWorkImageProcessing] = useState<WorkImageProcessingState | null>(null);
  const [workImageError, setWorkImageError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SubmitIdentityValues>({
    defaultValues: {
      userName: "",
      classGroupId: classGroupOptions[0]?.id ?? "",
    },
  });

  useEffect(() => {
    const isLocked = manualSubmitRequested || (remainSeconds !== null && remainSeconds <= 0);
    if (isLocked) {
      return;
    }

    if (remainSeconds === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainSeconds((prev) => {
        if (prev === null) {
          return null;
        }
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [manualSubmitRequested, remainSeconds]);

  useEffect(() => {
    if (classGroupOptions.length === 0) {
      return;
    }

    if (!getValues("classGroupId")) {
      setValue("classGroupId", classGroupOptions[0].id, { shouldDirty: false });
    }
  }, [classGroupOptions, getValues, setValue]);

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

  const solvedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);
  const currentQuestion = activeQuestions[currentIndex];
  const currentWorkImage = currentQuestion ? workImages[currentQuestion.id] : null;
  const currentProcessingStage = currentQuestion && workImageProcessing?.questionId === currentQuestion.id ? workImageProcessing.stage : null;
  const timeoutReached = remainSeconds !== null && remainSeconds <= 0;
  const submitRequested = manualSubmitRequested || timeoutReached;

  const chooseAnswer = (questionId: string, choiceNo: number) => {
    if (submitRequested) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceNo,
    }));

    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1));
    }
  };

  const submitIdentity = (values: SubmitIdentityValues) => {
    if (workImageProcessing) {
      setSaveError("손풀이 이미지 업로드가 끝난 뒤 다시 제출해 주세요.");
      return;
    }

    setSaveError(null);

    startTransition(async () => {
      try {
        const result = await submitAttemptAction({
          examId,
          classGroupId: values.classGroupId,
          userName: values.userName,
          answers,
          questionIds: activeQuestions.map((question) => question.id),
          workImagePaths: Object.fromEntries(activeQuestions.map((question) => [question.id, workImages[question.id]?.path ?? null])),
        });

        window.sessionStorage.removeItem(`${WORK_IMAGE_STORAGE_KEY_PREFIX}:${examId}`);
        window.sessionStorage.removeItem(`${WORK_IMAGE_DRAFT_KEY_PREFIX}:${examId}`);
        window.location.replace(routes.resultPage(result.attemptId));
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "결과 저장에 실패했습니다.");
      }
    });
  };

  const attachWorkImage = (questionId: string, file: File | null) => {
    if (!file) {
      return;
    }

    if (!clientDraftId) {
      setWorkImageError("손풀이 업로드 준비가 아직 완료되지 않았습니다.");
      return;
    }

    setWorkImageError(null);
    setWorkImageProcessing({ questionId, stage: "compressing" });

    void (async () => {
      try {
        const compressedFile = await compressImageToMaxSize(file, { maxBytes: MAX_WORK_IMAGE_BYTES });
        setWorkImageProcessing({ questionId, stage: "uploading" });

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
      } catch (error) {
        setWorkImageError(error instanceof Error ? error.message : "손풀이 이미지 업로드에 실패했습니다.");
      } finally {
        setWorkImageProcessing(null);
      }
    })();
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

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>문항이 없습니다</CardTitle>
          <CardDescription>선택한 시험에 표시할 문항이 아직 등록되지 않았습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>문제를 불러오지 못했습니다</CardTitle>
          <CardDescription>잠시 후 다시 시도해 주세요.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (classGroupOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>응시 정보를 선택할 수 없습니다</CardTitle>
          <CardDescription>관리자가 아직 사용할 반 정보를 등록하지 않았습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (submitRequested) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>{timeoutReached ? "시험 시간이 종료되었습니다" : "답안 제출"}</CardTitle>
            <CardDescription>이름과 반을 입력하면 채점 후 결과 페이지로 이동합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
            <p>시험: {examTitle}</p>
            <p>
              응답한 문항: {solvedCount} / {totalCount}
            </p>
          </div>

          <form className="grid grid-cols-1 gap-4 md:max-w-md" onSubmit={handleSubmit(submitIdentity)}>
            <div className="space-y-2">
              <Label htmlFor="classGroupId">반 선택</Label>
              <select
                id="classGroupId"
                className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                {...register("classGroupId", { required: "반을 선택해 주세요." })}
              >
                <option value="">반을 선택해 주세요</option>
                {classGroupOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.classGroupId ? <p className="text-xs text-red-700">{errors.classGroupId.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">이름</Label>
              <Input
                id="userName"
                placeholder="홍길동"
                {...register("userName", { required: "이름을 입력해 주세요." })}
              />
              {errors.userName ? <p className="text-xs text-red-700">{errors.userName.message}</p> : null}
            </div>

            {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending || workImageProcessing ? "저장 중..." : "채점 및 결과 저장"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setManualSubmitRequested(false)} disabled={timeoutReached || isPending}>
                돌아가기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{examTitle}</CardTitle>
                <CardDescription>
                  {currentQuestion.subjectName} · 문제 {currentIndex + 1} / {totalCount}
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
                {currentQuestion.questionNo}. {currentQuestion.stem}
              </h2>
              {currentQuestion.imagePaths.map((imagePath, index) => (
                <div key={`${currentQuestion.id}-image-${index}`} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePath} alt={`문항 ${currentQuestion.questionNo} 이미지 ${index + 1}`} className="h-auto w-full" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
                {currentQuestion.choices.map((choice) => {
                  const selected = answers[currentQuestion.id] === choice.no;

                  return (
                    <button
                    key={`${currentQuestion.id}-${choice.no}`}
                    type="button"
                    onClick={() => chooseAnswer(currentQuestion.id, choice.no)}
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

            {currentQuestion.explanationVideoUrl ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm font-semibold">해설 링크</p>
                <p className="mt-2 text-sm">
                  <a
                    href={currentQuestion.explanationVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--color-primary)] underline underline-offset-2"
                  >
                    {currentQuestion.explanationVideoUrl}
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
                  {currentProcessingStage === "compressing"
                    ? "압축 중..."
                    : currentProcessingStage === "uploading"
                      ? "업로드 중..."
                      : currentWorkImage
                        ? "이미지 교체"
                        : "이미지 선택"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={Boolean(currentProcessingStage)}
                    onChange={(event) => {
                      attachWorkImage(currentQuestion.id, event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              {currentWorkImage ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <span>
                      {currentWorkImage.fileName}
                      {typeof currentWorkImage.sizeBytes === "number" ? ` · ${formatFileSize(currentWorkImage.sizeBytes)}` : ""}
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={() => clearWorkImage(currentQuestion.id)}>
                      이미지 제거
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentWorkImage.publicUrl} alt={`문항 ${currentQuestion.questionNo} 손풀이 이미지`} className="h-auto max-h-[420px] w-full object-contain" />
                  </div>
                </div>
              ) : null}

              {currentProcessingStage ? (
                <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                  {currentProcessingStage === "compressing" ? "이미지를 1MB 이하로 자동 압축하는 중입니다." : "압축된 이미지를 업로드하는 중입니다."}
                </p>
              ) : null}
              {workImageError ? <p className="mt-3 text-sm text-red-700">{workImageError}</p> : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="w-full">
            이전 문제
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
            disabled={currentIndex >= totalCount - 1}
            className="w-full"
          >
            다음 문제
          </Button>
        </div>
      </section>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>진행 현황</CardTitle>
            <CardDescription>문항 선택 상태를 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>진행률</span>
                <span className="font-semibold">
                  {solvedCount} / {totalCount}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full bg-[var(--color-primary)]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {activeQuestions.map((question, idx) => {
                const answered = Boolean(answers[question.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={[
                      "h-10 rounded-xl border text-xs font-semibold",
                      isCurrent
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-foreground)]"
                        : answered
                          ? "border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                          : "border-[var(--color-border)] bg-white",
                    ].join(" ")}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <Button type="button" className="w-full" onClick={() => setManualSubmitRequested(true)} disabled={Boolean(workImageProcessing)}>
              시험 제출하기
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
