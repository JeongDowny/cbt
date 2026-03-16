"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentExamOption } from "@/features/exams/types";
import { routes } from "@/lib/constants/routes";
import { useExamSessionStore } from "@/stores/exam-session.store";

interface ExamSelectionFormProps {
  exams: StudentExamOption[];
  loadErrorMessage?: string;
}

type ExamSelectionValues = {
  certificationName: string;
  examId: string;
  examYear: number;
  examRound: number;
  timeLimitMinutes: number | null;
  randomOrder: boolean;
  questionCount: number | null;
};

function getInitialValues(exams: StudentExamOption[]): ExamSelectionValues {
  const firstExam = exams[0];

  if (!firstExam) {
    return {
      certificationName: "",
      examId: "",
      examYear: new Date().getFullYear(),
      examRound: 1,
      timeLimitMinutes: 60,
      randomOrder: false,
      questionCount: 20,
    };
  }

  return {
    certificationName: firstExam.certificationName,
    examId: firstExam.id,
    examYear: firstExam.examYear,
    examRound: firstExam.examRound,
    timeLimitMinutes: 60,
    randomOrder: false,
    questionCount: 20,
  };
}

export function ExamSelectionForm({ exams, loadErrorMessage }: ExamSelectionFormProps) {
  const router = useRouter();
  const { setSessionOptions } = useExamSessionStore();

  const initialValues = useMemo(() => getInitialValues(exams), [exams]);

  const { register, handleSubmit, setValue, control } = useForm<ExamSelectionValues>({
    defaultValues: initialValues,
  });

  const certificationName = useWatch({ control, name: "certificationName" });
  const examId = useWatch({ control, name: "examId" });
  const examYear = useWatch({ control, name: "examYear" });
  const examRound = useWatch({ control, name: "examRound" });

  const certifications = useMemo(
    () => Array.from(new Set(exams.map((exam) => exam.certificationName))),
    [exams]
  );

  const filteredByCertification = useMemo(
    () => exams.filter((exam) => exam.certificationName === certificationName),
    [exams, certificationName]
  );

  const filteredByExam = useMemo(
    () => filteredByCertification.filter((exam) => exam.id === examId),
    [filteredByCertification, examId]
  );

  const years = useMemo(
    () => Array.from(new Set(filteredByCertification.map((exam) => exam.examYear))).sort((a, b) => b - a),
    [filteredByCertification]
  );

  const rounds = useMemo(
    () => Array.from(new Set(filteredByCertification.filter((exam) => exam.examYear === examYear).map((exam) => exam.examRound))).sort((a, b) => a - b),
    [filteredByCertification, examYear]
  );

  useEffect(() => {
    if (!certificationName && certifications[0]) {
      setValue("certificationName", certifications[0], { shouldDirty: true });
    }
  }, [certificationName, certifications, setValue]);

  useEffect(() => {
    if (filteredByCertification.length === 0) {
      return;
    }

    const selected = filteredByCertification.find((exam) => exam.id === examId);
    if (!selected) {
      const fallback = filteredByCertification[0];
      setValue("examId", fallback.id, { shouldDirty: true });
      setValue("examYear", fallback.examYear, { shouldDirty: true });
      setValue("examRound", fallback.examRound, { shouldDirty: true });
    }
  }, [examId, filteredByCertification, setValue]);

  useEffect(() => {
    const selectedByExam = filteredByExam[0];
    if (selectedByExam) {
      if (selectedByExam.examYear !== examYear) {
        setValue("examYear", selectedByExam.examYear, { shouldDirty: true });
      }
      if (selectedByExam.examRound !== examRound) {
        setValue("examRound", selectedByExam.examRound, { shouldDirty: true });
      }
    }
  }, [examRound, examYear, filteredByExam, setValue]);

  useEffect(() => {
    const matched = filteredByCertification.find((exam) => exam.examYear === examYear && exam.examRound === examRound);
    if (matched && matched.id !== examId) {
      setValue("examId", matched.id, { shouldDirty: true });
    }
  }, [examId, examRound, examYear, filteredByCertification, setValue]);

  const onSubmit = (values: ExamSelectionValues) => {
    if (!values.examId) {
      return;
    }

    setSessionOptions({
      examId: values.examId,
      timeLimitMinutes: values.timeLimitMinutes,
      randomOrder: values.randomOrder,
      questionCount: values.questionCount,
    });
    router.push(routes.examSolving(values.examId));
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("examId", { required: true })} />

      {loadErrorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          시험 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      {exams.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">현재 선택 가능한 시험이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-5">
              <div className="section-heading">시험 선택</div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="certificationName">자격 선택</Label>
                  <select id="certificationName" className="ui-select" {...register("certificationName", { required: true })}>
                    {certifications.map((certification) => (
                      <option key={certification} value={certification}>
                        {certification}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examYear">연도</Label>
                  <select id="examYear" className="ui-select" {...register("examYear", { valueAsNumber: true, required: true })}>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examRound">회차</Label>
                  <select id="examRound" className="ui-select" {...register("examRound", { valueAsNumber: true, required: true })}>
                    {rounds.map((round) => (
                      <option key={round} value={round}>
                        {round}회차
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredByCertification.map((exam) => {
                  const selected = exam.id === examId;

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => {
                        setValue("examId", exam.id, { shouldDirty: true });
                        setValue("examYear", exam.examYear, { shouldDirty: true });
                        setValue("examRound", exam.examRound, { shouldDirty: true });
                      }}
                      className={selected ? "selection-tile selection-tile-active" : "selection-tile"}
                    >
                      <p className="text-sm font-semibold text-[var(--color-primary)]">
                        {exam.examYear}년 {exam.examRound}회차
                      </p>
                      <p className="mt-2 text-xl font-semibold">{exam.certificationName}</p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{exam.title} · 기본 60분</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5">
              <div className="section-heading">시험 옵션</div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_220px]">
                <div className="space-y-2">
                  <Label htmlFor="timeLimitMinutes">시간 제한</Label>
                  <Input
                    id="timeLimitMinutes"
                    type="number"
                    min={1}
                    {...register("timeLimitMinutes", {
                      setValueAs: (value: string) => (value === "" ? null : Number(value)),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCount">문항 수</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min={1}
                    {...register("questionCount", {
                      setValueAs: (value: string) => (value === "" ? null : Number(value)),
                    })}
                  />
                </div>

                <div className="flex items-end">
                  <label className="selection-tile flex w-full items-center gap-3 px-4 py-3">
                    <input id="randomOrder" type="checkbox" className="h-4 w-4 rounded border-[var(--color-border)]" {...register("randomOrder")} />
                    <span className="text-sm font-medium">문제 랜덤</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button type="submit" size="lg" className="w-full">
              시험 시작하기
            </Button>
            <div className="text-center">
              <Link href={routes.resultLookup} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                이전 결과 조회하기
              </Link>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
