export const routes = {
  home: "/",
  examSelection: "/exams/select",
  examSolving: (examId: string) => `/exams/${examId}/solve`,
  resultPage: (reportId: string) => `/results/${reportId}`,
  resultLookup: "/results/lookup",
  adminLogin: "/admin/login",
  adminDashboard: "/admin/dashboard",
  adminExamNew: "/admin/exams/new",
  adminExamEdit: (examId: string) => `/admin/exams/${examId}/edit`,
} as const;
