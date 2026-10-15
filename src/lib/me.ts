// 내 프로필 (로그인 없이 이 기기에만 저장)
export interface MeProfile {
  nickname: string;
  dong: string;
  lat: number;
  lng: number;
  label: string;
}

const KEY = "brothers-me";

export function loadMe(): MeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as MeProfile;
    if (!p.nickname || !p.dong) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveMe(p: MeProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function clearMe() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// 동네 이름 → 좌표 (OpenStreetMap Nominatim, 키 없음)
export async function geocodeDong(query: string): Promise<MeProfile[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=5&q=${encodeURIComponent(q)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) return [];
    const arr = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return arr.map((a) => ({
      nickname: "",
      dong: q,
      lat: Number(a.lat),
      lng: Number(a.lon),
      label: a.display_name.split(",").slice(0, 3).join(","),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

// 좌표 → 동네 이름 (우리집 핀 확정용)
export async function reverseDong(lat: number, lng: number, fallback: string): Promise<{ dong: string; label: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=ko`,
      { headers: { Accept: "application/json" }, signal: ctrl.signal }
    );
    if (!res.ok) return { dong: fallback, label: fallback };
    const j = (await res.json()) as { display_name?: string; address?: Record<string, string> };
    const a = j.address ?? {};
    const dong =
      a.suburb ?? a.quarter ?? a.town ?? a.village ?? a.city_district ?? a.borough ?? a.county ?? fallback;
    return { dong, label: (j.display_name ?? fallback).split(",").slice(0, 2).join(",") };
  } catch {
    return { dong: fallback, label: fallback };
  } finally {
    clearTimeout(t);
  }
}
