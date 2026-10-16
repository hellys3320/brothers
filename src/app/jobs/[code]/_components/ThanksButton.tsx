"use client";

import { useState } from "react";
import { addXP, getXP, levelFor } from "@/lib/xp";
import { speak } from "@/lib/speak";

function loadThanks(code: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const all = JSON.parse(localStorage.getItem("brothers-thanks") ?? "{}") as Record<string, number>;
    return all[code] ?? 0;
  } catch {
    return 0;
  }
}

export default function ThanksButton({
  code,
  dong,
  spot,
  locked,
}: {
  code: string;
  dong: string;
  spot: string;
  locked: boolean;
}) {
  const [n, setN] = useState(() => loadThanks(code));

  function send() {
    const next = n + 1;
    setN(next);
    try {
      const all = JSON.parse(localStorage.getItem("brothers-thanks") ?? "{}") as Record<string, number>;
      all[code] = next;
      localStorage.setItem("brothers-thanks", JSON.stringify(all));
    } catch {}
    if (!locked && n === 0) addXP(2, `${spot} 첫 응원!`);
    speak(`응원 ${next}개째! ${dong}의 ${spot} 사장님께 전해줄게!`);
  }

  if (locked) {
    return (
      <div className="rounded-3xl bg-stone-200 p-5 text-center shadow">
        <p className="text-xl font-black">🔒 응원 보내기는 탐험대원부터!</p>
        <p className="font-bold text-stone-600">(현재 {getXP()} XP · {levelFor(getXP()).name})</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 text-center shadow">
      <p className="text-xl font-black">🦸 {dong}의 {spot} 사장님께 응원 보내기!</p>
      <button
        type="button"
        onClick={send}
        className="animate-wiggle mt-2 rounded-2xl bg-pink-300 px-6 py-3 text-xl font-black shadow"
      >
        💌 응원하기 ({n})
      </button>
    </div>
  );
}
