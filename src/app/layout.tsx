import type { Metadata } from "next";

import { GlobalNavigation } from "@/features/layout/components/global-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: "CBT Program",
  description: "Desktop-first CBT web application scaffold",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-[var(--color-background)] font-sans text-[var(--color-foreground)] antialiased">
        <GlobalNavigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
