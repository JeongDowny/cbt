"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/lib/constants/routes";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

function redirectDashboard(message: string, type: "message" | "error" = "message"): never {
  redirect(`${routes.adminDashboard}?${type}=${encodeURIComponent(message)}`);
}

function asTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signOutAdminAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(routes.adminLogin);
}

export async function createClassGroupAction(formData: FormData) {
  const classYearId = asTrimmedString(formData.get("classYearId"));
  const classNameId = asTrimmedString(formData.get("classNameId"));
  const classCohortId = asTrimmedString(formData.get("classCohortId"));
  const year = Number(asTrimmedString(formData.get("year")));
  const className = asTrimmedString(formData.get("className"));
  const cohortNo = Number(asTrimmedString(formData.get("cohortNo")));

  const supabase = createSupabaseAdminClient();

  let resolvedClassYearId = classYearId;
  let resolvedClassNameId = classNameId;
  let resolvedClassCohortId = classCohortId;

  if (!resolvedClassYearId || !resolvedClassNameId || !resolvedClassCohortId) {
    if (!Number.isInteger(year) || year < 2000 || !className || !Number.isInteger(cohortNo) || cohortNo < 1) {
      redirectDashboard("연도, 반 이름, 기수를 한 번에 입력해 주세요.", "error");
    }

    const [{ data: classYearRow, error: classYearError }, { data: classNameRow, error: classNameError }, { data: classCohortRow, error: classCohortError }] =
      await Promise.all([
        supabase.from("class_years").upsert({ year }, { onConflict: "year" }).select("id").single(),
        supabase.from("class_names").upsert({ name: className }, { onConflict: "name" }).select("id").single(),
        supabase.from("class_cohorts").upsert({ cohort_no: cohortNo }, { onConflict: "cohort_no" }).select("id").single(),
      ]);

    if (classYearError || classNameError || classCohortError || !classYearRow || !classNameRow || !classCohortRow) {
      redirectDashboard("반 기본 정보를 저장하지 못했습니다.", "error");
    }

    resolvedClassYearId = classYearRow.id;
    resolvedClassNameId = classNameRow.id;
    resolvedClassCohortId = classCohortRow.id;
  }

  if (!resolvedClassYearId || !resolvedClassNameId || !resolvedClassCohortId) {
    redirectDashboard("반 조합을 만들려면 연도, 반 이름, 기수를 모두 입력해 주세요.", "error");
  }

  const { error } = await supabase.from("class_groups").insert({
    class_year_id: resolvedClassYearId,
    class_name_id: resolvedClassNameId,
    class_cohort_id: resolvedClassCohortId,
  });

  if (error) {
    redirectDashboard("반 조합 저장에 실패했습니다.", "error");
  }

  revalidatePath(routes.adminDashboard);
  redirectDashboard("반 조합을 추가했습니다.");
}

export async function deleteClassGroupAction(formData: FormData) {
  const id = asTrimmedString(formData.get("id"));
  if (!id) {
    redirectDashboard("삭제할 반 조합을 찾을 수 없습니다.", "error");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("class_groups").delete().eq("id", id);

  if (error) {
    redirectDashboard("응시 기록에 사용 중인 반 조합은 삭제할 수 없습니다.", "error");
  }

  revalidatePath(routes.adminDashboard);
  redirectDashboard("반 조합을 삭제했습니다.");
}
