// 도장 기록 (id뿐 아니라 이름·날짜까지 저장해야 수집함에 표시됨)
export interface StampLog {
  id: string;
  name: string;
  stamp: string;
  dong: string;
  at: number;
}

const KEY = "brothers-stamp-log";

export function logStamp(id: string, name: string, stamp: string, dong: string) {
  try {
    const log = loadStampLog();
    if (log.some((s) => s.id === id)) return;
    log.unshift({ id, name, stamp, dong, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(log.slice(0, 200)));
  } catch {}
}

export function loadStampLog(): StampLog[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as StampLog[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function clearStampLog() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
