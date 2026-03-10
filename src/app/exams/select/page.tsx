import { PageShell } from "@/features/layout/components/page-shell";
import { ExamSelectionForm } from "@/features/exams/components/exam-selection-form";
import type { StudentExamOption } from "@/features/exams/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

function deriveCertificationName(title: string) {
  const normalized = title.replace(/\d{4}년\s*\d+회차/g, "").trim();
  return normalized.length > 0 ? normalized : "기본 자격";
}

export default async function ExamSelectionPage() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("exams")
    .select("id, title, exam_year, exam_round")
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false });

  const exams: StudentExamOption[] = (data ?? []).map((exam) => ({
    id: exam.id,
    title: exam.title,
    examYear: exam.exam_year,
    examRound: exam.exam_round,
    certificationName: deriveCertificationName(exam.title),
  }));

  return (
    <PageShell title="시험 선택" description="시험 정보를 선택하고 응시 옵션을 설정하세요.">
      <ExamSelectionForm exams={exams} loadErrorMessage={error?.message} />
    </PageShell>
  );
}
