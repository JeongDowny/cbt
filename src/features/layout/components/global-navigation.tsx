import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const navItems = [
  { href: routes.home, label: "홈" },
  { href: routes.examSelection, label: "시험 시작하기" },
  { href: routes.resultLookup, label: "결과 다시보기" },
] as const;

export async function GlobalNavigation() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[var(--page-max-width-wide)] items-center justify-between gap-4 px-5 py-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href={routes.home} className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
            전기 CBT
          </Link>
          <nav className="hidden items-center gap-2 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href={user ? routes.adminDashboard : routes.adminLogin}
          className={cn("hidden md:inline-flex", buttonVariants({ variant: user ? "secondary" : "outline", size: "sm" }))}
        >
          {user ? "관리자 대시보드" : "관리자 로그인"}
        </Link>
      </div>

      <nav className="mx-auto flex w-full max-w-[var(--page-max-width-wide)] gap-2 overflow-x-auto px-5 pb-3 md:hidden md:px-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
