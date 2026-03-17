import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/lib/constants/routes";

export function AdminExamListSection({
  exams,
}: {
  exams: Array<{
    id: string;
    title: string;
    exam_year: number;
    exam_round: number;
    status: "draft" | "published" | "archived";
    is_public: boolean;
    certifications: { name: string } | { name: string }[] | null;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>시험 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ul className="space-y-2">
          {exams.map((exam) => {
            const certification = Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications;

            return (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                <span>
                  {certification?.name ?? "자격 미지정"} / {exam.title} ({exam.exam_year}-{exam.exam_round}) ·{" "}
                  {exam.status === "draft" ? "임시저장" : exam.status === "published" ? "공개중" : "보관"} · {exam.is_public ? "노출" : "비노출"}
                </span>
                <Link href={routes.adminExamEdit(exam.id)} className="text-[var(--color-primary)] hover:underline">
                  수정
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
