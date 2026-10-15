"use client";

import { useEffect } from "react";

// 상세 페이지를 열면 수집함에 기록
export default function VisitRecorder({ code }: { code: string }) {
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("brothers-jobs-visited") ?? "[]") as string[];
      if (!v.includes(code)) {
        localStorage.setItem("brothers-jobs-visited", JSON.stringify([...v, code]));
      }
    } catch {}
  }, [code]);
  return null;
}
