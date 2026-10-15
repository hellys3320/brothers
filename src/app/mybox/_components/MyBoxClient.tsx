"use client";

import { useState } from "react";
import Link from "next/link";
import { loadMyPlaces } from "@/lib/realTown";
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

export default function MyBoxClient() {
  const [stamps, setStamps] = useState<string[]>(readStamps);
  const [myPlaces] = useState(loadMyPlaces);
  const [diary, setDiary] = useState<string>(() => read("brothers-diary", ""));
  const [saved, setSaved] = useState<string>(() => read("brothers-diary", ""));
  const [mood, setMood] = useState<string>(() => read("brothers-mood", MOODS[0]));
  const [best] = useState<number>(() => Number(read("brothers-quiz-best", "0")));

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
    try {
      localStorage.removeItem("brothers-stamps");
      localStorage.removeItem("brothers-diary");
      localStorage.removeItem("brothers-mood");
      setStamps([]);
      setSaved("");
      setDiary("");
    } catch {}
  }

  const found = stamps.map((id) => {
    const p = myPlaces.find((x) => x.id === id);
    return p ?? { id, stamp: "🔖", name: "비밀 장소" };
  });
  const myGot = stamps.filter((s) => myPlaces.some((p) => p.id === s)).length;
  const progress = myPlaces.length > 0 ? Math.round((myGot / myPlaces.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏆 탐험 진행도 {progress}%</h2>
        <div className="mt-2 h-5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 font-bold">퀴즈 최고 기록: {best}개 · 스탬프 {found.length}개</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🎒 스탬프북 ({found.length}개)</h2>
        {found.length === 0 ? (
          <div>
            <p className="mt-2 font-bold">아직 비었어. 동네탐험에서 먼저 찾아봐!</p>
            <Link href="/town" className="mt-3 block rounded-2xl bg-emerald-300 px-4 py-3 text-center text-xl font-black">
              탐험하러 가기
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {found.map((f) => (
              <li key={f.id} className="rounded-2xl bg-green-50 px-4 py-2 text-lg font-black">
                {f.stamp} {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>

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
        <Link href="/print" className="flex-1 rounded-2xl bg-white px-4 py-3 text-center font-black shadow">
          🖨️ 기록표 보기
        </Link>
        <button type="button" onClick={resetAll} className="flex-1 rounded-2xl bg-stone-200 px-4 py-3 font-black">
          🗑️ 처음부터
        </button>
      </div>
    </div>
  );
}
