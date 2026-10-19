"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { loadMe, saveMe, searchHome, reverseDong, type MeProfile } from "@/lib/me";
import { getXP, levelFor } from "@/lib/xp";
import { speak } from "@/lib/speak";

const HomePicker = dynamic(() => import("@/components/HomePicker"), {
  ssr: false,
  loading: () => <p className="rounded-3xl bg-white p-6 text-xl font-black">🗺️ 지도를 준비중...</p>,
});

export default function ProfileClient() {
  const router = useRouter();
  const [me, setMe] = useState<MeProfile | null>(() => loadMe());
  const [xp] = useState(() => getXP());
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [editHome, setEditHome] = useState(false);
  const [q, setQ] = useState("");
  const [cands, setCands] = useState<MeProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<MeProfile | null>(null);
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!me) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow">
        <p className="text-xl font-black">아직 비밀기지 식구가 아니야!</p>
        <Link href="/" className="mt-3 block rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black">
          홈에서 이름 정하기!
        </Link>
      </div>
    );
  }

  function saveNickname() {
    const nn = name.trim();
    if (!nn) return;
    const next = { ...me!, nickname: nn };
    saveMe(next);
    setMe(next);
    setEditName(false);
    setName("");
    speak(`${nn}! 이름 바꿨다!`);
  }

  async function search() {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await searchHome(q);
      setCands(r);
      if (r.length === 0) speak("못 찾았어. 아파트나 도로명 주소로 써봐!");
    } catch {
      setCands([]);
    } finally {
      setBusy(false);
    }
  }

  function choose(c: MeProfile) {
    setPicked(c);
    setHome({ lat: c.lat, lng: c.lng });
  }

  async function confirmHome() {
    if (!picked || !home) return;
    setSaving(true);
    const rev = await reverseDong(home.lat, home.lng, picked.dong);
    const next: MeProfile = { ...me!, dong: rev.dong, lat: home.lat, lng: home.lng, label: rev.label };
    saveMe(next);
    setMe(next);
    setEditHome(false);
    setPicked(null);
    setHome(null);
    setCands([]);
    setQ("");
    setSaving(false);
    speak(`${rev.dong}으로 이사 완료!`);
  }

  const lv = levelFor(xp);

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-pop rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 p-6 text-center shadow-lg">
        <p className="text-6xl">🕵️</p>
        <h1 className="mt-1 text-3xl font-black">{me.nickname}</h1>
        <p className="text-xl font-black">🏠 {me.label || me.dong}</p>
        <p className="mt-1 font-black text-violet-800">🎖️ Lv.{lv.lv} {lv.name} ({xp} XP)</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">📝 이름 바꾸기</h2>
        {!editName ? (
          <button type="button" onClick={() => { setName(me.nickname); setEditName(true); }} className="mt-2 w-full rounded-2xl bg-amber-200 px-4 py-3 text-xl font-black">
            이름 바꾸기
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
              className="min-w-0 flex-1 rounded-2xl border-4 border-amber-300 p-3 text-xl font-black"
            />
            <button type="button" onClick={saveNickname} disabled={!name.trim()} className="rounded-2xl bg-amber-400 px-6 py-3 text-xl font-black disabled:opacity-40">
              저장
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏠 우리집 바꾸기</h2>
        {!editHome ? (
          <button type="button" onClick={() => setEditHome(true)} className="mt-2 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-xl font-black">
            이사하기!
          </button>
        ) : picked && home ? (
          <div>
            <HomePicker lat={picked.lat} lng={picked.lng} onMove={(la, ln) => setHome({ lat: la, lng: ln })} />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setPicked(null); setHome(null); }} className="flex-1 rounded-2xl bg-stone-200 px-4 py-3 text-xl font-black">
                다시 찾기
              </button>
              <button type="button" onClick={confirmHome} disabled={saving} className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 text-xl font-black disabled:opacity-40">
                {saving ? "저장 중..." : "여기로 이사! 🏠"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mt-2 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="아파트·도로명 주소 (예: 연산4동 656-4)"
                className="min-w-0 flex-1 rounded-2xl border-4 border-emerald-300 p-3 text-xl font-black"
              />
              <button type="button" onClick={search} disabled={busy || !q.trim()} className="rounded-2xl bg-emerald-400 px-6 py-3 text-xl font-black disabled:opacity-40">
                {busy ? "..." : "찾기"}
              </button>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {cands.map((c, i) => (
                <li key={`${c.lat}-${c.lng}-${i}`}>
                  <button type="button" onClick={() => choose(c)} className="w-full rounded-2xl bg-amber-50 px-4 py-3 text-left font-black hover:bg-amber-100">
                    📍 {c.label}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setEditHome(false)} className="mt-2 w-full rounded-2xl bg-stone-100 px-4 py-2 font-black">
              그만두기
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/mybox" className="rounded-3xl bg-pink-300 p-5 text-center text-xl font-black shadow">
          🎒 수집함
        </Link>
        <Link href="/town" className="rounded-3xl bg-emerald-300 p-5 text-center text-xl font-black shadow">
          🗺️ 동네탐험
        </Link>
      </div>

      <div className="rounded-3xl bg-red-50 p-5 text-center shadow">
        <h2 className="text-xl font-black">🗑️ 처음부터 시작하기</h2>
        <p className="font-bold text-stone-500">이름·우리집·도장·XP 전부 지워져!</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("정말 다 지우고 처음부터 시작할까?")) {
              try {
                localStorage.clear();
              } catch {}
              router.push("/");
              window.location.reload();
            }
          }}
          className="mt-2 w-full rounded-2xl bg-red-300 px-4 py-3 text-xl font-black"
        >
          다 지우기!
        </button>
      </div>
    </div>
  );
}
