// 진짜 동네 장소 가져오기 (키 없음)
// 1순위: OpenStreetMap Overpass (반경 1.5km → 3km → 5km)
// 2순위: Nominatim 지명 검색 (도서관/공원/병원/경찰서 + 동네)
// 전부 실패하면 null → 호출 쪽에서 연습 장소로 폴백
import type { TownFacility } from "./mock";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export type RealSource = "overpass" | "nominatim";

async function fetchOverpass(q: string): Promise<Response | null> {
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      });
      if (res.ok) return res;
    } catch {
      // 다음 미러로
    }
  }
  return null;
}

function cacheKey(lat: number, lng: number) {
  return `brothers-poi-${lat.toFixed(3)}-${lng.toFixed(3)}`;
}

function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function walkText(meters: number) {
  return meters < 150 ? "바로 앞!" : `약 ${Math.round(meters / 100) * 100}m!`;
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
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "pharmacy") return "병원";
  if (tags.amenity === "police" || tags.amenity === "fire_station") return "안전지킴이집";
  return null;
}

function stampOf(tags: Record<string, string>): string {
  if (tags.leisure === "playground") return "🛝";
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
    case "병원":
      return `아프면 가는 곳이야. ${walk}`;
    case "안전지킴이집":
      return `위험할 때 도와주는 곳이야. ${walk}`;
    default:
      return walk;
  }
}

async function viaOverpass(lat: number, lng: number, dong: string): Promise<TownFacility[] | null> {
  for (const r of [1500, 3000, 5000]) {
    const q = `
[out:json][timeout:25];
(
  nwr["amenity"="library"](around:${r},${lat},${lng});
  nwr["leisure"="park"](around:${r},${lat},${lng});
  nwr["leisure"="playground"](around:${r},${lat},${lng});
  nwr["amenity"~"^(school|kindergarten)$"](around:${r},${lat},${lng});
  nwr["amenity"~"^(hospital|clinic|pharmacy)$"](around:${r},${lat},${lng});
  nwr["amenity"~"^(police|fire_station)$"](around:${r},${lat},${lng});
);
out center 60;`.trim();
    try {
      const res = await fetchOverpass(q);
      if (!res) continue;
      const json = (await res.json()) as { elements?: OverpassEl[] };
      const els = json.elements ?? [];
      const seen = new Set<string>();
      const items: TownFacility[] = [];
      for (const el of els) {
        const tags = el.tags ?? {};
        const name = tags["name:ko"] ?? tags.name;
        if (!name) continue;
        const kind = kindOf(tags);
        if (!kind) continue;
        const key = `${kind}:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (plat == null || plng == null) continue;
        items.push({
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
      const cap: Record<TownFacility["kind"], number> = { 도서관: 3, 공원: 4, 학교: 3, 병원: 2, 안전지킴이집: 2, 주의길: 0 };
      const out: TownFacility[] = [];
      for (const kind of ["도서관", "공원", "학교", "병원", "안전지킴이집"] as const) {
        out.push(
          ...items
            .filter((i) => i.kind === kind)
            .sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng))
            .slice(0, cap[kind])
        );
      }
      if (out.length > 0) return out;
    } catch {
      // 다음 반경·미러로
    }
  }
  return null;
}

interface NominatimEl {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

async function viaNominatim(lat: number, lng: number, dong: string): Promise<TownFacility[] | null> {
  const kinds: Array<[string, TownFacility["kind"], string]> = [
    ["도서관", "도서관", "📚"],
    ["공원", "공원", "🌳"],
    ["학교", "학교", "🏫"],
    ["병원", "병원", "🏥"],
    ["경찰서", "안전지킴이집", "🛟"],
  ];
  const out: TownFacility[] = [];
  try {
    for (const [kw, kind, stamp] of kinds) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=4&q=${encodeURIComponent(`${kw} ${dong}`)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const arr = (await res.json()) as NominatimEl[];
      let took = 0;
      for (const a of arr) {
        if (took >= 2) break;
        const nm = a.name ?? a.display_name.split(",")[0];
        if (!nm || out.some((o) => o.name === nm)) continue;
        const plat = Number(a.lat);
        const plng = Number(a.lon);
        out.push({
          id: `nom-${a.place_id}`,
          name: nm,
          kind,
          dong,
          easy: `지도에서 찾은 진짜 ${kind}! ${walkText(distM(lat, lng, plat, plng))}`,
          stamp,
          safeLevel: "초록",
          lat: plat,
          lng: plng,
        });
        took++;
      }
    }
  } catch {
    return out.length > 0 ? out : null;
  }
  return out.length > 0 ? out : null;
}

export async function fetchRealFacilities(
  lat: number,
  lng: number,
  dong: string
): Promise<{ items: TownFacility[]; via: RealSource } | null> {
  const o = await viaOverpass(lat, lng, dong);
  if (o) return { items: o, via: "overpass" };
  const n = await viaNominatim(lat, lng, dong);
  if (n) return { items: n, via: "nominatim" };
  return null;
}

// 직업별 진짜 만남 장소 (빵집→제빵사, 책방→웹툰작가, 공원→드론 등)
export interface JobPlace {
  id: string;
  name: string;
  easy: string;
}

const JOB_FILTER: Record<string, string> = {
  baker: `nwr["shop"="bakery"](around:3000,LAT,LNG);nwr["craft"="bakery"](around:3000,LAT,LNG);`,
  nurse: `nwr["amenity"~"^(hospital|clinic|pharmacy)$"](around:3000,LAT,LNG);`,
  librarian: `nwr["amenity"="library"](around:3000,LAT,LNG);`,
  fire: `nwr["amenity"="fire_station"](around:3000,LAT,LNG);`,
  toon: `nwr["shop"="books"](around:3000,LAT,LNG);`,
  drone: `nwr["leisure"~"^(park|playground)$"](around:3000,LAT,LNG);`,
};

export const JOB_PLACE_HINT: Record<string, string> = {
  baker: "빵집",
  nurse: "병원·약국",
  librarian: "도서관",
  fire: "소방서",
  toon: "책방",
  drone: "드론 날리기 좋은 공원",
};

export async function fetchPlacesForJob(
  jobCode: string,
  lat: number,
  lng: number
): Promise<JobPlace[] | null> {
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
      });
      if (out.length >= 5) break;
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
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
