export interface ClassGroupOption {
  id: string;
  classYear: number;
  className: string;
  cohortNo: number;
  label: string;
}

export interface DashboardAttemptRow {
  id: string;
  examTitle: string;
  certificationName: string;
  userName: string;
  score: number;
  passed: boolean;
  submittedAt: string | null;
}

export interface DashboardAttemptGroup {
  id: string;
  label: string;
  classYear: number | null;
  className: string | null;
  cohortNo: number | null;
  attempts: DashboardAttemptRow[];
}
