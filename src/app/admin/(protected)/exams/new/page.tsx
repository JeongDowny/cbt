import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAdminAction } from "@/features/admin/actions";
import { AdminExamEditorForm } from "@/features/admin/exams/components/admin-exam-editor-form";
import { createEmptyExamFormValues } from "@/features/admin/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";

export default function AdminExamCreatePage() {
  return (
    <PageShell
      badge="관리자"
      title="새 시험 등록"
      description="시험 기본 정보와 문항 구성을 입력해 바로 공개하거나 임시 저장할 수 있습니다."
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
      <AdminExamEditorForm mode="create" initialValues={createEmptyExamFormValues()} />
    </PageShell>
  );
}
