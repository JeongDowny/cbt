import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/features/layout/components/page-shell";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <PageShell
      badge="전기 CBT"
      title="전기기사 · 산업기사 CBT 기출문제"
      description="실제 시험과 비슷한 흐름으로 연습하고, 결과를 저장해 다시 확인할 수 있습니다."
      contentClassName="space-y-5"
    >
      <Card>
        <CardContent className="space-y-5">
          <div className="section-heading">빠른 시작</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Link href={routes.examSelection} className="selection-tile selection-tile-active block">
              <p className="text-sm font-semibold text-[var(--color-primary)]">시험 선택</p>
              <p className="mt-2 text-xl font-semibold">바로 시험 시작하기</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">자격증, 연도, 회차를 고르고 응시 옵션을 정할 수 있습니다.</p>
            </Link>
            <Link href={routes.resultLookup} className="selection-tile block">
              <p className="text-sm font-semibold text-[var(--color-primary)]">결과 조회</p>
              <p className="mt-2 text-xl font-semibold">저장된 결과 다시 보기</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">반과 이름으로 이전 응시 결과를 확인할 수 있습니다.</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          <div className="section-heading">서비스 안내</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="selection-tile">
              <p className="text-sm font-semibold">카드형 시험 선택</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">공개된 시험을 한눈에 비교하고 바로 시작할 수 있습니다.</p>
            </div>
            <div className="selection-tile">
              <p className="text-sm font-semibold">집중형 풀이 화면</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">문항, 타이머, 진행 현황을 한 화면 안에서 안정적으로 제공합니다.</p>
            </div>
            <div className="selection-tile hidden md:block">
              <p className="text-sm font-semibold">관리자 시험 관리</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">로그인 후 시험 생성, 수정, 공개 상태를 관리할 수 있습니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
