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
    <PageShell title="Edit Exam" description="시험 메타데이터와 문항을 수정합니다.">
      <AdminExamEditorForm mode="edit" examId={examId} initialValues={initialValues} />
    </PageShell>
  );
}
