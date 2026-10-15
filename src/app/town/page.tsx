import Link from "next/link";
import HyungnimTalk from "@/components/HyungnimTalk";
import TownExplorer from "./_components/TownExplorer";
import { MOCK_SHOPS } from "@/lib/shops";

export default function TownPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🗺️ 우리동네 비밀지도</h1>
      <HyungnimTalk text="햇살동에는 비밀이 5개 숨겨져 있어. 카드를 눌러 하나씩 찾아봐!" />
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
        우리동네 도서관·공원·가게 이야기와 안전한 길 이야기를 쉽게 바꾼 연습판이에요.
      </p>
    </div>
  );
}
