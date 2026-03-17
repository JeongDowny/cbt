"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SolveQuestion } from "@/features/exams/types";

interface ExamProgressPanelProps {
  questions: SolveQuestion[];
  currentIndex: number;
  answers: Record<string, number>;
  solvedCount: number;
  totalCount: number;
  progressPercent: number;
  onSelectQuestion: (index: number) => void;
  onRequestSubmit: () => void;
  submitDisabled: boolean;
}

export function ExamProgressPanel({
  questions,
  currentIndex,
  answers,
  solvedCount,
  totalCount,
  progressPercent,
  onSelectQuestion,
  onRequestSubmit,
  submitDisabled,
}: ExamProgressPanelProps) {
  return (
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
          {questions.map((question, idx) => {
            const answered = Boolean(answers[question.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
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

        <Button type="button" className="w-full" onClick={onRequestSubmit} disabled={submitDisabled}>
          시험 제출하기
        </Button>
      </CardContent>
    </Card>
  );
}
