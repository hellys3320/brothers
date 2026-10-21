"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_JOBS, type JobCard } from "@/lib/mock";
import { loadJobCards } from "@/lib/jobMission";
import { myCode } from "@/lib/friends";
import { loadMe } from "@/lib/me";
import { addXP, getXP, levelFor } from "@/lib/xp";
import { battleLevelBenefit, battleXPFor, clampLevel, momentumBonusFor } from "@/lib/battleLevel";
import { speak } from "@/lib/speak";
import JobCardFace from "@/components/JobCardFace";
import { loadSockets, socketBonusOf, socketFor, type Treasure } from "@/lib/treasures";
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

function ownedJobCards(): JobCard[] {
  const owned = new Set(loadJobCards());
  return MOCK_JOBS.filter((j) => owned.has(j.code));
}

function claimBattleXP(id: string, won: boolean, level: number) {
  try {
    const raw = JSON.parse(localStorage.getItem("brothers-battle-xp") ?? "[]") as string[];
    const v = Array.isArray(raw) ? raw : [];
    if (v.includes(id)) return;
    localStorage.setItem("brothers-battle-xp", JSON.stringify([...v, id]));
    addXP(battleXPFor(level, won), won ? "카드배틀 승리!" : "카드배틀 참가!");
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

/** 수집함과 똑같은 직업카드 앞면을 배틀에서도 그대로 보여준다. */
function CardTile({
  job,
  no,
  socket,
  selected = false,
  disabled = false,
  badge,
  onClick,
}: {
  job: JobCard;
  no?: string;
  socket?: Treasure | null;
  selected?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${job.name} 카드${badge ? `, ${badge}` : ""}`}
      className={`relative block w-full rounded-2xl text-left transition ${
        selected ? "ring-4 ring-amber-400" : ""
      } ${disabled ? "cursor-not-allowed grayscale" : "hover:-translate-y-0.5"}`}
    >
      <JobCardFace job={job} no={no} socket={socket} />
      {badge && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-900/25">
          <span className="whitespace-nowrap rounded-full bg-stone-900/85 px-2 py-0.5 text-[10px] font-black text-white shadow">
            {badge}
          </span>
        </span>
      )}
    </button>
  );
}

function NeedCards({ have, title, note }: { have: number; title: string; note: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow">
      <p className="text-5xl">🎴</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <p className="mt-2 font-bold text-stone-600">{note}</p>
      <p className="mt-1 text-xl font-black text-violet-700">지금 {have}장 보유</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link href="/jobs" className="rounded-2xl bg-sky-300 px-4 py-3 text-center text-xl font-black">
          직업 도감에서 카드 모으기
        </Link>
        <Link href="/mybox" className="rounded-2xl bg-white px-4 py-3 text-center font-black shadow">
          내 수집함 보기
        </Link>
      </div>
    </div>
  );
}

// 3판 덱 짜기 (내 카드 + 스탯 고르기 + 레벨 기세 한 판)
function DeckBuilder({
  title,
  onDone,
  allowMomentum = true,
  level,
}: {
  title: string;
  onDone: (rounds: BattleRound[]) => void;
  allowMomentum?: boolean;
  level: number;
}) {
  const [pool] = useState(ownedJobCards);
  const [sockets] = useState(loadSockets);
  const [picks, setPicks] = useState<BattleRound[]>([
    { card: "", stat: "힘" },
    { card: "", stat: "힘" },
    { card: "", stat: "힘" },
  ]);
  const [momentumRound, setMomentumRound] = useState<number | null>(null);
  const [activeRound, setActiveRound] = useState(0);
  const benefit = battleLevelBenefit(level);
  const momentum = allowMomentum ? benefit.momentum : 0;
  const ready = picks.every((p) => p.card);

  function setStat(i: number, stat: string) {
    setPicks((prev) => prev.map((p, k) => (k === i ? { ...p, stat } : p)));
  }

  // 다른 판에 쓴 카드를 누르면 이 판으로 옮기고, 원래 판은 비우거나 서로 바꾼다.
  function chooseCard(code: string) {
    const next = picks.map((p) => ({ ...p }));
    const oldIndex = next.findIndex((p, i) => i !== activeRound && p.card === code);
    if (oldIndex >= 0) {
      next[oldIndex].card = next[activeRound].card;
    }
    next[activeRound].card = code;
    setPicks(next);

    const nextEmpty = next.findIndex((p) => !p.card);
    if (nextEmpty >= 0) setActiveRound(nextEmpty);
  }

  function finish() {
    onDone(picks.map((p, i) => ({ ...p, momentum: i === momentumRound && momentum > 0 })));
  }

  if (pool.length < 3) {
    return (
      <NeedCards
        have={pool.length}
        title="직업카드가 3장 필요해!"
        note="친구와 대결하려면 수집함에 있는 내 직업카드 3장으로 덱을 짜야 해."
      />
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="font-bold text-stone-500">수집함에서 모은 내 카드 3장으로 덱을 짜자!</p>
      <div className="mt-2 rounded-2xl bg-amber-50 p-3 text-center">
        {allowMomentum ? (
          momentum > 0 ? (
            <p className="font-black text-amber-800">
              ⭐ Lv.{benefit.level} 기세: 3판 중 1판에 +{momentum}! 아래에서 쓸 판을 골라.
            </p>
          ) : (
            <p className="font-black text-stone-500">🔒 레벨 기세는 Lv.3부터! 지금은 Lv.{benefit.level}.</p>
          )
        ) : (
          <p className="font-black text-stone-500">👫 둘이서 모드는 레벨 기세 없이 공정하게!</p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((r) => {
          const p = picks[r];
          const job = p.card ? jobOf(p.card) : null;
          const active = activeRound === r;
          return (
            <div
              key={r}
              className={`rounded-2xl p-1.5 transition ${
                active ? "bg-amber-100 ring-2 ring-amber-400" : "bg-stone-50"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveRound(r)}
                aria-label={`${r + 1}판 카드 슬롯`}
                className="block w-full text-left"
              >
                {job ? (
                  <JobCardFace job={job} no={noOf(job.code)} socket={socketFor(sockets, job.code)} />
                ) : (
                  <div className="flex aspect-[5/7] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/70 text-center">
                    <span className="text-2xl">＋</span>
                    <span className="text-[11px] font-black text-stone-500">
                      {r + 1}판
                      <br />
                      카드
                    </span>
                  </div>
                )}
              </button>
              <select
                value={p.stat}
                onChange={(e) => setStat(r, e.target.value)}
                aria-label={`${r + 1}판 겨룰 힘`}
                className="mt-1 w-full rounded-lg border-0 bg-white px-1 py-1 text-center text-[11px] font-black shadow-sm"
              >
                {STATS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {allowMomentum && (
                <button
                  type="button"
                  disabled={momentum === 0}
                  onClick={() => setMomentumRound((cur) => (cur === r ? null : r))}
                  className={`mt-1 w-full rounded-lg px-1 py-1 text-[10px] font-black disabled:opacity-40 ${
                    momentumRound === r ? "bg-amber-400" : "bg-white shadow-sm"
                  }`}
                >
                  {momentum === 0 ? "🔒 기세" : momentumRound === r ? `⭐ +${momentum}` : "⭐ 기세"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-stone-50 p-3">
        <div className="flex items-end justify-between gap-2">
          <p className="font-black">🎴 내 직업카드 {pool.length}장</p>
          <p className="text-right text-[11px] font-bold text-stone-500">{activeRound + 1}판에 넣을 카드를 눌러!</p>
        </div>
        <div className="mt-3 grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          {pool.map((j) => {
            const usedRound = picks.findIndex((p) => p.card === j.code);
            const isSelected = usedRound === activeRound;
            const usedElsewhere = usedRound >= 0 && usedRound !== activeRound;
            return (
              <CardTile
                key={j.code}
                job={j}
                no={noOf(j.code)}
                socket={socketFor(sockets, j.code)}
                selected={isSelected}
                badge={usedElsewhere ? `${usedRound + 1}판 사용` : undefined}
                onClick={() => chooseCard(j.code)}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11px] font-bold text-stone-500">
          다른 판에 쓴 카드를 누르면 이 판으로 옮겨져!
        </p>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={finish}
        className="mt-3 w-full rounded-2xl bg-red-400 px-4 py-3 text-xl font-black disabled:opacity-40"
      >
        {ready ? "이 덱으로 확정!" : "카드 3장을 골라줘!"}
      </button>
    </div>
  );
}

function ResultView({ battle, myCode: me, myLevel }: { battle: Battle; myCode: string; myLevel: number }) {
  const [sockets] = useState(loadSockets);
  const iAmA = battle.a.code === me;
  const myWins = battle.result?.filter((r) => (iAmA ? r.win === "a" : r.win === "b")).length ?? 0;
  const won = battle.winnerCode === me;
  const draw = !battle.winnerCode;
  const rewardLevel = iAmA ? clampLevel(battle.a.level ?? myLevel) : clampLevel(battle.b?.level ?? myLevel);
  const xp = battleXPFor(rewardLevel, won);
  const aLv = clampLevel(battle.a.level);
  const bLv = clampLevel(battle.b?.level);
  const aBenefit = battleLevelBenefit(aLv);
  const bBenefit = battleLevelBenefit(bLv);

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-pop rounded-3xl bg-gradient-to-b from-amber-200 to-pink-200 p-6 text-center shadow">
        <p className="text-5xl">{draw ? "🤝" : won ? "🏆" : "😅"}</p>
        <h2 className="text-3xl font-black">
          {draw ? "무승부!" : won ? "승리!" : `${battle.a.code === me ? battle.b?.name : battle.a.name} 승리!`}
        </h2>
        <p className="mt-1 font-black text-stone-600">
          🎖️ Lv.{aLv} {aBenefit.badge} {battle.a.name}
          {battle.b && (
            <>
              {" "}vs Lv.{bLv} {bBenefit.badge} {battle.b.name}
            </>
          )}
        </p>
        <p className="text-xl font-black text-violet-700">+{xp} XP!</p>
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
                  <div className="w-14 shrink-0">
                    {aj && (
                      <JobCardFace
                        job={aj}
                        no={noOf(a.card)}
                        socket={iAmA ? socketFor(sockets, a.card) : null}
                        emptySocketLabel={!iAmA && a.bonus ? `💠 보물 +${a.bonus}` : "빈 소켓"}
                      />
                    )}
                  </div>
                  <p className="text-xl">{r.aVal}</p>
                  <span className="font-black text-stone-400">vs</span>
                  <p className="text-xl">{r.bVal}</p>
                  <div className="w-14 shrink-0">
                    {b && bj && (
                      <JobCardFace
                        job={bj}
                        no={noOf(b.card)}
                        socket={!iAmA ? socketFor(sockets, b.card) : null}
                        emptySocketLabel={iAmA && b.bonus ? `💠 보물 +${b.bonus}` : "빈 소켓"}
                      />
                    )}
                  </div>
                </div>
                {(a.momentum || b?.momentum || a.bonus || b?.bonus) && (
                  <p className="mt-1 text-sm font-bold text-stone-500">
                    {a.momentum ? "⭐ A 기세 " : ""}
                    {a.bonus ? `💠 A보물+${a.bonus} ` : ""}
                    {b?.momentum ? "⭐ B 기세 " : ""}
                    {b?.bonus ? `💠 B보물+${b.bonus}` : ""}
                  </p>
                )}
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

function BattleLevelCard({ level }: { level: number }) {
  const b = battleLevelBenefit(level);
  const nextB = b.next ? battleLevelBenefit(b.next.level) : null;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-100 to-pink-100 p-5 shadow">
      <p className="text-xl font-black">
        🎖️ Lv.{b.level} {b.badge} {b.name}
      </p>
      <ul className="mt-2 flex flex-col gap-1 font-bold text-stone-700">
        <li>
          {b.momentum > 0
            ? `⭐ 기세: 3판 중 1판에 +${b.momentum} (보물과 합쳐 최대 +5)`
            : "🔒 기세: Lv.3부터 사용 가능"}
        </li>
        <li>🏆 승리 +{b.winXP} XP · 참가 +{b.loseXP} XP</li>
        {b.next && (
          <li className="text-violet-700">
            다음 Lv.{b.next.level} {b.next.name}
            {nextB && nextB.momentum > b.momentum ? ` · 기세 +${nextB.momentum}` : ""}
            {nextB && nextB.winXP > b.winXP ? ` · 승리 XP +${nextB.winXP}` : ""}
          </li>
        )}
      </ul>
    </div>
  );
}

export default function BattleClient() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const [tab, setTab] = useState<"online" | "local">("online");
  const [me] = useState(() => myCode());
  const [myName] = useState(() => loadMe()?.nickname ?? "탐험대원");
  const [myLevel, setMyLevel] = useState(() => clampLevel(levelFor(getXP()).lv));
  const [localSockets] = useState(loadSockets);

  // 배틀 보상으로 레벨이 오르면 배틀 화면의 혜택도 바로 갱신
  useEffect(() => {
    const sync = () => setMyLevel(clampLevel(levelFor(getXP()).lv));
    window.addEventListener("brothers-xp", sync);
    return () => window.removeEventListener("brothers-xp", sync);
  }, []);
  const [view, setView] = useState<
    | { k: "menu" }
    | { k: "create"; toCode: string }
    | { k: "wait"; id: string; toCode?: string }
    | { k: "play"; battle: Battle }
    | { k: "result"; battle: Battle }
    | { k: "local-p1" } | { k: "local-p2"; p1: { name: string; rounds: BattleRound[] } } | { k: "local-result"; p1name: string; p2name: string; results: Array<{ aVal: number; bVal: number; win: string }> ; aRounds: BattleRound[]; bRounds: BattleRound[]; level: number }
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
          claimBattleXP(j.battle.id, j.battle.winnerCode === me, myLevel);
          setView({ k: "result", battle: j.battle });
        }
      } catch {}
    };
    const iv = setInterval(check, 3000);
    return () => {
      live = false;
      clearInterval(iv);
    };
  }, [view, me, myLevel]);

  async function createBattle(rounds: BattleRound[], toCode: string) {
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "create", aCode: me, aName: myName, toCode: toCode || undefined, level: myLevel, rounds: withSockets(rounds) }),
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
        body: JSON.stringify({ op: "answer", id: view.battle.id, code: me, name: myName, level: myLevel, rounds: withSockets(finalPicks) }),
      });
      const j = (await res.json()) as { ok: boolean; battle?: Battle; reason?: string };
      if (j.ok && j.battle) {
        claimBattleXP(j.battle.id, j.battle.winnerCode === me, myLevel);
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
    const aRounds = withSockets(p1.rounds);
    const bRounds = withSockets(p2.rounds);
    const results = aRounds.map((ar, i) => {
      const br = bRounds[i];
      const aVal = pval(ar.card, ar.stat) + (ar.bonus ?? 0);
      const bVal = pval(br.card, br.stat) + (br.bonus ?? 0);
      return { aVal, bVal, win: aVal === bVal ? "draw" : aVal > bVal ? "a" : ("b" as string) };
    });
    const aW = results.filter((r) => r.win === "a").length;
    const bW = results.filter((r) => r.win === "b").length;
    const winner = aW === bW ? "무승부!" : aW > bW ? p1.name : p2.name;
    const id = `local-${Date.now()}`;
    claimBattleXP(id, aW !== bW, myLevel);
    setView({ k: "local-result", p1name: p1.name, p2name: p2.name, results, aRounds, bRounds, level: myLevel });
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
          <BattleLevelCard level={myLevel} />
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
        <DeckBuilder title="내 덱 3장 정하기!" level={myLevel} onDone={(rounds) => createBattle(rounds, view.toCode)} />
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
          level={myLevel}
          onDone={submitAnswer}
        />
      )}

      {tab === "online" && view.k === "result" && <ResultView battle={view.battle} myCode={me} myLevel={myLevel} />}

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
            level={myLevel}
            allowMomentum={false}
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
            level={myLevel}
            allowMomentum={false}
            onDone={(rounds) => resolveLocal(view.p1, { name: p2name || "2P", rounds })}
          />
        </div>
      )}

      {tab === "local" && view.k === "local-result" && (
        <div className="flex flex-col gap-4">
          <div className="animate-pop rounded-3xl bg-gradient-to-b from-amber-200 to-pink-200 p-6 text-center shadow">
            <p className="text-5xl">🏆</p>
            <h2 className="text-3xl font-black">{localWinner}!</h2>
            <p className="mt-1 font-bold text-stone-600">👫 둘이서 모드는 레벨 기세 없이 순수 카드 대결!</p>
            <p className="text-xl font-black text-violet-700">+{battleXPFor(view.level, localWinner !== "무승부!")} XP!</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow">
            {view.results.map((r, i) => {
              const a = view.aRounds[i];
              const b = view.bRounds[i];
              const aj = jobOf(a.card);
              const bj = jobOf(b.card);
              const av = r.aVal;
              const bv = r.bVal;
              return (
                <div key={i} className="mt-2 rounded-2xl bg-stone-50 p-3 font-black">
                  <p>
                    {r.win === "draw" ? "➖" : r.win === "a" ? `⭕ ${view.p1name}` : `⭕ ${view.p2name}`} {i + 1}판 ·{" "}
                    {a.stat} 대결!
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-14 shrink-0">
                      {aj && <JobCardFace job={aj} no={noOf(a.card)} socket={socketFor(localSockets, a.card)} />}
                    </div>
                    <p className="text-xl">{av}</p>
                    <span className="font-black text-stone-400">vs</span>
                    <p className="text-xl">{bv}</p>
                    <div className="w-14 shrink-0">
                      {bj && <JobCardFace job={bj} no={noOf(b.card)} socket={socketFor(localSockets, b.card)} />}
                    </div>
                  </div>
                </div>
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
  level,
  onDone,
}: {
  battle: Battle;
  picks: BattleRound[];
  setPicks: (p: BattleRound[]) => void;
  round: number;
  setRound: (n: number) => void;
  level: number;
  onDone: (finalPicks: BattleRound[]) => void;
}) {
  const foe = battle.aRounds[round];
  const foeJob = jobOf(foe.card);
  const [code, setCode] = useState("");
  const [stat, setStat] = useState(STATS[0]);
  const [momentumUsed, setMomentumUsed] = useState(false);
  const [useMomentum, setUseMomentum] = useState(false);
  const [pool] = useState(ownedJobCards);
  const [sockets] = useState(loadSockets);
  const myMomentum = battleLevelBenefit(level).momentum;
  const selectedJob = code ? jobOf(code) : null;

  function confirm() {
    if (!code) return;
    const useNow = useMomentum && !momentumUsed && myMomentum > 0;
    const next = [...picks, { card: code, stat, momentum: useNow }];
    if (useNow) setMomentumUsed(true);
    setUseMomentum(false);
    setPicks(next);
    setCode("");
    if (round + 1 >= 3) {
      onDone(next);
    } else {
      setRound(round + 1);
    }
  }

  if (pool.length < 3) {
    return (
      <NeedCards
        have={pool.length}
        title="이 대결에 낼 카드가 3장 필요해!"
        note="친구의 대결은 수집함에 있는 내 직업카드 3장으로만 받을 수 있어."
      />
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="font-black text-stone-500">{round + 1}판 / 3판</p>
      <div className="mt-2 flex flex-col items-center rounded-2xl bg-red-100 p-4 text-center">
        <p className="font-black text-stone-500">
          {battle.a.name} · Lv.{clampLevel(battle.a.level)} {battleLevelBenefit(battle.a.level).badge}가 낸 카드!
        </p>
        {foeJob && (
          <div className="mt-2 w-28">
            <JobCardFace
              job={foeJob}
              no={noOf(foe.card)}
              emptySocketLabel={foe.bonus ? `💠 보물 +${foe.bonus}` : "빈 소켓"}
            />
          </div>
        )}
        <p className="mt-1 text-lg font-black">
          겨루는 힘: {foe.stat}
          {foe.bonus ? ` · 💠 보물 +${foe.bonus}` : ""}
          {foe.momentum ? ` · ⭐ 기세 +${momentumBonusFor(battle.a.level ?? 1)}` : ""}
        </p>
      </div>
      <p className="mt-3 text-xl font-black">내 카드 내기!</p>
      <div className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-2xl bg-stone-50 p-2 sm:grid-cols-4">
        {pool.map((j) => {
          const usedRound = picks.findIndex((p) => p.card === j.code);
          const taken = usedRound >= 0;
          return (
            <CardTile
              key={j.code}
              job={j}
              no={noOf(j.code)}
              socket={socketFor(sockets, j.code)}
              selected={code === j.code}
              disabled={taken}
              badge={taken ? `${usedRound + 1}판 사용` : undefined}
              onClick={() => setCode(j.code)}
            />
          );
        })}
      </div>
      {selectedJob && (
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-amber-50 p-2">
          <div className="w-20 shrink-0">
            <JobCardFace
              job={selectedJob}
              no={noOf(selectedJob.code)}
              socket={socketFor(sockets, selectedJob.code)}
            />
          </div>
          <p className="font-black">
            {selectedJob.name} × {stat}로 겨루기!
          </p>
        </div>
      )}
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
      {myMomentum > 0 ? (
        <button
          type="button"
          disabled={momentumUsed}
          onClick={() => setUseMomentum((v) => !v)}
          className={`mt-2 w-full rounded-2xl px-4 py-2 font-black shadow disabled:opacity-50 ${
            useMomentum ? "bg-amber-400" : "bg-amber-100"
          }`}
        >
          {momentumUsed
            ? "⭐ 이번 대결 기세 사용 완료!"
            : useMomentum
              ? `⭐ 이 판에 기세 +${myMomentum} 사용!`
              : `⭐ 이 판에 기세 +${myMomentum} 쓰기 (한 번만)`}
        </button>
      ) : (
        <p className="mt-2 rounded-2xl bg-stone-100 p-2 text-center font-bold text-stone-500">
          🔒 레벨 기세는 Lv.3부터!
        </p>
      )}
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
