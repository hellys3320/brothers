"use client";

import { useState } from "react";
import { missionsFor, loadMissions, saveMissions } from "@/lib/missions";
import { addXP, getXP, levelFor } from "@/lib/xp";
import { speak } from "@/lib/speak";
import type { JobField } from "@/lib/mock";

export default function MissionSection({
  code,
  name,
  spot,
  field,
  locked,
}: {
  code: string;
  name: string;
  spot: string;
  field: JobField;
  locked: boolean;
}) {
  const [done, setDone] = useState<boolean[]>(() => loadMissions(code));

  if (locked) {
    return (
      <div className="rounded-3xl bg-stone-200 p-5 text-center shadow">
        <p className="text-4xl">🔒</p>
        <p className="text-xl font-black">레전드 체험은 탐험대원부터!</p>
        <p className="font-bold text-stone-600">탐험·퀴즈·미션으로 XP를 모아봐. (현재 {getXP()} XP · {levelFor(getXP()).name})</p>
      </div>
    );
  }

  const all = done.every(Boolean);
  const list = missionsFor(field, name, spot);

  function toggle(i: number) {
    if (done[i]) return;
    const next = done.map((d, k) => (k === i ? true : d));
    setDone(next);
    saveMissions(code, next);
    addXP(10);
    if (next.every(Boolean)) {
      speak(`대단해! 오늘부터 너는 1일 ${name}! 체험 완료!`);
    } else {
      speak(`미션 1개 완료! 10 XP 받았다!`);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="text-2xl font-black">🎖️ 1일 {name} 체험</h2>
      <p className="font-bold text-stone-500">미션 1개마다 10 XP! 3개 다 하면 체험 완료!</p>
      <ul className="mt-3 flex flex-col gap-2">
        {list.map((m, i) => (
          <li key={m}>
            <button
              type="button"
              onClick={() => toggle(i)}
              disabled={done[i]}
              className={`w-full rounded-2xl px-4 py-3 text-left text-lg font-black ${
                done[i] ? "bg-green-100" : "border-4 border-violet-200 bg-violet-50"
              }`}
            >
              {done[i] ? "✅" : `${i + 1}.`} {m}
            </button>
          </li>
        ))}
      </ul>
      {all && <p className="animate-pop mt-3 text-center text-2xl font-black">🎖️ 체험 완료! 명예 {name}!</p>}
    </div>
  );
}
