import HyungnimTalk from "@/components/HyungnimTalk";
import GamesClient from "./_components/GamesClient";

export const metadata = {
  title: "직업 놀이터 - 형님의 비밀기지",
};

export default function GamesPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🎮 직업 놀이터</h1>
      <HyungnimTalk text="놀면서 XP를 모아봐! XP가 쌓이면 전설 직업이 열려!" />
      <GamesClient />
    </div>
  );
}
