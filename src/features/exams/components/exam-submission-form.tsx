"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassGroupOption } from "@/features/classes/types";
import type { SubmitIdentityValues } from "@/features/exams/types";

interface ExamSubmissionFormProps {
  examTitle: string;
  solvedCount: number;
  totalCount: number;
  timeoutReached: boolean;
  classGroupOptions: ClassGroupOption[];
  isSubmitting: boolean;
  saveError: string | null;
  onSubmit: (values: SubmitIdentityValues) => void;
  onCancel: () => void;
}

export function ExamSubmissionForm({
  examTitle,
  solvedCount,
  totalCount,
  timeoutReached,
  classGroupOptions,
  isSubmitting,
  saveError,
  onSubmit,
  onCancel,
}: ExamSubmissionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitIdentityValues>({
    defaultValues: {
      userName: "",
      classGroupId: classGroupOptions[0]?.id ?? "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{timeoutReached ? "시험 시간이 종료되었습니다" : "답안 제출"}</CardTitle>
        <CardDescription>이름과 반을 입력하면 채점 후 결과 페이지로 이동합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
          <p>시험: {examTitle}</p>
          <p>
            응답한 문항: {solvedCount} / {totalCount}
          </p>
        </div>

        <form className="grid grid-cols-1 gap-4 md:max-w-md" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="classGroupId">반 선택</Label>
            <select
              id="classGroupId"
              className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              {...register("classGroupId", { required: "반을 선택해 주세요." })}
            >
              <option value="">반을 선택해 주세요</option>
              {classGroupOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.classGroupId ? <p className="text-xs text-red-700">{errors.classGroupId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">이름</Label>
            <Input id="userName" placeholder="홍길동" {...register("userName", { required: "이름을 입력해 주세요." })} />
            {errors.userName ? <p className="text-xs text-red-700">{errors.userName.message}</p> : null}
          </div>

          {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "채점 및 결과 저장"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={timeoutReached || isSubmitting}>
              돌아가기
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
