export type ExamStatus = "draft" | "published" | "archived";

export type QuestionChoiceForm = {
  choiceNo: 1 | 2 | 3 | 4;
  content: string;
};

export type QuestionForm = {
  subjectName: string;
  subjectTimeLimitMinutes: number;
  stem: string;
  correctChoiceNo: 1 | 2 | 3 | 4;
  imagePath: string | null;
  explanation: string;
  choices: QuestionChoiceForm[];
};

export type AdminExamFormValues = {
  certificationName: string;
  examYear: number;
  examRound: number;
  status: ExamStatus;
  isPublic: boolean;
  questions: QuestionForm[];
};

export type SaveExamResult = {
  examId: string;
};
