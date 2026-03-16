"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";

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

function createQuestionTemplate() {
  return {
    stem: "",
    correctChoiceNo: 1 as const,
    imagePath: null,
    explanation: "",
    explanationVideoUrl: "",
    choices: [
      { choiceNo: 1 as const, content: "" },
      { choiceNo: 2 as const, content: "" },
      { choiceNo: 3 as const, content: "" },
      { choiceNo: 4 as const, content: "" },
    ],
  };
}

function createSubjectTemplate() {
  return {
    name: "",
    timeLimitMinutes: 30,
    questions: [],
  };
}

function QuestionEditorCard({
  subjectIndex,
  questionIndex,
  control,
  register,
  setValue,
  examId,
  removeQuestion,
}: {
  subjectIndex: number;
  questionIndex: number;
  control: Control<AdminExamFormValues>;
  register: UseFormRegister<AdminExamFormValues>;
  setValue: UseFormSetValue<AdminExamFormValues>;
  examId?: string;
  removeQuestion: () => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imagePath = useWatch({
    control,
    name: `subjects.${subjectIndex}.questions.${questionIndex}.imagePath`,
  });
  const selectedChoiceNo = useWatch({
    control,
    name: `subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`,
  });

  const uploadImage = (file: File | null) => {
    if (!file) {
      setUploadError("업로드할 파일을 먼저 선택해 주세요.");
      return;
    }

    setUploadError(null);

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("examId", examId ?? "draft");

        const result = await uploadQuestionImageAction(formData);
        setValue(`subjects.${subjectIndex}.questions.${questionIndex}.imagePath`, result.imagePath, { shouldDirty: true });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch {
        setUploadError("이미지 업로드에 실패했습니다.");
      }
    });
  };

  return (
    <Card className="bg-[var(--color-surface-muted)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>문항 {questionIndex + 1}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={removeQuestion}>
            문항 삭제
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`question-stem-${subjectIndex}-${questionIndex}`}>문항 내용</Label>
          <textarea
            id={`question-stem-${subjectIndex}-${questionIndex}`}
            className="flex min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-3 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.stem`, { required: true })}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor={`question-file-${subjectIndex}-${questionIndex}`}>문항 이미지</Label>
          <input type="hidden" {...register(`subjects.${subjectIndex}.questions.${questionIndex}.imagePath`)} />
          <input
            ref={fileInputRef}
            id={`question-file-${subjectIndex}-${questionIndex}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => uploadImage(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? "업로드 중..." : imagePath ? "이미지 교체" : "이미지 첨부"}
            </Button>
            {imagePath ? <span className="text-xs text-[var(--color-muted-foreground)]">현재 이미지가 연결되어 있습니다.</span> : null}
          </div>
          {imagePath ? <p className="text-xs text-[var(--color-muted-foreground)]">저장된 이미지: {imagePath}</p> : null}
          {uploadError ? <p className="text-xs text-red-700">{uploadError}</p> : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">선택지 및 정답</p>
          <input type="hidden" {...register(`subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`, { valueAsNumber: true })} />
          {[0, 1, 2, 3].map((choiceIndex) => {
            const choiceNo = (choiceIndex + 1) as 1 | 2 | 3 | 4;
            return (
              <div key={`${subjectIndex}-${questionIndex}-${choiceNo}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-sm font-medium">{choiceNo}.</span>
                <Input {...register(`subjects.${subjectIndex}.questions.${questionIndex}.choices.${choiceIndex}.content`, { required: true })} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`question-correct-choice-${subjectIndex}-${questionIndex}`}
                    value={choiceNo}
                    checked={selectedChoiceNo === choiceNo}
                    onChange={() =>
                      setValue(`subjects.${subjectIndex}.questions.${questionIndex}.correctChoiceNo`, choiceNo, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                  />
                  정답
                </label>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-explanation-${subjectIndex}-${questionIndex}`}>해설</Label>
          <textarea
            id={`question-explanation-${subjectIndex}-${questionIndex}`}
            className="flex min-h-24 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-3 text-sm text-[var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.explanation`)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-explanation-video-url-${subjectIndex}-${questionIndex}`}>해설 영상 URL</Label>
          <Input
            id={`question-explanation-video-url-${subjectIndex}-${questionIndex}`}
            placeholder="https://www.youtube.com/watch?v=..."
            {...register(`subjects.${subjectIndex}.questions.${questionIndex}.explanationVideoUrl`)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectEditorCard({
  subjectIndex,
  subjectFieldId,
  control,
  register,
  setValue,
  examId,
  collapsed,
  toggleCollapsed,
  removeSubject,
}: {
  subjectIndex: number;
  subjectFieldId: string;
  control: Control<AdminExamFormValues>;
  register: UseFormRegister<AdminExamFormValues>;
  setValue: UseFormSetValue<AdminExamFormValues>;
  examId?: string;
  collapsed: boolean;
  toggleCollapsed: () => void;
  removeSubject: () => void;
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

  const handleRemoveSubject = () => {
    const confirmedName = window.prompt(`삭제하려면 과목명 "${trimmedSubjectName}" 을(를) 입력해 주세요.`, "");

    if (confirmedName === null) {
      return;
    }

    if (confirmedName.trim() !== trimmedSubjectName) {
      window.alert("과목명이 일치하지 않아 삭제하지 않았습니다.");
      return;
    }

    removeSubject();
  };

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
            <Button type="button" variant="outline" size="sm" onClick={handleRemoveSubject}>
              과목 삭제
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => append(createQuestionTemplate())}>
              이 과목에 문항 추가
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={toggleCollapsed}>
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
                <QuestionEditorCard
                  key={questionField.id}
                  subjectIndex={subjectIndex}
                  questionIndex={questionIndex}
                  control={control}
                  register={register}
                  setValue={setValue}
                  examId={examId}
                  removeQuestion={() => remove(questionIndex)}
                />
              ))}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
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
    formState: { isSubmitting },
  } = useForm<AdminExamFormValues>({
    defaultValues: initialValues,
  });

  const { fields: subjectFields, append, remove } = useFieldArray({
    control,
    name: "subjects",
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

  const addSubject = () => {
    append(createSubjectTemplate());
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">문항 편집</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">먼저 과목을 추가한 뒤, 각 과목 안에서 문항을 넣어 주세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={addSubject}>
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
            <SubjectEditorCard
              key={subjectField.id}
              subjectIndex={subjectIndex}
              subjectFieldId={subjectField.id}
              control={control}
              register={register}
              setValue={setValue}
              examId={examId}
              collapsed={collapsedSubjects[subjectField.id] ?? false}
              toggleCollapsed={() =>
                setCollapsedSubjects((prev) => ({
                  ...prev,
                  [subjectField.id]: !(prev[subjectField.id] ?? false),
                }))
              }
              removeSubject={() => remove(subjectIndex)}
            />
          ))
        )}
      </div>

      {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

      <Button type="submit" disabled={isSubmitting || isPending}>
        {isSubmitting || isPending ? "저장 중..." : "시험 저장"}
      </Button>
    </form>
  );
}
