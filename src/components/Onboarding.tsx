"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { searchHome, reverseDong, saveMe, DEFAULT_AVATAR, type MeProfile } from "@/lib/me";
import { speak } from "@/lib/speak";

const HomePicker = dynamic(() => import("./HomePicker"), {
  ssr: false,
  loading: () => <p className="rounded-3xl bg-white p-6 text-xl font-black">🗺️ 지도를 준비중...</p>,
});

const QUICK = ["염창동", "잠실동", "해운대", "둔산동", "애월읍"];

export default function Onboarding({ onDone }: { onDone: (me: MeProfile) => void }) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [q, setQ] = useState("");
  const [cands, setCands] = useState<MeProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<MeProfile | null>(null);
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await searchHome(q);
      setCands(r);
      if (r.length === 0) speak("못 찾았어. 아파트나 학교 이름으로 다시 써봐!");
    } catch {
      setCands([]);
    } finally {
      setBusy(false);
    }
  }

  function choose(c: MeProfile) {
    setPicked(c);
    setHome({ lat: c.lat, lng: c.lng });
    setStep(2);
  }

  async function confirm() {
    if (!picked || !home) return;
    setSaving(true);
    const rev = await reverseDong(home.lat, home.lng, picked.dong);
    const me: MeProfile = {
      nickname: nickname.trim() || "탐험대원",
      avatar: DEFAULT_AVATAR,
      dong: rev.dong,
      lat: home.lat,
      lng: home.lng,
      label: rev.label,
    };
    saveMe(me);
    speak(`${me.nickname}! 우리집 저장 완료! ${me.dong} 탐험 시작!`);
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
        <button
          type="button"
          onClick={() => {
            const me: MeProfile = {
              nickname: nickname.trim() || "탐험대원",
              avatar: DEFAULT_AVATAR,
              dong: "서울 중구",
              lat: 37.5665,
              lng: 126.978,
              label: "서울 시청 앞 (둘러보기)",
            };
            saveMe(me);
            onDone(me);
          }}
          className="mt-2 w-full rounded-2xl bg-stone-100 px-4 py-2 font-black"
        >
          그냥 둘러보기
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-lg">
        <p className="text-6xl">🏠</p>
        <h2 className="mt-2 text-3xl font-black">{nickname || "탐험대원"}! 우리집은 어디야?</h2>
        <p className="font-bold text-stone-500">아파트·학교 이름으로 검색해봐</p>
        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="예: 염창동, 한빛아파트"
            className="min-w-0 flex-1 rounded-2xl border-4 border-emerald-300 p-3 text-xl font-black"
          />
          <button
            type="button"
            onClick={search}
            disabled={busy || !q.trim()}
            className="rounded-2xl bg-emerald-400 px-6 py-3 text-xl font-black disabled:opacity-40"
          >
            {busy ? "..." : "찾기"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {QUICK.map((w) => (
            <button key={w} type="button" onClick={() => setQ(w)} className="rounded-full bg-stone-100 px-3 py-1 font-bold">
              {w}
            </button>
          ))}
        </div>
        <ul className="mt-3 flex flex-col gap-2 text-left">
          {cands.map((c, i) => (
            <li key={`${c.lat}-${c.lng}-${i}`}>
              <button
                type="button"
                onClick={() => choose(c)}
                className="w-full rounded-2xl bg-amber-50 px-4 py-3 text-left font-black hover:bg-amber-100"
              >
                📍 {c.label}
              </button>
            </li>
          ))}
        </ul>
        {cands.length === 0 && !busy && <p className="mt-3 font-bold text-stone-400">검색하면 여기에 후보가 나와!</p>}
      </div>
    );
  }

  return (
    <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-lg">
      <h2 className="text-2xl font-black">🏠를 우리집 앞에 놓아줘!</h2>
      {picked && home && <HomePicker lat={picked.lat} lng={picked.lng} onMove={(la, ln) => setHome({ lat: la, lng: ln })} />}
      <button
        type="button"
        onClick={confirm}
        disabled={saving || !home}
        className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-4 text-2xl font-black shadow disabled:opacity-40"
      >
        {saving ? "저장 중..." : "여기가 우리집! 🏠"}
      </button>
    </div>
  );
}
