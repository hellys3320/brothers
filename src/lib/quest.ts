// 퀴즈 → 동네탐험 연결 미션 (오늘 날짜 + 찾을 종류 + 완료 여부)
export interface TownQuest {
  date: string;
  kinds: string[];
  done: boolean;
}

export function loadQuest(): TownQuest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("brothers-quest");
    return raw ? (JSON.parse(raw) as TownQuest) : null;
  } catch {
    return null;
  }
}

export function saveQuest(q: TownQuest) {
  try {
    localStorage.setItem("brothers-quest", JSON.stringify(q));
  } catch {}
}

export function todayQuest(): TownQuest | null {
  const q = loadQuest();
  if (!q || q.done) return null;
  try {
    if (q.date !== new Date().toDateString()) return null;
  } catch {
    return null;
  }
  return q;
}
