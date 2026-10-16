"use client";

import { useState } from "react";
import { getXP, LEVELS } from "@/lib/xp";

const MEDALS = ["🌱", "🤝", "👑", "🎒", "🗺️", "🏘️", "💼", "🎖️", "🌟", "👑"];

export default function LevelTable() {
  const [xp] = useState(() => getXP());
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left text-2xl font-black"
      >
        🎖️ 레벨표 보기 {open ? "▲" : "▼"}
      </button>
      {open && (
        <ul className="mt-3 flex flex-col gap-2">
          {LEVELS.map((l, i) => {
            const reached = xp >= l.xp;
            const current = reached && (i === LEVELS.length - 1 || xp < LEVELS[i + 1].xp);
            return (
              <li
                key={l.lv}
                className={`rounded-2xl px-4 py-2 font-black ${
                  current ? "bg-amber-200" : reached ? "bg-green-50" : "bg-stone-100 text-stone-400"
                }`}
              >
                {MEDALS[i]} Lv.{l.lv} {l.name} · {l.xp} XP
                {current && " ← 지금 여기!"}
                {l.lv === 3 && " 🔓 레전드 열림!"}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
