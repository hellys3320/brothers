// 경험치·레벨 (로그인 없이 이 기기에만 저장)
export interface Level {
  lv: number;
  name: string;
  xp: number;
}

export const LEVELS: Level[] = [
  { lv: 1, name: "탐험견습생", xp: 0 },
  { lv: 2, name: "탐험대원", xp: 60 },
  { lv: 3, name: "동네박사", xp: 150 },
  { lv: 4, name: "명예형님", xp: 300 },
  { lv: 5, name: "전설의형님", xp: 500 },
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

export function addXP(n: number): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = getXP() + n;
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new CustomEvent("brothers-xp", { detail: next }));
    return next;
  } catch {
    return getXP();
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
