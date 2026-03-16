"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAttemptGroup } from "@/features/classes/types";
import { routes } from "@/lib/constants/routes";

interface AdminAttemptGroupsProps {
  groups: DashboardAttemptGroup[];
}

function AttemptGroupCard({
  group,
  collapsed,
  toggleCollapsed,
}: {
  group: DashboardAttemptGroup;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const [filter, setFilter] = useState("");

  const filteredAttempts = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) {
      return group.attempts;
    }

    return group.attempts.filter((attempt) => attempt.userName.toLowerCase().includes(keyword));
  }, [filter, group.attempts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{group.label}</CardTitle>
            <CardDescription>응시 {group.attempts.length}건</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={toggleCollapsed}>
            {collapsed ? "펼치기" : "접기"}
          </Button>
        </div>
      </CardHeader>

      {!collapsed ? (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`attempt-filter-${group.id}`} className="text-sm font-medium">
              이름으로 찾기
            </label>
            <input
              id={`attempt-filter-${group.id}`}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="이름을 입력해 주세요"
              className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            />
          </div>

          {filteredAttempts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
              조건에 맞는 응시 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredAttempts.map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      {attempt.userName} · {attempt.certificationName} · {attempt.examTitle}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "미제출"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={attempt.passed ? "font-semibold text-[var(--color-success)]" : "font-semibold text-[var(--color-danger)]"}>
                      {attempt.score}점 · {attempt.passed ? "합격" : "불합격"}
                    </p>
                    <Link href={routes.resultPage(attempt.id)} className="text-[var(--color-primary)] hover:underline">
                      상세 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function AdminAttemptGroups({ groups }: AdminAttemptGroupsProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  if (groups.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">아직 저장된 응시 결과가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <AttemptGroupCard
          key={group.id}
          group={group}
          collapsed={collapsedGroups[group.id] ?? index !== 0}
          toggleCollapsed={() =>
            setCollapsedGroups((prev) => ({
              ...prev,
              [group.id]: !(prev[group.id] ?? index !== 0),
            }))
          }
        />
      ))}
    </div>
  );
}
