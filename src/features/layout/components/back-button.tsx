"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(href);
      }}
    >
      뒤로 가기
    </Button>
  );
}
