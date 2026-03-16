import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(routes.adminDashboard);
  }

  return (
    <PageShell
      badge="관리자"
      title="관리자 로그인"
      description="관리자 계정으로 로그인해 시험 생성, 수정, 공개 상태 관리를 이어서 진행하세요."
      width="narrow"
      density="compact"
    >
      <AdminLoginForm />
    </PageShell>
  );
}
