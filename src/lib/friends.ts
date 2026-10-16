// 친구 (내 코드 발급 + 목록은 이 기기에 저장, 이름 조회는 공유 저장소)
export interface Friend {
  code: string;
  nickname: string;
  at: number;
}

const CODE_KEY = "brothers-my-code";
const LIST_KEY = "brothers-friends";

function newCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) s += chars[buf[i] % chars.length];
  return s;
}

export function myCode(): string {
  if (typeof window === "undefined") return "";
  try {
    let c = localStorage.getItem(CODE_KEY);
    if (!c) {
      c = newCode();
      localStorage.setItem(CODE_KEY, c);
    }
    return c;
  } catch {
    return "";
  }
}

export function loadFriends(): Friend[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]") as Friend[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveFriends(list: Friend[]) {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {}
}
