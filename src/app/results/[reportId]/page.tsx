import { notFound } from "next/navigation";

import { getAttemptReportAction } from "@/app/actions/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";

interface ResultPageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { reportId } = await params;
  const report = await getAttemptReportAction(reportId);

  if (!report) {
    notFound();
  }

  const wrongCount = report.totalQuestions - report.correctCount;

  return (
    <PageShell
      badge="채점 완료"
      title="시험 결과와 문항별 리뷰"
      description="점수와 과목별 결과를 먼저 확인하고, 아래에서 문항별 정오답과 해설을 검토해 보세요."
      width="wide"
      headerAlign="left"
      density="compact"
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {report.certificationName} · {report.examTitle}
            </CardTitle>
            <CardDescription>
              {report.userName} · {report.birthDate} · {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "미제출"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <Card>
          <CardHeader>
            <CardTitle>과목별 문항 리뷰</CardTitle>
            <CardDescription>과목 단위로 펼쳐 보면서 내 답안과 정답, 해설을 순서대로 확인할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.subjects.map((subject, index) => {
              const subjectReviews = report.reviews
                .filter((review) => review.attemptSubjectId === subject.id)
                .sort((a, b) => a.questionNo - b.questionNo);

              return (
                <details
                  key={subject.id}
                  className="rounded-[22px] border border-[var(--color-border)] bg-white open:shadow-[0_18px_40px_-28px_rgba(24,59,113,0.34)]"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-base font-semibold">{subject.subjectName}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                        문항 {subjectReviews.length}개 · {subject.score}점 · {subject.passed ? "통과" : "과락"}
                      </p>
                    </div>
                    <span className={subject.passed ? "text-sm font-semibold text-[var(--color-success)]" : "text-sm font-semibold text-[var(--color-danger)]"}>
                      {subject.passed ? "펼쳐서 보기" : "오답 확인"}
                    </span>
                  </summary>

                  <div className="space-y-4 border-t border-[var(--color-border)] px-5 py-5">
                    {subjectReviews.map((review) => (
                      <article key={review.id} className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
                        <header className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="font-semibold">
                            {review.questionNo}. {review.stem}
                          </h3>
                          <span className={review.isCorrect ? "text-sm font-semibold text-[var(--color-success)]" : "text-sm font-semibold text-[var(--color-danger)]"}>
                            {review.isCorrect ? "정답" : "오답"}
                          </span>
                        </header>

                        {review.imagePaths.map((imagePath, imageIndex) => (
                          <div key={`${review.id}-image-${imageIndex}`} className="mb-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePath} alt={`문항 ${review.questionNo} 이미지 ${imageIndex + 1}`} className="h-auto w-full" />
                          </div>
                        ))}

                        <ul className="space-y-2 text-sm">
                          {review.choices.map((choice) => {
                            const isCorrectChoice = choice.no === review.correctAnswer;
                            const isUserChoice = choice.no === review.selectedAnswer;

                            return (
                              <li
                                key={`${review.id}-${choice.no}`}
                                className={[
                                  "rounded-2xl border px-4 py-3",
                                  isCorrectChoice
                                    ? "border-emerald-200 bg-emerald-50"
                                    : isUserChoice
                                      ? "border-blue-200 bg-blue-50"
                                      : "border-[var(--color-border)] bg-white",
                                ].join(" ")}
                              >
                                <span className="font-medium">{choice.no}. </span>
                                <span>{choice.text}</span>
                                {isCorrectChoice ? <span className="ml-2 text-xs font-semibold text-[var(--color-success)]">정답</span> : null}
                                {isUserChoice ? <span className="ml-2 text-xs font-semibold text-blue-700">내 선택</span> : null}
                              </li>
                            );
                          })}
                        </ul>

                        {review.explanation ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">해설: {review.explanation}</p> : null}
                      </article>
                    ))}
                  </div>
                </details>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
