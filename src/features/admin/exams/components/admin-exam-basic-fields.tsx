"use client";

import type { UseFormRegister } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminExamFormValues } from "@/features/admin/exams/types";

export function AdminExamBasicFields({
  mode,
  register,
}: {
  mode: "create" | "edit";
  register: UseFormRegister<AdminExamFormValues>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "시험 생성" : "시험 수정"}</CardTitle>
        <CardDescription>시험 기본 정보를 입력하세요.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="certificationName">자격명</Label>
          <Input id="certificationName" {...register("certificationName", { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examYear">연도</Label>
          <Input id="examYear" type="number" {...register("examYear", { valueAsNumber: true, required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examRound">회차</Label>
          <Input id="examRound" type="number" {...register("examRound", { valueAsNumber: true, required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <select id="status" className="ui-select" {...register("status", { required: true })}>
            <option value="draft">임시저장</option>
            <option value="published">공개</option>
            <option value="archived">보관</option>
          </select>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 md:pt-3">
          <input id="isPublic" type="checkbox" className="h-4 w-4" {...register("isPublic")} />
          <Label htmlFor="isPublic">학생 화면에 공개하기</Label>
        </div>
      </CardContent>
    </Card>
  );
}
