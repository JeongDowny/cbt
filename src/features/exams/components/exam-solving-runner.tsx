"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { submitAttemptAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassGroupOption } from "@/features/classes/types";
import type { SolveQuestion } from "@/features/exams/types";
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

  const solvedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);
  const currentQuestion = activeQuestions[currentIndex];
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
    setSaveError(null);

    startTransition(async () => {
      try {
        const result = await submitAttemptAction({
          examId,
          classGroupId: values.classGroupId,
          userName: values.userName,
          answers,
          questionIds: activeQuestions.map((question) => question.id),
        });

        window.location.replace(routes.resultPage(result.attemptId));
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "결과 저장에 실패했습니다.");
      }
    });
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
                {isPending ? "저장 중..." : "채점 및 결과 저장"}
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-chip">진행률 {progressPercent}%</span>
                {remainSeconds !== null ? <span className="status-chip">남은 시간 {formatRemain(remainSeconds)}</span> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold leading-9">
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
                      "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition",
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
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
            이전 문제
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
            disabled={currentIndex >= totalCount - 1}
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

            <div className="grid grid-cols-5 gap-2">
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

            <Button type="button" className="w-full" onClick={() => setManualSubmitRequested(true)}>
              시험 제출하기
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
