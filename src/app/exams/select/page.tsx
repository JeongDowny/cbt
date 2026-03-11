import { PageShell } from "@/features/layout/components/page-shell";
import { ExamSelectionForm } from "@/features/exams/components/exam-selection-form";
import type { StudentExamOption } from "@/features/exams/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export default async function ExamSelectionPage() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("exams")
    .select("id, title, exam_year, exam_round, status, is_public, certifications(name)")
    .eq("status", "published")
    .eq("is_public", true)
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false });

  const exams: StudentExamOption[] = (data ?? []).map((exam) => {
    const certification = Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications;

    return {
      id: exam.id,
      title: exam.title,
      examYear: exam.exam_year,
      examRound: exam.exam_round,
      certificationName: certification?.name ?? "기본 자격",
      status: exam.status,
      isPublic: exam.is_public,
    };
  });

  return (
    <PageShell title="시험 선택" description="시험 정보를 선택하고 응시 옵션을 설정하세요.">
      <ExamSelectionForm exams={exams} loadErrorMessage={error?.message} />
    </PageShell>
  );
}
