import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { ClassGroupOption } from "@/features/classes/types";

interface ClassGroupRow {
  id: string;
  class_years: { year: number } | { year: number }[] | null;
  class_names: { name: string } | { name: string }[] | null;
  class_cohorts: { cohort_no: number } | { cohort_no: number }[] | null;
}

export function formatClassGroupLabel(classYear: number, cohortNo: number, className: string) {
  return `${classYear}-${cohortNo} ${className}`;
}

function mapClassGroupOption(group: ClassGroupRow): ClassGroupOption | null {
  const classYear = Array.isArray(group.class_years) ? group.class_years[0]?.year : group.class_years?.year;
  const className = Array.isArray(group.class_names) ? group.class_names[0]?.name : group.class_names?.name;
  const cohortNo = Array.isArray(group.class_cohorts) ? group.class_cohorts[0]?.cohort_no : group.class_cohorts?.cohort_no;

  if (!classYear || !className || !cohortNo) {
    return null;
  }

  return {
    id: group.id,
    classYear,
    className,
    cohortNo,
    label: formatClassGroupLabel(classYear, cohortNo, className),
  };
}

export async function fetchClassGroupOptions(): Promise<ClassGroupOption[]> {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from("class_groups")
    .select("id, class_years(year), class_names(name), class_cohorts(cohort_no)")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ClassGroupRow[])
    .map(mapClassGroupOption)
    .filter((group): group is ClassGroupOption => group !== null)
    .sort((a, b) => {
      if (a.classYear !== b.classYear) {
        return b.classYear - a.classYear;
      }

      if (a.cohortNo !== b.cohortNo) {
        return a.cohortNo - b.cohortNo;
      }

      return a.className.localeCompare(b.className, "ko");
    });
}
