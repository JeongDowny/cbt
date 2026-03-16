import { AdminExamEditorForm } from "@/features/admin/exams/components/admin-exam-editor-form";
import { createEmptyExamFormValues } from "@/features/admin/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";

export default function AdminExamCreatePage() {
  return (
    <PageShell
      badge="관리자"
      title="새 시험 등록"
      description="시험 기본 정보와 문항 구성을 입력해 바로 공개하거나 임시 저장할 수 있습니다."
      width="wide"
      density="compact"
    >
      <AdminExamEditorForm mode="create" initialValues={createEmptyExamFormValues()} />
    </PageShell>
  );
}
