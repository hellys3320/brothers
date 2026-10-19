"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_JOBS } from "@/lib/mock";
import { myCode } from "@/lib/friends";
import { loadMe } from "@/lib/me";
import { addXP } from "@/lib/xp";
import { speak } from "@/lib/speak";
import JobCardFace from "@/components/JobCardFace";
import { loadSockets, socketBonusOf, socketFor } from "@/lib/treasures";
import type { Battle, BattleRound } from "@/app/api/battle/route";

const STATS = ["힘", "말하기", "그리기", "관찰", "손재주"];

// 소켓(보물) 강화를 반영한 라운드로 변환
function withSockets(rounds: BattleRound[]): BattleRound[] {
  const sockets = loadSockets();
  return rounds.map((r) => {
    const bonus = socketBonusOf(sockets, r.card);
    return bonus > 0 ? { ...r, bonus } : r;
  });
}

function noOf(code: string): string {
  const i = MOCK_JOBS.findIndex((j) => j.code === code);
  return i >= 0 ? String(i + 1).padStart(3, "0") : "???";
}

function ownedCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("brothers-jobs-visited") ?? "[]");
  } catch {
    return [];
  }
}

function claimBattleXP(id: string, won: boolean) {
  try {
    const raw = JSON.parse(localStorage.getItem("brothers-battle-xp") ?? "[]") as string[];
    const v = Array.isArray(raw) ? raw : [];
    if (v.includes(id)) return;
    localStorage.setItem("brothers-battle-xp", JSON.stringify([...v, id]));
    addXP(won ? 10 : 3, won ? "카드배틀 승리!" : "카드배틀 참가!");
  } catch {}
}

function jobOf(code: string) {
  return MOCK_JOBS.find((j) => j.code === code);
}

function pval(code: string, stat: string): number {
  const j = jobOf(code);
  if (!j) return 0;
  const p = j.powers as unknown as Record<string, number>;
  return typeof p[stat] === "number" ? p[stat] : 0;
}

// 3판 덱 짜기 (남은 카드 + 스탯 고르기)
function DeckBuilder({ title, onDone }: { title: string; onDone: (rounds: BattleRound[]) => void }) {
  const [pool] = useState(() => {
    const owned = ownedCodes();
    return owned.length >= 3 ? MOCK_JOBS.filter((j) => owned.includes(j.code)) : MOCK_JOBS;
  });
  const [sockets] = useState(loadSockets);
  const [picks, setPicks] = useState<BattleRound[]>([
    { card: "", stat: "힘" },
    { card: "", stat: "힘" },
    { card: "", stat: "힘" },
  ]);
  const used = picks.map((p) => p.card).filter(Boolean);

  function setPick(i: number, card: string) {
    setPicks((prev) => prev.map((p, k) => (k === i ? { ...p, card } : p)));
  }
  function setStat(i: number, stat: string) {
    setPicks((prev) => prev.map((p, k) => (k === i ? { ...p, stat } : p)));
  }

  const ready = picks.every((p) => p.card);

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="font-bold text-stone-500">3판에 낼 카드 1장씩 + 겨룰 힘 1개씩!</p>
      {[0, 1, 2].map((r) => (
        <div key={r} className="mt-3 rounded-2xl bg-stone-50 p-3">
          <p className="font-black">{r + 1}판</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {pool.slice(0, 30).map((j) => {
              const taken = used.includes(j.code) && picks[r].card !== j.code;
              return (
                <button
                  key={j.code}
                  type="button"
                  disabled={taken}
                  onClick={() => setPick(r, j.code)}
                  className={`rounded-xl px-2 py-1 text-xl font-black ${picks[r].card === j.code ? "bg-amber-400" : taken ? "bg-stone-100 opacity-40" : "bg-white shadow"}`}
                >
                  {j.emoji}
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {STATS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStat(r, s)}
                className={`rounded-full px-3 py-1 font-black ${picks[r].stat === s ? "bg-violet-400" : "bg-white shadow"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {picks[r].card ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="w-20 shrink-0">
                <JobCardFace job={jobOf(picks[r].card)!} no={noOf(picks[r].card)} socket={socketFor(sockets, picks[r].card)} />
              </div>
              <p className="font-bold">
                {jobOf(picks[r].card)?.name} × {picks[r].stat}로 겨루기!
              </p>
            </div>
          ) : (
            <p className="mt-1 font-bold text-stone-500">카드 골라!</p>
          )}
        </div>
      ))}
      <button
        type="button"
        disabled={!ready}
        onClick={() => onDone(picks)}
        className="mt-3 w-full rounded-2xl bg-red-400 px-4 py-3 text-xl font-black disabled:opacity-40"
      >
        확정!
      </button>
    </div>
  );
}

function ResultView({ battle, myCode: me }: { battle: Battle; myCode: string }) {
  const iAmA = battle.a.code === me;
  const myWins = battle.result?.filter((r) => (iAmA ? r.win === "a" : r.win === "b")).length ?? 0;
  const won = battle.winnerCode === me;
  const draw = !battle.winnerCode;

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-pop rounded-3xl bg-gradient-to-b from-amber-200 to-pink-200 p-6 text-center shadow">
        <p className="text-5xl">{draw ? "🤝" : won ? "🏆" : "😅"}</p>
        <h2 className="text-3xl font-black">
          {draw ? "무승부!" : won ? "승리!" : `${battle.a.code === me ? battle.b?.name : battle.a.name} 승리!`}
        </h2>
        <p className="text-xl font-black text-violet-700">{draw ? "+3 XP!" : won ? "+10 XP!" : "+3 XP!"}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow">
        <h3 className="text-2xl font-black">⚔️ 판 결과 ({myWins}승!)</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {(battle.result ?? []).map((r, i) => {
            const a = battle.aRounds[i];
            const b = battle.bRounds?.[i];
            const aj = jobOf(a.card);
            const bj = b ? jobOf(b.card) : null;
            const mineFirst = iAmA;
            return (
              <li key={i} className="rounded-2xl bg-stone-50 p-3 font-black">
                <p>
                  {r.win === "draw" ? "➖" : (r.win === "a") === mineFirst ? "⭕" : "❌"} {i + 1}판 · {a.stat} 대결!
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-14 shrink-0">{aj && <JobCardFace job={aj} no={noOf(a.card)} />}</div>
                  <p className="text-xl">{r.aVal}</p>
                  <span className="font-black text-stone-400">vs</span>
                  <p className="text-xl">{r.bVal}</p>
                  <div className="w-14 shrink-0">{b && bj && <JobCardFace job={bj} no={noOf(b.card)} />}</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <Link href="/battle" className="flex-1 rounded-2xl bg-white px-4 py-3 text-center font-black shadow">
            목록으로
          </Link>
          <Link href="/jobs" className="flex-1 rounded-2xl bg-sky-300 px-4 py-3 text-center font-black">
            도감 가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BattleClient() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const [tab, setTab] = useState<"online" | "local">("online");
  const [me] = useState(() => myCode());
  const [myName] = useState(() => loadMe()?.nickname ?? "탐험대원");
  const [view, setView] = useState<
    | { k: "menu" }
    | { k: "create"; toCode: string }
    | { k: "wait"; id: string; toCode?: string }
    | { k: "play"; battle: Battle }
    | { k: "result"; battle: Battle }
    | { k: "local-p1" } | { k: "local-p2"; p1: { name: string; rounds: BattleRound[] } } | { k: "local-result"; p1name: string; p2name: string; results: Array<{ aVal: number; bVal: number; win: string }> ; aRounds: BattleRound[]; bRounds: BattleRound[] }
  >(() => (to ? { k: "create", toCode: to.toUpperCase() } : { k: "menu" }));
  const [joinCode, setJoinCode] = useState("");
  const [incoming, setIncoming] = useState<Array<{ id: string; from: string; at: number; status: string }>>([]);
  const [msg, setMsg] = useState("");
  const [p1name, setP1name] = useState("");
  const [p2name, setP2name] = useState("");

  // 도착한 대결 목록 (5초마다)
  useEffect(() => {
    if (tab !== "online" || !me) return;
    let live = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/battle?inbox=${me}`);
        const j = (await res.json()) as { ok: boolean; items?: Array<{ id: string; from: string; at: number; status: string }> };
        if (live && j.ok && j.items) setIncoming(j.items);
      } catch {}
    };
    load();
    const iv = setInterval(load, 5000);
    return () => {
      live = false;
      clearInterval(iv);
    };
  }, [tab, me]);

  // 기다리는 중 결과 확인 (3초마다)
  useEffect(() => {
    if (view.k !== "wait") return;
    let live = true;
    const check = async () => {
      try {
        const res = await fetch(`/api/battle?id=${view.id}`);
        const j = (await res.json()) as { ok: boolean; battle?: Battle };
        if (live && j.ok && j.battle && j.battle.status === "done") {
          claimBattleXP(j.battle.id, j.battle.winnerCode === me);
          setView({ k: "result", battle: j.battle });
        }
      } catch {}
    };
    const iv = setInterval(check, 3000);
    return () => {
      live = false;
      clearInterval(iv);
    };
  }, [view, me]);

  async function createBattle(rounds: BattleRound[], toCode: string) {
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "create", aCode: me, aName: myName, toCode: toCode || undefined, rounds: withSockets(rounds) }),
      });
      const j = (await res.json()) as { ok: boolean; id?: string; reason?: string };
      if (j.ok && j.id) {
        speak(toCode ? "친구에게 대결을 신청했어!" : `대결 코드 ${j.id}! 친구에게 알려줘!`);
        setView({ k: "wait", id: j.id, toCode: toCode || undefined });
      } else if (j.reason === "no-store") {
        setMsg("대결 서버가 아직 안 열렸어! 둘이서 모드로 놀아!");
      } else {
        setMsg("만들기 실패! 다시 해봐!");
      }
    } catch {
      setMsg("인터넷을 확인해줘!");
    }
  }

  async function joinBattle(id: string) {
    const bid = id.trim().toUpperCase();
    if (!bid) return;
    try {
      const res = await fetch(`/api/battle?id=${bid}`);
      const j = (await res.json()) as { ok: boolean; battle?: Battle; reason?: string };
      if (!j.ok || !j.battle) {
        setMsg(j.reason === "no-store" ? "대결 서버가 아직 안 열렸어!" : "방을 못 찾았어!");
        return;
      }
      if (j.battle.status === "done") {
        setView({ k: "result", battle: j.battle });
        return;
      }
      if (j.battle.a.code === me) {
        setView({ k: "wait", id: j.battle.id });
        return;
      }
      setView({ k: "play", battle: j.battle });
    } catch {
      setMsg("인터넷을 확인해줘!");
    }
  }

  // B의 3판 플레이
  const [bPicks, setBPicks] = useState<BattleRound[]>([]);
  const [bRound, setBRound] = useState(0);

  async function submitAnswer(finalPicks: BattleRound[]) {
    if (view.k !== "play") return;
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "answer", id: view.battle.id, code: me, name: myName, rounds: withSockets(finalPicks) }),
      });
      const j = (await res.json()) as { ok: boolean; battle?: Battle; reason?: string };
      if (j.ok && j.battle) {
        claimBattleXP(j.battle.id, j.battle.winnerCode === me);
        setBPicks([]);
        setBRound(0);
        setView({ k: "result", battle: j.battle });
      } else {
        setMsg(j.reason === "closed" ? "이미 끝난 대결이야!" : "제출 실패!");
      }
    } catch {
      setMsg("인터넷을 확인해줘!");
    }
  }

  // 둘이서 모드
  const [localWinner, setLocalWinner] = useState<string | null>(null);

  function resolveLocal(p1: { name: string; rounds: BattleRound[] }, p2: { name: string; rounds: BattleRound[] }) {
    const results = p1.rounds.map((ar, i) => {
      const br = p2.rounds[i];
      const aVal = pval(ar.card, ar.stat);
      const bVal = pval(br.card, br.stat);
      return { aVal, bVal, win: aVal === bVal ? "draw" : aVal > bVal ? "a" : ("b" as string) };
    });
    const aW = results.filter((r) => r.win === "a").length;
    const bW = results.filter((r) => r.win === "b").length;
    const winner = aW === bW ? "무승부!" : aW > bW ? p1.name : p2.name;
    const id = `local-${Date.now()}`;
    claimBattleXP(id, true);
    addXP(3, "둘이서 대결!");
    setView({ k: "local-result", p1name: p1.name, p2name: p2.name, results, aRounds: p1.rounds, bRounds: p2.rounds });
    setLocalWinner(winner);
    speak(`${winner}!`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["online", "local"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setView({ k: "menu" }); setMsg(""); }}
            aria-pressed={tab === t}
            className={`flex-1 rounded-2xl px-4 py-3 text-xl font-black shadow ${tab === t ? "bg-red-300" : "bg-white"}`}
          >
            {t === "online" ? "🌐 온라인 대결" : "👫 둘이서 대결"}
          </button>
        ))}
      </div>
      {msg && <p className="rounded-2xl bg-white p-3 text-center font-black">{msg}</p>}

      {tab === "online" && view.k === "menu" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-2xl font-black">⚔️ 대결 신청하기</h2>
            <Link href="/friends" className="mt-2 block rounded-2xl bg-sky-200 px-4 py-3 text-center text-xl font-black">
              👫 친구 목록에서 신청!
            </Link>
            <button type="button" onClick={() => setView({ k: "create", toCode: "" })} className="mt-2 w-full rounded-2xl bg-red-300 px-4 py-3 text-xl font-black">
              코드로 방 만들기!
            </button>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-2xl font-black">📥 코드로 참가하기</h2>
            <div className="mt-2 flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="방 코드 4자리"
                maxLength={4}
                className="min-w-0 flex-1 rounded-2xl border-4 border-red-200 p-3 text-center text-2xl font-black tracking-widest"
              />
              <button type="button" onClick={() => joinBattle(joinCode)} className="rounded-2xl bg-red-300 px-6 py-3 text-xl font-black">
                입장!
              </button>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="text-2xl font-black">📮 도착한 대결 ({incoming.length})</h2>
            {incoming.length === 0 ? (
              <p className="mt-2 font-bold text-stone-500">아직 없어!</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {incoming.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3">
                    <p className="flex-1 font-black">{m.from}의 도전! ({m.status === "done" ? "끝남" : "대기중"})</p>
                    <button type="button" onClick={() => joinBattle(m.id)} className="rounded-2xl bg-red-300 px-4 py-2 font-black">
                      보기!
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "online" && view.k === "create" && (
        <DeckBuilder title="내 덱 3장 정하기!" onDone={(rounds) => createBattle(rounds, view.toCode)} />
      )}

      {tab === "online" && view.k === "wait" && (
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <p className="text-4xl">⏳</p>
          <h2 className="text-3xl font-black">친구를 기다리는 중...</h2>
          <p className="mt-2 text-5xl font-black tracking-widest">{view.id}</p>
          {view.toCode ? (
            <p className="font-bold text-stone-500">친구에게 신청됐어! 친구가 &lsquo;도착한 대결&rsquo;에서 확인하면 시작돼!</p>
          ) : (
            <p className="font-bold text-stone-500">이 코드를 친구에게 알려줘!</p>
          )}
          <button type="button" onClick={() => setView({ k: "menu" })} className="mt-3 rounded-full bg-stone-100 px-6 py-2 font-black">
            그만두기
          </button>
        </div>
      )}

      {tab === "online" && view.k === "play" && (
        <PlayView
          battle={view.battle}
          picks={bPicks}
          setPicks={setBPicks}
          round={bRound}
          setRound={setBRound}
          onDone={submitAnswer}
        />
      )}

      {tab === "online" && view.k === "result" && <ResultView battle={view.battle} myCode={me} />}

      {tab === "local" && view.k === "menu" && (
        <div className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-2xl font-black">👫 한 화면에서 둘이서!</h2>
          <p className="font-bold text-stone-500">번갈아 덱을 짜고 바로 붙어!</p>
          <div className="mt-2 flex gap-2">
            <input value={p1name} onChange={(e) => setP1name(e.target.value)} placeholder="1P 이름" maxLength={6} className="min-w-0 flex-1 rounded-2xl border-4 border-sky-200 p-3 text-xl font-black" />
            <input value={p2name} onChange={(e) => setP2name(e.target.value)} placeholder="2P 이름" maxLength={6} className="min-w-0 flex-1 rounded-2xl border-4 border-pink-200 p-3 text-xl font-black" />
          </div>
          <button
            type="button"
            disabled={!p1name.trim() || !p2name.trim()}
            onClick={() => setView({ k: "local-p1" })}
            className="mt-2 w-full rounded-2xl bg-red-300 px-4 py-3 text-xl font-black disabled:opacity-40"
          >
            시작!
          </button>
        </div>
      )}

      {tab === "local" && view.k === "local-p1" && (
        <div>
          <p className="mb-2 text-center text-xl font-black">📱 {p1name || "1P"}만 봐! ({p2name || "2P"}는 눈 가려!)</p>
          <DeckBuilder
            title={`${p1name || "1P"} 덱 짜기!`}
            onDone={(rounds) => {
              setView({ k: "local-p2", p1: { name: p1name || "1P", rounds } });
            }}
          />
        </div>
      )}

      {tab === "local" && view.k === "local-p2" && (
        <div>
          <p className="mb-2 text-center text-xl font-black">📱 이제 {p2name || "2P"}만 봐!</p>
          <DeckBuilder
            title={`${p2name || "2P"} 덱 짜기!`}
            onDone={(rounds) => resolveLocal(view.p1, { name: p2name || "2P", rounds })}
          />
        </div>
      )}

      {tab === "local" && view.k === "local-result" && (
        <div className="flex flex-col gap-4">
          <div className="animate-pop rounded-3xl bg-gradient-to-b from-amber-200 to-pink-200 p-6 text-center shadow">
            <p className="text-5xl">🏆</p>
            <h2 className="text-3xl font-black">{localWinner}!</h2>
            <p className="text-xl font-black text-violet-700">+10 XP!</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow">
            {view.results.map((r, i) => {
              const a = view.aRounds[i];
              const b = view.bRounds[i];
              const aj = jobOf(a.card);
              const bj = jobOf(b.card);
              const av = pval(a.card, a.stat);
              const bv = pval(b.card, b.stat);
              return (
                <p key={i} className="mt-1 rounded-2xl bg-stone-50 p-3 font-black">
                  {r.win === "draw" ? "➖" : r.win === "a" ? `⭕ ${view.p1name}` : `⭕ ${view.p2name}`} {i + 1}판 ·{" "}
                  {aj?.emoji}{av} vs {bj?.emoji}{bv} ({a.stat})
                </p>
              );
            })}
            <button type="button" onClick={() => { setView({ k: "menu" }); setLocalWinner(null); }} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-black shadow">
              다시 하기!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayView({
  battle,
  picks,
  setPicks,
  round,
  setRound,
  onDone,
}: {
  battle: Battle;
  picks: BattleRound[];
  setPicks: (p: BattleRound[]) => void;
  round: number;
  setRound: (n: number) => void;
  onDone: (finalPicks: BattleRound[]) => void;
}) {
  const foe = battle.aRounds[round];
  const foeJob = jobOf(foe.card);
  const [code, setCode] = useState("");
  const [stat, setStat] = useState(STATS[0]);
  const [pool] = useState(() => {
    const owned = ownedCodes();
    return owned.length >= 3 ? MOCK_JOBS.filter((j) => owned.includes(j.code)) : MOCK_JOBS;
  });
  const used = picks.map((p) => p.card);

  function confirm() {
    if (!code) return;
    const next = [...picks, { card: code, stat }];
    setPicks(next);
    setCode("");
    if (round + 1 >= 3) {
      onDone(next);
    } else {
      setRound(round + 1);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="font-black text-stone-500">{round + 1}판 / 3판</p>
      <div className="mt-2 flex flex-col items-center rounded-2xl bg-red-100 p-4 text-center">
        <p className="font-black text-stone-500">{battle.a.name}가 낸 카드!</p>
        {foeJob && (
          <div className="mt-2 w-28">
            <JobCardFace job={foeJob} no={noOf(foe.card)} />
          </div>
        )}
        <p className="mt-1 text-lg font-black">
          겨루는 힘: {foe.stat}
          {foe.bonus ? ` (보물 강화 +${foe.bonus})` : ""}
        </p>
      </div>
      <p className="mt-3 text-xl font-black">내 카드 내기!</p>
      <div className="mt-1 flex max-h-48 flex-wrap gap-1 overflow-y-auto">
        {pool.slice(0, 40).map((j) => {
          const taken = used.includes(j.code);
          return (
            <button
              key={j.code}
              type="button"
              disabled={taken}
              onClick={() => setCode(j.code)}
              className={`rounded-xl px-2 py-1 text-2xl ${code === j.code ? "bg-amber-400" : taken ? "bg-stone-100 opacity-40" : "bg-stone-50 shadow"}`}
            >
              {j.emoji}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {STATS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStat(s)}
            className={`rounded-full px-3 py-1 font-black ${stat === s ? "bg-violet-400" : "bg-stone-100"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!code}
        onClick={confirm}
        className="mt-3 w-full rounded-2xl bg-red-400 px-4 py-3 text-xl font-black disabled:opacity-40"
      >
        내기!
      </button>
    </div>
  );
}
