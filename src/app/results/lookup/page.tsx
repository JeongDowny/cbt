import { PageShell } from "@/features/layout/components/page-shell";
import { ResultLookupForm } from "@/features/reports/components/result-lookup-form";

export default function ResultLookupPage() {
  return (
    <PageShell title="Result Lookup" description="Find previous result records by name and birth date.">
      <ResultLookupForm />
    </PageShell>
  );
}
