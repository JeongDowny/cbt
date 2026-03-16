import type { ReactNode } from "react";

import { BackButton } from "@/features/layout/components/back-button";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  badge?: string;
  contentClassName?: string;
  headerAlign?: "center" | "left";
  density?: "default" | "compact";
  width?: "default" | "wide" | "narrow";
  showBackButton?: boolean;
  backHref?: string;
  headerActions?: ReactNode;
}

export function PageShell({
  title,
  description,
  children,
  className,
  badge,
  contentClassName,
  headerAlign = "center",
  density = "default",
  width = "default",
  showBackButton = false,
  backHref = "/",
  headerActions,
}: PageShellProps) {
  const widthClassName =
    width === "wide" ? "max-w-[var(--page-max-width-wide)]" : width === "narrow" ? "max-w-[640px]" : "max-w-[var(--page-max-width)]";

  return (
    <section className={cn("mx-auto w-full px-5 pb-14 pt-16 md:px-6 md:pb-20 md:pt-24", className)}>
      <header
        className={cn(
          "mx-auto mb-8 space-y-4",
          widthClassName,
          headerAlign === "center" ? "text-center" : "text-left",
          density === "compact" ? "mb-6 space-y-3" : "mb-8 space-y-4"
        )}
      >
        {showBackButton || headerActions ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{showBackButton ? <BackButton href={backHref} /> : null}</div>
            {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
          </div>
        ) : null}
        {badge ? (
          <div className={cn("flex", headerAlign === "center" ? "justify-center" : "justify-start")}>
            <span className="inline-flex items-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
              {badge}
            </span>
          </div>
        ) : null}
        <h1
          className={cn(
            "font-semibold tracking-tight text-[var(--color-foreground)]",
            density === "compact" ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
          )}
        >
          {title}
        </h1>
        {description ? <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p> : null}
      </header>
      <div className={cn("mx-auto", widthClassName, contentClassName)}>{children}</div>
    </section>
  );
}
