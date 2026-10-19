// 진짜 동네 장소 가져오기 (키 없음)
// Overpass(구조 검색) + Nominatim(이름 검색)을 합침. 하나라도 있으면 표시.
// 전부 실패하면 null → 호출 쪽에서 연습 장소로 폴백
import type { TownFacility } from "./mock";
import { loadMe } from "./me";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export type RealSource = "overpass" | "seoul" | "kakao" | "nominatim";

// fetch 시간제한 (무응답 서버에 화면이 멈추지 않게)
async function fetchTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchViaKakao(lat: number, lng: number, dong: string): Promise<TownFacility[]> {
  try {
    const res = await fetchTimeout(`/api/places/kakao?lat=${lat}&lng=${lng}&dong=${encodeURIComponent(dong)}`, {}, 25000);
    if (!res.ok) return [];
    const j = (await res.json()) as {
      ok: boolean;
      items?: Array<{ id: string; name: string; kind: TownFacility["kind"]; stamp: string; easy: string; lat: number; lng: number }>;
    };
    if (!j.ok || !Array.isArray(j.items)) return [];
    return j.items.map((i) => ({ ...i, dong, safeLevel: "초록" as const }));
  } catch {
    return [];
  }
}

async function fetchViaSeoul(lat: number, lng: number, dong: string): Promise<TownFacility[]> {
  try {
    const res = await fetchTimeout(`/api/places/seoul?lat=${lat}&lng=${lng}`, {}, 25000);
    if (!res.ok) return [];
    const j = (await res.json()) as {
      ok: boolean;
      items?: Array<{ id: string; name: string; kind: TownFacility["kind"]; stamp: string; easy: string; lat: number; lng: number }>;
    };
    if (!j.ok || !Array.isArray(j.items)) return [];
    return j.items.map((i) => ({ ...i, dong, safeLevel: "초록" as const }));
  } catch {
    return [];
  }
}

async function fetchOverpass(q: string): Promise<Response | null> {
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetchTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(q),
        },
        10000
      );
      if (res.ok) return res;
    } catch {
      // 다음 미러로
    }
  }
  return null;
}

function cacheKey(lat: number, lng: number) {
  return `brothers-poi-v7-${lat.toFixed(3)}-${lng.toFixed(3)}`;
}

export function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function walkText(meters: number) {
  return meters < 150 ? "바로 앞!" : `약 ${Math.round(meters / 100) * 100}m!`;
}

// 어린이 걸음 기준 대략 분당 70m (신호 대기 조금 포함)
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 70));
}

export function distText(meters: number): string {
  if (meters < 120) return "바로 앞";
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// "320m · 걸어서 약 5분" 처럼 거리와 도보시간을 함께
export function walkInfo(meters: number): string {
  if (meters < 120) return "바로 앞";
  return `${distText(meters)} · 걸어서 약 ${walkMinutes(meters)}분`;
}

// 중심에서 보면 어느 쪽인지 (보물찾기 힌트용)
export function dirWord(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const dirs = ["북쪽", "북동쪽", "동쪽", "남동쪽", "남쪽", "남서쪽", "서쪽", "북서쪽"];
  const theta = (Math.atan2((lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180), lat2 - lat1) * 180) / Math.PI;
  return dirs[Math.round(((theta + 360) % 360) / 45) % 8];
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function kindOf(tags: Record<string, string>): TownFacility["kind"] | null {
  if (tags.amenity === "library") return "도서관";
  if (tags.leisure === "park" || tags.leisure === "playground") return "공원";
  if (tags.amenity === "school" || tags.amenity === "kindergarten") return "학교";
  if (tags.shop === "bakery" || tags.craft === "bakery") return "빵집";
  if (tags.shop === "ice_cream" || tags.shop === "confectionery") return "간식";
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "pharmacy") return "병원";
  if (tags.amenity === "police" || tags.amenity === "fire_station") return "안전지킴이집";
  return null;
}

function stampOf(tags: Record<string, string>): string {
  if (tags.leisure === "playground") return "🛝";
  if (tags.shop === "ice_cream" || tags.shop === "confectionery") return "🍦";
  if (tags.shop === "bakery" || tags.craft === "bakery") return "🍞";
  if (tags.amenity === "kindergarten") return "🧸";
  if (tags.amenity === "school") return "🏫";
  if (tags.amenity === "pharmacy") return "💊";
  if (tags.amenity === "police" || tags.amenity === "fire_station") return "🛟";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "🏥";
  if (tags.leisure === "park") return "🌳";
  return "📚";
}

function easyOf(kind: TownFacility["kind"], meters: number): string {
  const walk = walkText(meters);
  switch (kind) {
    case "도서관":
      return `진짜 도서관! 책 빌리러 가봐. ${walk}`;
    case "공원":
      return `진짜 공원! 뛰어놀기 좋아. ${walk}`;
    case "학교":
      return `진짜 학교! 친구들이 다녀. ${walk}`;
    case "빵집":
      return `진짜 빵집! 고소한 냄새~ ${walk}`;
    case "간식":
      return `시원달콤 간식 가게! ${walk}`;
    case "병원":
      return `아프면 가는 곳이야. ${walk}`;
    case "안전지킴이집":
      return `위험할 때 도와주는 곳이야. ${walk}`;
    default:
      return walk;
  }
}

const CAP: Record<TownFacility["kind"], number> = {
  도서관: 3,
  공원: 3,
  학교: 2,
  빵집: 2,
  간식: 2,
  병원: 2,
  안전지킴이집: 2,
  주의길: 0,
};

function applyCaps(lat: number, lng: number, items: TownFacility[], mult = 1): TownFacility[] {
  const out: TownFacility[] = [];
  for (const kind of ["도서관", "공원", "학교", "빵집", "간식", "병원", "안전지킴이집"] as const) {
    out.push(
      ...items
        .filter((i) => i.kind === kind)
        .sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng))
        .slice(0, CAP[kind] * mult)
    );
  }
  return out;
}

async function viaOverpass(lat: number, lng: number, dong: string, radius = 3500): Promise<TownFacility[]> {
  // 한 번에 조회 (반경 나눠서 여러 번 물으면 느려서 멈춘 것처럼 보임)
  const r = radius;
  const q = `
[out:json][timeout:25];
(
  nwr["amenity"="library"](around:${r},${lat},${lng});
  nwr["leisure"="park"](around:${r},${lat},${lng});
  nwr["leisure"="playground"](around:${r},${lat},${lng});
  nwr["amenity"~"^(school|kindergarten)$"](around:${r},${lat},${lng});
  nwr["shop"="bakery"](around:${r},${lat},${lng});
  nwr["craft"="bakery"](around:${r},${lat},${lng});
  nwr["shop"~"^(ice_cream|confectionery)$"](around:${r},${lat},${lng});
  nwr["amenity"~"^(hospital|clinic|pharmacy)$"](around:${r},${lat},${lng});
  nwr["amenity"~"^(police|fire_station)$"](around:${r},${lat},${lng});
);
out center 80;`.trim();
  const merged = new Map<string, TownFacility>();
  try {
    const res = await fetchOverpass(q);
    if (!res) return [];
    const json = (await res.json()) as { elements?: OverpassEl[] };
    for (const el of json.elements ?? []) {
      const tags = el.tags ?? {};
      const name = tags["name:ko"] ?? tags.name;
      if (!name) continue;
      const kind = kindOf(tags);
      if (!kind) continue;
      const key = `${kind}:${name}`;
      if (merged.has(key)) continue;
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      if (plat == null || plng == null) continue;
      merged.set(key, {
        id: `osm-${el.type}-${el.id}`,
        name,
        kind,
        dong,
        easy: easyOf(kind, distM(lat, lng, plat, plng)),
        stamp: stampOf(tags),
        safeLevel: "초록",
        lat: plat,
        lng: plng,
      });
    }
  } catch {
    return [...merged.values()];
  }
  return [...merged.values()];
}

interface NominatimEl {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

async function viaNominatim(lat: number, lng: number, dong: string, boxD = 0.027): Promise<TownFacility[]> {
  // 이름 없는 점(빵집이 그냥 "빵집"으로 등록된 경우)은 애들 눈에 가짜처럼 보여서 제외
  const GENERIC = new Set(["도서관", "공원", "학교", "빵집", "병원", "약국", "소방서", "경찰서", "편의점", "놀이터"]);
  const kinds: Array<[string, TownFacility["kind"], string]> = [
    ["도서관", "도서관", "📚"],
    ["공원", "공원", "🌳"],
    ["학교", "학교", "🏫"],
    ["빵집", "빵집", "🍞"],
    ["아이스크림", "간식", "🍦"],
    ["병원", "병원", "🏥"],
    ["소방서", "안전지킴이집", "🛟"],
    ["경찰서", "안전지킴이집", "🛟"],
  ];
  const out: TownFacility[] = [];
  const push = (nm: string, kind: TownFacility["kind"], stamp: string, plat: number, plng: number): boolean => {
    if (!nm || GENERIC.has(nm) || out.some((o) => o.name === nm)) return false;
    out.push({
      id: `nom-${kind}-${nm}-${plat.toFixed(4)}`,
      name: nm,
      kind,
      dong,
      easy: `지도에서 찾은 진짜 ${kind}! ${walkText(distM(lat, lng, plat, plng))}`,
      stamp,
      safeLevel: "초록",
      lat: plat,
      lng: plng,
    });
    return true;
  };
  await Promise.all(
    kinds.map(async ([kw, kind, stamp]) => {
      try {
        const res = await fetchTimeout(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=4&q=${encodeURIComponent(`${kw} ${dong}`)}`,
          { headers: { Accept: "application/json" } },
          10000
        );
        if (!res.ok) return;
        const arr = (await res.json()) as NominatimEl[];
        let took = 0;
        for (const a of arr) {
          if (took >= 2) break;
          if (push(a.name ?? a.display_name.split(",")[0], kind, stamp, Number(a.lat), Number(a.lon))) took++;
        }
      } catch {
        // 이 종류는 건너뜀
      }
    })
  );
  // 동 이름과 상관없이 내 주변 박스에서 한 번 더 (옆 동네 경계에 걸린 곳도 잡힘)
  const d = boxD;
  const vb = `${lng - d},${lat + d},${lng + d},${lat - d}`;
  await Promise.all(
    kinds.map(async ([kw, kind, stamp]) => {
      try {
        const res = await fetchTimeout(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=8&bounded=1&viewbox=${vb}&q=${encodeURIComponent(kw)}`,
          { headers: { Accept: "application/json" } },
          10000
        );
        if (!res.ok) return;
        const arr = (await res.json()) as NominatimEl[];
        let took = 0;
        for (const a of arr) {
          if (took >= 2) break;
          const plat = Number(a.lat);
          const plng = Number(a.lon);
          if (distM(lat, lng, plat, plng) > 5000) continue;
          if (push(a.name ?? a.display_name.split(",")[0], kind, stamp, plat, plng)) took++;
        }
      } catch {
        // 이 종류는 건너뜀
      }
    })
  );
  return out;
}

export interface RealDebug {
  kakao: number;
  seoul: number;
  overpass: number;
  nominatim: number;
}

export type ProgressStep = { source: "kakao" | "seoul" | "overpass" | "nominatim"; count: number };

export async function fetchRealFacilities(
  lat: number,
  lng: number,
  dong: string,
  onStep?: (s: ProgressStep) => void
): Promise<{ items: TownFacility[]; via: RealSource; debug: RealDebug } | null> {
  const wrap = async (source: ProgressStep["source"], p: Promise<TownFacility[]>) => {
    try {
      const r = await p;
      onStep?.({ source, count: r.length });
      return r;
    } catch {
      onStep?.({ source, count: -1 });
      return [];
    }
  };
  const [kak, seo, over, nom] = await Promise.all([
    wrap("kakao", fetchViaKakao(lat, lng, dong)),
    wrap("seoul", fetchViaSeoul(lat, lng, dong)),
    wrap("overpass", viaOverpass(lat, lng, dong)),
    wrap("nominatim", viaNominatim(lat, lng, dong)),
  ]);
  const debug: RealDebug = { kakao: kak.length, seoul: seo.length, overpass: over.length, nominatim: nom.length };
  const merged = new Map<string, TownFacility>();
  for (const f of [...kak, ...seo, ...over, ...nom]) {
    const key = `${f.kind}:${f.name}`;
    if (!merged.has(key)) merged.set(key, f);
  }
  if (merged.size === 0) return null;
  return {
    items: applyCaps(lat, lng, [...merged.values()]),
    via: kak.length > 0 ? "kakao" : over.length > 0 ? "overpass" : seo.length > 0 ? "seoul" : "nominatim",
    debug,
  };
}

// 직업별 진짜 만남 장소 (빵집→제빵사, 책방→웹툰작가, 공원→드론 등)
export interface JobPlace {
  id: string;
  name: string;
  easy: string;
  lat: number;
  lng: number;
}

const JOB_FILTER: Record<string, string> = {
  baker: `nwr["shop"="bakery"](around:3000,LAT,LNG);nwr["craft"="bakery"](around:3000,LAT,LNG);`,
  nurse: `nwr["amenity"~"^(hospital|clinic|pharmacy)$"](around:3000,LAT,LNG);`,
  librarian: `nwr["amenity"="library"](around:3000,LAT,LNG);`,
  fire: `nwr["amenity"="fire_station"](around:3000,LAT,LNG);`,
  toon: `nwr["shop"="books"](around:3000,LAT,LNG);`,
  drone: `nwr["leisure"~"^(park|playground)$"](around:3000,LAT,LNG);`,
  teacher: `nwr["amenity"="school"](around:3000,LAT,LNG);`,
  police: `nwr["amenity"="police"](around:3000,LAT,LNG);`,
};

export async function fetchPlacesForJob(
  jobCode: string,
  lat: number,
  lng: number,
  dong: string
): Promise<JobPlace[] | null> {
  // 1순위: 카카오 (키 있을 때)
  try {
    const res = await fetchTimeout(`/api/places/kakao?job=${jobCode}&lat=${lat}&lng=${lng}&dong=${encodeURIComponent(dong)}`, {}, 25000);
    if (res.ok) {
      const j = (await res.json()) as { ok: boolean; items?: JobPlace[] };
      if (j.ok && Array.isArray(j.items) && j.items.length > 0) return j.items;
    }
  } catch {
    // OSM으로 폴백
  }
  const filter = JOB_FILTER[jobCode];
  if (!filter) return null;
  const q = `[out:json][timeout:25];(${filter
    .replaceAll("LAT", String(lat))
    .replaceAll("LNG", String(lng))});out center 20;`.trim();
  try {
    const res = await fetchOverpass(q);
    if (!res) return null;
    const json = (await res.json()) as { elements?: OverpassEl[] };
    const seen = new Set<string>();
    const out: JobPlace[] = [];
    for (const el of json.elements ?? []) {
      const name = el.tags?.["name:ko"] ?? el.tags?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      if (plat == null || plng == null) continue;
      out.push({
        id: `osm-${el.type}-${el.id}`,
        name,
        easy: `${walkText(distM(lat, lng, plat, plng))} 걸려!`,
        lat: plat,
        lng: plng,
      });
      if (out.length >= 5) break;
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

// 다 찾은 뒤 새 비밀 추가: 더 넓게 + 이미 찾은 곳 제외
export async function fetchMorePlaces(
  lat: number,
  lng: number,
  dong: string,
  exclude: string[],
  onStep?: (s: ProgressStep) => void
): Promise<TownFacility[] | null> {
  const wrap = async (source: ProgressStep["source"], p: Promise<TownFacility[]>) => {
    try {
      const r = await p;
      onStep?.({ source, count: r.length });
      return r;
    } catch {
      onStep?.({ source, count: -1 });
      return [];
    }
  };
  const kakaoWide = (async () => {
    try {
      const res = await fetchTimeout(`/api/places/kakao?lat=${lat}&lng=${lng}&dong=${encodeURIComponent(dong)}&radius=8000`, {}, 25000);
      if (!res.ok) return [];
      const j = (await res.json()) as { ok: boolean; items?: TownFacility[] };
      if (!j.ok || !Array.isArray(j.items)) return [];
      return j.items.map((i) => ({ ...i, dong, safeLevel: "초록" as const }));
    } catch {
      return [];
    }
  })();
  const [kak, over, nom] = await Promise.all([
    wrap("kakao", kakaoWide),
    wrap("overpass", viaOverpass(lat, lng, dong, 8000)),
    wrap("nominatim", viaNominatim(lat, lng, dong, 0.06)),
  ]);
  const have = new Set(exclude);
  const merged = new Map<string, TownFacility>();
  for (const f of [...kak, ...over, ...nom]) {
    const key = `${f.kind}:${f.name}`;
    if (have.has(f.id) || merged.has(key)) continue;
    merged.set(key, f);
  }
  if (merged.size === 0) return null;
  return applyCaps(lat, lng, [...merged.values()], 2);
}

export function loadCached(lat: number, lng: number): TownFacility[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    const c = JSON.parse(raw) as { ts: number; items: TownFacility[] };
    if (Date.now() - c.ts > CACHE_TTL) return null;
    if (!Array.isArray(c.items) || c.items.length === 0) return null;
    return c.items;
  } catch {
    return null;
  }
}

export function saveCached(lat: number, lng: number, items: TownFacility[]) {
  try {
    localStorage.setItem(cacheKey(lat, lng), JSON.stringify({ ts: Date.now(), items }));
  } catch {}
}

// 수집함·기록표용: 내 동네 저장된 장소 (없으면 연습장소)
export function loadMyPlaces(): TownFacility[] {
  if (typeof window === "undefined") return [];
  try {
    const me = loadMe();
    if (!me) return [];
    return loadCached(me.lat, me.lng) ?? [];
  } catch {
    return [];
  }
}
