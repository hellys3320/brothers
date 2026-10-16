"use client";

import { useState } from "react";
import Link from "next/link";
import { loadMyPlaces } from "@/lib/realTown";
import { getXP, getXPLog, levelFor } from "@/lib/xp";
import { loadStampLog } from "@/lib/stamps";
import { MOCK_JOBS } from "@/lib/mock";
import type { Dream } from "@/app/jobs/dream/_components/DreamMaker";
import { speak } from "@/lib/speak";

const RARITY_FRAME: Record<string, string> = {
  커먼: "border-stone-300 bg-gradient-to-b from-stone-50 to-stone-200",
  레어: "border-sky-400 bg-gradient-to-b from-sky-100 to-sky-200",
  레전드: "border-amber-400 bg-gradient-to-b from-amber-100 to-orange-200",
};

const POWER_EMOJI: Record<string, string> = { 힘: "💪", 말하기: "🗣️", 그리기: "🎨", 관찰: "🔍", 손재주: "✋" };

const MOODS = ["😄", "😮", "😤", "🥱", "🤩"];

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

function readVisitedJobs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("brothers-jobs-visited") ?? "[]");
  } catch {
    return [];
  }
}

function dateStr(t: number): string {
  try {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

export default function MyBoxClient() {
  const [stamps, setStamps] = useState<string[]>(readStamps);
  const [myPlaces] = useState(loadMyPlaces);
  const [stampLog, setStampLog] = useState(loadStampLog);
  const [visitedJobs] = useState<string[]>(readVisitedJobs);
  const [xpLog] = useState(getXPLog);
  const [xp] = useState(() => getXP());
  const [diary, setDiary] = useState<string>(() => read("brothers-diary", ""));
  const [saved, setSaved] = useState<string>(() => read("brothers-diary", ""));
  const [mood, setMood] = useState<string>(() => read("brothers-mood", MOODS[0]));
  const [best] = useState<number>(() => Number(read("brothers-quiz-best", "0")));
  const [dream] = useState<Dream | null>(() => {
    try {
      const raw = localStorage.getItem("brothers-dream");
      return raw ? (JSON.parse(raw) as Dream) : null;
    } catch {
      return null;
    }
  });
  const dreamJob = dream ? MOCK_JOBS.find((j) => j.code === dream.code) : null;

  function saveDiary() {
    if (!diary.trim() && !saved) return;
    const text = diary.trim() || saved;
    try {
      localStorage.setItem("brothers-diary", text);
      localStorage.setItem("brothers-mood", mood);
      setSaved(text);
      speak("탐험일지를 저장했다!");
    } catch {}
  }

  function resetAll() {
    // 게임 기록은 다 지우고 이름·집은 유지 (프로필 키 brothers-me 제외)
    const keep = localStorage.getItem("brothers-me");
    const keepCache: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("brothers-poi-") && localStorage.getItem(k)) {
          keepCache[k] = localStorage.getItem(k) as string;
        }
      }
    } catch {}
    try {
      localStorage.clear();
      if (keep) localStorage.setItem("brothers-me", keep);
      for (const [k, v] of Object.entries(keepCache)) localStorage.setItem(k, v);
    } catch {}
    window.location.reload();
  }

  const myGot = stamps.filter((s) => myPlaces.some((p) => p.id === s)).length;
  const progress = myPlaces.length > 0 ? Math.round((myGot / myPlaces.length) * 100) : 0;
  // 예전 도장(이름 기록 전)은 저장된 장소에서 이름 찾아주기
  const legacy = stamps
    .filter((id) => !stampLog.some((s) => s.id === id))
    .map((id) => {
      const p = myPlaces.find((x) => x.id === id);
      return p ? { id, name: p.name, stamp: p.stamp, dong: p.dong, at: 0 } : null;
    })
    .filter((s): s is { id: string; name: string; stamp: string; dong: string; at: number } => !!s);
  const allStamps = [...stampLog, ...legacy];
  const jobCards = visitedJobs
    .map((c) => MOCK_JOBS.find((j) => j.code === c))
    .filter((j): j is (typeof MOCK_JOBS)[number] => !!j);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏆 탐험 진행도 {progress}%</h2>
        <div className="mt-2 h-5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 font-bold">퀴즈 최고 기록: {best}개 · 스탬프 {stamps.length}개 · 카드 {jobCards.length}장</p>
        <p className="font-black text-violet-700">🎖️ Lv.{levelFor(xp).lv} {levelFor(xp).name} ({xp} XP)</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">⚡ XP 히스토리</h2>
        {xpLog.length === 0 ? (
          <p className="mt-2 font-bold text-stone-500">아직 XP가 없어. 탐험·퀴즈·게임을 해봐!</p>
        ) : (
          <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
            {xpLog.slice(0, 15).map((e, i) => (
              <li key={`${e.t}-${i}`} className="rounded-xl bg-violet-50 px-3 py-1 font-bold">
                +{e.n} · {e.why || "열심히 했어!"} <span className="text-stone-400">{dateStr(e.t)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">💼 직업 카드 도감 ({jobCards.length}/{MOCK_JOBS.length})</h2>
        {jobCards.length === 0 ? (
          <div>
            <p className="mt-2 font-bold">아직 없어. 직업 도감에서 카드를 열어봐!</p>
            <Link href="/jobs" className="mt-3 block rounded-2xl bg-sky-300 px-4 py-3 text-center text-xl font-black">
              직업 도감 가기
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {jobCards.map((j) => {
              const no = String(MOCK_JOBS.findIndex((x) => x.code === j.code) + 1).padStart(3, "0");
              return (
                <li key={j.code}>
                  <Link
                    href={`/jobs/${j.code}`}
                    className={`block rounded-2xl border-4 p-2 text-center shadow ${RARITY_FRAME[j.rarity]}`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-stone-500">No.{no}</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-black">{j.rarity}</span>
                    </div>
                    <div className="mx-auto mt-1 flex h-20 w-20 items-center justify-center rounded-full bg-white/70 text-5xl">
                      {j.emoji}
                    </div>
                    <p className="mt-1 text-lg font-black">{j.name}</p>
                    <p className="text-xs font-black text-stone-500">{j.field}</p>
                    <p className="mt-1 text-xs font-bold">
                      {(Object.entries(j.powers) as [string, number][]).map(([k, v]) => (
                        <span key={k} className="mr-1">
                          {POWER_EMOJI[k]}{v}
                        </span>
                      ))}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🎒 얻은 장소 ({allStamps.length}곳)</h2>
        {allStamps.length === 0 ? (
          <div>
            <p className="mt-2 font-bold">아직 비었어. 동네탐험에서 먼저 찾아봐!</p>
            <Link href="/town" className="mt-3 block rounded-2xl bg-emerald-300 px-4 py-3 text-center text-xl font-black">
              탐험하러 가기
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {allStamps.map((s) => (
              <li key={s.id} className="rounded-2xl bg-green-50 px-4 py-2 text-lg font-black">
                {s.stamp} {s.name}
                <span className="ml-2 text-sm font-bold text-stone-500">{s.dong}{s.at > 0 ? ` · ${dateStr(s.at)}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dream && dreamJob && (
        <div className="rounded-3xl bg-gradient-to-r from-violet-200 to-pink-200 p-5 text-center shadow">
          <p className="text-4xl">{dreamJob.emoji}</p>
          <p className="text-2xl font-black">20년 뒤의 {dreamJob.name}</p>
          <p className="font-bold">“{dream.msg}”</p>
          <Link href="/jobs/dream" className="mt-2 block rounded-2xl bg-white px-4 py-2 font-black">
            꿈 바꾸기
          </Link>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">📝 탐험일지</h2>
        <p className="font-bold text-stone-500">오늘 기분은?</p>
        <div className="mt-1 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              aria-pressed={mood === m}
              className={`rounded-2xl px-3 py-2 text-3xl ${mood === m ? "bg-amber-200" : "bg-stone-100"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={diary}
          onChange={(e) => setDiary(e.target.value)}
          rows={3}
          placeholder="오늘 본 것을 한 줄로 써봐!"
          className="mt-3 w-full rounded-2xl border-4 border-amber-200 p-3 text-lg font-bold"
        />
        <button type="button" onClick={saveDiary} className="mt-2 w-full rounded-2xl bg-pink-300 px-4 py-3 text-xl font-black">
          저장하기
        </button>
        {saved && <p className="mt-2 font-bold">{mood} 저장됨: {saved}</p>}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={resetAll} className="flex-1 rounded-2xl bg-stone-200 px-4 py-3 font-black">
          🗑️ 기록 지우기 (처음부터)
        </button>
      </div>
    </div>
  );
}
