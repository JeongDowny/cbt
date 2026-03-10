export interface StudentExamOption {
  id: string;
  certificationName: string;
  title: string;
  examYear: number;
  examRound: number;
}

export interface SolveChoice {
  no: number;
  text: string;
}

export interface SolveQuestion {
  id: string;
  questionNo: number;
  stem: string;
  imageUrl: string | null;
  choices: SolveChoice[];
}
