"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttemptReport } from "@/features/reports/types";

interface ResultReviewRunnerProps {
  report: AttemptReport;
}

export function ResultReviewRunner({ report }: ResultReviewRunnerProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const subjectOrderMap = useMemo(
    () => new Map(report.subjects.map((subject, index) => [subject.id, index])),
    [report.subjects]
  );

  const orderedReviews = useMemo(
    () =>
      [...report.reviews].sort((a, b) => {
        const subjectOrderA = subjectOrderMap.get(a.attemptSubjectId) ?? Number.MAX_SAFE_INTEGER;
        const subjectOrderB = subjectOrderMap.get(b.attemptSubjectId) ?? Number.MAX_SAFE_INTEGER;

        if (subjectOrderA !== subjectOrderB) {
          return subjectOrderA - subjectOrderB;
        }

        return a.questionNo - b.questionNo;
      }),
    [report.reviews, subjectOrderMap]
  );

  const currentReview = orderedReviews[currentIndex];
  const solvedCount = orderedReviews.length;
  const correctCount = orderedReviews.filter((review) => review.isCorrect).length;
  const progressPercent = solvedCount === 0 ? 0 : Math.round(((currentIndex + 1) / solvedCount) * 100);
  const wrongCount = report.totalQuestions - report.correctCount;

  if (orderedReviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>리뷰할 문항이 없습니다</CardTitle>
          <CardDescription>저장된 문항 리뷰 데이터를 찾지 못했습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!started ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {report.certificationName} · {report.examTitle}
              </CardTitle>
              <CardDescription>
                {report.classLabel} · {report.userName} · {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "미제출"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">점수</p>
                  <p className="text-2xl font-semibold">{report.score}</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">정답</p>
                  <p className="text-2xl font-semibold">{report.correctCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">오답</p>
                  <p className="text-2xl font-semibold">{wrongCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">합격 여부</p>
                  <p className={report.passed ? "text-2xl font-semibold text-[var(--color-success)]" : "text-2xl font-semibold text-[var(--color-danger)]"}>
                    {report.passed ? "합격" : "불합격"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">과목별 점수</p>
                <ul className="space-y-2">
                  {report.subjects.map((subject) => (
                    <li key={subject.id} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm">
                      <span>{subject.subjectName}</span>
                      <span className={subject.passed ? "font-semibold text-[var(--color-success)]" : "font-semibold text-[var(--color-danger)]"}>
                        {subject.score}점 ({subject.passed ? "통과" : "과락"})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button type="button" size="lg" onClick={() => setStarted(true)}>
              문항 리뷰 시작하기
            </Button>
          </div>
        </div>
      ) : null}

      {started && currentReview ? (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>{report.examTitle}</CardTitle>
                    <CardDescription>
                      {currentReview.subjectName} · 문제 {currentIndex + 1} / {orderedReviews.length}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="status-chip">리뷰 진행 {progressPercent}%</span>
                    <span className={currentReview.isCorrect ? "status-chip text-[var(--color-success)]" : "status-chip text-[var(--color-danger)]"}>
                      {currentReview.isCorrect ? "정답" : "오답"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold leading-8 md:text-2xl md:leading-9">
                    {currentReview.questionNo}. {currentReview.stem}
                  </h2>
                  {currentReview.imagePaths.map((imagePath, index) => (
                    <div key={`${currentReview.id}-image-${index}`} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePath} alt={`문항 ${currentReview.questionNo} 이미지 ${index + 1}`} className="h-auto w-full" />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {currentReview.choices.map((choice) => {
                    const isCorrectChoice = choice.no === currentReview.correctAnswer;
                    const isUserChoice = choice.no === currentReview.selectedAnswer;
                    const isWrongUserChoice = isUserChoice && !isCorrectChoice;

                    return (
                      <div
                        key={`${currentReview.id}-${choice.no}`}
                        className={[
                          "flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm md:px-4 md:py-4",
                          isCorrectChoice
                            ? "border-emerald-200 bg-emerald-50"
                            : isWrongUserChoice
                              ? "border-rose-200 bg-rose-50"
                              : "border-[var(--color-border)] bg-white",
                        ].join(" ")}
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-xs font-semibold text-[var(--color-primary)]">
                          {choice.no}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="leading-6 text-[15px]">{choice.text}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                            {isCorrectChoice ? <span className="text-[var(--color-success)]">정답</span> : null}
                            {isUserChoice ? (
                              <span className={isCorrectChoice ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>내 선택</span>
                            ) : null}
                            {!currentReview.selectedAnswer && choice.no === currentReview.correctAnswer ? <span className="text-[var(--color-success)]">정답 보기</span> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
                  <p className="font-semibold text-[var(--color-foreground)]">정답: {currentReview.correctAnswer}번</p>
                  <p className="mt-2 text-[var(--color-muted-foreground)]">
                    내 답: {currentReview.selectedAnswer ? `${currentReview.selectedAnswer}번` : "응답하지 않음"}
                  </p>
                </div>

                {currentReview.explanation ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-sm font-semibold">해설</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">{currentReview.explanation}</p>
                  </div>
                ) : null}

                {currentReview.explanationVideoUrl ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-sm font-semibold">해설 영상</p>
                    <p className="mt-2 text-sm">
                      <a
                        href={currentReview.explanationVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[var(--color-primary)] underline underline-offset-2"
                      >
                        {currentReview.explanationVideoUrl}
                      </a>
                    </p>
                  </div>
                ) : null}

                {currentReview.workImageUrl ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-sm font-semibold">내 손풀이</p>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentReview.workImageUrl} alt={`문항 ${currentReview.questionNo} 손풀이 이미지`} className="h-auto max-h-[420px] w-full object-contain" />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="w-full">
                이전 문제
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.min(orderedReviews.length - 1, prev + 1))}
                disabled={currentIndex >= orderedReviews.length - 1}
                className="w-full"
              >
                다음 문제
              </Button>
            </div>
          </section>

          <aside>
            <Card>
              <CardHeader>
                <CardTitle>리뷰 현황</CardTitle>
                <CardDescription>문항을 눌러 바로 이동할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>진행률</span>
                    <span className="font-semibold">
                      {currentIndex + 1} / {orderedReviews.length}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div className="h-full bg-[var(--color-primary)]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  정답 {correctCount}개 · 오답 {orderedReviews.length - correctCount}개
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {orderedReviews.map((review, index) => {
                    const isCurrent = index === currentIndex;

                    return (
                      <button
                        key={review.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={[
                          "h-10 rounded-xl border text-xs font-semibold",
                          isCurrent
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-foreground)]"
                            : review.isCorrect
                              ? "border-emerald-200 bg-emerald-50 text-[var(--color-success)]"
                              : "border-rose-200 bg-rose-50 text-[var(--color-danger)]",
                        ].join(" ")}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
