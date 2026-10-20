"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTodayMeal, type MealInfo, type SchoolInfo } from "@/lib/school";

type CardState = "idle" | "loading" | "ok" | "empty" | "error";

function formatDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return "";
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const weekday = "일월화수목금토"[new Date(year, month - 1, day).getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function SchoolMealCard({ school }: { school?: SchoolInfo }) {
  const [meal, setMeal] = useState<MealInfo | null>(null);
  const [state, setState] = useState<CardState>(school ? "loading" : "idle");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!school) return;
    let alive = true;
    fetchTodayMeal(school).then((result) => {
      if (!alive) return;
      if (result.ok && result.meal) {
        setMeal(result.meal);
        setState("ok");
      } else if (result.reason === "no-data") {
        setMeal(null);
        setState("empty");
      } else {
        setMeal(null);
        setState("error");
      }
    });
    return () => {
      alive = false;
    };
  }, [school, nonce]);

  function retry() {
    setState("loading");
    setNonce((value) => value + 1);
  }

  if (!school) {
    return (
      <div className="rounded-3xl bg-amber-50 p-5 shadow">
        <p className="text-xl font-black">🍱 오늘의 급식</p>
        <p className="mt-1 font-bold text-stone-600">우리 학교를 설정하면 오늘 점심을 알려줄게!</p>
        <Link
          href="/profile#school"
          className="mt-3 inline-block rounded-2xl bg-sky-400 px-5 py-3 text-lg font-black shadow"
        >
          🏫 우리 학교 설정하기
        </Link>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 p-5 shadow">
        <p className="text-lg font-black text-stone-500">🍱 오늘의 급식</p>
        <p className="mt-1 text-xl font-black">🏫 {school.name}</p>
        <p className="mt-2 animate-pulse rounded-2xl bg-white/70 p-4 font-bold text-stone-500">
          오늘 점심을 가져오는 중...
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-3xl bg-rose-50 p-5 shadow">
        <p className="text-xl font-black">🍱 오늘의 급식</p>
        <p className="mt-1 font-black text-stone-700">🏫 {school.name}</p>
        <p className="mt-2 font-bold text-stone-600">급식 정보를 못 가져왔어. 잠시 후 다시 해볼까?</p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-2xl bg-rose-300 px-5 py-2 text-lg font-black"
        >
          다시 가져오기
        </button>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="rounded-3xl bg-stone-50 p-5 shadow">
        <p className="text-xl font-black">🍱 오늘의 급식</p>
        <p className="mt-1 font-black text-stone-700">🏫 {school.name}</p>
        <p className="mt-2 font-bold text-stone-600">
          오늘은 급식이 없어! 주말이나 방학, 휴일인가 봐.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-2xl bg-stone-200 px-5 py-2 text-lg font-black"
        >
          다시 확인
        </button>
      </div>
    );
  }

  if (!meal) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 p-5 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-stone-500">🍱 오늘의 급식 · {meal.mealName}</p>
          <p className="truncate text-xl font-black">🏫 {school.name}</p>
          <p className="text-sm font-bold text-stone-500">{formatDate(meal.date)}</p>
        </div>
        <span className="animate-floaty text-5xl">🍚</span>
      </div>

      {meal.dishes.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {meal.dishes.map((dish, index) => (
            <li key={`${dish}-${index}`} className="rounded-full bg-white px-3 py-1.5 font-black shadow-sm">
              {dish}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-2xl bg-white/70 p-3 font-bold text-stone-500">메뉴 정보가 없어.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">
        {meal.calories && <span className="rounded-full bg-amber-200 px-3 py-1">🔥 {meal.calories}</span>}
        <span className="text-stone-500">
          자료:{" "}
          <a
            href="https://open.neis.go.kr"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            나이스 교육정보 개방 포털
          </a>
        </span>
      </div>

      {meal.allergens.length > 0 && (
        <p className="mt-2 text-sm font-black text-rose-700">
          ⚠️ 알레르기: {meal.allergens.map((item) => `${item.code} ${item.name}`).join(" · ")}
        </p>
      )}
      <p className="mt-1 text-xs font-bold text-stone-400">
        알레르기 표시는 학교에서 한 번 더 확인해요.
      </p>
    </div>
  );
}
