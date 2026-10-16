"use client";

import { useEffect, useState } from "react";
import { MOCK_JOBS } from "@/lib/mock";
import { addXP } from "@/lib/xp";
import { speak } from "@/lib/speak";

type Tab = "who" | "sos" | "vs";

const SOS: Array<{ s: string; choices: string[]; answer: number }> = [
  { s: "불이 났어! 누구에게 연락할까?", choices: ["소방관", "제빵사", "사서", "미용사"], answer: 0 },
  { s: "배가 아파! 어디로 갈까?", choices: ["놀이터", "의사", "영화관", "빵집"], answer: 1 },
  { s: "이를 치료하고 싶어!", choices: ["치과의사", "운전사", "농부", "가수"], answer: 0 },
  { s: "길을 잃었어! 누구에게 물어볼까?", choices: ["경찰관", "고양이", "텔레비전", "냉장고"], answer: 0 },
  { s: "머리를 자르고 싶어!", choices: ["미용사", "소방관", "조종사", "선장"], answer: 0 },
  { s: "책을 빌리고 싶어!", choices: ["사서", "경찰관", "요리사", "군인"], answer: 0 },
];

function pick<T>(arr: T[], n: number): T[] {
  const c = [...arr];
  const out: T[] = [];
  while (out.length < n && c.length > 0) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  return out;
}

interface WhoHistory {
  line: string;
  jobs: { code: string; name: string; emoji: string }[];
  answer: number;
  picked: number;
}

function WhoGame() {
  const [round, setRound] = useState(() => ({
    jobs: MOCK_JOBS.slice(0, 4),
    answer: 0,
    line: MOCK_JOBS[0].easy3[0],
  }));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [n, setN] = useState(1);
  const [history, setHistory] = useState<WhoHistory[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  // 첫 문제는 저장용, 열리자마자 섞음 (prerender에선 고정값)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(newRound());
  }, []);

  function newRound() {
    const jobs = pick(MOCK_JOBS, 4);
    const answer = Math.floor(Math.random() * 4);
    const line = jobs[answer].easy3[Math.floor(Math.random() * 3)];
    return { jobs, answer, line };
  }

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setHistory((h) => [...h, { line: round.line, jobs: round.jobs.map((j) => ({ code: j.code, name: j.name, emoji: j.emoji })), answer: round.answer, picked: i }]);
    if (i === round.answer) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + 3);
      addXP(3, "게임 정답!");
      speak("맞았어! 3 XP 받았다!");
    } else {
      speak(`땡! 정답은 ${round.jobs[round.answer].name}!`);
    }
  }

  function next() {
    if (n >= 5) {
      setFinished(true);
      return;
    }
    setN(n + 1);
    setRound(newRound());
    setPicked(null);
  }

  function restart() {
    setN(1);
    setScore(0);
    setXpEarned(0);
    setHistory([]);
    setFinished(false);
    setRound(newRound());
    setPicked(null);
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-6 text-center shadow">
          <p className="text-4xl">🎉</p>
          <h2 className="text-3xl font-black">5문제 중 {score}개!</h2>
          <p className="mt-1 text-xl font-black text-violet-700">+{xpEarned} XP 받았다!</p>
          <button type="button" onClick={restart} className="mt-3 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black">
            다시 놀기!
          </button>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-2xl font-black">📝 정답 확인!</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {history.map((h, i) => {
              const ok = h.picked === h.answer;
              return (
                <li key={i} className={`rounded-2xl border-4 p-4 ${ok ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-lg font-black">
                    {ok ? "⭕" : "❌"} {i + 1}. “{h.line}”
                  </p>
                  <p className="mt-1 font-bold">
                    내가 고른 답: {h.jobs[h.picked].emoji} {h.jobs[h.picked].name}
                  </p>
                  {!ok && (
                    <p className="font-black text-emerald-700">
                      정답: {h.jobs[h.answer].emoji} {h.jobs[h.answer].name}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="font-black text-stone-500">문제 {n} / 5 · {score}점 · 이번 게임 +{xpEarned} XP</p>
      <h2 className="mt-1 text-2xl font-black">“{round.line}” — 누구일까?</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {round.jobs.map((j, i) => {
          const isAnswer = picked !== null && i === round.answer;
          const isWrongPick = picked === i && i !== round.answer;
          return (
            <button
              key={j.code}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-4 px-4 py-4 text-xl font-black ${
                picked === null
                  ? "border-violet-200 bg-violet-50"
                  : isAnswer
                    ? "border-green-500 bg-green-100"
                    : isWrongPick
                      ? "border-red-400 bg-red-100"
                      : "border-stone-200 bg-stone-50"
              }`}
            >
              {j.emoji} {j.name} {isAnswer ? "⭕" : isWrongPick ? "❌" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div>
          <p className={`mt-2 text-center text-xl font-black ${picked === round.answer ? "text-emerald-600" : "text-stone-500"}`}>
            {picked === round.answer ? "🎉 +3 XP!" : "다음엔 맞힐 수 있어!"}
          </p>
          <button type="button" onClick={next} className="mt-2 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black">
            {n >= 5 ? "결과 보기!" : "다음 문제!"}
          </button>
        </div>
      )}
    </div>
  );
}

function SosGame() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [history, setHistory] = useState<Array<{ s: string; choices: string[]; answer: number; picked: number }>>([]);
  const [finished, setFinished] = useState(false);
  const q = SOS[idx % SOS.length];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setHistory((h) => [...h, { s: q.s, choices: q.choices, answer: q.answer, picked: i }]);
    if (i === q.answer) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + 3);
      addXP(3, "게임 정답!");
      speak("정답! 3 XP 받았다!");
    } else {
      speak(`아쉬워! 정답은 ${q.choices[q.answer]}!`);
    }
  }

  function next() {
    if (idx + 1 >= SOS.length) {
      setFinished(true);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  }

  function restart() {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setXpEarned(0);
    setHistory([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-6 text-center shadow">
          <p className="text-4xl">🎉</p>
          <h2 className="text-3xl font-black">{SOS.length}개 중 {score}개!</h2>
          <p className="mt-1 text-xl font-black text-amber-600">+{xpEarned} XP 받았다!</p>
          <button type="button" onClick={restart} className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black">
            다시 놀기!
          </button>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-2xl font-black">📝 정답 확인!</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {history.map((h, i) => {
              const ok = h.picked === h.answer;
              return (
                <li key={i} className={`rounded-2xl border-4 p-4 ${ok ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-lg font-black">
                    {ok ? "⭕" : "❌"} {i + 1}. {h.s}
                  </p>
                  <p className="mt-1 font-bold">내가 고른 답: {h.choices[h.picked]}</p>
                  {!ok && <p className="font-black text-emerald-700">정답: {h.choices[h.answer]}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="font-black text-stone-500">상황 {idx + 1} / {SOS.length} · {score}점 · 이번 게임 +{xpEarned} XP</p>
      <h2 className="mt-1 text-2xl font-black">{q.s}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {q.choices.map((c, i) => {
          const isAnswer = picked !== null && i === q.answer;
          const isWrongPick = picked === i && i !== q.answer;
          return (
            <button
              key={c}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-4 px-4 py-3 text-xl font-black ${
                picked === null
                  ? "border-amber-200 bg-amber-50"
                  : isAnswer
                    ? "border-green-500 bg-green-100"
                    : isWrongPick
                      ? "border-red-400 bg-red-100"
                      : "border-stone-200 bg-stone-50"
              }`}
            >
              {c} {isAnswer ? "⭕" : isWrongPick ? "❌" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div>
          <p className={`mt-2 text-center text-xl font-black ${picked === q.answer ? "text-emerald-600" : "text-stone-500"}`}>
            {picked === q.answer ? "🎉 +3 XP!" : "다음엔 맞힐 수 있어!"}
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-2 w-full rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black"
          >
            {idx + 1 >= SOS.length ? "결과 보기!" : "다음 상황!"}
          </button>
        </div>
      )}
    </div>
  );
}

function VsGame() {
  const [entrants, setEntrants] = useState(() => MOCK_JOBS.slice(0, 8));
  const [matchIdx, setMatchIdx] = useState(0);
  const [winners, setWinners] = useState<typeof MOCK_JOBS>([]);
  const [champion, setChampion] = useState<(typeof MOCK_JOBS)[number] | null>(null);
  const [splash, setSplash] = useState<string | null>("8강 시작!");

  // prerender엔 고정, 열리자마자 섞음
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntrants(pick(MOCK_JOBS, 8));
  }, []);

  // 스플래시는 1.3초 뒤 사라짐
  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(null), 1300);
    return () => clearTimeout(t);
  }, [splash]);

  const roundSize = entrants.length;
  const roundName = roundSize === 8 ? "8강" : roundSize === 4 ? "4강" : "결승!";
  const pair = [entrants[matchIdx * 2], entrants[matchIdx * 2 + 1]].filter(Boolean);

  function choose(winner: (typeof MOCK_JOBS)[number]) {
    speak(`${winner.name}! 다음!`);
    const nextWinners = [...winners, winner];
    const lastMatch = matchIdx * 2 + 2 >= entrants.length;
    if (lastMatch) {
      if (nextWinners.length === 1) {
        setChampion(nextWinners[0]);
        addXP(5, "밸런스게임 우승!");
        speak(`우승! ${nextWinners[0].name}! 5 XP 받았다!`);
      } else {
        setEntrants(nextWinners);
        setMatchIdx(0);
        setWinners([]);
        setSplash(nextWinners.length === 4 ? "4강 진출!" : "결승전!");
      }
    } else {
      setWinners(nextWinners);
      setMatchIdx(matchIdx + 1);
    }
  }

  function restart() {
    setEntrants(pick(MOCK_JOBS, 8));
    setMatchIdx(0);
    setWinners([]);
    setChampion(null);
    setSplash("8강 시작!");
  }

  if (champion) {
    return (
      <div className="animate-pop rounded-3xl bg-gradient-to-b from-amber-200 to-pink-200 p-8 text-center shadow">
        <p className="text-4xl">🏆</p>
        <p className="text-7xl">{champion.emoji}</p>
        <h2 className="mt-2 text-3xl font-black">우승! {champion.name}!</h2>
        <p className="mt-1 text-xl font-black text-violet-700">+5 XP 받았다!</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={restart} className="flex-1 rounded-2xl bg-white px-4 py-3 text-xl font-black shadow">
            다시 하기!
          </button>
          <a href={`/jobs/${champion.code}`} className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 text-center text-xl font-black shadow">
            직업 보러 가기!
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-white p-6 text-center shadow">
      {splash && (
        <div key={splash} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <p className="animate-pop rounded-full bg-amber-400 px-10 py-6 text-5xl font-black shadow-2xl">
            {splash}
          </p>
        </div>
      )}
      <p className="font-black text-stone-500">
        {roundName} · {matchIdx + 1}번째 대결! · 이기면 +5 XP는 결승에서!
      </p>
      <h2 className="mt-1 text-2xl font-black">너라면? 둘 중 하나!</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {pair.map((j) => (
          <button
            key={j.code}
            type="button"
            onClick={() => choose(j)}
            className="rounded-3xl bg-gradient-to-b from-pink-200 to-amber-200 p-6 shadow"
          >
            <span className="text-6xl">{j.emoji}</span>
            <span className="block text-2xl font-black">{j.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GamesClient() {
  const [tab, setTab] = useState<Tab>("who");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["who", "sos", "vs"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`flex-1 rounded-2xl px-4 py-3 text-lg font-black shadow ${tab === t ? "bg-violet-400" : "bg-white"}`}
          >
            {t === "who" ? "🕵️ 누구일까?" : t === "sos" ? "🚨 위급상황!" : "⚖️ 밸런스게임"}
          </button>
        ))}
      </div>
      {tab === "who" && <WhoGame />}
      {tab === "sos" && <SosGame />}
      {tab === "vs" && <VsGame />}
      <p className="text-center font-bold text-stone-500">맞히면 XP! 수집함에서 레벨을 확인해봐!</p>
    </div>
  );
}
