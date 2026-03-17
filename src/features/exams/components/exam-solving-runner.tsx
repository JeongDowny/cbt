"use client";

import { useState, useTransition } from "react";

import { submitAttemptAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassGroupOption } from "@/features/classes/types";
import { ExamProgressPanel } from "@/features/exams/components/exam-progress-panel";
import { ExamQuestionPanel } from "@/features/exams/components/exam-question-panel";
import { ExamSubmissionForm } from "@/features/exams/components/exam-submission-form";
import { useAttemptWorkImages } from "@/features/exams/hooks/use-attempt-work-images";
import { useExamQuestionFlow } from "@/features/exams/hooks/use-exam-question-flow";
import { useExamTimer } from "@/features/exams/hooks/use-exam-timer";
import type { SolveQuestion, SubmitIdentityValues } from "@/features/exams/types";
import { routes } from "@/lib/constants/routes";
import { useExamSessionStore } from "@/stores/exam-session.store";

interface ExamSolvingRunnerProps {
  examId: string;
  examTitle: string;
  questions: SolveQuestion[];
  classGroupOptions: ClassGroupOption[];
}

export function ExamSolvingRunner({ examId, examTitle, questions, classGroupOptions }: ExamSolvingRunnerProps) {
  const session = useExamSessionStore();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const optionEnabled = session.examId === examId;
  const randomOrder = optionEnabled ? session.randomOrder : false;
  const questionCount = optionEnabled ? session.questionCount : null;
  const timeLimitMinutes = optionEnabled ? session.timeLimitMinutes : null;

  const {
    activeQuestions,
    totalCount,
    state,
    setCurrentIndex,
    setManualSubmitRequested,
    chooseAnswer,
    goPrev,
    goNext,
  } = useExamQuestionFlow({
    questions,
    randomOrder,
    questionCount,
  });

  const { remainSeconds, timeoutReached } = useExamTimer(timeLimitMinutes, state.manualSubmitRequested);
  const {
    workImages,
    processing,
    error: workImageError,
    attachWorkImage,
    clearWorkImage,
    resetWorkImages,
  } = useAttemptWorkImages(examId);

  const submitRequested = state.manualSubmitRequested || timeoutReached;
  const currentQuestion = activeQuestions[state.currentIndex];

  const handleSubmitIdentity = (values: SubmitIdentityValues) => {
    if (processing) {
      setSaveError("손풀이 이미지 업로드가 끝난 뒤 다시 제출해 주세요.");
      return;
    }

    setSaveError(null);

    startTransition(async () => {
      try {
        const result = await submitAttemptAction({
          examId,
          classGroupId: values.classGroupId,
          userName: values.userName,
          answers: state.answers,
          questionIds: activeQuestions.map((question) => question.id),
          workImagePaths: Object.fromEntries(activeQuestions.map((question) => [question.id, workImages[question.id]?.path ?? null])),
        });

        resetWorkImages();
        window.location.replace(routes.resultPage(result.attemptId));
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "결과 저장에 실패했습니다.");
      }
    });
  };

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>문항이 없습니다</CardTitle>
          <CardDescription>선택한 시험에 표시할 문항이 아직 등록되지 않았습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>문제를 불러오지 못했습니다</CardTitle>
          <CardDescription>잠시 후 다시 시도해 주세요.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (classGroupOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>응시 정보를 선택할 수 없습니다</CardTitle>
          <CardDescription>관리자가 아직 사용할 반 정보를 등록하지 않았습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (submitRequested) {
    return (
      <ExamSubmissionForm
        examTitle={examTitle}
        solvedCount={state.solvedCount}
        totalCount={totalCount}
        timeoutReached={timeoutReached}
        classGroupOptions={classGroupOptions}
        isSubmitting={isPending || Boolean(processing)}
        saveError={saveError}
        onSubmit={handleSubmitIdentity}
        onCancel={() => setManualSubmitRequested(false)}
      />
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <ExamQuestionPanel
          examTitle={examTitle}
          question={currentQuestion}
          currentIndex={state.currentIndex}
          totalCount={totalCount}
          progressPercent={state.progressPercent}
          remainSeconds={remainSeconds}
          selectedChoiceNo={state.answers[currentQuestion.id]}
          onChooseAnswer={(choiceNo) => chooseAnswer(currentQuestion.id, choiceNo, submitRequested)}
          workImage={workImages[currentQuestion.id] ?? null}
          processing={processing?.questionId === currentQuestion.id ? processing : null}
          workImageError={workImageError}
          onAttachWorkImage={(file) => void attachWorkImage(currentQuestion.id, file)}
          onClearWorkImage={() => clearWorkImage(currentQuestion.id)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={goPrev} disabled={state.currentIndex === 0} className="w-full">
            이전 문제
          </Button>
          <Button type="button" variant="outline" onClick={goNext} disabled={state.currentIndex >= totalCount - 1} className="w-full">
            다음 문제
          </Button>
        </div>
      </section>

      <aside>
        <ExamProgressPanel
          questions={activeQuestions}
          currentIndex={state.currentIndex}
          answers={state.answers}
          solvedCount={state.solvedCount}
          totalCount={totalCount}
          progressPercent={state.progressPercent}
          onSelectQuestion={setCurrentIndex}
          onRequestSubmit={() => setManualSubmitRequested(true)}
          submitDisabled={Boolean(processing)}
        />
      </aside>
    </div>
  );
}
