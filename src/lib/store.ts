// 친구 공유 저장소 (Upstash Redis, Vercel Marketplace에서 연결)
// env 없으면 모든 호출이 {ok:false} → 기기내 2인 모드만 동작
import { Redis } from "@upstash/redis";

export function store() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export const TTL_7D = 7 * 24 * 60 * 60;

export function roomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint32Array(4);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 4; i++) s += chars[buf[i] % chars.length];
  return s;
}
