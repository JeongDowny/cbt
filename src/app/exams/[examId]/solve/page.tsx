import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamSolvingRunner } from "@/features/exams/components/exam-solving-runner";
import { fetchSolveData } from "@/features/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";

interface ExamSolvingPageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamSolvingPage({ params }: ExamSolvingPageProps) {
  const { examId } = await params;
  const result = await fetchSolveData(examId)
    .then((data) => ({ data, errorMessage: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      errorMessage: error instanceof Error ? error.message : "시험 데이터를 불러오지 못했습니다.",
    }));

  return (
    <PageShell title="시험 풀이" description="문항을 읽고 답안을 선택한 뒤 제출하세요.">
      {result.data ? (
        <ExamSolvingRunner examId={examId} examTitle={result.data.examTitle} questions={result.data.questions} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>시험을 시작할 수 없습니다</CardTitle>
            <CardDescription>잠시 후 다시 시도해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-muted-foreground)]">{result.errorMessage}</CardContent>
        </Card>
      )}
    </PageShell>
  );
}
