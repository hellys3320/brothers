import { Suspense } from "react";
import HyungnimTalk from "@/components/HyungnimTalk";
import GamesClient from "./_components/GamesClient";

export const metadata = {
  title: "게임 놀이터 - 형님의 비밀기지",
};

export default function GamesPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🎮 게임 놀이터</h1>
      <HyungnimTalk text="미니게임도 하고 오늘의 퀴즈도 풀어봐! 놀면서 XP를 모을 수 있어!" />
      <Suspense fallback={<p className="rounded-3xl bg-white p-6 text-xl font-black">🎮 게임을 준비중...</p>}>
        <GamesClient />
      </Suspense>
    </div>
  );
}
