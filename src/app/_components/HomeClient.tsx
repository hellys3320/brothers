"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Onboarding from "@/components/Onboarding";
import LevelBadge from "@/components/LevelBadge";
import WeatherCard from "@/components/WeatherCard";
import { loadMe, type MeProfile } from "@/lib/me";
import { MOCK_JOBS } from "@/lib/mock";
import { addXP } from "@/lib/xp";
import { speak } from "@/lib/speak";
import { getDailyLetter, getDailyMission, letterDoneToday, markLetterDone } from "@/lib/letters";

function todayJob() {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  return MOCK_JOBS[seed % MOCK_JOBS.length];
}

export default function HomeClient() {
  const [me, setMe] = useState<MeProfile | null>(() => loadMe());
  const [daily, setDaily] = useState(MOCK_JOBS[0]);
  const [letter, setLetter] = useState("");
  const [mission, setMission] = useState<string | null>(null);
  const [missionDone, setMissionDone] = useState(false);

  // 오늘 날짜 기준 직업·편지는 기기에서 정함 (prerender엔 고정값)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaily(todayJob());
    setLetter(getDailyLetter());
    setMission(getDailyMission());
    setMissionDone(letterDoneToday());
  }, []);

  function claimMission() {
    if (!mission || missionDone) return;
    markLetterDone();
    setMissionDone(true);
    addXP(5, "우체통 미션!");
    speak("우체통 미션 완료! 5 XP 받았다!");
  }

  if (!me) {
    return (
      <div className="flex flex-col gap-4">
        <Onboarding onDone={setMe} />
        <p className="text-center font-bold text-stone-500">이름과 집은 이 기기에만 저장돼. 로그인은 없어!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-pop rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 p-6 text-center shadow-lg">
        <p className="text-6xl">🕵️</p>
        <h1 className="mt-1 text-3xl font-black">{me.nickname}의 비밀기지!</h1>
        <p className="text-xl font-black">🏠 우리집 ({me.dong})에서 탐험중</p>
        <Link
          href="/profile"
          className="mt-2 inline-block rounded-full bg-white/80 px-4 py-1 text-sm font-black"
        >
          내 정보 보기·바꾸기
        </Link>
      </div>

      <LevelBadge />

      <WeatherCard />

      <div className="rounded-3xl bg-amber-100 p-5 shadow">
        <p className="font-black text-stone-500">💌 형님 우체통 (오늘의 편지)</p>
        <p className="text-lg font-bold">{letter ? `“${letter}”` : "편지 오는 중..."}</p>
        {mission && (
          <div className="mt-2 rounded-2xl bg-white p-3">
            <p className="font-black">🎯 오늘 미션: {mission}</p>
            <button
              type="button"
              onClick={claimMission}
              disabled={missionDone}
              className="mt-2 w-full rounded-2xl bg-emerald-400 px-4 py-2 text-lg font-black disabled:opacity-50"
            >
              {missionDone ? "✅ 오늘 완료! (+5 XP)" : "했어요! (+5 XP)"}
            </button>
          </div>
        )}
      </div>

      <Link href={`/jobs/${daily.code}`} className="animate-floaty block rounded-3xl bg-violet-300 p-5 text-center shadow-lg">
        <p className="font-black text-stone-600">📅 오늘의 직업</p>
        <p className="text-3xl font-black">{daily.emoji} {daily.name}</p>
        <p className="font-bold">{daily.easy3[0]}</p>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/town"
          className="animate-wiggle rounded-3xl bg-emerald-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          🗺️ {me.dong} 탐험!
          <span className="block text-base font-bold">비밀을 찾아봐</span>
        </Link>
        <Link
          href="/jobs"
          className="rounded-3xl bg-sky-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          💼 {me.nickname} 변신!
          <span className="block text-base font-bold">직업 100개 도감</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/games" className="rounded-3xl bg-violet-300 p-6 text-center text-xl font-black shadow">
          🎮 게임 놀이터
        </Link>
        <Link href="/games?tab=quiz" className="rounded-3xl bg-yellow-300 p-6 text-center text-xl font-black shadow">
          🎯 오늘의 퀴즈
        </Link>
        <Link href="/mybox" className="rounded-3xl bg-pink-300 p-6 text-center text-xl font-black shadow">
          🎒 {me.nickname} 수집함
        </Link>
        <Link href="/jobs/dream" className="rounded-3xl bg-rose-200 p-6 text-center text-xl font-black shadow">
          🌟 꿈 발표장
        </Link>
      </div>
    </div>
  );
}
