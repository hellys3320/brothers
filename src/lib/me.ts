// 내 프로필 (로그인 없이 이 기기에만 저장)
export interface MeProfile {
  nickname: string;
  avatar: string;
  dong: string;
  lat: number;
  lng: number;
  label: string;
}

export const AVATARS = ["😀", "😎", "🤩", "🥳", "😺", "🐶", "🐰", "🐯", "🦊", "🐼", "🐸", "🦄"];
export const DEFAULT_AVATAR = "🕵️";

const KEY = "brothers-me";

export function loadMe(): MeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as MeProfile;
    if (!p.nickname || !p.dong) return null;
    if (!p.avatar) p.avatar = DEFAULT_AVATAR;
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

// 집 찾기: 카카오(한국 주소·아파트·가게명에 강함) 우선, 없으면 OSM
export async function searchHome(query: string): Promise<MeProfile[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const j = (await res.json()) as {
        ok: boolean;
        items?: Array<{ lat: number; lng: number; name: string; addr: string }>;
      };
      if (j.ok && Array.isArray(j.items) && j.items.length > 0) {
        return j.items.map((a) => ({
          nickname: "",
          avatar: "",
          dong: q,
          lat: a.lat,
          lng: a.lng,
          label: a.addr ? `${a.name} (${a.addr})` : a.name,
        }));
      }
    }
  } catch {
    // OSM으로 폴백
  }
  return geocodeDong(q);
}

// 동네 이름 → 좌표 (OpenStreetMap Nominatim, 키 없음, 폴백용)
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
      avatar: "",
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
