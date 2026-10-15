"use client";

import { useState } from "react";
import { MOCK_QUIZ } from "@/lib/mock";
import { speak } from "@/lib/speak";

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem("brothers-quiz-best") ?? "0");
  } catch {
    return 0;
  }
}

export default function QuizRunner() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [best, setBest] = useState<number>(loadBest);

  const q = MOCK_QUIZ[idx];
  const done = results.length >= MOCK_QUIZ.length;
  const score = results.filter(Boolean).length;

  function pick(i: number) {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    if (ok) speak(`맞았어! ${q.say}`);
    else speak(`아쉬워! 정답은 ${q.choices[q.answer]}. ${q.say}`);
  }

  function next() {
    if (!q || picked === null) return;
    const ok = picked === q.answer;
    const nextResults = [...results, ok];
    setResults(nextResults);
    setPicked(null);
    if (nextResults.length >= MOCK_QUIZ.length) {
      const s = nextResults.filter(Boolean).length;
      try {
        const prev = Number(localStorage.getItem("brothers-quiz-best") ?? "0");
        const nb = Math.max(prev, s);
        localStorage.setItem("brothers-quiz-best", String(nb));
        setBest(nb);
      } catch {}
    } else {
      setIdx(idx + 1);
    }
  }

  function retry() {
    setIdx(0);
    setPicked(null);
    setResults([]);
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow">
        <p className="text-4xl">🎉</p>
        <h2 className="text-3xl font-black">
          끝! {MOCK_QUIZ.length}개 중 {score}개 맞혔어!
        </h2>
        <p className="mt-2 text-xl font-bold">{score >= 4 ? "칭호: 동네박사!" : score >= 2 ? "칭호: 탐험대원!" : "칭호: 탐험견습생!"}</p>
        <p className="mt-1 font-bold text-stone-500">역대 최고: {Math.max(best, score)}개</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={retry} className="flex-1 rounded-2xl bg-amber-400 px-6 py-3 text-xl font-black">
            다시 하기
          </button>
          <a href="/town" className="flex-1 rounded-2xl bg-emerald-300 px-6 py-3 text-center text-xl font-black">
            탐험하러 가기
          </a>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="h-4 overflow-hidden rounded-full bg-stone-200" aria-hidden>
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${(results.length / MOCK_QUIZ.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 font-black text-stone-500">
        {idx + 1} / {MOCK_QUIZ.length} · 지금까지 {score}개 성공
      </p>
      <h2 className="mt-1 text-2xl font-black">{q.q}</h2>
      <button
        type="button"
        onClick={() => speak(q.q)}
        className="mt-2 rounded-full bg-stone-100 px-4 py-1 font-black"
      >
        🔊 문제 읽어주기
      </button>
      <div className="mt-4 flex flex-col gap-3">
        {q.choices.map((c, i) => {
          const isAnswer = picked !== null && i === q.answer;
          const isWrongPick = picked === i && i !== q.answer;
          return (
            <button
              key={c}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-4 px-4 py-4 text-left text-xl font-black active:translate-y-0.5 ${
                isAnswer
                  ? "border-green-500 bg-green-100"
                  : isWrongPick
                    ? "border-red-400 bg-red-100"
                    : "border-amber-200 bg-amber-50"
              }`}
            >
              {i + 1}. {c} {isAnswer ? "⭕" : isWrongPick ? "❌" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 rounded-2xl bg-stone-100 p-4">
          <p className="text-lg font-bold">{q.say}</p>
          <button
            type="button"
            onClick={next}
            className="mt-3 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black"
          >
            {results.length + 1 >= MOCK_QUIZ.length ? "결과 보기!" : "다음 문제!"}
          </button>
        </div>
      )}
    </div>
  );
}
