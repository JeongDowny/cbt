export interface ReportChoiceSnapshot {
  no: number;
  text: string;
}

export interface ReportQuestionReview {
  questionId: string;
  questionNo: number;
  stem: string;
  imageUrl: string | null;
  choices: ReportChoiceSnapshot[];
  correctAnswer: number;
  userAnswer: number | null;
  isCorrect: boolean;
}

export interface SubmissionReport {
  id: string;
  examId: string;
  examTitle: string;
  userName: string;
  birthDate: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  reviews: ReportQuestionReview[];
  answers: Record<string, number>;
  createdAt: string;
}

export interface LookupSubmissionReportRow {
  id: string;
  examTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: string;
}
