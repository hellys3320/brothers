"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MOCK_TOWN, type FacilityKind } from "@/lib/mock";
import { speak } from "@/lib/speak";

const TownMap = dynamic(() => import("./TownMap"), {
  ssr: false,
  loading: () => <p className="rounded-3xl bg-white p-6 text-xl font-black">🗺️ 지도를 준비중...</p>,
});

const KIND_COLOR: Record<FacilityKind, string> = {
  도서관: "bg-sky-200",
  공원: "bg-green-200",
  병원: "bg-red-200",
  안전지킴이집: "bg-yellow-200",
  주의길: "bg-orange-200",
};

function loadStamps(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("brothers-stamps") ?? "[]");
  } catch {
    return [];
  }
}

export default function TownExplorer() {
  const [found, setFound] = useState<string[]>(loadStamps);
  const [listMode, setListMode] = useState(false);

  function discover(id: string) {
    const f = MOCK_TOWN.find((x) => x.id === id);
    if (!f || found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    try {
      localStorage.setItem("brothers-stamps", JSON.stringify(next));
    } catch {}
    speak(`${f.name}. ${f.easy} 스탬프를 받았다!`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xl font-black">
          찾은 비밀 {found.length} / {MOCK_TOWN.length}개 🎉
        </p>
        <button
          type="button"
          onClick={() => setListMode((v) => !v)}
          className="rounded-full bg-white px-5 py-2 font-black shadow"
        >
          {listMode ? "🗺️ 지도로 보기" : "📋 목록으로 보기"}
        </button>
      </div>

      {listMode ? null : <TownMap found={found} onDiscover={discover} />}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_TOWN.map((f) => {
          const got = found.includes(f.id);
          return (
            <li
              key={f.id}
              className={`rounded-3xl border-4 p-5 shadow ${got ? "border-green-500 bg-green-50" : "border-white bg-white"}`}
            >
              <span className={`inline-block rounded-full px-3 py-1 font-black ${KIND_COLOR[f.kind]}`}>
                {f.stamp} {f.kind}
              </span>
              <h3 className="mt-2 text-2xl font-black">{f.name}</h3>
              <p className="font-bold text-stone-700">{f.easy}</p>
              <p className="mt-1 font-bold">
                안전: {f.safeLevel === "초록" ? "🟢 안전해" : f.safeLevel === "노랑" ? "🟡 조심!" : "🔴 위험!"}
              </p>
              <button
                type="button"
                onClick={() => discover(f.id)}
                className="mt-3 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-xl font-black shadow active:translate-y-0.5"
              >
                {got ? "✅ 찾았다!" : "🔍 탐험하기"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
