import { formatClassGroupLabel } from "@/features/classes/data";
import type { DashboardAttemptGroup } from "@/features/classes/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function fetchDashboardExams() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("exams")
    .select("id, title, exam_year, exam_round, status, is_public, certifications(name)")
    .order("exam_year", { ascending: false })
    .order("exam_round", { ascending: false })
    .limit(10);

  return data ?? [];
}

export async function fetchDashboardClassGroups() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("class_groups")
    .select("id, class_year_id, class_name_id, class_cohort_id, class_years(year), class_names(name), class_cohorts(cohort_no)")
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function fetchDashboardAttemptGroups(): Promise<DashboardAttemptGroup[]> {
  const supabase = createSupabaseAdminClient();
  const { data: attempts } = await supabase
    .from("attempts")
    .select(
      "id, user_name, class_year_snapshot, class_name_snapshot, cohort_no_snapshot, total_score, passed, submitted_at, exams(title, certifications(name))"
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(100);

  const groupedAttemptsMap = new Map<string, DashboardAttemptGroup>();

  (attempts ?? []).forEach((attempt) => {
    const classLabel =
      attempt.class_year_snapshot && attempt.class_name_snapshot && attempt.cohort_no_snapshot
        ? formatClassGroupLabel(attempt.class_year_snapshot, attempt.cohort_no_snapshot, attempt.class_name_snapshot)
        : "반 미지정";
    const groupId = `${attempt.class_year_snapshot ?? "unknown"}-${attempt.cohort_no_snapshot ?? "unknown"}-${attempt.class_name_snapshot ?? "unknown"}`;
    const exam = Array.isArray(attempt.exams) ? attempt.exams[0] : attempt.exams;
    const certification = exam ? (Array.isArray(exam.certifications) ? exam.certifications[0] : exam.certifications) : null;

    const group =
      groupedAttemptsMap.get(groupId) ??
      ({
        id: groupId,
        label: classLabel,
        classYear: attempt.class_year_snapshot,
        className: attempt.class_name_snapshot,
        cohortNo: attempt.cohort_no_snapshot,
        attempts: [],
      } satisfies DashboardAttemptGroup);

    group.attempts.push({
      id: attempt.id,
      examTitle: exam?.title ?? "시험",
      certificationName: certification?.name ?? "자격",
      userName: attempt.user_name,
      score: Number(attempt.total_score),
      passed: attempt.passed,
      submittedAt: attempt.submitted_at,
    });

    groupedAttemptsMap.set(groupId, group);
  });

  return Array.from(groupedAttemptsMap.values()).sort((a, b) => {
    if (a.classYear === null && b.classYear !== null) {
      return 1;
    }
    if (a.classYear !== null && b.classYear === null) {
      return -1;
    }
    if ((a.classYear ?? 0) !== (b.classYear ?? 0)) {
      return (b.classYear ?? 0) - (a.classYear ?? 0);
    }
    if ((a.cohortNo ?? 0) !== (b.cohortNo ?? 0)) {
      return (a.cohortNo ?? 0) - (b.cohortNo ?? 0);
    }
    return (a.className ?? "").localeCompare(b.className ?? "", "ko");
  });
}
