import type { QuestionForm, SubjectForm } from "@/features/admin/exams/types";

export function createQuestionTemplate(): QuestionForm {
  return {
    stem: "",
    correctChoiceNo: 1,
    imagePath: null,
    explanation: "",
    explanationVideoUrl: "",
    choices: [
      { choiceNo: 1, content: "" },
      { choiceNo: 2, content: "" },
      { choiceNo: 3, content: "" },
      { choiceNo: 4, content: "" },
    ],
  };
}

export function createSubjectTemplate(): SubjectForm {
  return {
    name: "",
    timeLimitMinutes: 30,
    questions: [],
  };
}
