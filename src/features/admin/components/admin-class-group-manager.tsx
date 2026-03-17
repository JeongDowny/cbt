import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClassGroupAction, deleteClassGroupAction } from "@/features/admin/actions";
import { formatClassGroupLabel } from "@/features/classes/data";

export function AdminClassGroupManager({
  classGroups,
}: {
  classGroups: Array<{
    id: string;
    class_years: { year: number } | { year: number }[] | null;
    class_names: { name: string } | { name: string }[] | null;
    class_cohorts: { cohort_no: number } | { cohort_no: number }[] | null;
  }>;
}) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>반 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={createClassGroupAction} className="grid gap-3 md:grid-cols-[180px_1fr_140px_auto]">
          <input
            name="year"
            type="number"
            min="2000"
            className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            placeholder="2026"
          />
          <input
            name="className"
            type="text"
            className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            placeholder="전기 A반"
          />
          <input
            name="cohortNo"
            type="number"
            min="1"
            className="flex h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            placeholder="1"
          />
          <Button type="submit">반 추가</Button>
        </form>

        <ul className="space-y-2">
          {classGroups.map((group) => {
            const classYear = Array.isArray(group.class_years) ? group.class_years[0]?.year : group.class_years?.year;
            const className = Array.isArray(group.class_names) ? group.class_names[0]?.name : group.class_names?.name;
            const cohortNo = Array.isArray(group.class_cohorts) ? group.class_cohorts[0]?.cohort_no : group.class_cohorts?.cohort_no;
            const label = classYear && className && cohortNo ? formatClassGroupLabel(classYear, cohortNo, className) : "반 정보 미완성";

            return (
              <li key={group.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm">
                <span>{label}</span>
                <form action={deleteClassGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    삭제
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
