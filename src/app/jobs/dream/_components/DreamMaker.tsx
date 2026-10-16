"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_JOBS } from "@/lib/mock";
import { addXP } from "@/lib/xp";
import { speak } from "@/lib/speak";

export interface Dream {
  code: string;
  msg: string;
  date: string;
}

export function loadDream(): Dream | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("brothers-dream");
    return raw ? (JSON.parse(raw) as Dream) : null;
  } catch {
    return null;
  }
}

export default function DreamMaker() {
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [dream, setDream] = useState<Dream | null>(loadDream);

  const cands = q.trim() === "" ? [] : MOCK_JOBS.filter((j) => j.name.includes(q.trim())).slice(0, 6);
  const job = MOCK_JOBS.find((j) => j.code === (code || dream?.code));

  function save() {
    if (!code || !msg.trim()) return;
    const had = !!dream;
    const d: Dream = { code, msg: msg.trim(), date: new Date().toLocaleDateString("ko-KR") };
    try {
      localStorage.setItem("brothers-dream", JSON.stringify(d));
    } catch {}
    setDream(d);
    if (!had) {
      addXP(20, "꿈 발표!");
      speak(`멋진 꿈이다! 20 XP 받았다! 20년 뒤의 ${MOCK_JOBS.find((j) => j.code === code)?.name}!`);
    } else {
      speak(`꿈을 바꿨어! 멋지다!`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🌟 20년 뒤의 나</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="되고 싶은 직업 검색 (예: 소방)"
          className="mt-2 w-full rounded-2xl border-4 border-amber-200 p-3 text-lg font-bold"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {cands.map((j) => (
            <button
              key={j.code}
              type="button"
              onClick={() => setCode(j.code)}
              aria-pressed={code === j.code}
              className={`rounded-full px-4 py-2 text-lg font-black ${code === j.code ? "bg-amber-400" : "bg-stone-100"}`}
            >
              {j.emoji} {j.name}
            </button>
          ))}
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={2}
          maxLength={60}
          placeholder="하고 싶은 말 한 줄! (예: 불을 끄고 사람을 구할래요)"
          className="mt-3 w-full rounded-2xl border-4 border-pink-200 p-3 text-lg font-bold"
        />
        <button
          type="button"
          onClick={save}
          disabled={!code || !msg.trim()}
          className="mt-2 w-full rounded-2xl bg-pink-300 px-4 py-3 text-xl font-black disabled:opacity-40"
        >
          꿈 발표하기! (+20 XP)
        </button>
      </div>

      {dream && job && (
        <div className="animate-pop rounded-3xl bg-gradient-to-r from-violet-300 to-pink-300 p-6 text-center shadow-lg">
          <p className="text-6xl">{job.emoji}</p>
          <h3 className="text-3xl font-black">20년 뒤의 {job.name}</h3>
          <p className="mt-1 text-xl font-bold">“{dream.msg}”</p>
          <p className="mt-1 font-bold text-stone-600">{dream.date} 발표</p>
          <Link href="/mybox" className="mt-3 block rounded-2xl bg-white px-4 py-3 text-xl font-black">
            🎒 수집함에서 보기
          </Link>
        </div>
      )}
    </div>
  );
}
