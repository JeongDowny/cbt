import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClassGroupOptions } from "@/features/classes/data";
import { ExamSolvingRunner } from "@/features/exams/components/exam-solving-runner";
import { fetchSolveData } from "@/features/exams/data";

interface ExamSolvingPageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamSolvingPage({ params }: ExamSolvingPageProps) {
  const { examId } = await params;
  const classGroupOptions = await fetchClassGroupOptions().catch(() => []);
  const result = await fetchSolveData(examId)
    .then((data) => ({ data, errorMessage: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      errorMessage: error instanceof Error ? error.message : "시험 데이터를 불러오지 못했습니다.",
    }));

  return (
    <section className="mx-auto w-full max-w-[var(--page-max-width-wide)] px-5 pb-14 pt-6 md:px-6 md:pb-20 md:pt-8">
      {result.data ? (
        <ExamSolvingRunner
          examId={examId}
          examTitle={result.data.examTitle}
          questions={result.data.questions}
          classGroupOptions={classGroupOptions}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>시험을 시작할 수 없습니다</CardTitle>
            <CardDescription>잠시 후 다시 시도해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-muted-foreground)]">{result.errorMessage}</CardContent>
        </Card>
      )}
    </section>
  );
}
