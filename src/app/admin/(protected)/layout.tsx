import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOutAdminAction } from "@/features/admin/actions";
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
    <main className="min-h-screen bg-[var(--color-surface-muted)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-3 text-sm">
            <Link href={routes.adminDashboard} className="font-medium text-[var(--color-foreground)]">
              Dashboard
            </Link>
            <Link href={routes.adminExamNew} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              New Exam
            </Link>
          </nav>

          <form action={signOutAdminAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      {children}
    </main>
  );
}
