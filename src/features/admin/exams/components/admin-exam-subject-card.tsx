"use client";

import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminExamQuestionCard } from "@/features/admin/exams/components/admin-exam-question-card";
import { createQuestionTemplate } from "@/features/admin/exams/form-templates";
import type { AdminExamFormValues } from "@/features/admin/exams/types";

export function AdminExamSubjectCard({
  subjectIndex,
  subjectFieldId,
  control,
  register,
  setValue,
  examId,
  collapsed,
  onToggleCollapsed,
  onRemoveSubject,
}: {
  subjectIndex: number;
  subjectFieldId: string;
  control: Control<AdminExamFormValues>;
  register: UseFormRegister<AdminExamFormValues>;
  setValue: UseFormSetValue<AdminExamFormValues>;
  examId?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRemoveSubject: () => void;
}) {
  const { fields: questionFields, append, remove } = useFieldArray({
    control,
    name: `subjects.${subjectIndex}.questions`,
  });

  const subjectName = useWatch({
    control,
    name: `subjects.${subjectIndex}.name`,
  });

  const timeLimitMinutes = useWatch({
    control,
    name: `subjects.${subjectIndex}.timeLimitMinutes`,
  });

  const trimmedSubjectName = subjectName?.trim() || `과목 ${subjectIndex + 1}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{trimmedSubjectName}</CardTitle>
            <CardDescription>
              문항 {questionFields.length}개 · 과목 제한시간 {timeLimitMinutes ?? 30}분
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onRemoveSubject}>
              과목 삭제
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => append(createQuestionTemplate())}>
              이 과목에 문항 추가
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onToggleCollapsed}>
              {collapsed ? "펼치기" : "접기"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed ? (
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`subject-name-${subjectFieldId}`}>과목명</Label>
              <Input id={`subject-name-${subjectFieldId}`} {...register(`subjects.${subjectIndex}.name`, { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`subject-time-${subjectFieldId}`}>과목 제한시간(분)</Label>
              <Input
                id={`subject-time-${subjectFieldId}`}
                type="number"
                {...register(`subjects.${subjectIndex}.timeLimitMinutes`, { valueAsNumber: true, required: true })}
              />
            </div>
          </div>

          {questionFields.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
              아직 등록된 문항이 없습니다. 헤더의 `이 과목에 문항 추가` 버튼으로 시작하세요.
            </div>
          ) : (
            <div className="space-y-4">
              {questionFields.map((questionField, questionIndex) => (
                <AdminExamQuestionCard
                  key={questionField.id}
                  subjectIndex={subjectIndex}
                  questionIndex={questionIndex}
                  control={control}
                  register={register}
                  setValue={setValue}
                  examId={examId}
                  onRemoveQuestion={() => remove(questionIndex)}
                />
              ))}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
