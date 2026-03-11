import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CBT Program",
  description: "Desktop-first CBT web application scaffold",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-background)] font-sans text-[var(--color-foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
