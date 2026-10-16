// 경험치·레벨 (로그인 없이 이 기기에만 저장)
export interface Level {
  lv: number;
  name: string;
  xp: number;
}

export const LEVELS: Level[] = [
  { lv: 1, name: "탐험새싹", xp: 0 },
  { lv: 2, name: "동네친구", xp: 50 },
  { lv: 3, name: "골목대장", xp: 130 },
  { lv: 4, name: "탐험대원", xp: 250 },
  { lv: 5, name: "비밀지도사", xp: 420 },
  { lv: 6, name: "동네박사", xp: 650 },
  { lv: 7, name: "직업박사", xp: 950 },
  { lv: 8, name: "명예형님", xp: 1300 },
  { lv: 9, name: "전설의형님", xp: 1750 },
  { lv: 10, name: "신화의형님", xp: 2300 },
];

const KEY = "brothers-xp";

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export interface XPEvent {
  t: number;
  n: number;
  why: string;
}

const LOG_KEY = "brothers-xp-log";

export function addXP(n: number, why = ""): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = getXP() + n;
    localStorage.setItem(KEY, String(next));
    const log = getXPLog();
    log.unshift({ t: Date.now(), n, why });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 50)));
    window.dispatchEvent(new CustomEvent("brothers-xp", { detail: next }));
    return next;
  } catch {
    return getXP();
  }
}

export function getXPLog(): XPEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]") as XPEvent[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function levelFor(xp: number): Level {
  let cur = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) cur = l;
  }
  return cur;
}

export function nextLevel(xp: number): Level | null {
  for (const l of LEVELS) {
    if (xp < l.xp) return l;
  }
  return null;
}
