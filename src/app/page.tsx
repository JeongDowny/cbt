import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>CBT Program Scaffold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Initial App Router scaffold is ready. Use the placeholder routes below for each domain flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants()} href={routes.examSelection}>
              시험 보기
            </Link>
            <Link className={buttonVariants({ variant: "secondary" })} href={routes.resultLookup}>
              결과 조회
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href={routes.adminLogin}>
              Admin Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
