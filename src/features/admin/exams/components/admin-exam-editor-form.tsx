"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Control, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveExamAction, uploadQuestionImageAction } from "@/features/admin/exams/actions";
import type { AdminExamFormValues } from "@/features/admin/exams/types";
import { routes } from "@/lib/constants/routes";

interface AdminExamEditorFormProps {
  mode: "create" | "edit";
  examId?: string;
  initialValues: AdminExamFormValues;
}

function QuestionEditorCard({
  index,
  register,
  setValue,
  watch,
  control,
  examId,
  removeQuestion,
}: {
  index: number;
  register: UseFormRegister<AdminExamFormValues>;
  setValue: UseFormSetValue<AdminExamFormValues>;
  watch: UseFormWatch<AdminExamFormValues>;
  control: Control<AdminExamFormValues>;
  examId?: string;
  removeQuestion: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();

  const choiceCount = watch(`questions.${index}.choiceCount`);
  const imagePath = watch(`questions.${index}.imagePath`);

  const { fields: choiceFields } = useFieldArray({
    control,
    name: `questions.${index}.choices`,
  });

  const applyChoiceCount = (nextCount: 4 | 5) => {
    const currentChoices = watch(`questions.${index}.choices`);

    const normalizedChoices = Array.from({ length: nextCount }, (_, idx) => {
      const choiceNo = (idx + 1) as 1 | 2 | 3 | 4 | 5;
      return {
        choiceNo,
        content: currentChoices[idx]?.content ?? "",
      };
    });

    setValue(`questions.${index}.choiceCount`, nextCount, { shouldDirty: true });
    setValue(`questions.${index}.choices`, normalizedChoices, { shouldDirty: true });

    const currentCorrect = watch(`questions.${index}.correctChoiceNo`);
    if (currentCorrect > nextCount) {
      setValue(`questions.${index}.correctChoiceNo`, 1, { shouldDirty: true });
    }
  };

  const uploadImage = () => {
    if (!file) {
      setUploadError("업로드할 이미지를 먼저 선택해 주세요.");
      return;
    }

    setUploadError(null);

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("examId", examId ?? "draft");

        const result = await uploadQuestionImageAction(formData);
        setValue(`questions.${index}.imagePath`, result.imagePath, { shouldDirty: true });
      } catch {
        setUploadError("이미지 업로드에 실패했습니다.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>문항 {index + 1}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={removeQuestion}>
            문항 삭제
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`question-stem-${index}`}>문항 내용</Label>
          <Input id={`question-stem-${index}`} {...register(`questions.${index}.stem`, { required: true })} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`question-choice-count-${index}`}>선택지 개수</Label>
            <select
              id={`question-choice-count-${index}`}
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              value={choiceCount}
              onChange={(event) => applyChoiceCount(Number(event.target.value) as 4 | 5)}
            >
              <option value={4}>4지선다</option>
              <option value={5}>5지선다</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`question-image-path-${index}`}>이미지 경로</Label>
            <Input id={`question-image-path-${index}`} {...register(`questions.${index}.imagePath`)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor={`question-file-${index}`}>문항 이미지 업로드</Label>
            <Input
              id={`question-file-${index}`}
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="button" variant="secondary" onClick={uploadImage} disabled={isUploading}>
            {isUploading ? "업로드 중..." : "이미지 업로드"}
          </Button>
        </div>

        {imagePath ? <p className="text-xs text-[var(--color-muted-foreground)]">저장된 이미지: {imagePath}</p> : null}
        {uploadError ? <p className="text-xs text-red-700">{uploadError}</p> : null}

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">선택지 및 정답</p>
          {choiceFields.slice(0, choiceCount).map((field, choiceIndex) => {
            const choiceNo = (choiceIndex + 1) as 1 | 2 | 3 | 4 | 5;
            return (
              <div key={field.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-sm font-medium">{choiceNo}.</span>
                <Input {...register(`questions.${index}.choices.${choiceIndex}.content`, { required: true })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value={choiceNo} {...register(`questions.${index}.correctChoiceNo`, { valueAsNumber: true })} />
                  정답
                </label>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-explanation-${index}`}>해설 (선택)</Label>
          <Input id={`question-explanation-${index}`} {...register(`questions.${index}.explanation`)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminExamEditorForm({ mode, examId, initialValues }: AdminExamEditorFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<AdminExamFormValues>({
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const questionTemplate = useMemo(
    () => ({
      stem: "",
      choiceCount: 4 as const,
      correctChoiceNo: 1 as const,
      imagePath: null,
      explanation: "",
      choices: [
        { choiceNo: 1 as const, content: "" },
        { choiceNo: 2 as const, content: "" },
        { choiceNo: 3 as const, content: "" },
        { choiceNo: 4 as const, content: "" },
      ],
    }),
    []
  );

  const onSubmit = async (values: AdminExamFormValues) => {
    setSubmitError(null);

    startTransition(async () => {
      try {
        const result = await saveExamAction({ examId, values });
        router.replace(routes.adminExamEdit(result.examId));
        router.refresh();
      } catch {
        setSubmitError("시험 저장에 실패했습니다. 입력값과 권한을 확인해 주세요.");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "시험 생성" : "시험 수정"}</CardTitle>
          <CardDescription>필수 메타데이터를 입력하고 문항을 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="certificationName">자격명</Label>
            <Input id="certificationName" {...register("certificationName", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">시험 제목</Label>
            <Input id="title" {...register("title", { required: true })} />
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
            <Label htmlFor="defaultTimeLimitMinutes">기본 제한시간(분)</Label>
            <Input
              id="defaultTimeLimitMinutes"
              type="number"
              {...register("defaultTimeLimitMinutes", {
                setValueAs: (value: string) => (value === "" ? null : Number(value)),
              })}
            />
          </div>

          <div className="flex items-center gap-2 md:pt-8">
            <input id="isPublished" type="checkbox" className="h-4 w-4" {...register("isPublished")} />
            <Label htmlFor="isPublished">공개 상태</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">문항 편집</h2>
          <Button type="button" variant="secondary" onClick={() => append(questionTemplate)}>
            문항 추가
          </Button>
        </div>

        {fields.map((field, index) => (
          <QuestionEditorCard
            key={field.id}
            index={index}
            register={register}
            setValue={setValue}
            watch={watch}
            control={control}
            examId={examId}
            removeQuestion={() => remove(index)}
          />
        ))}
      </div>

      {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

      <Button type="submit" disabled={isSubmitting || isPending}>
        {isSubmitting || isPending ? "저장 중..." : "시험 저장"}
      </Button>
    </form>
  );
}
