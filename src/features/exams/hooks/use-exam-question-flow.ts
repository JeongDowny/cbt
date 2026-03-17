"use client";

import { useMemo, useState } from "react";

import type { ExamFlowState, SolveQuestion } from "@/features/exams/types";

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let idx = copy.length - 1; idx > 0; idx -= 1) {
    const randomIndex = Math.floor(Math.random() * (idx + 1));
    [copy[idx], copy[randomIndex]] = [copy[randomIndex], copy[idx]];
  }
  return copy;
}

export function useExamQuestionFlow({
  questions,
  randomOrder,
  questionCount,
}: {
  questions: SolveQuestion[];
  randomOrder: boolean;
  questionCount: number | null;
}) {
  const activeQuestions = useMemo(() => {
    let base = [...questions];
    if (randomOrder) {
      base = shuffled(base);
    }

    if (questionCount && questionCount > 0) {
      base = base.slice(0, Math.min(questionCount, base.length));
    }

    return base;
  }, [questions, randomOrder, questionCount]);

  const totalCount = activeQuestions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [manualSubmitRequested, setManualSubmitRequested] = useState(false);

  const solvedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);

  const chooseAnswer = (questionId: string, choiceNo: number, locked: boolean) => {
    if (locked) {
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceNo,
    }));

    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1));
    }
  };

  const state: ExamFlowState = {
    currentIndex,
    answers,
    solvedCount,
    progressPercent,
    manualSubmitRequested,
    submitRequested: manualSubmitRequested,
  };

  return {
    activeQuestions,
    totalCount,
    state,
    setCurrentIndex,
    setManualSubmitRequested,
    chooseAnswer,
    goPrev: () => setCurrentIndex((prev) => Math.max(0, prev - 1)),
    goNext: () => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1)),
  };
}
