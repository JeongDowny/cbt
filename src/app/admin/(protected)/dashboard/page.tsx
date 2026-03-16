import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createClassGroupAction,
  deleteClassGroupAction,
  signOutAdminAction,
} from "@/features/admin/actions";
import { AdminAttemptGroups } from "@/features/admin/components/admin-attempt-groups";
import { formatClassGroupLabel } from "@/features/classes/data";
import type { DashboardAttemptGroup } from "@/features/classes/types";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface AdminDashboardPageProps {
  searchParams?: Promise<{ message?: string; error?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const supabase = createSupabaseAdminClient();

  const [
    { data: exams },
    { data: classGroups },
    { data: attempts },
  ] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, exam_year, exam_round, status, is_public, certifications(name)")
      .order("exam_year", { ascending: false })
      .order("exam_round", { ascending: false })
      .limit(10),
    supabase
      .from("class_groups")
      .select("id, class_year_id, class_name_id, class_cohort_id, class_years(year), class_names(name), class_cohorts(cohort_no)")
      .order("created_at", { ascending: true }),
    supabase
      .from("attempts")
      .select(
        "id, user_name, class_year_snapshot, class_name_snapshot, cohort_no_snapshot, total_score, passed, submitted_at, exams(title, certifications(name))"
      )
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(100),
  ]);

  const groupedAttemptsMap = new Map<string, DashboardAttemptGroup>();

  (attempts ?? []).forEach((attempt) => {
    const classLabel =
      attempt.class_year_snapshot && attempt.class_name_snapshot && attempt.cohort_no_snapshot
        ? formatClassGroupLabel(attempt.class_year_snapshot, attempt.cohort_no_snapshot, attempt.class_name_snapshot)
        : "반 미지정";
    const groupId = `${attempt.class_year_snapshot ?? "unknown"}-${attempt.cohort_no_snapshot ?? "unknown"}-${attempt.class_name_snapshot ?? "unknown"}`;
    const exam = Array.isArray(attempt.exams) ? attempt.exams[0] : attempt.exams;
    const certification = exam
      ? Array.isArray(exam.certifications)
        ? exam.certifications[0]
        : exam.certifications
      : null;

    const group =
      groupedAttemptsMap.get(groupId) ??
      ({
        id: groupId,
        label: classLabel,
        classYear: attempt.class_year_snapshot,
        className: attempt.class_name_snapshot,
        cohortNo: attempt.cohort_no_snapshot,
        attempts: [],
      } satisfies DashboardAttemptGroup);

    group.attempts.push({
      id: attempt.id,
      examTitle: exam?.title ?? "시험",
      certificationName: certification?.name ?? "자격",
      userName: attempt.user_name,
      score: Number(attempt.total_score),
      passed: attempt.passed,
      submittedAt: attempt.submitted_at,
    });

    groupedAttemptsMap.set(groupId, group);
  });

  const attemptGroups = Array.from(groupedAttemptsMap.values()).sort((a, b) => {
    if (a.classYear === null && b.classYear !== null) {
      return 1;
    }
    if (a.classYear !== null && b.classYear === null) {
      return -1;
    }
    if ((a.classYear ?? 0) !== (b.classYear ?? 0)) {
      return (b.classYear ?? 0) - (a.classYear ?? 0);
    }
    if ((a.cohortNo ?? 0) !== (b.cohortNo ?? 0)) {
      return (a.cohortNo ?? 0) - (b.cohortNo ?? 0);
    }
    return (a.className ?? "").localeCompare(b.className ?? "", "ko");
  });

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
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>반 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createClassGroupAction} className="grid gap-3 md:grid-cols-[180px_1fr_140px_auto]">
              <input
                name="year"
                type="number"
                min="2000"
                className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                placeholder="2026"
              />
              <input
                name="className"
                type="text"
                className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                placeholder="전기 A반"
              />
              <input
                name="cohortNo"
                type="number"
                min="1"
                className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                placeholder="1"
              />
              <Button type="submit">반 추가</Button>
            </form>

            <ul className="space-y-2">
              {(classGroups ?? []).map((group) => {
                const classYear = Array.isArray(group.class_years) ? group.class_years[0]?.year : group.class_years?.year;
                const className = Array.isArray(group.class_names) ? group.class_names[0]?.name : group.class_names?.name;
                const cohortNo = Array.isArray(group.class_cohorts) ? group.class_cohorts[0]?.cohort_no : group.class_cohorts?.cohort_no;
                const label = classYear && className && cohortNo ? formatClassGroupLabel(classYear, cohortNo, className) : "반 정보 미완성";

                return (
                  <li key={group.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm">
                    <span>{label}</span>
                    <form action={deleteClassGroupAction}>
                      <input type="hidden" name="id" value={group.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        삭제
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>반별 응시 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAttemptGroups groups={attemptGroups} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시험 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
