import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <PageShell title="관리자 대시보드" description="시험 목록을 확인하고 생성/수정할 수 있습니다.">
      <Card>
        <CardHeader>
          <CardTitle>시험 관리</CardTitle>
          <CardDescription>최신 시험 10건</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <Link href={routes.adminExamNew} className="text-[var(--color-primary)] hover:underline">
              새 시험 만들기
            </Link>
          </div>

          <ul className="space-y-2">
            {(exams ?? []).map((exam) => {
              const certification = Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications;

              return (
                <li key={exam.id} className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2">
                  <span>
                    {certification?.name ?? "자격 미지정"} / {exam.title} ({exam.exam_year}-{exam.exam_round}) · {exam.status}{" "}
                    · {exam.is_public ? "공개" : "비공개"}
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
