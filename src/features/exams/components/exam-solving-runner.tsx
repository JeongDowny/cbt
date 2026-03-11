"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { submitAttemptAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SolveQuestion } from "@/features/exams/types";
import { routes } from "@/lib/constants/routes";
import { useExamSessionStore } from "@/stores/exam-session.store";

interface ExamSolvingRunnerProps {
  examId: string;
  examTitle: string;
  questions: SolveQuestion[];
}

type SubmitIdentityValues = {
  userName: string;
  birthDate: string;
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

export function ExamSolvingRunner({ examId, examTitle, questions }: ExamSolvingRunnerProps) {
  const router = useRouter();
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
    formState: { errors },
  } = useForm<SubmitIdentityValues>({
    defaultValues: {
      userName: "",
      birthDate: "",
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
  };

  const submitIdentity = (values: SubmitIdentityValues) => {
    setSaveError(null);

    startTransition(async () => {
      try {
        const result = await submitAttemptAction({
          examId,
          userName: values.userName,
          birthDate: values.birthDate,
          answers,
          questionIds: activeQuestions.map((question) => question.id),
        });

        router.replace(routes.resultPage(result.attemptId));
        router.refresh();
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

  if (submitRequested) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{timeoutReached ? "시험 시간이 종료되었습니다" : "답안 제출"}</CardTitle>
          <CardDescription>이름과 생년월일을 입력하면 채점 후 결과 페이지로 이동합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
            <p>시험: {examTitle}</p>
            <p>
              응답한 문항: {solvedCount} / {totalCount}
            </p>
          </div>

          <form className="grid grid-cols-1 gap-4 md:max-w-md" onSubmit={handleSubmit(submitIdentity)}>
            <div className="space-y-2">
              <Label htmlFor="userName">이름</Label>
              <Input
                id="userName"
                placeholder="홍길동"
                {...register("userName", { required: "이름을 입력해 주세요." })}
              />
              {errors.userName ? <p className="text-xs text-red-700">{errors.userName.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                type="date"
                {...register("birthDate", {
                  required: "생년월일을 입력해 주세요.",
                  pattern: {
                    value: /^\d{4}-\d{2}-\d{2}$/,
                    message: "생년월일 형식을 확인해 주세요.",
                  },
                })}
              />
              {errors.birthDate ? <p className="text-xs text-red-700">{errors.birthDate.message}</p> : null}
            </div>

            {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}

            <div className="flex items-center gap-2">
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{examTitle}</CardTitle>
                <CardDescription>
                  {currentQuestion.subjectName} · 문제 {currentIndex + 1} / {totalCount}
                </CardDescription>
              </div>
              {remainSeconds !== null ? (
                <div className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-foreground)]">
                  남은 시간 {formatRemain(remainSeconds)}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold leading-7">
                {currentQuestion.questionNo}. {currentQuestion.stem}
              </h2>
              {currentQuestion.imagePaths.map((imagePath, index) => (
                <div key={`${currentQuestion.id}-image-${index}`} className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
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
                      "flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition",
                      selected
                        ? "border-[var(--color-primary)] bg-blue-50"
                        : "border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-muted)]",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-xs font-semibold">
                      {choice.no}
                    </span>
                    <span className="leading-6">{choice.text}</span>
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
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
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
                      "h-9 rounded-md border text-xs",
                      isCurrent
                        ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-foreground)]"
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
              제출하기
            </Button>

            <Link href={routes.resultLookup} className="block text-sm text-[var(--color-primary)] hover:underline">
              기존 결과 조회
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
