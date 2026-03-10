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
    <PageShell title="Admin Login" description="관리자 계정으로 로그인해 시험 관리를 시작하세요.">
      <AdminLoginForm />
    </PageShell>
  );
}
