"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { lookupAttemptsAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LookupAttemptRow } from "@/features/reports/types";
import { routes } from "@/lib/constants/routes";

type LookupValues = {
  name: string;
  birthDate: string;
};

export function ResultLookupForm() {
  const [rows, setRows] = useState<LookupAttemptRow[] | null>(null);
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
        const result = await lookupAttemptsAction({
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
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>조회 정보 입력</CardTitle>
          <CardDescription>시험을 제출할 때 저장한 이름과 생년월일을 정확히 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit(onSubmit)}>
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

            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
                {isPending ? "조회 중..." : "결과 조회"}
              </Button>
            </div>
          </form>

          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      {rows ? (
        <Card>
          <CardHeader>
            <CardTitle>조회 결과</CardTitle>
            <CardDescription>{rows.length === 0 ? "조건과 일치하는 결과가 없습니다." : "저장된 응시 기록을 선택해 상세 결과를 확인하세요."}</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">다시 확인할 결과가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {row.certificationName} · {row.examTitle}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "미제출"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm">
                        {row.score}점 · {row.passed ? "합격" : "불합격"}
                      </p>
                      <Link href={routes.resultPage(row.id)} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                        상세 보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
