import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_JOBS } from "@/lib/mock";
import { getShopsByJob } from "@/lib/shops";
import HyungnimTalk from "@/components/HyungnimTalk";

export function generateStaticParams() {
  return MOCK_JOBS.map((j) => ({ code: j.code }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = MOCK_JOBS.find((j) => j.code === code);
  if (!job) notFound();
  const shops = getShopsByJob(code);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/jobs" className="font-black text-stone-600">
        ← 직업 도감으로
      </Link>
      <h1 className="text-4xl font-black">
        {job.emoji} {job.name}
      </h1>
      <HyungnimTalk text={`${job.name}! ${job.easy3.join(", ")}. 우리동네 ${job.townPlace}에서 만날 수 있어.`} />
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">필요한 능력치</h2>
        {(Object.entries(job.powers) as [string, number][]).map(([k, v]) => (
          <p key={k} className="text-xl font-bold">
            {k}: {"⭐".repeat(v)}{"☆".repeat(5 - v)}
          </p>
        ))}
        <p className="mt-3 text-sm font-bold text-stone-500">출처: {job.source}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">🏪 우리동네에서 만나는 곳 ({shops.length}곳)</h2>
        {shops.length === 0 ? (
          <p className="mt-2 font-bold">아직 연결된 가게가 없어. 형님이 찾고 있어!</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {shops.map((s) => (
              <li key={s.id} className="rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xl font-black">{s.name}</p>
                <p className="font-bold text-stone-600">{s.address} · {s.easy}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <Link href="/town" className="flex-1 rounded-2xl bg-emerald-300 px-4 py-3 text-center text-lg font-black">
            지도에서 보기
          </Link>
          <Link href="/quiz" className="flex-1 rounded-2xl bg-yellow-200 px-4 py-3 text-center text-lg font-black">
            퀴즈 풀기
          </Link>
        </div>
        <p className="mt-2 text-sm font-bold text-stone-500">
          우리동네 가게 이야기를 쉽게 바꾼 연습판이에요. 나중에는 진짜 가게 정보로 바꿔요.
        </p>
      </div>
    </div>
  );
}
