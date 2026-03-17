export type ExamStatus = "draft" | "published" | "archived";

export type ChoiceForm = {
  choiceNo: 1 | 2 | 3 | 4;
  content: string;
};

export type QuestionForm = {
  stem: string;
  correctChoiceNo: 1 | 2 | 3 | 4;
  imagePath: string | null;
  explanation: string;
  explanationVideoUrl: string;
  choices: ChoiceForm[];
};

export type SubjectForm = {
  name: string;
  timeLimitMinutes: number;
  questions: QuestionForm[];
};

export type AdminExamFormValues = {
  certificationName: string;
  examYear: number;
  examRound: number;
  status: ExamStatus;
  isPublic: boolean;
  subjects: SubjectForm[];
};

export type BasicExamFields = Pick<AdminExamFormValues, "certificationName" | "examYear" | "examRound" | "status" | "isPublic">;

export type SaveExamResult = {
  examId: string;
};
