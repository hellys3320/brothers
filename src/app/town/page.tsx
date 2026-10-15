import { Suspense } from "react";
import Link from "next/link";
import HyungnimTalk from "@/components/HyungnimTalk";
import TownExplorer from "./_components/TownExplorer";
import { MOCK_JOBS } from "@/lib/mock";
import { JOB_PLACE_HINT } from "@/lib/realTown";

export default function TownPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🗺️ 우리동네 비밀지도</h1>
      <HyungnimTalk text="핀을 눌러 스탬프를 모아봐! 다 모으면 동네박사가 되고 기록표를 인쇄할 수 있어!" />
      <Suspense fallback={<p className="rounded-3xl bg-white p-6 text-xl font-black">⏳ 형님이 준비중...</p>}>
        <TownExplorer />
      </Suspense>
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">💼 동네에서 직업 찾기</h2>
        <p className="font-bold text-stone-500">눌러서 우리동네 진짜 장소를 봐봐!</p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MOCK_JOBS.map((j) => (
            <li key={j.code}>
              <Link
                href={`/jobs/${j.code}`}
                className="block rounded-2xl bg-amber-50 px-4 py-3 font-black hover:bg-amber-100"
              >
                {j.emoji} {j.name} → 우리동네 {JOB_PLACE_HINT[j.code]} 보기
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="rounded-2xl bg-white p-4 text-sm font-bold text-stone-500">
        진짜 도서관·공원·학교·빵집·병원은 지도(OpenStreetMap·카카오)에서 가져와요. 못 가져오면 연습 장소가 나와요.
      </p>
    </div>
  );
}
