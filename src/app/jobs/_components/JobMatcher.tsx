"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_JOBS } from "@/lib/mock";
import { countShopsByJob } from "@/lib/shops";
import { speak } from "@/lib/speak";

export default function JobMatcher() {
  const [talk, setTalk] = useState(3);
  const [draw, setDraw] = useState(3);

  const sorted = [...MOCK_JOBS].sort((a, b) => {
    const sa = a.powers.말하기 * talk + a.powers.그리기 * draw;
    const sb = b.powers.말하기 * talk + b.powers.그리기 * draw;
    return sb - sa;
  });
  const top3 = sorted.slice(0, 3);
  const shopCount = countShopsByJob();

  function recommend() {
    speak(`너에게 어울리는 직업은 ${top3.map((j) => j.name).join(", ")}!`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">💫 직업 변신 실험실</h2>
        <label className="mt-3 block text-xl font-bold">
          말하기 레벨: {talk}
          <input type="range" min={1} max={5} value={talk} onChange={(e) => setTalk(Number(e.target.value))} className="w-full" />
        </label>
        <label className="mt-2 block text-xl font-bold">
          그리기 레벨: {draw}
          <input type="range" min={1} max={5} value={draw} onChange={(e) => setDraw(Number(e.target.value))} className="w-full" />
        </label>
        <button
          type="button"
          onClick={recommend}
          className="mt-3 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black shadow"
        >
          어울리는 직업 찾기!
        </button>
        <p className="mt-2 text-xl font-black">추천: {top3.map((j) => `${j.emoji}${j.name}`).join(" · ")}</p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_JOBS.map((j) => (
          <li key={j.code} className="rounded-3xl bg-white p-5 shadow">
            <div className="text-5xl">{j.emoji}</div>
            <h3 className="text-2xl font-black">{j.name}</h3>
            <ul className="font-bold text-stone-700">
              {j.easy3.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
            <p className="mt-1 font-bold">📍 {j.townPlace}</p>
            <p className="font-black text-emerald-700">🏪 우리동네 가게 {shopCount[j.code] ?? 0}곳 연결됨</p>
            <Link
              href={`/jobs/${j.code}`}
              className="mt-3 block rounded-2xl bg-sky-300 px-4 py-3 text-center text-xl font-black"
            >
              자세히 보기
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
