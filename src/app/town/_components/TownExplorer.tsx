"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MapApi } from "./TownMap";
import TownMapLazy from "./TownMapLazy";
import { MOCK_TOWN, type FacilityKind, type TownFacility } from "@/lib/mock";
import { fetchRealFacilities, fetchMorePlaces, loadCached, saveCached, dirWord, distM, walkInfo, type RealSource, type RealDebug, type ProgressStep } from "@/lib/realTown";
import { addXP } from "@/lib/xp";
import { logStamp } from "@/lib/stamps";
import { todayQuest, saveQuest, type TownQuest } from "@/lib/quest";
import { loadMe, type MeProfile } from "@/lib/me";
import { speak } from "@/lib/speak";
import { addTreasure, loadTreasures, saveTreasures, tryFindTreasure, type Treasure } from "@/lib/treasures";
import { addJobVisit, awardJobCard, jobMissionReady } from "@/lib/jobMission";

const KIND_COLOR: Record<FacilityKind, string> = {
  도서관: "bg-sky-200",
  공원: "bg-green-200",
  학교: "bg-indigo-200",
  빵집: "bg-amber-200",
  간식: "bg-rose-200",
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
  const searchParams = useSearchParams();
  const focus = {
    lat: Number(searchParams.get("lat")),
    lng: Number(searchParams.get("lng")),
    name: searchParams.get("name") ?? "",
  };
  const hasFocus = isFinite(focus.lat) && isFinite(focus.lng) && focus.name !== "";
  const [init] = useState(initPlaces);
  const me = init.profile;
  const [places, setPlaces] = useState<TownFacility[]>(init.list);
  // 직업 도감에서 넘어온 장소(?lat&lng&name&kind...)는 지도·목록에 '진짜 탐험 핀'으로 합친다
  const focusKindRaw = searchParams.get("kind") ?? "";
  const focusKind: FacilityKind = (Object.keys(KIND_COLOR) as FacilityKind[]).includes(focusKindRaw as FacilityKind)
    ? (focusKindRaw as FacilityKind)
    : "간식";
  const focusPlaceId = hasFocus ? `job-${focus.lat.toFixed(5)}-${focus.lng.toFixed(5)}` : "";
  const focusFacility: TownFacility | null = hasFocus
    ? {
        id: focusPlaceId,
        name: focus.name,
        kind: focusKind,
        dong: me?.dong ?? "",
        easy: searchParams.get("easy") || "직업 도감에서 찾은 장소!",
        stamp: searchParams.get("stamp") || "📍",
        label: searchParams.get("label") || undefined,
        safeLevel: "초록",
        lat: focus.lat,
        lng: focus.lng,
      }
    : null;
  // 같은 이름의 동네 장소가 이미 있으면 중복 핀을 만들지 않는다
  const allPlaces: TownFacility[] = focusFacility
    ? [focusFacility, ...places.filter((p) => p.id !== focusFacility.id && p.name !== focusFacility.name)]
    : places;
  // 직업카드 미션: 어느 직업의 장소인지, 몇 곳을 채워야 하는지
  const focusJob = searchParams.get("job") ?? "";
  const focusJobName = searchParams.get("jobName") ?? "";
  const focusNeed = Number(searchParams.get("need") ?? "0") || 0;
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

  function moreSecrets() {
    if (!me || loadingMore) return;
    setLoadingMore(true);
    setMoreEmpty(false);
    setSearching(true);
    setSteps([]);
    const exclude = [...places.map((p) => p.id), ...found];
    fetchMorePlaces(me.lat, me.lng, me.dong, exclude, (s) =>
      setSteps((prev) => [...prev.filter((p) => p.source !== s.source), s])
    )
      .then((r) => {
        if (r && r.length > 0) {
          const next = [...places, ...r];
          setPlaces(next);
          setDebug((d) => (d ? { ...d } : d));
          saveCached(me.lat, me.lng, next);
          speak(`새 비밀 ${r.length}개 추가!`);
        } else {
          setMoreEmpty(true);
        }
      })
      .catch(() => setMoreEmpty(true))
      .finally(() => {
        setSearching(false);
        setLoadingMore(false);
      });
  }

  const [found, setFound] = useState<string[]>(loadStamps);
  const [listMode, setListMode] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const [treasureFind, setTreasureFind] = useState<Treasure | null>(null);
  const [travel, setTravel] = useState<TownFacility | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreEmpty, setMoreEmpty] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(() => focusPlaceId || null);
  const [questView, setQuestView] = useState<TownQuest | null>(() => todayQuest());
  const mapApi = useRef<MapApi | null>(null);

  // URL의 직업 장소가 바뀌면 지도도 그 장소로 다시 포커스한다.
  // (처음 렌더에서 searchParams가 비어 있어도, 값이 들어오는 순간 별표 핀으로 이동)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (focusPlaceId) setFocusId(focusPlaceId);
  }, [focusPlaceId]);

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

  function focusCard(id: string) {
    if (listMode) setListMode(false);
    setFocusId(id);
    // 지도가 켜지길 기다렸다가 스크롤 + 포커싱
    setTimeout(() => {
      document.getElementById("town-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      mapApi.current?.focusPlace(id);
    }, 700);
  }

  function goHome() {
    if (listMode) setListMode(false);
    setTimeout(() => {
      document.getElementById("town-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      mapApi.current?.goHome();
    }, 700);
  }

  function discover(id: string) {
    const f = allPlaces.find((x) => x.id === id);
    if (!f || found.includes(id) || travel) return;
    // 목록모드면 지도를 켜야 형님이 걸어갈 수 있음
    if (listMode) setListMode(false);
    document.getElementById("town-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
    // 바로 도장 대신 형님이 걸어감 (도착하면 onArrive에서 도장)
    setTravel(f);
    const meters = Math.round(distM(center.lat, center.lng, f.lat, f.lng));
    speak(`출발! ${dirWord(center.lat, center.lng, f.lat, f.lng)}으로 ${walkInfo(meters)}! 따라와!`);
  }

  function onArrive(id: string) {
    const f = allPlaces.find((x) => x.id === id);
    setTravel(null);
    if (!f) return;
    // 직업 상세에서 이어진 장소면 카드 미션 방문으로 기록
    const jobHit = !!focusJob && !!focusFacility && id === focusFacility.id;
    let jobCount = 0;
    let cardWon = false;
    if (jobHit) {
      jobCount = addJobVisit(focusJob, f.id).length;
      if (
        focusNeed > 0 &&
        jobCount >= focusNeed &&
        jobMissionReady(focusJob, focusNeed) &&
        awardJobCard(focusJob)
      ) {
        addXP(10, `${focusJobName || "직업"} 카드 획득!`);
        cardWon = true;
      }
    }
    if (found.includes(id)) {
      if (cardWon) {
        setCheer(`🎴 ${focusJobName || "직업"} 카드 획득!`);
        setTimeout(() => setCheer(null), 2200);
        speak(`직업카드 획득! ${focusJobName || "직업"}! 수집함에서 확인해봐!`);
      }
      return;
    }
    const next = [...found, id];
    setFound(next);
    try {
      localStorage.setItem("brothers-stamps", JSON.stringify(next));
    } catch {}
    addXP(10, `${f.name} 발견!`);
    logStamp(id, f.name, f.stamp, f.dong);
    // 퀴즈 동네 미션 보너스 (오늘 발급 + 해당 종류 첫 발견)
    try {
      const q0 = todayQuest();
      if (q0 && q0.kinds.includes(f.kind)) {
        q0.done = true;
        saveQuest(q0);
        setQuestView(null);
        addXP(5, "동네 미션 완료!");
        setTimeout(() => speak("보너스! 동네 미션 완료! 5 XP 더 받았다!"), 2500);
      }
    } catch {}
    // 보물 랜덤 발견! (처음엔 꼭 하나, 이후 55%)
    try {
      const inv = loadTreasures();
      const t = tryFindTreasure(inv);
      if (t) {
        saveTreasures(addTreasure(inv, t.id));
        setTreasureFind(t);
        addXP(3, `보물 '${t.name}' 발견!`);
        setTimeout(() => setTreasureFind(null), 3000);
        setTimeout(() => speak(`보물 발견! ${t.name}! 수집함에서 카드에 꽂아봐!`), 3200);
      }
    } catch {}
    const gotNow = next.filter((n) => places.some((p) => p.id === n)).length;
    const jobMsg = jobHit ? ` 직업카드 미션 장소 ${jobCount}곳째!` : "";
    speak(
      `${f.name} 도착! ${f.easy} 스탬프를 받았다! 수집함에 저장됐다!${jobMsg}${cardWon ? " 직업카드 획득!" : ""}`
    );
    setCheer(
      cardWon
        ? `🎴 ${focusJobName || "직업"} 카드 획득!`
        : `${f.stamp} ${f.name} 찾았다! (${gotNow}/${places.length})`
    );
    setTimeout(() => setCheer(null), 2200);
    if (gotNow >= places.length) {
      setTimeout(() => speak("우와! 비밀을 다 찾았어! 너는 진짜 동네박사야! 수집함에서 기록표를 인쇄해봐!"), 2300);
    }
  }

  const gotCount = found.filter((n) => places.some((p) => p.id === n)).length;
  const center = me ? { lat: me.lat, lng: me.lng, dong: me.dong } : { lat: 37.5668, lng: 126.9785, dong: "햇살동" };

  return (
    <div className="relative flex flex-col gap-4">
      {cheer && (
        <div className="animate-pop pointer-events-none fixed inset-x-0 top-24 z-40 mx-auto w-fit rounded-full bg-amber-400 px-8 py-4 text-3xl font-black shadow-xl">
          🎉 {cheer}
        </div>
      )}
      {treasureFind && (
        <div className="animate-pop pointer-events-none fixed inset-x-0 top-40 z-40 mx-auto w-fit rounded-3xl bg-gradient-to-r from-amber-300 to-yellow-400 px-6 py-4 text-center shadow-xl">
          <p className="text-xl font-black">✨ 보물 발견! ✨</p>
          <p className="text-2xl font-black">
            {treasureFind.emoji} {treasureFind.name}
          </p>
          <p className="text-sm font-black text-stone-700">
            {treasureFind.stat} +{treasureFind.bonus} 강화! 수집함에서 카드에 꽂아봐!
          </p>
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
        <p className="mt-1 text-sm font-bold text-stone-500">핀을 누르면 스탬프가 수집함에 저장돼!</p>
        <p className="mt-1 text-sm font-bold text-amber-700">
          💎 보물 힌트: 새 장소에 도착하면 55% 확률! 처음엔 꼭 1개, 전설은 10%!
        </p>
      </div>
      {questView && (
        <div className="animate-pop rounded-3xl bg-gradient-to-r from-emerald-300 to-sky-300 p-4 text-center shadow">
          <p className="text-xl font-black">🔍 오늘 미션: {questView.kinds.join("·")} 핀 찾기! (+5 XP)</p>
        </div>
      )}
      {places.length > 0 && gotCount >= places.length && (
        <div className="animate-pop rounded-3xl bg-gradient-to-r from-amber-300 to-pink-300 p-5 text-center shadow-lg">
          <p className="text-3xl font-black">🏆 다 찾았다! {center.dong} 박사!</p>
          <Link
            href="/mybox"
            className="mt-2 block rounded-2xl bg-white px-4 py-3 text-xl font-black shadow"
          >
            🎒 수집함에서 기록표 인쇄하기
          </Link>
          <button
            type="button"
            onClick={moreSecrets}
            disabled={searching || loadingMore}
            className="mt-2 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-xl font-black shadow disabled:opacity-50"
          >
            {loadingMore ? "🔍 더 넓게 찾는 중..." : "🆕 새 비밀 찾기! (더 넓게)"}
          </button>
          {moreEmpty && <p className="mt-2 font-black">주변을 다 뒤졌어! 너 진짜 대단하다! 🎉</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={goHome}
          className="rounded-full bg-white px-5 py-2 font-black shadow"
        >
          🏠 우리집
        </button>
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

      {listMode ? null : (
        <TownMapLazy
          found={found}
          onDiscover={discover}
          facilities={allPlaces}
          center={center}
          expedition={travel ? { lat: travel.lat, lng: travel.lng, id: travel.id } : null}
          onArrive={onArrive}
          focusPlaceId={focusId}
          onFocusDone={() => setFocusId(null)}
          mapApiRef={mapApi}
        />
      )}
      {hasFocus && (
        <p className="animate-pop rounded-2xl bg-violet-200 p-4 text-center text-xl font-black">
          ⭐ {focus.name} 여기야! 지도 핀을 누르거나 아래 목록에서 탐험을 시작해봐!
        </p>
      )}
      {travel && (
        <p className="animate-floaty rounded-2xl bg-sky-200 p-4 text-center text-xl font-black">
          탐험가가 {travel.name}으로 가는 중... 따라와!
        </p>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...allPlaces]
          .sort((a, b) => Number(found.includes(a.id)) - Number(found.includes(b.id)))
          .map((f) => {
          const got = found.includes(f.id);
          const meters = Math.round(distM(center.lat, center.lng, f.lat, f.lng));
          const hint = `🧭 ${dirWord(center.lat, center.lng, f.lat, f.lng)}으로 ${walkInfo(meters)}!`;
          const going = travel?.id === f.id;
          return (
            <li
              key={f.id}
              className={`animate-pop rounded-3xl border-4 p-5 shadow ${got ? "border-green-500 bg-green-50" : "border-white bg-white"}`}
            >
              <span className={`inline-block rounded-full px-3 py-1 font-black ${KIND_COLOR[f.kind]}`}>
                {f.stamp} {f.label ?? f.kind}
              </span>
              <button
                type="button"
                onClick={() => focusCard(f.id)}
                className="mt-2 block w-full text-left text-2xl font-black hover:underline"
                aria-label={`${f.name} 지도에서 보기`}
              >
                {f.name} <span className="text-base text-sky-700">🗺️</span>
              </button>
              <p className="font-bold text-stone-700">{f.easy}</p>
              {!got && <p className="mt-1 font-black text-sky-700">{hint}</p>}
              <button
                type="button"
                onClick={() => discover(f.id)}
                disabled={got || !!travel}
                className="mt-3 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-xl font-black shadow active:translate-y-0.5 disabled:opacity-60"
              >
                {got ? "✅ 찾았다!" : going ? "🚶 가는 중..." : "🔍 탐험 출발!"}
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
