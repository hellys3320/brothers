"use client";

import { useEffect, useState } from "react";
import { getXP, levelFor, nextLevel } from "@/lib/xp";

export default function LevelBadge() {
  const [xp, setXp] = useState(() => getXP());

  useEffect(() => {
    const on = (e: Event) => setXp((e as CustomEvent<number>).detail ?? getXP());
    window.addEventListener("brothers-xp", on);
    return () => window.removeEventListener("brothers-xp", on);
  }, []);

  const lv = levelFor(xp);
  const nx = nextLevel(xp);

  return (
    <div className="rounded-2xl bg-white p-3 shadow">
      <p className="text-lg font-black">
        🎖️ Lv.{lv.lv} {lv.name} ({xp} XP)
      </p>
      {nx ? (
        <div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${Math.min(100, ((xp - lv.xp) / (nx.xp - lv.xp)) * 100)}%` }}
            />
          </div>
          <p className="text-sm font-bold text-stone-500">다음 {nx.name}까지 {nx.xp - xp} XP!</p>
        </div>
      ) : (
        <p className="text-sm font-black text-amber-600">👑 최고 레벨! 전설의형님!</p>
      )}
    </div>
  );
}
