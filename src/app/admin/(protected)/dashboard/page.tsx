import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAdminAction } from "@/features/admin/actions";
import { AdminAttemptGroups } from "@/features/admin/components/admin-attempt-groups";
import { AdminClassGroupManager } from "@/features/admin/components/admin-class-group-manager";
import { AdminExamListSection } from "@/features/admin/components/admin-exam-list-section";
import { fetchDashboardAttemptGroups, fetchDashboardClassGroups, fetchDashboardExams } from "@/features/admin/dashboard/data";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";

interface AdminDashboardPageProps {
  searchParams?: Promise<{ message?: string; error?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const [exams, classGroups, attemptGroups] = await Promise.all([
    fetchDashboardExams(),
    fetchDashboardClassGroups(),
    fetchDashboardAttemptGroups(),
  ]);

  return (
    <PageShell
      badge="관리자"
      title="시험 관리 대시보드"
      description="반 정보와 시험 목록, 반별 응시 결과를 한 곳에서 관리할 수 있습니다."
      width="wide"
      density="compact"
      showBackButton
      backHref={routes.home}
      headerActions={
        <>
          <Link href={routes.adminExamNew} className="inline-flex h-9 items-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">
            새 시험
          </Link>
          <form action={signOutAdminAction}>
            <Button type="submit" variant="outline" size="sm">
              로그아웃
            </Button>
          </form>
        </>
      }
      contentClassName="space-y-5"
    >
      {params?.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.message}</div>
      ) : null}
      {params?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.error}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminClassGroupManager classGroups={classGroups} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>반별 응시 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAttemptGroups groups={attemptGroups} />
        </CardContent>
      </Card>

      <AdminExamListSection exams={exams} />
    </PageShell>
  );
}
