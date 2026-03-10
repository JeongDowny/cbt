import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("id, certification_name, title, exam_year, exam_round")
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false })
    .limit(10);

  return (
    <PageShell title="Admin Dashboard" description="관리자용 시험 관리 화면입니다.">
      <Card>
        <CardHeader>
          <CardTitle>Exam Management</CardTitle>
          <CardDescription>시험 생성/수정 기능의 최소 구현입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <Link href={routes.adminExamNew} className="text-[var(--color-primary)] hover:underline">
              새 시험 만들기
            </Link>
          </div>

          <ul className="space-y-2">
            {(exams ?? []).map((exam) => (
              <li key={exam.id} className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2">
                <span>
                  {exam.certification_name} / {exam.title} ({exam.exam_year}-{exam.exam_round})
                </span>
                <Link href={routes.adminExamEdit(exam.id)} className="text-[var(--color-primary)] hover:underline">
                  수정
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}
