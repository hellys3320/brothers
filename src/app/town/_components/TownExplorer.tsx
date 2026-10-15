"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MOCK_TOWN, type FacilityKind, type TownFacility } from "@/lib/mock";
import { fetchRealFacilities, loadCached, saveCached, type RealSource, type RealDebug, type ProgressStep } from "@/lib/realTown";
import { loadMe, type MeProfile } from "@/lib/me";
import { speak } from "@/lib/speak";

const TownMap = dynamic(() => import("./TownMap"), {
  ssr: false,
  loading: () => <p className="rounded-3xl bg-white p-6 text-xl font-black">🗺️ 지도를 준비중...</p>,
});

const KIND_COLOR: Record<FacilityKind, string> = {
  도서관: "bg-sky-200",
  공원: "bg-green-200",
  학교: "bg-indigo-200",
  빵집: "bg-amber-200",
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

function initPlaces(): { list: TownFacility[]; real: boolean; profile: MeProfile | null } {
  if (typeof window === "undefined") return { list: MOCK_TOWN, real: false, profile: null };
  const profile = loadMe();
  if (!profile) return { list: MOCK_TOWN, real: false, profile };
  const cached = loadCached(profile.lat, profile.lng);
  if (cached) return { list: cached, real: true, profile };
  return { list: MOCK_TOWN, real: false, profile };
}

export default function TownExplorer() {
  const [init] = useState(initPlaces);
  const me = init.profile;
  const [places, setPlaces] = useState<TownFacility[]>(init.list);
  const [realMode, setRealMode] = useState<RealSource | null>(() => (init.real ? "overpass" : null));
  const [searching, setSearching] = useState(() => !init.real && init.profile !== null);
  const [failed, setFailed] = useState(false);
  const [debug, setDebug] = useState<RealDebug | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([]);

  const STEP_LABEL: Record<ProgressStep["source"], string> = {
    kakao: "카카오 지도",
    seoul: "서울시 데이터",
    overpass: "세계 지도",
    nominatim: "이름 찾기",
  };

  function runSearch() {
    if (!me) return;
    setFailed(false);
    setSearching(true);
    setSteps([]);
    fetchRealFacilities(
      me.lat,
      me.lng,
      me.dong,
      (s) => setSteps((prev) => [...prev.filter((p) => p.source !== s.source), s])
    )
      .then((r) => {
        if (r) {
          setPlaces(r.items);
          setRealMode(r.via);
          setDebug(r.debug);
          saveCached(me.lat, me.lng, r.items);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setSearching(false));
  }

  function retry() {
    runSearch();
  }

  const [found, setFound] = useState<string[]>(loadStamps);
  const [listMode, setListMode] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);

  // 내 동네면 진짜 장소로 교체 (캐시 우선, miss면 네트워크)
  useEffect(() => {
    if (!me || realMode) return;
    let live = true;
    fetchRealFacilities(me.lat, me.lng, me.dong, (s) => {
      if (live) setSteps((prev) => [...prev.filter((p) => p.source !== s.source), s]);
    })
      .then((r) => {
        if (!live) return;
        if (r) {
          setPlaces(r.items);
          setRealMode(r.via);
          setDebug(r.debug);
          saveCached(me.lat, me.lng, r.items);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setSearching(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function discover(id: string) {
    const f = places.find((x) => x.id === id);
    if (!f || found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    try {
      localStorage.setItem("brothers-stamps", JSON.stringify(next));
    } catch {}
    speak(`${f.name}. ${f.easy} 스탬프를 받았다!`);
    setCheer(`${f.stamp} 찾았다!`);
    setTimeout(() => setCheer(null), 1500);
    const gotNow = next.filter((n) => places.some((p) => p.id === n)).length;
    if (gotNow >= places.length) {
      setTimeout(() => speak("우와! 비밀을 다 찾았어! 너는 진짜 동네박사야!"), 1600);
    }
  }

  const gotCount = found.filter((n) => places.some((p) => p.id === n)).length;
  const center = me ? { lat: me.lat, lng: me.lng, dong: me.dong } : { lat: 37.5668, lng: 126.9785, dong: "햇살동" };

  return (
    <div className="relative flex flex-col gap-4">
      {cheer && (
        <div className="animate-pop pointer-events-none fixed inset-x-0 top-24 z-20 mx-auto w-fit rounded-full bg-amber-400 px-8 py-4 text-3xl font-black shadow-xl">
          🎉 {cheer}
        </div>
      )}
      <div className="rounded-2xl bg-white p-3 shadow">
        <p className="mb-1 text-xl font-black">
          찾은 비밀 {gotCount} / {places.length}개 🎉
          {realMode ? (
            <span className="ml-2 text-base text-emerald-700">
              {realMode === "nominatim" ? "진짜 장소(간이)!" : "진짜 장소!"}
            </span>
          ) : (
            <span className="ml-2 text-base text-stone-400">연습 장소</span>
          )}
        </p>
        <div className="h-5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all"
            style={{ width: `${places.length ? (gotCount / places.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={retry}
          disabled={searching}
          className="rounded-full bg-white px-5 py-2 font-black shadow disabled:opacity-50"
        >
          🔄 새로 찾기
        </button>
        <button
          type="button"
          onClick={() => setListMode((v) => !v)}
          className="rounded-full bg-white px-5 py-2 font-black shadow"
        >
          {listMode ? "🗺️ 지도로 보기" : "📋 목록으로 보기"}
        </button>
      </div>
      {debug && (
        <p className="text-center text-xs font-bold text-stone-400">
          형님 점검: 카카오 {debug.kakao} · 서울 {debug.seoul} · OSM {debug.overpass} · 이름 {debug.nominatim}
        </p>
      )}

      {searching && (
        <div className="animate-pop rounded-3xl bg-white p-5 shadow">
          <p className="text-center text-xl font-black">🔍 {center.dong}의 진짜 장소를 찾는 중... ({steps.length}/4)</p>
          <div className="mt-2 h-5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
              style={{ width: `${(steps.length / 4) * 100}%` }}
            />
          </div>
          <ul className="mt-2 font-bold">
            {(["kakao", "seoul", "overpass", "nominatim"] as const).map((k) => {
              const s = steps.find((p) => p.source === k);
              return (
                <li key={k}>
                  {s ? (s.count >= 0 ? `✅ ${STEP_LABEL[k]}에서 ${s.count}개!` : `➖ ${STEP_LABEL[k]} 건너뜀`) : `⏳ ${STEP_LABEL[k]} 찾는 중...`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {listMode ? null : <TownMap found={found} onDiscover={discover} facilities={places} center={center} />}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {places.map((f) => {
          const got = found.includes(f.id);
          return (
            <li
              key={f.id}
              className={`animate-pop rounded-3xl border-4 p-5 shadow ${got ? "border-green-500 bg-green-50" : "border-white bg-white"}`}
            >
              <span className={`inline-block rounded-full px-3 py-1 font-black ${KIND_COLOR[f.kind]}`}>
                {f.stamp} {f.kind}
              </span>
              <h3 className="mt-2 text-2xl font-black">{f.name}</h3>
              <p className="font-bold text-stone-700">{f.easy}</p>
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
      {!realMode && me && !searching && (
        <div className="rounded-2xl bg-white p-4 text-center shadow">
          <p className="font-bold text-stone-500">
            {failed
              ? "진짜 장소를 못 가져왔어. 인터넷이 막혔거나 지도에 등록된 곳이 없어!"
              : "연습 장소를 보여주는 중이야."}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 rounded-full bg-emerald-400 px-6 py-2 font-black shadow"
          >
            🔄 진짜 장소 다시 찾기
          </button>
        </div>
      )}
    </div>
  );
}
