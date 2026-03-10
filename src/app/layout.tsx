import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CBT Program",
  description: "Desktop-first CBT web application scaffold",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} bg-[var(--color-background)] font-sans text-[var(--color-foreground)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
