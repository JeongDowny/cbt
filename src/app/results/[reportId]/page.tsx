import { notFound } from "next/navigation";

import { getAttemptReportAction } from "@/app/actions/reports";
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
      <ResultReviewRunner report={report} />
    </PageShell>
  );
}
