"use client";

import { useState } from "react";
import { geocodeDong, saveMe, type MeProfile } from "@/lib/me";
import { speak } from "@/lib/speak";

const QUICK = ["서울 잠실동", "부산 해운대", "대전 둔산동", "광주 충장로", "제주 애월읍"];

export default function Onboarding({ onDone }: { onDone: (me: MeProfile) => void }) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [dong, setDong] = useState("");
  const [cands, setCands] = useState<MeProfile[]>([]);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (!dong.trim()) return;
    setBusy(true);
    try {
      const r = await geocodeDong(dong);
      setCands(r);
      if (r.length === 0) speak("못 찾았어. 동 이름으로 다시 써봐. 예를 들어 잠실동!");
    } catch {
      setCands([]);
    } finally {
      setBusy(false);
    }
  }

  function pick(c: MeProfile) {
    const me = { ...c, nickname: nickname.trim() || "탐험대원", dong: dong.trim() };
    saveMe(me);
    speak(`${me.nickname}! ${me.dong} 비밀지도를 폈다!`);
    onDone(me);
  }

  if (step === 0) {
    return (
      <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-lg">
        <p className="text-6xl">🕵️</p>
        <h2 className="mt-2 text-3xl font-black">형님이 묻는다!</h2>
        <p className="mt-1 text-xl font-bold">너의 이름은 뭐야?</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 지우"
          maxLength={10}
          className="mt-4 w-full rounded-2xl border-4 border-amber-300 p-4 text-center text-2xl font-black"
        />
        <button
          type="button"
          disabled={!nickname.trim()}
          onClick={() => setStep(1)}
          className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-4 text-2xl font-black shadow disabled:opacity-40"
        >
          다음! →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-lg">
      <p className="text-6xl">🗺️</p>
      <h2 className="mt-2 text-3xl font-black">{nickname || "탐험대원"}! 우리동네는 어디야?</h2>
      <p className="font-bold text-stone-500">동 이름으로 검색해봐 (예: 잠실동)</p>
      <div className="mt-3 flex gap-2">
        <input
          value={dong}
          onChange={(e) => setDong(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="동 이름"
          className="flex-1 rounded-2xl border-4 border-emerald-300 p-3 text-xl font-black"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !dong.trim()}
          className="rounded-2xl bg-emerald-400 px-6 py-3 text-xl font-black disabled:opacity-40"
        >
          {busy ? "..." : "찾기"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => { setDong(q); }} className="rounded-full bg-stone-100 px-3 py-1 font-bold">
            {q}
          </button>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-2 text-left">
        {cands.map((c, i) => (
          <li key={`${c.lat}-${c.lng}-${i}`}>
            <button
              type="button"
              onClick={() => pick(c)}
              className="w-full rounded-2xl bg-amber-50 px-4 py-3 text-left font-black hover:bg-amber-100"
            >
              📍 {c.label}
            </button>
          </li>
        ))}
      </ul>
      {cands.length === 0 && !busy && <p className="mt-3 font-bold text-stone-400">검색하면 여기에 동네가 나와!</p>}
    </div>
  );
}
