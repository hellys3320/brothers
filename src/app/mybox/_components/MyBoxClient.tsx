"use client";

import { useState } from "react";
import Link from "next/link";
import { loadMyPlaces } from "@/lib/realTown";
import { getXP, getXPLog, levelFor } from "@/lib/xp";
import { loadStampLog } from "@/lib/stamps";
import { MOCK_JOBS } from "@/lib/mock";
import JobCardFace from "@/components/JobCardFace";
import {
  TREASURES,
  TREASURE_STYLE,
  loadTreasures,
  loadSockets,
  saveSockets,
  socketFor,
  treasureCount,
  type Inventory,
  type Sockets,
} from "@/lib/treasures";
import type { Dream } from "@/app/jobs/dream/_components/DreamMaker";
import { speak } from "@/lib/speak";

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
  const [stamps] = useState<string[]>(readStamps);
  const [myPlaces] = useState(loadMyPlaces);
  const [stampLog] = useState(loadStampLog);
  const [visitedJobs] = useState<string[]>(readVisitedJobs);
  const [xpLog] = useState(getXPLog);
  const [xp] = useState(() => getXP());
  const [diary, setDiary] = useState<string>(() => read("brothers-diary", ""));
  const [saved, setSaved] = useState<string>(() => read("brothers-diary", ""));
  const [mood, setMood] = useState<string>(() => read("brothers-mood", MOODS[0]));
  const [best] = useState<number>(() => Number(read("brothers-quiz-best", "0")));
  const [inventory] = useState<Inventory>(loadTreasures);
  const [sockets, setSockets] = useState<Sockets>(loadSockets);
  const [socketTarget, setSocketTarget] = useState<string | null>(null);
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

  function equip(code: string, treasureId: string) {
    const next: Sockets = { ...sockets, [code]: treasureId };
    setSockets(next);
    saveSockets(next);
    setSocketTarget(null);
    speak("보물을 꽂아서 카드가 강해졌어!");
  }

  function unequip(code: string) {
    const next: Sockets = { ...sockets };
    delete next[code];
    setSockets(next);
    saveSockets(next);
    setSocketTarget(null);
    speak("보물을 뺐어!");
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
  const owned = TREASURES.filter((t) => (inventory[t.id] ?? 0) > 0);
  const strengthened = jobCards.filter((j) => sockets[j.code]).length;
  const targetJob = socketTarget ? MOCK_JOBS.find((j) => j.code === socketTarget) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏆 탐험 진행도 {progress}%</h2>
        <div className="mt-2 h-5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 font-bold">
          퀴즈 최고 기록: {best}개 · 스탬프 {stamps.length}개 · 카드 {jobCards.length}장 · 보물 {treasureCount(inventory)}개
        </p>
        <p className="font-black text-violet-700">🎖️ Lv.{levelFor(xp).lv} {levelFor(xp).name} ({xp} XP)</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">💎 내 보물 ({treasureCount(inventory)}개)</h2>
        <p className="font-bold text-stone-500">동네탐험에서 랜덤으로 나와! 카드 소켓에 꽂으면 그 능력치가 올라가!</p>
        {owned.length === 0 ? (
          <div>
            <p className="mt-2 font-bold">아직 보물이 없어. 동네탐험에서 스탬프를 모으다 보면 나와!</p>
            <Link href="/town" className="mt-3 block rounded-2xl bg-emerald-300 px-4 py-3 text-center text-xl font-black">
              탐험하러 가기
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {owned.map((t) => (
              <li key={t.id} className={`rounded-2xl bg-gradient-to-br p-[2px] ${TREASURE_STYLE[t.rarity].frame}`}>
                <div className={`flex h-full flex-col items-center rounded-[14px] bg-gradient-to-br p-2 text-center ${TREASURE_STYLE[t.rarity].bg}`}>
                  <span className="text-3xl">{t.emoji}</span>
                  <span className="mt-0.5 text-[11px] font-black leading-tight">{t.name}</span>
                  <span className="text-[10px] font-black text-stone-600">
                    {t.stat}+{t.bonus}
                  </span>
                  <span className={`mt-0.5 rounded-full px-1.5 text-[10px] font-black ${TREASURE_STYLE[t.rarity].badge}`}>
                    {t.rarity} ×{inventory[t.id]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">
          💼 직업 카드 도감 ({jobCards.length}/{MOCK_JOBS.length})
        </h2>
        <p className="font-bold text-stone-500">
          카드의 소켓에 보물을 꽂아 강화해봐! 지금까지 {strengthened}장 강화했어.
        </p>

        {targetJob && (
          <div className="animate-pop mt-3 rounded-2xl border-4 border-amber-300 bg-amber-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-black">
                💠 {targetJob.name}에 꽂을 보물 고르기
              </p>
              <button type="button" onClick={() => setSocketTarget(null)} className="rounded-full bg-white px-3 py-1 font-black shadow">
                닫기
              </button>
            </div>
            {owned.length === 0 ? (
              <p className="mt-2 font-bold text-stone-500">꽂을 보물이 없어. 동네탐험에서 보물을 먼저 찾아봐!</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {owned.map((t) => {
                  const on = sockets[targetJob.code] === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => equip(targetJob.code, t.id)}
                      className={`rounded-2xl px-3 py-2 font-black shadow ${on ? "bg-amber-400" : "bg-white"}`}
                    >
                      {t.emoji} {t.name}
                      <span className="ml-1 text-sm text-stone-600">
                        {t.stat}+{t.bonus}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {socketFor(sockets, targetJob.code) && (
              <button type="button" onClick={() => unequip(targetJob.code)} className="mt-3 rounded-2xl bg-stone-200 px-4 py-2 font-black">
                🔌 보물 빼기
              </button>
            )}
          </div>
        )}

        {jobCards.length === 0 ? (
          <div>
            <p className="mt-2 font-bold">아직 없어. 직업 도감에서 카드를 열어봐!</p>
            <Link href="/jobs" className="mt-3 block rounded-2xl bg-sky-300 px-4 py-3 text-center text-xl font-black">
              직업 도감 가기
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {jobCards.map((j) => {
              const no = String(MOCK_JOBS.findIndex((x) => x.code === j.code) + 1).padStart(3, "0");
              return (
                <li key={j.code} className="flex flex-col gap-1">
                  <JobCardFace job={j} no={no} socket={socketFor(sockets, j.code)} onSocketClick={() => setSocketTarget(j.code)} />
                  <Link href={`/jobs/${j.code}`} className="rounded-xl bg-stone-100 py-1 text-center text-xs font-black text-stone-600">
                    📖 {j.name} 도감 보기
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
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
