"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPlacesForJob, JOB_PLACE_HINT, type JobPlace } from "@/lib/realTown";
import { loadMe, type MeProfile } from "@/lib/me";

function initMe(): MeProfile | null {
  if (typeof window === "undefined") return null;
  return loadMe();
}

export default function JobRealPlaces({ jobCode, jobName }: { jobCode: string; jobName: string }) {
  const [me] = useState<MeProfile | null>(initMe);
  const [places, setPlaces] = useState<JobPlace[] | null>(null);
  const [loading, setLoading] = useState(() => initMe() !== null);

  useEffect(() => {
    if (!me) return;
    let live = true;
    fetchPlacesForJob(jobCode, me.lat, me.lng, me.dong)
      .then((r) => {
        if (live) setPlaces(r);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [jobCode, me]);

  const hint = JOB_PLACE_HINT[jobCode] ?? "관련 장소";

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow">
        <p className="text-xl font-black">🔍 우리동네 {hint} 찾는 중...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="rounded-3xl bg-white p-5 text-center shadow">
        <p className="text-xl font-black">먼저 우리동네를 알려줘!</p>
        <Link href="/" className="mt-3 block rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black">
          이름·동네 정하기
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="text-2xl font-black">
        🏪 {me.dong}의 {hint} ({places ? places.length : 0}곳)
      </h2>
      {!places ? (
        <p className="mt-2 font-bold text-stone-500">
          지도에 등록된 {hint}가 없어. {jobName} 이야기는 카드에서 읽어봐!
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {places.map((s) => (
            <li key={s.id} className="animate-pop rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xl font-black">{s.name}</p>
              <p className="font-bold text-stone-600">{s.easy}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <Link href="/town" className="flex-1 rounded-2xl bg-emerald-300 px-4 py-3 text-center text-lg font-black">
          지도에서 보기
        </Link>
        <Link href="/quiz" className="flex-1 rounded-2xl bg-yellow-200 px-4 py-3 text-center text-lg font-black">
          퀴즈 풀기
        </Link>
      </div>
    </div>
  );
}
