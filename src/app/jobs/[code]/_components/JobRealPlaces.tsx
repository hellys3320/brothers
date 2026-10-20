"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPlacesForJob, type JobPlace } from "@/lib/realTown";
import { MOCK_JOBS } from "@/lib/mock";
import { loadMe, type MeProfile } from "@/lib/me";
import { addXP } from "@/lib/xp";
import { speak } from "@/lib/speak";
import { loadMissions } from "@/lib/missions";
import {
  JOB_MISSION_COUNT,
  JOB_PLACE_NEED,
  awardJobCard,
  hasJobCard,
  visitsFor,
} from "@/lib/jobMission";

export default function JobRealPlaces({ jobCode, jobName }: { jobCode: string; jobName: string }) {
  // 첫 렌더는 서버와 똑같이 두고, 마운트 후에만 localStorage를 읽는다 (hydration mismatch 방지)
  const [me, setMe] = useState<MeProfile | null>(null);
  const [places, setPlaces] = useState<JobPlace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [missions, setMissions] = useState<boolean[]>([false, false, false]);
  const [visits, setVisits] = useState<string[]>([]);
  const [owned, setOwned] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const profile = loadMe();
    setMe(profile);
    setPlaces(null);
    setLoading(false);
    setPlacesLoaded(!profile);
    setMissions(loadMissions(jobCode));
    setVisits(visitsFor(jobCode));
    setOwned(hasJobCard(jobCode));
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [jobCode]);

  useEffect(() => {
    if (!me) return;
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setPlacesLoaded(false);
    fetchPlacesForJob(jobCode, me.lat, me.lng, me.dong)
      .then((r) => {
        if (live) setPlaces(r);
      })
      .catch(() => {})
      .finally(() => {
        if (live) {
          setLoading(false);
          setPlacesLoaded(true);
        }
      });
    return () => {
      live = false;
    };
  }, [jobCode, me]);

  // 미션 체크 / 지도 방문 후 돌아오면 진행도를 다시 읽는다
  useEffect(() => {
    const sync = () => {
      setMissions(loadMissions(jobCode));
      setVisits(visitsFor(jobCode));
      setOwned(hasJobCard(jobCode));
    };
    window.addEventListener("brothers:missions", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("brothers:missions", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [jobCode]);

  const hint = MOCK_JOBS.find((j) => j.code === jobCode)?.spot ?? "관련 장소";
  const missionCount = missions.filter(Boolean).length;
  const missionDone = missionCount >= JOB_MISSION_COUNT;
  // 장소가 2곳 미만이면 있는 만큼만 요구 (아예 없으면 체험 미션만)
  const needPlaces = !placesLoaded
    ? JOB_PLACE_NEED
    : places && places.length > 0
      ? Math.min(JOB_PLACE_NEED, places.length)
      : 0;
  const placesDone = placesLoaded && visits.length >= needPlaces;
  const ready = mounted && placesLoaded && !loading && missionDone && placesDone;

  useEffect(() => {
    if (!ready || owned) return;
    const won = awardJobCard(jobCode);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwned(true);
    if (won) {
      addXP(10, `${jobName} 카드 획득!`);
      speak(`직업카드 획득! ${jobName}! 수집함에서 확인해봐!`);
    }
  }, [ready, owned, jobCode, jobName]);

  const placeStatus = !mounted || (me && !placesLoaded)
    ? "⏳ 관련 장소 확인 중..."
    : !me
      ? "➖ 동네를 정하면 관련 장소 미션도 생겨!"
      : needPlaces === 0
        ? "➖ 관련 장소 없음 · 체험 미션만 하면 돼!"
        : `${placesDone ? "✅" : "⬜"} 관련 장소 ${needPlaces}곳 방문 (${Math.min(visits.length, needPlaces)}/${needPlaces})`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🎴 직업카드 획득 미션</h2>
        <ul className="mt-2 flex flex-col gap-1 text-lg font-bold">
          <li className={missionDone ? "text-emerald-700" : ""}>
            {`${missionDone ? "✅" : "⬜"} 1일 체험 미션 3개 (${Math.min(missionCount, JOB_MISSION_COUNT)}/${JOB_MISSION_COUNT})`}
          </li>
          <li className={placesDone ? "text-emerald-700" : ""}>{placeStatus}</li>
        </ul>
        {owned ? (
          <p className="mt-2 text-xl font-black text-emerald-700">✅ 카드 보유 중! 수집함에서 확인해봐!</p>
        ) : ready ? (
          <p className="mt-2 text-xl font-black text-amber-600">🎉 미션 완료! 카드를 받는 중...</p>
        ) : (
          <p className="mt-2 font-bold text-stone-500">
            두 미션을 모두 끝내면 직업카드가 생겨!{" "}
            {mounted && needPlaces > 0 && <span className="text-violet-700">아래 장소로 지도 탐험을 떠나봐!</span>}
          </p>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">
          🏪 {me?.dong ?? "우리동네"}의 {hint} ({places ? places.length : 0}곳)
        </h2>
        {!mounted ? (
          <p className="mt-2 text-xl font-black">🔍 우리동네 장소를 확인하는 중...</p>
        ) : !me ? (
          <div className="mt-2 text-center">
            <p className="text-xl font-black">먼저 우리동네를 알려줘!</p>
            <p className="font-bold text-stone-500">동네를 정하면 진짜 장소를 찾아줄게.</p>
            <Link href="/" className="mt-3 block rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black">
              이름·동네 정하기
            </Link>
          </div>
        ) : loading ? (
          <p className="mt-2 text-xl font-black">🔍 우리동네 {hint} 찾는 중...</p>
        ) : !places ? (
          <p className="mt-2 font-bold text-stone-500">
            지도에 등록된 {hint}가 없어. {jobName} 이야기는 카드에서 읽어봐!
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {places.map((s) => {
              const params = new URLSearchParams({
                lat: String(s.lat),
                lng: String(s.lng),
                name: s.name,
                kind: s.kind ?? "간식",
                stamp: s.stamp ?? "📍",
                easy: s.easy,
                label: hint,
                job: jobCode,
                jobName,
                need: String(Math.min(JOB_PLACE_NEED, places.length)),
              });
              return (
                <li key={s.id} className="animate-pop rounded-2xl bg-emerald-50 px-4 py-3">
                  <p className="text-xl font-black">{s.name}</p>
                  <p className="font-bold text-stone-600">{s.easy}</p>
                  <Link
                    href={`/town?${params.toString()}`}
                    className="mt-2 block rounded-2xl bg-emerald-300 px-4 py-2 text-center font-black"
                  >
                    🗺️ 지도에서 탐험하기
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <Link href="/town" className="flex-1 rounded-2xl bg-emerald-300 px-4 py-3 text-center text-lg font-black">
            동네 탐험하기
          </Link>
          <Link href="/games?tab=quiz" className="flex-1 rounded-2xl bg-yellow-200 px-4 py-3 text-center text-lg font-black">
            오늘의 퀴즈
          </Link>
        </div>
      </div>
    </div>
  );
}
