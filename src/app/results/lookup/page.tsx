import { PageShell } from "@/features/layout/components/page-shell";
import { ResultLookupForm } from "@/features/reports/components/result-lookup-form";

export default function ResultLookupPage() {
  return (
    <PageShell
      badge="결과 확인"
      title="저장된 시험 결과 조회"
      description="이름과 생년월일을 입력하면 이전에 저장한 응시 결과를 다시 확인할 수 있습니다."
    >
      <ResultLookupForm />
    </PageShell>
  );
}
