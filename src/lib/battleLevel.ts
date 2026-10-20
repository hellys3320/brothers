// 배틀 레벨 혜택 — 온라인 대결에서 한 판에 몰아 쓰는 "형님 기세"
// 레벨이 높다고 매 판 무조건 세지고, 3판 중 1판만 고를 수 있게 해서
// 저레벨 친구도 충분히 이길 수 있는 재미 중심 밸런스로 설계했다.

import { LEVELS } from "./xp";

/** 한 판에 더할 수 있는 레벨 기세의 최대치 */
export const MAX_LEVEL_MOMENTUM = 3;
/** 보물 소켓 + 레벨 기세를 합친 한 판 보너스 상한 (기본 능력치 5 + 5 = 최대 10) */
export const MAX_ROUND_BONUS = 5;

const BADGE: Record<number, string> = {
  1: "🌱",
  2: "🙂",
  3: "⭐",
  4: "🧭",
  5: "🗺️",
  6: "🎓",
  7: "🧑‍🏫",
  8: "🎖️",
  9: "🔥",
  10: "👑",
};

export interface BattleLevelBenefit {
  level: number;
  name: string;
  badge: string;
  /** 3판 중 1판에 더할 수 있는 기세 */
  momentum: number;
  /** 승리 XP */
  winXP: number;
  /** 참가 XP */
  loseXP: number;
  /** 다음 레벨에서 달라지는 혜택 (최고 레벨이면 null) */
  next: { level: number; name: string; momentum: number } | null;
}

export function clampLevel(level: unknown): number {
  const n = Math.floor(Number(level));
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(10, n));
}

/** Lv.3 +1 · Lv.6 +2 · Lv.9 +3 */
export function momentumBonusFor(level: number): number {
  const lv = clampLevel(level);
  if (lv >= 9) return 3;
  if (lv >= 6) return 2;
  if (lv >= 3) return 1;
  return 0;
}

/** 레벨이 높을수록 배틀 보상도 조금 더 (전투력을 압도하지 않는 선에서) */
export function battleXPFor(level: number, won: boolean): number {
  const lv = clampLevel(level);
  return won ? 10 + Math.floor((lv - 1) / 3) : 3 + Math.floor((lv - 1) / 4);
}

/** 보물 소켓 + 레벨 기세를 합친 실제 보너스. 서버와 클라이언트가 같은 규칙을 쓴다. */
export function battleBonus(socketBonus: unknown, level: number, usedMomentum: boolean): number {
  const socket = Number.isFinite(Number(socketBonus))
    ? Math.max(0, Math.min(5, Math.floor(Number(socketBonus))))
    : 0;
  const momentum = usedMomentum ? momentumBonusFor(level) : 0;
  return Math.max(0, Math.min(MAX_ROUND_BONUS, socket + momentum));
}

export function battleLevelBenefit(level: unknown): BattleLevelBenefit {
  const lv = clampLevel(level);
  const cur = LEVELS.find((l) => l.lv === lv) ?? LEVELS[0];
  const nextLv = Math.min(10, lv + 1);
  const next = lv < 10 ? LEVELS.find((l) => l.lv === nextLv) : null;
  return {
    level: lv,
    name: cur.name,
    badge: BADGE[lv] ?? "🎖️",
    momentum: momentumBonusFor(lv),
    winXP: battleXPFor(lv, true),
    loseXP: battleXPFor(lv, false),
    next: next ? { level: next.lv, name: next.name, momentum: momentumBonusFor(next.lv) } : null,
  };
}
