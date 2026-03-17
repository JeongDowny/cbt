"use client";

import { useEffect, useState } from "react";

export function formatRemain(seconds: number) {
  const safe = Math.max(seconds, 0);
  const minute = String(Math.floor(safe / 60)).padStart(2, "0");
  const second = String(safe % 60).padStart(2, "0");
  return `${minute}:${second}`;
}

export function useExamTimer(timeLimitMinutes: number | null, locked: boolean) {
  const [remainSeconds, setRemainSeconds] = useState<number | null>(
    timeLimitMinutes && timeLimitMinutes > 0 ? Math.floor(timeLimitMinutes * 60) : null
  );

  useEffect(() => {
    if (locked || remainSeconds === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainSeconds((prev) => {
        if (prev === null) {
          return null;
        }
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [locked, remainSeconds]);

  return {
    remainSeconds,
    timeoutReached: remainSeconds !== null && remainSeconds <= 0,
  };
}
