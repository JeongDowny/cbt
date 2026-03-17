"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteExamAction, saveExamAction } from "@/features/admin/exams/actions";
import { AdminExamBasicFields } from "@/features/admin/exams/components/admin-exam-basic-fields";
import { AdminExamDeleteBar } from "@/features/admin/exams/components/admin-exam-delete-bar";
import { AdminExamSubjectCard } from "@/features/admin/exams/components/admin-exam-subject-card";
import { createSubjectTemplate } from "@/features/admin/exams/form-templates";
import type { AdminExamFormValues } from "@/features/admin/exams/types";
import { routes } from "@/lib/constants/routes";

interface AdminExamEditorFormProps {
  mode: "create" | "edit";
  examId?: string;
  initialValues: AdminExamFormValues;
}

export function AdminExamEditorForm({ mode, examId, initialValues }: AdminExamEditorFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<AdminExamFormValues>({
    defaultValues: initialValues,
  });

  const { fields: subjectFields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  });

  const certificationName = useWatch({
    control,
    name: "certificationName",
  });
  const examYear = useWatch({
    control,
    name: "examYear",
  });
  const examRound = useWatch({
    control,
    name: "examRound",
  });

  const onSubmit = async (values: AdminExamFormValues) => {
    setSubmitError(null);

    startTransition(async () => {
      try {
        const result = await saveExamAction({ examId, values });
        router.replace(routes.adminExamEdit(result.examId));
        router.refresh();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "시험 저장에 실패했습니다. 입력값과 권한을 확인해 주세요.");
      }
    });
  };

  const handleDeleteExam = () => {
    if (!examId) {
      return;
    }

    const examLabel = `${certificationName?.trim() || "시험"} ${examYear ?? ""}년 ${examRound ?? ""}회차`.trim();
    const confirmedName = window.prompt(`삭제하려면 시험명 "${examLabel}" 을(를) 입력해 주세요.`, "");

    if (confirmedName === null) {
      return;
    }

    if (confirmedName.trim() !== examLabel) {
      window.alert("시험명이 일치하지 않아 삭제하지 않았습니다.");
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      try {
        await deleteExamAction({ examId });
        router.replace(routes.adminDashboard);
        router.refresh();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "시험 삭제에 실패했습니다.");
      }
    });
  };

  const handleRemoveSubject = (subjectIndex: number, subjectName: string) => {
    const trimmedSubjectName = subjectName.trim() || `과목 ${subjectIndex + 1}`;
    const confirmedName = window.prompt(`삭제하려면 과목명 "${trimmedSubjectName}" 을(를) 입력해 주세요.`, "");

    if (confirmedName === null) {
      return;
    }

    if (confirmedName.trim() !== trimmedSubjectName) {
      window.alert("과목명이 일치하지 않아 삭제하지 않았습니다.");
      return;
    }

    remove(subjectIndex);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <AdminExamBasicFields mode={mode} register={register} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">문항 편집</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">먼저 과목을 추가한 뒤, 각 과목 안에서 문항을 넣어 주세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => append(createSubjectTemplate())}>
              과목 추가
            </Button>
          </div>
        </div>

        {subjectFields.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-[var(--color-muted-foreground)]">아직 등록된 과목이 없습니다. `과목 추가`를 눌러 세부 과목부터 만들어 주세요.</p>
            </CardContent>
          </Card>
        ) : (
          subjectFields.map((subjectField, subjectIndex) => (
            <AdminExamSubjectCard
              key={subjectField.id}
              subjectIndex={subjectIndex}
              subjectFieldId={subjectField.id}
              control={control}
              register={register}
              setValue={setValue}
              examId={examId}
              collapsed={collapsedSubjects[subjectField.id] ?? false}
              onToggleCollapsed={() =>
                setCollapsedSubjects((prev) => ({
                  ...prev,
                  [subjectField.id]: !(prev[subjectField.id] ?? false),
                }))
              }
              onRemoveSubject={() => handleRemoveSubject(subjectIndex, getValues(`subjects.${subjectIndex}.name`) ?? "")}
            />
          ))
        )}
      </div>

      {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

      <AdminExamDeleteBar mode={mode} examId={examId} pending={isSubmitting || isPending} onDelete={handleDeleteExam} />
    </form>
  );
}
