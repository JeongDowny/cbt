import { notFound } from "next/navigation";

import { getAttemptReportAction } from "@/app/actions/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";
import { ResultReviewRunner } from "@/features/reports/components/result-review-runner";
import { routes } from "@/lib/constants/routes";

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
      title="시험 결과와 문항별 리뷰"
      description="점수와 과목별 결과를 먼저 확인하고, 아래에서 문항별 정오답과 해설을 검토해 보세요."
      width="wide"
      headerAlign="left"
      density="compact"
      showBackButton
      backHref={routes.resultLookup}
    >
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

        <ResultReviewRunner report={report} />
      </div>
    </PageShell>
  );
}
