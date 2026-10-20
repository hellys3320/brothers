"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MOCK_JOBS, JOB_FIELDS, type JobField, type JobPowers } from "@/lib/mock";
import { loadMissions } from "@/lib/missions";
import { visitsFor } from "@/lib/jobMission";
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

type OwnedFilter = "전체" | "획득" | "미획득";

function readVisited(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("brothers-jobs-visited") ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function JobMatcher() {
  const [levels, setLevels] = useState<Record<keyof JobPowers, number>>({ 힘: 3, 말하기: 3, 그리기: 3, 관찰: 3, 손재주: 3 });
  const [field, setField] = useState<JobField | "전체">("전체");
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>("전체");

  // 카드를 얻고 돌아오거나 다른 탭에서 바뀌어도 목록이 바로 갱신되게
  useEffect(() => {
    const sync = () => {
      setVisited(readVisited());
      setMounted(true);
    };
    sync();
    window.addEventListener("brothers:missions", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("brothers:missions", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const ownedSet = useMemo(() => new Set(visited), [visited]);
  const ownedCount = MOCK_JOBS.filter((j) => ownedSet.has(j.code)).length;
  const pct = Math.round((ownedCount / MOCK_JOBS.length) * 100);

  // 미획득 카드의 미션/장소 진행도 (마운트 후에만 localStorage를 읽는다)
  const progress = useMemo(() => {
    const out: Record<string, { missions: number; visits: number }> = {};
    if (!mounted) return out;
    const owned = new Set(visited);
    for (const j of MOCK_JOBS) {
      // 이미 얻은 카드는 진행도를 다시 읽을 필요가 없다
      if (owned.has(j.code)) continue;
      out[j.code] = {
        missions: loadMissions(j.code).filter(Boolean).length,
        visits: visitsFor(j.code).length,
      };
    }
    return out;
  }, [mounted, visited]);

  const sorted = [...MOCK_JOBS].sort((a, b) => {
    const sa = (Object.keys(levels) as Array<keyof JobPowers>).reduce((s, k) => s + a.powers[k] * levels[k], 0);
    const sb = (Object.keys(levels) as Array<keyof JobPowers>).reduce((s, k) => s + b.powers[k] * levels[k], 0);
    return sb - sa;
  });
  const top3 = sorted.slice(0, 3);

  function recommend() {
    speak(`너에게 어울리는 직업은 ${top3.map((j) => j.name).join(", ")}!`);
  }

  const shown = MOCK_JOBS.filter((j) => {
    const got = ownedSet.has(j.code);
    if (ownedFilter === "획득" && !got) return false;
    if (ownedFilter === "미획득" && got) return false;
    return (field === "전체" || j.field === field) && (q.trim() === "" || j.name.includes(q.trim()));
  });

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
        <h2 className="text-2xl font-black">
          🗂️ 직업 카드 <span className="text-emerald-600">{mounted ? ownedCount : "…"}</span> / {MOCK_JOBS.length}
        </h2>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${mounted ? pct : 0}%` }} />
        </div>
        <p className="mt-2 font-bold text-stone-500">
          🎴 <b className="text-emerald-700">초록 테두리</b> = 내 카드 · 🔒 <b>자물쇠</b> = 아직 못 얻은 카드
        </p>
        <p className="mt-1 font-bold text-stone-500">
          카드는 <b>1일 체험 미션 3개</b> + <b>관련 장소 2곳</b>(있는 만큼)을 찾으면 얻을 수 있어!
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["전체", "획득", "미획득"] as const).map((f) => {
            const count =
              f === "전체"
                ? MOCK_JOBS.length
                : mounted
                  ? f === "획득"
                    ? ownedCount
                    : MOCK_JOBS.length - ownedCount
                  : "…";
            const active = ownedFilter === f;
            const activeColor =
              f === "획득"
                ? "bg-emerald-400 text-emerald-950"
                : f === "미획득"
                  ? "bg-stone-500 text-white"
                  : "bg-stone-800 text-white";
            return (
              <button
                key={f}
                type="button"
                onClick={() => setOwnedFilter(f)}
                aria-pressed={active}
                className={`rounded-2xl px-2 py-2 font-black ${active ? activeColor : "bg-stone-100 text-stone-600"}`}
              >
                {f === "획득" ? "🎴 " : f === "미획득" ? "🔒 " : ""}
                {f} {count}
              </button>
            );
          })}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 찾기 (예: 빵)"
          className="mt-3 w-full rounded-2xl border-4 border-amber-200 p-3 text-lg font-bold"
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

      {!mounted ? (
        <p className="rounded-3xl bg-white p-6 text-center text-xl font-black">🎴 내 카드를 확인하는 중...</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shown.map((j) => {
            const got = ownedSet.has(j.code);
            const p = progress[j.code] ?? { missions: 0, visits: 0 };
            return (
              <li
                key={j.code}
                className={`relative overflow-hidden rounded-3xl p-5 shadow ${
                  got
                    ? "bg-gradient-to-br from-emerald-50 to-amber-50 ring-4 ring-emerald-300"
                    : "border-4 border-dashed border-stone-200 bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`text-5xl ${got ? "" : "grayscale opacity-40"}`}>{j.emoji}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-sm font-black ${RARITY_COLOR[j.rarity]}`}>
                      {j.rarity}
                    </span>
                    {got ? (
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-emerald-950">🎴 획득!</span>
                    ) : (
                      <span className="rounded-full bg-stone-300 px-3 py-1 text-sm font-black text-stone-600">🔒 미획득</span>
                    )}
                  </div>
                </div>
                <h3 className={`mt-1 text-2xl font-black ${got ? "" : "text-stone-500"}`}>{j.name}</h3>
                <p className="font-bold text-stone-500">{j.field} · 우리동네 {j.spot}에서 만나봐!</p>

                {got ? (
                  <p className="mt-2 rounded-xl bg-emerald-100 px-3 py-2 font-black text-emerald-800">
                    ✅ 내 카드! 수집함에서 보물을 꽂아봐.
                  </p>
                ) : (
                  <p className="mt-2 rounded-xl bg-white px-3 py-2 font-bold text-stone-600">
                    🎯 미션 {p.missions}/3 · 장소 {p.visits}곳
                  </p>
                )}

                <Link
                  href={`/jobs/${j.code}`}
                  className={`mt-3 block rounded-2xl px-4 py-3 text-center text-xl font-black ${
                    got ? "bg-emerald-300" : "bg-sky-300"
                  }`}
                >
                  {got ? "🎴 내 카드 보기" : "🔓 카드 얻으러 가기"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {mounted && shown.length === 0 && (
        <p className="text-center font-black">
          {ownedFilter === "획득"
            ? "아직 획득한 카드가 없어! 첫 카드에 도전해봐!"
            : ownedFilter === "미획득"
              ? "모든 카드를 획득했어! 🎉"
              : "없어! 다른 말로 찾아봐."}
        </p>
      )}
    </div>
  );
}
