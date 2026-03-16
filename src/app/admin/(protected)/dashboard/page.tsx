import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, exam_year, exam_round, status, is_public, certifications(name)")
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false })
    .limit(10);

  return (
    <PageShell
      badge="관리자"
      title="시험 관리 대시보드"
      description="등록된 시험을 확인하고 새 시험을 추가하거나 기존 시험을 수정할 수 있습니다."
      width="wide"
      density="compact"
      contentClassName="space-y-5"
    >
      <Card>
        <CardHeader>
          <CardTitle>시험 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <Link href={routes.adminExamNew} className="font-semibold text-[var(--color-primary)] hover:underline">
              새 시험 만들기
            </Link>
          </div>

          <ul className="space-y-2">
            {(exams ?? []).map((exam) => {
              const certification = Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications;

              return (
                <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                  <span>
                    {certification?.name ?? "자격 미지정"} / {exam.title} ({exam.exam_year}-{exam.exam_round}) ·{" "}
                    {exam.status === "draft" ? "임시저장" : exam.status === "published" ? "공개중" : "보관"} ·{" "}
                    {exam.is_public ? "노출" : "비노출"}
                  </span>
                  <Link href={routes.adminExamEdit(exam.id)} className="text-[var(--color-primary)] hover:underline">
                    수정
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}
