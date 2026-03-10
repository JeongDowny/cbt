"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { lookupSubmissionReportsAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LookupSubmissionReportRow } from "@/features/reports/types";
import { routes } from "@/lib/constants/routes";

type LookupValues = {
  name: string;
  birthDate: string;
};

export function ResultLookupForm() {
  const [rows, setRows] = useState<LookupSubmissionReportRow[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupValues>();

  const onSubmit = (values: LookupValues) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await lookupSubmissionReportsAction({
          userName: values.name,
          birthDate: values.birthDate,
        });
        setRows(result);
      } catch (error) {
        setRows(null);
        setErrorMessage(error instanceof Error ? error.message : "결과 조회에 실패했습니다.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>결과 조회</CardTitle>
        <CardDescription>이름과 생년월일로 이전 시험 결과를 조회할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid grid-cols-1 gap-4 md:max-w-md" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" {...register("name", { required: "이름을 입력해 주세요." })} />
            {errors.name ? <p className="text-xs text-red-700">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일</Label>
            <Input
              id="birthDate"
              type="date"
              {...register("birthDate", {
                required: "생년월일을 입력해 주세요.",
                pattern: {
                  value: /^\d{4}-\d{2}-\d{2}$/,
                  message: "생년월일 형식을 확인해 주세요.",
                },
              })}
            />
            {errors.birthDate ? <p className="text-xs text-red-700">{errors.birthDate.message}</p> : null}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "조회 중..." : "결과 조회"}
          </Button>
        </form>

        {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

        {rows ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">조회 결과</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">일치하는 결과가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{row.examTitle}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{new Date(row.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm">
                        {row.correctCount}/{row.totalQuestions} · {row.score}점
                      </p>
                      <Link href={routes.resultPage(row.id)} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                        보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
