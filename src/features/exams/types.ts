export interface StudentExamOption {
  id: string;
  certificationName: string;
  title: string;
  examYear: number;
  examRound: number;
  status: "draft" | "published" | "archived";
  isPublic: boolean;
}

export interface SolveChoice {
  no: number;
  text: string;
}

export interface SolveQuestion {
  id: string;
  examSubjectId: string;
  subjectName: string;
  subjectOrder: number;
  questionNo: number;
  stem: string;
  imagePaths: string[];
  explanationVideoUrl: string | null;
  choices: SolveChoice[];
}

export type SubmitIdentityValues = {
  userName: string;
  classGroupId: string;
};

export type WorkImageState = {
  path: string;
  publicUrl: string;
  fileName: string;
  sizeBytes?: number;
};

export type WorkImageProcessingState = {
  questionId: string;
  stage: "compressing" | "uploading";
};

export type ExamFlowState = {
  currentIndex: number;
  answers: Record<string, number>;
  solvedCount: number;
  progressPercent: number;
  manualSubmitRequested: boolean;
  submitRequested: boolean;
};
