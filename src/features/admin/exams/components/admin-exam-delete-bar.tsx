"use client";

import { Button } from "@/components/ui/button";

export function AdminExamDeleteBar({
  mode,
  examId,
  pending,
  onDelete,
}: {
  mode: "create" | "edit";
  examId?: string;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "시험 저장"}
      </Button>
      {mode === "edit" && examId ? (
        <Button type="button" variant="outline" disabled={pending} onClick={onDelete}>
          시험 삭제
        </Button>
      ) : null}
    </div>
  );
}
