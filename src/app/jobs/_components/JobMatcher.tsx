"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_JOBS, JOB_FIELDS, type JobField, type JobPowers } from "@/lib/mock";
import { speak } from "@/lib/speak";

const RARITY_COLOR: Record<string, string> = {
  커먼: "bg-stone-200",
  레어: "bg-sky-200",
  레전드: "bg-amber-300",
};

const SLIDERS: Array<{ key: keyof JobPowers; emoji: string }> = [
  { key: "힘", emoji: "💪" },
  { key: "말하기", emoji: "🗣️" },
  { key: "그리기", emoji: "🎨" },
  { key: "관찰", emoji: "🔍" },
  { key: "손재주", emoji: "✋" },
];

export default function JobMatcher() {
  const [levels, setLevels] = useState<Record<keyof JobPowers, number>>({ 힘: 3, 말하기: 3, 그리기: 3, 관찰: 3, 손재주: 3 });
  const [field, setField] = useState<JobField | "전체">("전체");
  const [q, setQ] = useState("");
  const [visited] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("brothers-jobs-visited") ?? "[]");
    } catch {
      return [];
    }
  });

  const sorted = [...MOCK_JOBS].sort((a, b) => {
    const sa = (Object.keys(levels) as Array<keyof JobPowers>).reduce((s, k) => s + a.powers[k] * levels[k], 0);
    const sb = (Object.keys(levels) as Array<keyof JobPowers>).reduce((s, k) => s + b.powers[k] * levels[k], 0);
    return sb - sa;
  });
  const top3 = sorted.slice(0, 3);

  function recommend() {
    speak(`너에게 어울리는 직업은 ${top3.map((j) => j.name).join(", ")}!`);
  }

  const shown = MOCK_JOBS.filter(
    (j) => (field === "전체" || j.field === field) && (q.trim() === "" || j.name.includes(q.trim()))
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">💫 직업 변신 실험실</h2>
        {SLIDERS.map(({ key, emoji }) => (
          <label key={key} className="mt-2 block text-xl font-bold">
            {emoji} {key} 레벨: {levels[key]}
            <input
              type="range"
              min={1}
              max={5}
              value={levels[key]}
              onChange={(e) => setLevels((v) => ({ ...v, [key]: Number(e.target.value) }))}
              className="w-full"
              aria-label={`${key} 레벨`}
            />
          </label>
        ))}
        <button
          type="button"
          onClick={recommend}
          className="mt-3 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black shadow"
        >
          어울리는 직업 찾기!
        </button>
        <p className="mt-2 text-xl font-black">추천: {top3.map((j) => `${j.emoji}${j.name}`).join(" · ")}</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🗂️ 직업 카드 {visited.length} / {MOCK_JOBS.length}</h2>
        <p className="mt-1 font-bold text-stone-500">
          카드는 <b>1일 체험 미션 3개</b> + <b>관련 장소 2곳</b>(있는 만큼)을 찾으면 얻을 수 있어!
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 찾기 (예: 빵)"
          className="mt-2 w-full rounded-2xl border-4 border-amber-200 p-3 text-lg font-bold"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {(["전체", ...JOB_FIELDS] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setField(f)}
              aria-pressed={field === f}
              className={`rounded-full px-4 py-1 font-black ${field === f ? "bg-amber-400" : "bg-stone-100"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shown.map((j) => {
          const got = visited.includes(j.code);
          return (
            <li key={j.code} className={`rounded-3xl p-5 shadow ${got ? "bg-green-50" : "bg-white"}`}>
              <div className="flex items-center justify-between">
                <div className="text-5xl">{j.emoji}</div>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${RARITY_COLOR[j.rarity]}`}>
                  {j.rarity}
                </span>
              </div>
              <h3 className="mt-1 text-2xl font-black">
                {j.name} {got && "✅"}
              </h3>
              <p className="font-bold text-stone-500">{j.field} · 우리동네 {j.spot}에서 만나봐!</p>
              <Link
                href={`/jobs/${j.code}`}
                className="mt-3 block rounded-2xl bg-sky-300 px-4 py-3 text-center text-xl font-black"
              >
                자세히 보기
              </Link>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="text-center font-black">없어! 다른 말로 찾아봐.</p>}
    </div>
  );
}
