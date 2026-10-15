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

const VS_COMMENTS = ["좋은 선택!", "형님도 그거!", "오호, 그 마음 알지!", "멋지다!"];

function pick<T>(arr: T[], n: number): T[] {
  const c = [...arr];
  const out: T[] = [];
  while (out.length < n && c.length > 0) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  return out;
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
    if (i === round.answer) {
      setScore((s) => s + 1);
      addXP(3);
      speak("맞았어! 3 XP!");
    } else {
      speak(`땡! 정답은 ${round.jobs[round.answer].name}!`);
    }
  }

  function next() {
    if (n >= 5) {
      setN(1);
      setScore(0);
    } else {
      setN(n + 1);
    }
    setRound(newRound());
    setPicked(null);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="font-black text-stone-500">문제 {n} / 5 · {score}점</p>
      <h2 className="mt-1 text-2xl font-black">“{round.line}” — 누구일까?</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {round.jobs.map((j, i) => (
          <button
            key={j.code}
            type="button"
            onClick={() => choose(i)}
            disabled={picked !== null}
            className={`rounded-2xl border-4 px-4 py-4 text-xl font-black ${
              picked === null
                ? "border-violet-200 bg-violet-50"
                : i === round.answer
                  ? "border-green-500 bg-green-100"
                  : "border-stone-200 bg-stone-50"
            }`}
          >
            {j.emoji} {j.name}
          </button>
        ))}
      </div>
      {picked !== null && (
        <button type="button" onClick={next} className="mt-4 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black">
          {n >= 5 ? "처음부터! (점수 리셋)" : "다음 문제!"}
        </button>
      )}
    </div>
  );
}

function SosGame() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = SOS[idx % SOS.length];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) {
      setScore((s) => s + 1);
      addXP(3);
      speak("정답! 3 XP!");
    } else {
      speak(`아쉬워! 정답은 ${q.choices[q.answer]}!`);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="font-black text-stone-500">{score}점</p>
      <h2 className="mt-1 text-2xl font-black">{q.s}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {q.choices.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => choose(i)}
            disabled={picked !== null}
            className={`rounded-2xl border-4 px-4 py-3 text-xl font-black ${
              picked === null
                ? "border-amber-200 bg-amber-50"
                : i === q.answer
                  ? "border-green-500 bg-green-100"
                  : "border-stone-200 bg-stone-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {picked !== null && (
        <button
          type="button"
          onClick={() => { setIdx(idx + 1); setPicked(null); }}
          className="mt-4 w-full rounded-2xl bg-amber-400 px-4 py-3 text-xl font-black"
        >
          다음 상황!
        </button>
      )}
    </div>
  );
}

function VsGame() {
  const [pair, setPair] = useState(() => [MOCK_JOBS[0], MOCK_JOBS[1]]);
  const [msg, setMsg] = useState("");
  const [n, setN] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPair(pick(MOCK_JOBS, 2));
  }, []);

  function choose(name: string) {
    addXP(1);
    const next = n + 1;
    setN(next);
    const c = VS_COMMENTS[next % VS_COMMENTS.length];
    setMsg(`${name}! ${c}`);
    speak(`${name}! ${c}`);
    setPair(pick(MOCK_JOBS, 2));
  }

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow">
      <p className="font-black text-stone-500">{n}번 골랐어!</p>
      <h2 className="mt-1 text-2xl font-black">너라면? 둘 중 하나!</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {pair.map((j) => (
          <button
            key={j.code}
            type="button"
            onClick={() => choose(j.name)}
            className="rounded-3xl bg-gradient-to-b from-pink-200 to-amber-200 p-6 shadow"
          >
            <span className="text-6xl">{j.emoji}</span>
            <span className="block text-2xl font-black">{j.name}</span>
          </button>
        ))}
      </div>
      {msg && <p className="animate-pop mt-3 text-xl font-black">{msg}</p>}
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
