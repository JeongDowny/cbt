import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[var(--color-surface-muted)]">{children}</main>;
}
