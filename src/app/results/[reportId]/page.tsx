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
    <PageShell title="시험 결과" description="채점 결과와 문항별 리뷰를 확인해 주세요.">
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
              <div className="rounded-md border border-[var(--color-border)] p-4">
                <p className="text-sm text-[var(--color-muted-foreground)]">합격 여부</p>
                <p className={report.passed ? "text-2xl font-semibold text-emerald-700" : "text-2xl font-semibold text-rose-700"}>
                  {report.passed ? "합격" : "불합격"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">과목별 점수</p>
              <ul className="space-y-2">
                {report.subjects.map((subject) => (
                  <li key={subject.id} className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
                    <span>{subject.subjectName}</span>
                    <span className={subject.passed ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
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
            <CardTitle>문항별 리뷰</CardTitle>
            <CardDescription>내 답안과 정답을 비교할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.reviews.map((review) => (
              <article key={review.id} className="rounded-md border border-[var(--color-border)] p-4">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    [{review.subjectName}] {review.questionNo}. {review.stem}
                  </h3>
                  <span className={review.isCorrect ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>
                    {review.isCorrect ? "정답" : "오답"}
                  </span>
                </header>

                {review.imagePaths.map((imagePath, index) => (
                  <div key={`${review.id}-image-${index}`} className="mb-3 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePath} alt={`문항 ${review.questionNo} 이미지 ${index + 1}`} className="h-auto w-full" />
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

                {review.explanation ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">해설: {review.explanation}</p> : null}
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
