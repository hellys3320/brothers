// 친구 등록·조회 (공유 저장소). env 없으면 {ok:false}
import { store, TTL_7D } from "@/lib/store";

export async function POST(req: Request) {
  const r = store();
  if (!r) return Response.json({ ok: false, reason: "no-store" });
  try {
    const { code, nickname } = (await req.json()) as { code?: string; nickname?: string };
    if (!code || !nickname) return Response.json({ ok: false, reason: "bad-args" });
    await r.set(`user:${code.toUpperCase()}`, nickname.slice(0, 10), { ex: TTL_7D * 4 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}

export async function GET(req: Request) {
  const r = store();
  if (!r) return Response.json({ ok: false, reason: "no-store" });
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase() ?? "";
  if (!code) return Response.json({ ok: false, reason: "bad-args" });
  try {
    const nickname = await r.get<string>(`user:${code}`);
    if (!nickname) return Response.json({ ok: false, reason: "not-found" });
    return Response.json({ ok: true, nickname });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
