import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageShell({ title, description, children, className }: PageShellProps) {
  return (
    <section className={cn("mx-auto w-full max-w-5xl px-6 py-10", className)}>
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">{title}</h1>
        {description ? <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
