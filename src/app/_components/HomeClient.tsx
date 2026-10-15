"use client";

import { useState } from "react";
import Link from "next/link";
import Onboarding from "@/components/Onboarding";
import { clearMe, loadMe, type MeProfile } from "@/lib/me";

export default function HomeClient() {
  const [me, setMe] = useState<MeProfile | null>(() => loadMe());

  if (!me) {
    return (
      <div className="flex flex-col gap-4">
        <Onboarding onDone={setMe} />
        <p className="text-center font-bold text-stone-500">이름과 동네는 이 기기에만 저장돼. 로그인은 없어!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-pop rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 p-6 text-center shadow-lg">
        <p className="text-5xl">🕵️‍♂️</p>
        <h1 className="mt-1 text-3xl font-black">{me.nickname}의 비밀기지!</h1>
        <p className="text-xl font-black">🏠 우리집 ({me.dong})에서 탐험중</p>
        <button
          type="button"
          onClick={() => { clearMe(); setMe(null); }}
          className="mt-2 rounded-full bg-white/80 px-4 py-1 text-sm font-black"
        >
          우리집 바꾸기
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/town"
          className="animate-wiggle rounded-3xl bg-emerald-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          🗺️ {me.dong} 탐험!
          <span className="block text-base font-bold">비밀 5개를 찾아봐</span>
        </Link>
        <Link
          href="/jobs"
          className="rounded-3xl bg-sky-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          💼 {me.nickname} 변신!
          <span className="block text-base font-bold">어울리는 직업 찾기</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/quiz" className="rounded-3xl bg-yellow-300 p-6 text-center text-xl font-black shadow">
          🎯 오늘의 퀴즈
        </Link>
        <Link href="/mybox" className="rounded-3xl bg-pink-300 p-6 text-center text-xl font-black shadow">
          🎒 {me.nickname} 수집함
        </Link>
      </div>
    </div>
  );
}
