import { notFound } from "next/navigation";

import { getSubmissionReportAction } from "@/app/actions/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";

interface ResultPageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { reportId } = await params;
  const report = await getSubmissionReportAction(reportId);

  if (!report) {
    notFound();
  }

  const wrongCount = report.totalQuestions - report.correctCount;

  return (
    <PageShell title="시험 결과" description="채점 결과와 문항별 리뷰를 확인해 주세요.">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{report.examTitle}</CardTitle>
            <CardDescription>
              {report.userName} · {report.birthDate} · {new Date(report.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-md border border-[var(--color-border)] p-4">
              <p className="text-sm text-[var(--color-muted-foreground)]">점수</p>
              <p className="text-2xl font-semibold">{report.score}</p>
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-4">
              <p className="text-sm text-[var(--color-muted-foreground)]">정답</p>
              <p className="text-2xl font-semibold">{report.correctCount}</p>
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-4">
              <p className="text-sm text-[var(--color-muted-foreground)]">오답</p>
              <p className="text-2xl font-semibold">{wrongCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>문항별 리뷰</CardTitle>
            <CardDescription>내 답안과 정답을 비교할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.reviews.map((review) => (
              <article key={review.questionId} className="rounded-md border border-[var(--color-border)] p-4">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    {review.questionNo}. {review.stem}
                  </h3>
                  <span className={review.isCorrect ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>
                    {review.isCorrect ? "정답" : "오답"}
                  </span>
                </header>

                {review.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={review.imageUrl} alt={`문항 ${review.questionNo} 이미지`} className="h-auto w-full" />
                  </div>
                ) : null}

                <ul className="space-y-2 text-sm">
                  {review.choices.map((choice) => {
                    const isCorrectChoice = choice.no === review.correctAnswer;
                    const isUserChoice = choice.no === review.userAnswer;

                    return (
                      <li
                        key={`${review.questionId}-${choice.no}`}
                        className={[
                          "rounded-md border px-3 py-2",
                          isCorrectChoice
                            ? "border-emerald-300 bg-emerald-50"
                            : isUserChoice
                              ? "border-blue-300 bg-blue-50"
                              : "border-[var(--color-border)] bg-white",
                        ].join(" ")}
                      >
                        <span className="font-medium">{choice.no}. </span>
                        <span>{choice.text}</span>
                        {isCorrectChoice ? <span className="ml-2 text-xs font-semibold text-emerald-700">정답</span> : null}
                        {isUserChoice ? <span className="ml-2 text-xs font-semibold text-blue-700">내 선택</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
