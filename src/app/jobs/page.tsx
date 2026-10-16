import Link from "next/link";
import HyungnimTalk from "@/components/HyungnimTalk";
import JobMatcher from "./_components/JobMatcher";

export const metadata = {
  title: "직업 도감 - 형님의 비밀기지",
};

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">💼 직업 도감</h1>
      <HyungnimTalk text="직업 100개! 카드를 모아봐. 체험하고 놀면 XP가 쌓여!" />
      <div className="grid grid-cols-2 gap-4">
        <Link href="/games" className="rounded-3xl bg-violet-300 p-5 text-center text-xl font-black shadow">
          🎮 직업 놀이터
        </Link>
        <Link href="/jobs/dream" className="rounded-3xl bg-rose-200 p-5 text-center text-xl font-black shadow">
          🌟 꿈 발표장
        </Link>
        <Link href="/battle" className="rounded-3xl bg-red-300 p-5 text-center text-xl font-black shadow">
          ⚔️ 카드배틀!
        </Link>
        <Link href="/friends" className="rounded-3xl bg-sky-200 p-5 text-center text-xl font-black shadow">
          👫 내 친구들
        </Link>
      </div>
      <JobMatcher />
    </div>
  );
}
