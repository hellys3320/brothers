// 진짜 동네 장소 가져오기 (OpenStreetMap Overpass, 키 없음)
// 도서관·공원·병원·경찰서/소방서를 내 동네 좌표 주변에서 검색
import type { TownFacility } from "./mock";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

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
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "pharmacy") return "병원";
  if (tags.amenity === "police" || tags.amenity === "fire_station") return "안전지킴이집";
  return null;
}

function stampOf(tags: Record<string, string>): string {
  if (tags.leisure === "playground") return "🛝";
  if (tags.amenity === "pharmacy") return "💊";
  if (tags.amenity === "police" || tags.amenity === "fire_station") return "🛟";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "🏥";
  if (tags.leisure === "park") return "🌳";
  return "📚";
}

function easyOf(kind: TownFacility["kind"], meters: number): string {
  const walk = meters < 150 ? "바로 앞!" : `약 ${Math.round(meters / 100) * 100}m!`;
  switch (kind) {
    case "도서관":
      return `진짜 도서관! 책 빌리러 가봐. ${walk}`;
    case "공원":
      return `진짜 공원! 뛰어놀기 좋아. ${walk}`;
    case "병원":
      return `아프면 가는 곳이야. ${walk}`;
    case "안전지킴이집":
      return `위험할 때 도와주는 곳이야. ${walk}`;
    default:
      return walk;
  }
}

export async function fetchRealFacilities(lat: number, lng: number, dong: string): Promise<TownFacility[] | null> {
  const q = `
[out:json][timeout:25];
(
  nwr["amenity"="library"](around:1500,${lat},${lng});
  nwr["leisure"="park"](around:1500,${lat},${lng});
  nwr["leisure"="playground"](around:1500,${lat},${lng});
  nwr["amenity"~"^(hospital|clinic|pharmacy)$"](around:1500,${lat},${lng});
  nwr["amenity"~"^(police|fire_station)$"](around:1500,${lat},${lng});
);
out center 60;`.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) return null;
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
    const meters = distM(lat, lng, plat, plng);
    items.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      kind,
      dong,
      easy: easyOf(kind, meters),
      stamp: stampOf(tags),
      safeLevel: "초록",
      lat: plat,
      lng: plng,
    });
  }

  // 종류별로 가까운 순, 최대 10개 (애들 눈에 맞게)
  const cap: Record<TownFacility["kind"], number> = { 도서관: 3, 공원: 3, 병원: 2, 안전지킴이집: 2, 주의길: 0 };
  const out: TownFacility[] = [];
  for (const kind of ["도서관", "공원", "병원", "안전지킴이집"] as const) {
    const group = items
      .filter((i) => i.kind === kind)
      .sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng))
      .slice(0, cap[kind]);
    out.push(...group);
  }
  return out.length > 0 ? out : null;
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
