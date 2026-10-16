"use client";

import { useEffect, useState } from "react";
import { MOCK_JOBS } from "@/lib/mock";
import { loadMyPlaces } from "@/lib/realTown";
import { loadMe } from "@/lib/me";

function read(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function readStamps(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("brothers-stamps") ?? "[]");
  } catch {
    return [];
  }
}

function todayStr(): string {
  return new Date().toLocaleDateString("ko-KR");
}

export default function PrintView() {
  const [stamps] = useState<string[]>(readStamps);
  const [myPlaces] = useState(loadMyPlaces);
  const [meDong] = useState(() => loadMe()?.dong ?? "우리동네");
  const [diary] = useState<string>(() => read("brothers-diary", ""));
  const [mood] = useState<string>(() => read("brothers-mood", "😄"));
  const [best] = useState<number>(() => Number(read("brothers-quiz-best", "0")));
  const [dreamLine] = useState(() => {
    try {
      const raw = localStorage.getItem("brothers-dream");
      if (!raw) return "";
      const d = JSON.parse(raw) as { code: string; msg: string };
      const j = MOCK_JOBS.find((x) => x.code === d.code);
      return j ? `20년 뒤의 ${j.name}: ${d.msg}` : "";
    } catch {
      return "";
    }
  });
  // 날짜는 기기 시계 기준이라 prerender에 넣을 수 없어 effect에서 채움
  const [today, setToday] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(todayStr());
  }, []);

  const found = stamps.filter((s) => myPlaces.some((p) => p.id === s));

  return (
    <div className="flex flex-col gap-4 bg-white p-6">
      <div className="text-center">
        <h1 className="text-3xl font-black">형님의 비밀기지 · 탐험 기록표</h1>
        <p className="font-bold text-stone-500">{today} · {meDong} · 로그인 없음 (이 기기에만 저장)</p>
      </div>
      <div className="rounded-2xl border-2 border-stone-200 p-4">
        <h2 className="text-xl font-black">찾은 비밀 {found.length} / {myPlaces.length}</h2>
        <ul className="mt-2">
          {myPlaces.map((f) => (
            <li key={f.id} className="font-bold">
              {stamps.includes(f.id) ? "✅" : "⬜"} {f.stamp} {f.name} - {f.easy}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border-2 border-stone-200 p-4">
        <h2 className="text-xl font-black">퀴즈 최고 {best}개!</h2>
        <p className="font-bold text-stone-500">도장: {best >= 8 ? "동네박사" : best >= 5 ? "탐험대원" : "탐험견습생"}</p>
      </div>
      <div className="rounded-2xl border-2 border-stone-200 p-4">
        <h2 className="text-xl font-black">탐험일지 {mood}</h2>
        <p className="min-h-16 font-bold">{diary || "(아직 안 썼어)"}</p>
      </div>
      {dreamLine && (
        <div className="rounded-2xl border-2 border-stone-200 p-4">
          <h2 className="text-xl font-black">🌟 나의 꿈</h2>
          <p className="font-bold">{dreamLine}</p>
        </div>
      )}
      <p className="text-sm font-bold text-stone-500">
        선생님께: 인쇄해서 칭찬스티커를 붙여주세요. 숫자는 나라 통계를 쉽게 바꾼 연습용이에요.
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black print:hidden"
      >
        🖨️ 인쇄하기
      </button>
    </div>
  );
}
