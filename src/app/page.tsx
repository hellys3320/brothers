import Link from "next/link";
import HyungnimTalk from "@/components/HyungnimTalk";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <HyungnimTalk text="어서와! 여기는 형님의 비밀기지야. 우리동네를 탐험하고 멋진 직업을 찾아보자!" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/town"
          className="rounded-3xl bg-emerald-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          🗺️ 동네탐험 출발!
          <span className="block text-base font-bold">비밀지도를 열어봐</span>
        </Link>
        <Link
          href="/jobs"
          className="rounded-3xl bg-sky-400 p-8 text-center text-2xl font-black shadow-lg active:translate-y-0.5"
        >
          💼 직업 변신!
          <span className="block text-base font-bold">나는 어떤 직업이 어울릴까?</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/quiz" className="rounded-3xl bg-yellow-300 p-6 text-center text-xl font-black shadow">
          🎯 오늘의 퀴즈
        </Link>
        <Link href="/mybox" className="rounded-3xl bg-pink-300 p-6 text-center text-xl font-black shadow">
          🎒 나의 수집함
        </Link>
      </div>
      <p className="rounded-2xl bg-white p-4 text-center font-bold text-stone-600">
        로그인은 없어요. 형님이 대신 기억해줄게!
      </p>
    </div>
  );
}
