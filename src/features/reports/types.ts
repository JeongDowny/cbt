export interface AttemptAnswerReview {
  id: string;
  attemptSubjectId: string;
  questionNo: number;
  subjectName: string;
  stem: string;
  choices: Array<{ no: number; text: string }>;
  correctAnswer: number;
  selectedAnswer: number | null;
  isCorrect: boolean;
  explanation: string;
  explanationVideoUrl: string | null;
  imagePaths: string[];
}

export interface AttemptSubjectSummary {
  id: string;
  subjectName: string;
  score: number;
  passed: boolean;
}

export interface AttemptReport {
  id: string;
  examId: string;
  examTitle: string;
  certificationName: string;
  userName: string;
  classLabel: string;
  classYear: number | null;
  className: string | null;
  cohortNo: number | null;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string | null;
  subjects: AttemptSubjectSummary[];
  reviews: AttemptAnswerReview[];
}

export interface LookupAttemptRow {
  id: string;
  examTitle: string;
  certificationName: string;
  classLabel: string;
  score: number;
  passed: boolean;
  submittedAt: string | null;
}
