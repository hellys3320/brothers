"use client";

import { useEffect, useRef, useState } from "react";
import { MOCK_QUIZ, getDailyQuiz, QUIZ_PLACE, type QuizItem } from "@/lib/mock";
import { speak } from "@/lib/speak";
import { addXP } from "@/lib/xp";
import { saveQuest, type TownQuest } from "@/lib/quest";

const TIME_LIMIT = 5;

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem("brothers-quiz-best") ?? "0");
  } catch {
    return 0;
  }
}

export default function QuizRunner() {
  // 오늘의 문제 (prerender엔 고정, 열리자마자 날짜 기준으로 교체)
  const [quiz, setQuiz] = useState<QuizItem[]>(MOCK_QUIZ.slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const [best, setBest] = useState<number>(loadBest);
  const [xpNote, setXpNote] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [quest, setQuest] = useState<TownQuest | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuiz(getDailyQuiz());
  }, []);

  const q = quiz[idx];
  const done = results.length >= quiz.length;
  const score = results.filter(Boolean).length;

  function pick(i: number) {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    if (ok) speak(`맞았어! ${q.say}`);
    else speak(`아쉬워! 정답은 ${q.choices[q.answer]}. ${q.say}`);
  }

  function advance(choice: number) {
    if (!q) return;
    const ok = choice === q.answer;
    const nextResults = [...results, ok];
    setResults(nextResults);
    setPicks([...picks, choice]);
    setPicked(null);
    setTimeLeft(TIME_LIMIT);
    if (nextResults.length >= quiz.length) {
      finish(nextResults);
    } else {
      setIdx(idx + 1);
    }
  }

  function next() {
    if (!q || picked === null || picked === -1) return;
    advance(picked);
  }

  function finish(nextResults: boolean[]) {
    const s = nextResults.filter(Boolean).length;
    try {
      const prev = Number(localStorage.getItem("brothers-quiz-best") ?? "0");
      const nb = Math.max(prev, s);
      localStorage.setItem("brothers-quiz-best", String(nb));
      setBest(nb);
    } catch {}
    // XP는 하루 1번만 (반복 풀기 farming 방지)
    const today = new Date().toDateString();
    let first = true;
    try {
      first = localStorage.getItem("brothers-quiz-xp-date") !== today;
      if (first) localStorage.setItem("brothers-quiz-xp-date", today);
    } catch {}
    if (first && s > 0) {
      addXP(s * 5, `퀴즈 ${s}개 정답!`);
      setXpNote(`+${s * 5} XP 받았다!`);
      speak(`끝! ${s}개 맞혔어! ${s * 5} XP 받았다!`);
    } else if (s > 0) {
      setXpNote("오늘 XP는 이미 받았어! 내일 또 받아!");
      speak(`끝! ${s}개 맞혔어! XP는 내일 또 받자!`);
    } else {
      setXpNote("");
      speak(`끝! 아쉬워! 다시 해보자!`);
    }
    // 동네 미션 발급: 틀린 문제의 장소를 동네에서 찾기 (최대 2곳)
    const kinds: string[] = [];
    quiz.forEach((item, i) => {
      if (!nextResults[i]) {
        const k = QUIZ_PLACE[item.id] as string | undefined;
        if (k && !kinds.includes(k) && kinds.length < 2) kinds.push(k);
      }
    });
    const finalKinds = kinds.length > 0 ? kinds : ["빵집"];
    const nq: TownQuest = { date: today, kinds: finalKinds, done: false };
    saveQuest(nq);
    setQuest(nq);
  }

  function resetTo(list: QuizItem[]) {
    setQuiz(list);
    setIdx(0);
    setPicked(null);
    setResults([]);
    setPicks([]);
    setXpNote("");
    setQuest(null);
    setTimeLeft(TIME_LIMIT);
  }

  function retry() {
    resetTo(quiz);
  }

  function otherQuiz() {
    const rest = MOCK_QUIZ.filter((item) => !quiz.some((x) => x.id === item.id));
    const shuffled = [...rest].sort(() => Math.random() - 0.5).slice(0, 10);
    resetTo(shuffled.length > 0 ? shuffled : getDailyQuiz());
  }

  function retryWrong() {
    resetTo(quiz.filter((_, i) => !results[i]));
  }

  // 5초 타이머 (선택하면 멈춤, 시간 끝이면 타임아웃)
  useEffect(() => {
    if (done || !q || picked !== null) return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          clearInterval(iv);
          return 0;
        }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [idx, done, q, picked, quiz]);

  useEffect(() => {
    if (timeLeft === 0 && picked === null && !done && q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPicked(-1);
      speak("땡! 시간 끝!");
      timeoutRef.current = setTimeout(() => {
        const qq = quiz[idx];
        if (!qq) return;
        const nr = [...results, false];
        setResults(nr);
        setPicks([...picks, -1]);
        setPicked(null);
        setTimeLeft(TIME_LIMIT);
        if (nr.length >= quiz.length) {
          finish(nr);
        } else {
          setIdx(idx + 1);
        }
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <p className="text-4xl">🎉</p>
          <h2 className="text-3xl font-black">
            끝! {quiz.length}개 중 {score}개 맞혔어!
          </h2>
          <p className="mt-2 text-xl font-bold">{score >= 8 ? "칭호: 동네박사!" : score >= 5 ? "칭호: 탐험대원!" : "칭호: 탐험견습생!"}</p>
          <p className="mt-1 font-bold text-stone-500">역대 최고: {Math.max(best, score)}개</p>
          {xpNote && <p className="mt-1 text-xl font-black text-violet-700">{xpNote}</p>}
          <div className="mt-4 flex flex-col gap-2">
            {score < quiz.length && (
              <button type="button" onClick={retryWrong} className="w-full rounded-2xl bg-red-300 px-6 py-3 text-xl font-black">
                ❌ 틀린 문제 다시 풀기! ({quiz.length - score}개)
              </button>
            )}
            <button type="button" onClick={otherQuiz} className="w-full rounded-2xl bg-emerald-400 px-6 py-3 text-xl font-black">
              🎲 다른 문제 풀기!
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={retry} className="flex-1 rounded-2xl bg-amber-400 px-6 py-3 text-xl font-black">
                다시 하기
              </button>
              <a href="/town" className="flex-1 rounded-2xl bg-emerald-300 px-6 py-3 text-center text-xl font-black">
                탐험하러 가기
              </a>
            </div>
          </div>
        </div>
        {quest && (
          <div className="animate-pop rounded-3xl bg-gradient-to-r from-emerald-300 to-sky-300 p-5 text-center shadow">
            <h3 className="text-2xl font-black">🔍 동네 미션 발급!</h3>
            <p className="text-xl font-bold">동네탐험에서 {quest.kinds.join("·")} 핀을 찾아봐!</p>
            <p className="font-bold">찾으면 보너스 +5 XP!</p>
            <a href="/town" className="mt-2 block rounded-2xl bg-white px-4 py-3 text-xl font-black">
              🗺️ 미션 하러 가기!
            </a>
          </div>
        )}
        <div className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-2xl font-black">📝 정답 확인!</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {quiz.map((item, i) => {
              const mine = picks[i];
              const ok = results[i];
              return (
                <li key={item.id} className={`rounded-2xl border-4 p-4 ${ok ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"}`}>
                  <p className="text-lg font-black">
                    {ok ? "⭕" : mine === -1 ? "⏰" : "❌"} {i + 1}. {item.q}
                  </p>
                  <p className="mt-1 font-bold">
                    내가 고른 답: {mine == null || mine === -1 ? "시간 끝!" : `${mine + 1}. ${item.choices[mine]}`}
                  </p>
                  {!ok && <p className="font-black text-emerald-700">정답: {item.answer + 1}. {item.choices[item.answer]}</p>}
                  <p className="mt-1 text-sm font-bold text-stone-500">{item.say}</p>
                </li>
              );
            })}
          </ul>
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
          style={{ width: `${(results.length / quiz.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 font-black text-stone-500">
        {idx + 1} / {quiz.length} · 지금까지 {score}개 성공
      </p>
      <div className={`mt-2 flex items-center gap-2 ${timeLeft <= 2 && picked === null ? "animate-wiggle" : ""}`}>
        <span className="text-2xl">⏰</span>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className={`h-full rounded-full transition-all ${timeLeft <= 2 ? "bg-red-400" : "bg-sky-400"}`}
            style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          />
        </div>
        <span className="w-8 font-black">{Math.ceil(timeLeft)}</span>
      </div>
      <h2 className="mt-2 text-2xl font-black">{q.q}</h2>
      <button
        type="button"
        onClick={() => speak(q.q)}
        className="mt-2 rounded-full bg-stone-100 px-4 py-1 font-black"
      >
        🔊 문제 읽어주기
      </button>
      <div className="mt-4 flex flex-col gap-3">
        {q.choices.map((c, i) => {
          const isAnswer = picked !== null && picked !== -1 && i === q.answer;
          const isWrongPick = picked === i && i !== q.answer;
          const isTimeout = picked === -1;
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
                    : isTimeout && i === q.answer
                      ? "border-green-500 bg-green-100"
                      : "border-amber-200 bg-amber-50"
              }`}
            >
              {i + 1}. {c} {isAnswer || (isTimeout && i === q.answer) ? "⭕" : isWrongPick ? "❌" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && picked !== -1 && (
        <div className="mt-4 rounded-2xl bg-stone-100 p-4">
          <p className="text-lg font-bold">{q.say}</p>
          <button
            type="button"
            onClick={next}
            className="mt-3 w-full rounded-2xl bg-violet-400 px-4 py-3 text-xl font-black"
          >
            {results.length + 1 >= quiz.length ? "결과 보기!" : "다음 문제!"}
          </button>
        </div>
      )}
      {picked === -1 && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-center">
          <p className="text-xl font-black">⏰ 시간 끝! 정답을 확인해!</p>
        </div>
      )}
    </div>
  );
}
