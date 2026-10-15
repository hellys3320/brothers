import Link from "next/link";
import HyungnimTalk from "@/components/HyungnimTalk";
import TownExplorer from "./_components/TownExplorer";
import { MOCK_SHOPS } from "@/lib/shops";

export default function TownPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🗺️ 우리동네 비밀지도</h1>
      <HyungnimTalk text="네 동네 중심에 비밀 5개를 숨겼어! 🏠에서 출발해 핀을 눌러봐!" />
      <TownExplorer />
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏪 가게에서 직업 찾기 ({MOCK_SHOPS.length}곳)</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MOCK_SHOPS.map((s) => (
            <li key={s.id}>
              <Link
                href={`/jobs/${s.jobCode}`}
                className="block rounded-2xl bg-amber-50 px-4 py-3 font-black hover:bg-amber-100"
              >
                {s.name} → 직업 보기
                <span className="block text-sm font-bold text-stone-500">{s.address}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="rounded-2xl bg-white p-4 text-sm font-bold text-stone-500">
        진짜 도서관·공원·병원은 지도(OpenStreetMap)에서 가져와요. 못 가져오면 연습 장소가 나와요.
      </p>
    </div>
  );
}
