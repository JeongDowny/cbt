import { PageShell } from "@/features/layout/components/page-shell";
import { ExamSelectionForm } from "@/features/exams/components/exam-selection-form";
import type { StudentExamOption } from "@/features/exams/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExamSelectionPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("exams")
    .select("id, title, exam_year, exam_round, status, is_public, certifications(name)")
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false });

  if (!user) {
    query = query.eq("status", "published").eq("is_public", true);
  }

  const { data, error } = await query;

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
    <PageShell
      badge="전기 CBT"
      title="전기기사 · 산업기사 CBT 기출문제"
      description="응시할 시험을 고르고, 원하는 방식으로 풀이 옵션을 정해 시작하세요."
    >
      <ExamSelectionForm exams={exams} loadErrorMessage={error?.message} />
    </PageShell>
  );
}
