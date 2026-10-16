import { Suspense } from "react";
import HyungnimTalk from "@/components/HyungnimTalk";
import BattleClient from "./_components/BattleClient";

export const metadata = {
  title: "카드배틀 - 형님의 비밀기지",
};

export default async function BattlePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">⚔️ 카드배틀!</h1>
      <HyungnimTalk text="내 카드 3장으로 친구와 붙어봐! 이기면 +10 XP!" />
      <Suspense fallback={<p className="rounded-3xl bg-white p-6 text-xl font-black">⏳ 형님이 준비중...</p>}>
        <BattleClient to={sp.to ?? null} />
      </Suspense>
    </div>
  );
}
