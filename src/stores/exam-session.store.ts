import { create } from "zustand";

interface ExamSessionState {
  examId: string | null;
  timeLimitMinutes: number | null;
  randomOrder: boolean;
  questionCount: number | null;
  setSessionOptions: (payload: {
    examId: string;
    timeLimitMinutes: number | null;
    randomOrder: boolean;
    questionCount: number | null;
  }) => void;
  resetSession: () => void;
}

const initialState = {
  examId: null,
  timeLimitMinutes: null,
  randomOrder: false,
  questionCount: null,
};

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  ...initialState,
  setSessionOptions: ({ examId, timeLimitMinutes, randomOrder, questionCount }) =>
    set({ examId, timeLimitMinutes, randomOrder, questionCount }),
  resetSession: () => set(initialState),
}));
