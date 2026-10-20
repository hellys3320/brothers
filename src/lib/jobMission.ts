// 직업카드 획득 미션
// - 1일 체험 미션 3개 완료
// - 직업 상세에서 이어진 관련 장소 2곳 방문 (장소가 적으면 있는 만큼)
import { loadMissions } from "./missions";

export const JOB_MISSION_COUNT = 3;
export const JOB_PLACE_NEED = 2;

const VISITS_KEY = "brothers-job-visits";
const CARDS_KEY = "brothers-jobs-visited";

export type JobVisits = Record<string, string[]>;

export function loadJobVisits(): JobVisits {
  if (typeof window === "undefined") return {};
  try {
    const v = JSON.parse(localStorage.getItem(VISITS_KEY) ?? "{}") as JobVisits;
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function visitsFor(jobCode: string): string[] {
  const v = loadJobVisits()[jobCode];
  return Array.isArray(v) ? v : [];
}

export function addJobVisit(jobCode: string, placeId: string): string[] {
  const all = loadJobVisits();
  const cur = Array.isArray(all[jobCode]) ? all[jobCode] : [];
  if (!cur.includes(placeId)) {
    all[jobCode] = [...cur, placeId];
    try {
      localStorage.setItem(VISITS_KEY, JSON.stringify(all));
    } catch {}
  }
  return all[jobCode] ?? cur;
}

export function loadJobCards(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]") as string[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function hasJobCard(jobCode: string): boolean {
  return loadJobCards().includes(jobCode);
}

/** 카드를 새로 획득했으면 true, 이미 있으면 false */
export function awardJobCard(jobCode: string): boolean {
  const cards = loadJobCards();
  if (cards.includes(jobCode)) return false;
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify([...cards, jobCode]));
  } catch {
    return false;
  }
  return true;
}

/** 체험 미션 3개 + 관련 장소 needPlaces곳을 모두 채웠는지 */
export function jobMissionReady(jobCode: string, needPlaces: number): boolean {
  const missionsDone = loadMissions(jobCode).every(Boolean);
  return missionsDone && visitsFor(jobCode).length >= needPlaces;
}
