// 보물(아이템) — 동네탐험에서 랜덤으로 발견!
// 수집함에서 직업 카드의 소켓에 꽂으면 그 카드의 능력치가 강해진다.
// 같은 보물은 보유한 개수만큼만 꽂을 수 있다.
import type { JobCard, JobPowers } from "./mock";

export type TreasureRarity = "반짝" | "빛나는" | "전설";

export interface Treasure {
  id: string;
  name: string;
  emoji: string;
  rarity: TreasureRarity;
  /** 강화되는 능력치 */
  stat: keyof JobPowers;
  /** 강화 수치 */
  bonus: number;
}

// 5개 능력치 × 6종 = 30종 (반짝·빛나는·전설 각 10종)
export const TREASURES: Treasure[] = [
  // 💪 힘
  { id: "rock", name: "단단한 주먹돌", emoji: "🪨", rarity: "반짝", stat: "힘", bonus: 1 },
  { id: "rope", name: "질긴 밧줄", emoji: "🪢", rarity: "반짝", stat: "힘", bonus: 1 },
  { id: "glove", name: "힘센 글러브", emoji: "🥊", rarity: "빛나는", stat: "힘", bonus: 2 },
  { id: "hammer", name: "번쩍 망치", emoji: "🔨", rarity: "빛나는", stat: "힘", bonus: 2 },
  { id: "dumbbell", name: "용기의 아령", emoji: "🏋️", rarity: "전설", stat: "힘", bonus: 3 },
  { id: "shield", name: "용사의 방패", emoji: "🛡️", rarity: "전설", stat: "힘", bonus: 3 },
  // 🗣️ 말하기
  { id: "shell", name: "소라 마이크", emoji: "🐚", rarity: "반짝", stat: "말하기", bonus: 1 },
  { id: "parrot", name: "수다쟁이 앵무새", emoji: "🦜", rarity: "반짝", stat: "말하기", bonus: 1 },
  { id: "megaphone", name: "우렁찬 확성기", emoji: "📣", rarity: "빛나는", stat: "말하기", bonus: 2 },
  { id: "storybook", name: "이야기꾼의 책", emoji: "📚", rarity: "빛나는", stat: "말하기", bonus: 2 },
  { id: "goldmic", name: "황금 마이크", emoji: "🎙️", rarity: "전설", stat: "말하기", bonus: 3 },
  { id: "radio", name: "은하 라디오", emoji: "📻", rarity: "전설", stat: "말하기", bonus: 3 },
  // 🎨 그리기
  { id: "crayon", name: "무지개 크레파스", emoji: "🖍️", rarity: "반짝", stat: "그리기", bonus: 1 },
  { id: "pencil", name: "알록달록 색연필", emoji: "✏️", rarity: "반짝", stat: "그리기", bonus: 1 },
  { id: "paint", name: "신비한 물감", emoji: "🎨", rarity: "빛나는", stat: "그리기", bonus: 2 },
  { id: "sketchbook", name: "마법 스케치북", emoji: "📒", rarity: "빛나는", stat: "그리기", bonus: 2 },
  { id: "legendbrush", name: "전설의 붓", emoji: "🖌️", rarity: "전설", stat: "그리기", bonus: 3 },
  { id: "palette", name: "무지개 팔레트", emoji: "🌈", rarity: "전설", stat: "그리기", bonus: 3 },
  // 🔍 관찰
  { id: "magnifier", name: "작은 돋보기", emoji: "🔎", rarity: "반짝", stat: "관찰", bonus: 1 },
  { id: "flashlight", name: "탐정 손전등", emoji: "🔦", rarity: "반짝", stat: "관찰", bonus: 1 },
  { id: "telescope", name: "별보는 망원경", emoji: "🔭", rarity: "빛나는", stat: "관찰", bonus: 2 },
  { id: "map", name: "비밀 지도", emoji: "🗺️", rarity: "빛나는", stat: "관찰", bonus: 2 },
  { id: "eagleeye", name: "매의 눈 렌즈", emoji: "👁️", rarity: "전설", stat: "관찰", bonus: 3 },
  { id: "crystalball", name: "별빛 수정 구슬", emoji: "🔮", rarity: "전설", stat: "관찰", bonus: 3 },
  // ✋ 손재주
  { id: "thread", name: "튼튼한 실타래", emoji: "🧵", rarity: "반짝", stat: "손재주", bonus: 1 },
  { id: "needle", name: "반짝 바늘", emoji: "🪡", rarity: "반짝", stat: "손재주", bonus: 1 },
  { id: "toolbox", name: "만능 공구함", emoji: "🧰", rarity: "빛나는", stat: "손재주", bonus: 2 },
  { id: "ruler", name: "척척 접이식 자", emoji: "📏", rarity: "빛나는", stat: "손재주", bonus: 2 },
  { id: "scissors", name: "신비의 가위", emoji: "✂️", rarity: "전설", stat: "손재주", bonus: 3 },
  { id: "gear", name: "황금 톱니바퀴", emoji: "⚙️", rarity: "전설", stat: "손재주", bonus: 3 },
];

export const TREASURE_STYLE: Record<TreasureRarity, { frame: string; bg: string; badge: string }> = {
  반짝: { frame: "from-stone-300 to-stone-400", bg: "from-stone-100 to-stone-200", badge: "bg-stone-200" },
  빛나는: { frame: "from-sky-300 to-violet-400", bg: "from-sky-100 to-violet-200", badge: "bg-sky-200" },
  전설: { frame: "from-amber-300 to-yellow-500", bg: "from-amber-100 to-orange-200", badge: "bg-amber-200" },
};

const BY_ID: Record<string, Treasure> = Object.fromEntries(TREASURES.map((t) => [t.id, t]));

export function treasureById(id?: string | null): Treasure | null {
  if (!id) return null;
  return BY_ID[id] ?? null;
}

const RARITY_WEIGHT: Array<[TreasureRarity, number]> = [
  ["반짝", 60],
  ["빛나는", 30],
  ["전설", 10],
];

// 희귀도 가중 랜덤 (전설은 10%)
export function rollTreasure(rand: () => number = Math.random): Treasure {
  const total = RARITY_WEIGHT.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  let pick: TreasureRarity = "반짝";
  for (const [rar, w] of RARITY_WEIGHT) {
    if (r < w) {
      pick = rar;
      break;
    }
    r -= w;
  }
  const pool = TREASURES.filter((t) => t.rarity === pick);
  return pool[Math.floor(rand() * pool.length)] ?? TREASURES[0];
}

/** 발견 확률 판정 후 보물 반환 (못 찾으면 null). 처음엔 꼭 하나 나온다. */
export function tryFindTreasure(inv: Inventory, chance = 0.55): Treasure | null {
  const realChance = Object.keys(inv).length > 0 ? chance : 1;
  if (Math.random() >= realChance) return null;
  return rollTreasure();
}

const INV_KEY = "brothers-treasures";
const SOCKET_KEY = "brothers-sockets";

export type Inventory = Record<string, number>;
export type Sockets = Record<string, string>;

export function loadTreasures(): Inventory {
  if (typeof window === "undefined") return {};
  try {
    const v = JSON.parse(localStorage.getItem(INV_KEY) ?? "{}") as Inventory;
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function saveTreasures(inv: Inventory) {
  try {
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
  } catch {}
}

export function addTreasure(inv: Inventory, id: string): Inventory {
  return { ...inv, [id]: (inv[id] ?? 0) + 1 };
}

export function treasureCount(inv: Inventory): number {
  return Object.values(inv).reduce((s, n) => s + n, 0);
}

/**
 * 같은 보물을 보유 수량보다 많이 꽂지 못하게 정리한다.
 * 예전 버그로 한 개를 여러 카드에 꽂아둔 경우에도 첫 카드만 남는다.
 */
export function sanitizeSockets(sockets: Sockets, inventory: Inventory): Sockets {
  const out: Sockets = {};
  for (const [code, treasureId] of Object.entries(sockets)) {
    if (typeof treasureId !== "string") continue;
    if (canSocketTreasure(inventory, out, code, treasureId)) {
      out[code] = treasureId;
    }
  }
  return out;
}

export function loadSockets(): Sockets {
  if (typeof window === "undefined") return {};
  try {
    const v = JSON.parse(localStorage.getItem(SOCKET_KEY) ?? "{}") as Sockets;
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const clean = sanitizeSockets(v, loadTreasures());
    // 예전 중복 소켓은 읽을 때 바로 고쳐서 저장한다.
    if (Object.keys(clean).length !== Object.keys(v).length) saveSockets(clean);
    return clean;
  } catch {
    return {};
  }
}

export function saveSockets(s: Sockets) {
  try {
    localStorage.setItem(SOCKET_KEY, JSON.stringify(s));
  } catch {}
}

export function socketFor(sockets: Sockets, code: string): Treasure | null {
  return treasureById(sockets[code]);
}

/** 이 보물을 지금 몇 장의 카드에 꽂았는지 */
export function socketedCount(sockets: Sockets, treasureId: string): number {
  return Object.values(sockets).filter((id) => id === treasureId).length;
}

/** 이 카드에 이 보물을 꽂을 수 있는지 (보유 수량 - 다른 카드에 꽂힌 수량) */
export function canSocketTreasure(
  inventory: Inventory,
  sockets: Sockets,
  code: string,
  treasureId: string
): boolean {
  const owned = Math.floor(Number(inventory[treasureId] ?? 0));
  if (!Number.isFinite(owned) || owned <= 0) return false;
  // 이미 이 카드에 꽂혀 있으면 그대로 둔다.
  if (sockets[code] === treasureId) return true;
  return socketedCount(sockets, treasureId) < owned;
}

/** 카드에 꽂힌 보물의 강화량 (없으면 0). 배틀에서 서버에 넘길 값. */
export function socketBonusOf(sockets: Sockets, code: string): number {
  return socketFor(sockets, code)?.bonus ?? 0;
}

/** 이 기기에 저장된 소켓 정보로 강화량 계산 (배틀 클라이언트용) */
export function socketBonusValue(code: string): number {
  if (typeof window === "undefined") return 0;
  return socketBonusOf(loadSockets(), code);
}

/** 강화가 반영된 능력치 */
export function boostedPowers(job: JobCard, sockets: Sockets): Record<string, number> {
  const base = job.powers as unknown as Record<string, number>;
  const t = socketFor(sockets, job.code);
  const out: Record<string, number> = { ...base };
  if (t && typeof base[t.stat] === "number") out[t.stat] = base[t.stat] + t.bonus;
  return out;
}
