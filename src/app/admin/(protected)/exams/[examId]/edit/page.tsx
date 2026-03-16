import { notFound } from "next/navigation";

import { AdminExamEditorForm } from "@/features/admin/exams/components/admin-exam-editor-form";
import { getExamFormValuesById } from "@/features/admin/exams/data";
import { PageShell } from "@/features/layout/components/page-shell";

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
    >
      <AdminExamEditorForm mode="edit" examId={examId} initialValues={initialValues} />
    </PageShell>
  );
}
