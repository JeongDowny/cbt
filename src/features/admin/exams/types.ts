export type QuestionChoiceForm = {
  choiceNo: 1 | 2 | 3 | 4 | 5;
  content: string;
};

export type QuestionForm = {
  stem: string;
  choiceCount: 4 | 5;
  correctChoiceNo: 1 | 2 | 3 | 4 | 5;
  imagePath: string | null;
  explanation: string;
  choices: QuestionChoiceForm[];
};

export type AdminExamFormValues = {
  certificationName: string;
  title: string;
  examYear: number;
  examRound: number;
  defaultTimeLimitMinutes: number | null;
  isPublished: boolean;
  questions: QuestionForm[];
};

export type SaveExamResult = {
  examId: string;
};
