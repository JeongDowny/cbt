import { notFound } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAdminAction } from "@/features/admin/actions";
import { AdminExamEditorForm } from "@/features/admin/exams/components/admin-exam-editor-form";
import { getExamFormValuesById } from "@/features/admin/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";

interface AdminExamEditPageProps {
  params: Promise<{ examId: string }>;
}

export default async function AdminExamEditPage({ params }: AdminExamEditPageProps) {
  const { examId } = await params;
  const initialValues = await getExamFormValuesById(examId);

  if (!initialValues) {
    notFound();
  }

  return (
    <PageShell
      badge="관리자"
      title="시험 수정"
      description="기존 시험의 기본 정보와 문항 구성을 확인하고 수정하세요."
      width="wide"
      density="compact"
      showBackButton
      backHref={routes.adminDashboard}
      headerActions={
        <>
          <Link href={routes.adminDashboard} className="inline-flex h-9 items-center rounded-lg border border-[var(--color-border-strong)] bg-white px-4 text-sm font-semibold">
            대시보드
          </Link>
          <form action={signOutAdminAction}>
            <Button type="submit" variant="outline" size="sm">
              로그아웃
            </Button>
          </form>
        </>
      }
    >
      <AdminExamEditorForm mode="edit" examId={examId} initialValues={initialValues} />
    </PageShell>
  );
}
