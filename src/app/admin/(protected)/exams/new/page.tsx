import { AdminExamEditorForm } from "@/features/admin/exams/components/admin-exam-editor-form";
import { createEmptyExamFormValues } from "@/features/admin/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";

export default function AdminExamCreatePage() {
  return (
    <PageShell title="Create Exam" description="새 시험과 문항을 등록합니다.">
      <AdminExamEditorForm mode="create" initialValues={createEmptyExamFormValues()} />
    </PageShell>
  );
}
