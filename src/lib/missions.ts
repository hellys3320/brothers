// 1일 직업 체험 미션 (분야별 3개, {name}·{spot} 치환)
import type { JobField } from "./mock";

const T: Record<JobField, string[]> = {
  먹거리: [
    "우리동네 {spot}에 가서 냄새 맡아보기",
    "{name} 일을 하는 사람 1명 찾아보기",
    "가족에게 오늘 본 {spot} 이야기해주기",
  ],
  돌봄: [
    "우리동네 {spot} 위치 확인하기",
    "아플 때 도와주는 말 1개 생각하기",
    "가족에게 고마운 말 전하기",
  ],
  안전: [
    "우리동네 {spot} 위치 확인하기",
    "위험할 때 갈 곳 1개 정하기",
    "횡단보도에서 손 들고 건너기",
  ],
  배움: [
    "우리동네 {spot}에 가보기",
    "책 1권 골라 10쪽 읽기",
    "배운 것 1개 가족에게 가르쳐주기",
  ],
  예술: [
    "{name} 관련 그림 1장 그리기",
    "관련 노래·이야기 1개 찾아보기",
    "가족 앞에서 1분 발표하기",
  ],
  기술: [
    "우리동네 {spot} 찾아보기",
    "쓰는 도구 1개 알아보기",
    "고장 난 것 1개 관찰하기",
  ],
  자연: [
    "가까운 공원에서 식물 3종 찾기",
    "동물 1마리 관찰 일기 쓰기",
    "쓰레기 1개 주워오기",
  ],
  움직임: [
    "우리동네 {spot} 찾아보기",
    "탈 것 3종 이름 외우기",
    "안전하게 타는 법 1개 말하기",
  ],
};

export function missionsFor(field: JobField, name: string, spot: string): string[] {
  return T[field].map((t) => t.replaceAll("{name}", name).replaceAll("{spot}", spot));
}

const KEY = "brothers-missions";

export function loadMissions(code: string): boolean[] {
  if (typeof window === "undefined") return [false, false, false];
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, boolean[]>;
    const v = all[code];
    return Array.isArray(v) && v.length === 3 ? v : [false, false, false];
  } catch {
    return [false, false, false];
  }
}

export function saveMissions(code: string, v: boolean[]) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, boolean[]>;
    all[code] = v;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function missionDoneCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, boolean[]>;
    return Object.values(all).filter((v) => Array.isArray(v) && v.every(Boolean)).length;
  } catch {
    return 0;
  }
}
