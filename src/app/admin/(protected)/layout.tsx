import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { routes } from "@/lib/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.adminLogin);
  }

  return (
    <main className="min-h-screen bg-transparent">{children}</main>
  );
}
