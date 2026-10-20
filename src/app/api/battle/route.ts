// 카드배틀 방 (3판 선공개 vs 순차 공개, 서버에서 판정)
import { store, TTL_7D, roomCode } from "@/lib/store";
import { MOCK_JOBS } from "@/lib/mock";
import { battleBonus, clampLevel } from "@/lib/battleLevel";

export interface BattleRound {
  card: string;
  stat: string;
  /** 카드 소켓(보물) 강화 수치 */
  bonus?: number;
  /** 이 판에 레벨 기세를 사용했는지 (3판 중 1판만) */
  momentum?: boolean;
}

export interface BattlePlayer {
  code: string;
  name: string;
  /** 배틀 당시 레벨 (표시 + 기세 계산용) */
  level?: number;
}

export interface Battle {
  id: string;
  a: BattlePlayer;
  b: BattlePlayer | null;
  aRounds: BattleRound[];
  bRounds: BattleRound[] | null;
  status: "wait" | "done";
  result?: Array<{ aVal: number; bVal: number; win: "a" | "b" | "draw" }>;
  winnerCode?: string | null;
  createdAt: number;
}

function valOf(
  code: string,
  stat: string,
  bonus = 0,
  level = 1,
  momentum = false
): number {
  const j = MOCK_JOBS.find((x) => x.code === code);
  const v = (j?.powers as Record<string, number> | undefined)?.[stat];
  return (typeof v === "number" ? v : 0) + battleBonus(bonus, level, momentum);
}

/** 3판 중 딱 1판만 기세를 인정한다 (클라이언트가 여러 판에 켜도 서버에서 차단) */
function oneMomentum(rounds: BattleRound[]): BattleRound[] {
  let used = false;
  return rounds.map((r) => {
    const momentum = r.momentum === true && !used;
    if (momentum) used = true;
    return { ...r, momentum };
  });
}

export async function POST(req: Request) {
  const r = store();
  if (!r) return Response.json({ ok: false, reason: "no-store" });
  try {
    const body = (await req.json()) as {
      op: "create" | "answer";
      id?: string;
      aCode?: string;
      aName?: string;
      toCode?: string;
      rounds?: BattleRound[];
      code?: string;
      name?: string;
      level?: number;
    };
    if (body.op === "create") {
      if (!body.aCode || !body.aName || !Array.isArray(body.rounds) || body.rounds.length !== 3) {
        return Response.json({ ok: false, reason: "bad-args" });
      }
      const id = roomCode();
      const b: Battle = {
        id,
        a: {
          code: body.aCode.toUpperCase(),
          name: body.aName.slice(0, 10),
          level: clampLevel(body.level),
        },
        b: null,
        aRounds: oneMomentum(body.rounds),
        bRounds: null,
        status: "wait",
        createdAt: Date.now(),
      };
      await r.set(`battle:${id}`, b, { ex: TTL_7D });
      if (body.toCode) {
        const to = body.toCode.toUpperCase();
        const key = `inbox:${to}`;
        const list = ((await r.get<string[]>(key)) ?? []).filter((x) => x !== id);
        list.unshift(id);
        await r.set(key, list.slice(0, 20), { ex: TTL_7D });
      }
      return Response.json({ ok: true, id });
    }
    if (body.op === "answer") {
      if (!body.id || !body.code || !body.name || !Array.isArray(body.rounds) || body.rounds.length !== 3) {
        return Response.json({ ok: false, reason: "bad-args" });
      }
      const key = `battle:${body.id.toUpperCase()}`;
      const b = await r.get<Battle>(key);
      if (!b || b.status !== "wait") return Response.json({ ok: false, reason: "closed" });
      if (b.a.code === body.code.toUpperCase()) return Response.json({ ok: false, reason: "self" });
      const aLevel = clampLevel(b.a.level);
      const bLevel = clampLevel(body.level);
      const bRounds = oneMomentum(body.rounds);
      const result = b.aRounds.map((ar, i) => {
        const br = bRounds[i];
        const aVal = valOf(ar.card, ar.stat, ar.bonus, aLevel, ar.momentum === true);
        const bVal = valOf(br.card, br.stat, br.bonus, bLevel, br.momentum === true);
        return { aVal, bVal, win: (aVal === bVal ? "draw" : aVal > bVal ? "a" : "b") as "a" | "b" | "draw" };
      });
      const aWins = result.filter((x) => x.win === "a").length;
      const bWins = result.filter((x) => x.win === "b").length;
      let winnerCode: string | null = null;
      if (aWins !== bWins) {
        winnerCode = aWins > bWins ? b.a.code : body.code.toUpperCase();
      } else {
        const aTot = result.reduce((s, x) => s + x.aVal, 0);
        const bTot = result.reduce((s, x) => s + x.bVal, 0);
        winnerCode = aTot === bTot ? null : aTot > bTot ? b.a.code : body.code.toUpperCase();
      }
      const done: Battle = {
        ...b,
        b: {
          code: body.code.toUpperCase(),
          name: body.name.slice(0, 10),
          level: bLevel,
        },
        bRounds,
        status: "done",
        result,
        winnerCode,
      };
      await r.set(key, done, { ex: TTL_7D });
      return Response.json({ ok: true, battle: done });
    }
    return Response.json({ ok: false, reason: "bad-op" });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}

export async function GET(req: Request) {
  const r = store();
  if (!r) return Response.json({ ok: false, reason: "no-store" });
  const sp = new URL(req.url).searchParams;
  try {
    if (sp.get("id")) {
      const b = await r.get<Battle>(`battle:${(sp.get("id") ?? "").toUpperCase()}`);
      if (!b) return Response.json({ ok: false, reason: "not-found" });
      return Response.json({ ok: true, battle: b });
    }
    if (sp.get("inbox")) {
      const ids = (await r.get<string[]>(`inbox:${sp.get("inbox")!.toUpperCase()}`)) ?? [];
      const out: Array<{ id: string; from: string; at: number; status: string }> = [];
      for (const id of ids.slice(0, 10)) {
        const b = await r.get<Battle>(`battle:${id}`);
        if (b) out.push({ id, from: b.a.name, at: b.createdAt, status: b.status });
      }
      return Response.json({ ok: true, items: out });
    }
    return Response.json({ ok: false, reason: "bad-args" });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
