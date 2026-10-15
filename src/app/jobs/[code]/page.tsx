import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_JOBS } from "@/lib/mock";
import HyungnimTalk from "@/components/HyungnimTalk";
import JobRealPlaces from "./_components/JobRealPlaces";

export function generateStaticParams() {
  return MOCK_JOBS.map((j) => ({ code: j.code }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = MOCK_JOBS.find((j) => j.code === code);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/jobs" className="font-black text-stone-600">
        ← 직업 도감으로
      </Link>
      <h1 className="text-4xl font-black">
        {job.emoji} {job.name}
      </h1>
      <HyungnimTalk text={`${job.name}! ${job.easy3.join(", ")}.`} />
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">필요한 능력치</h2>
        {(Object.entries(job.powers) as [string, number][]).map(([k, v]) => (
          <p key={k} className="text-xl font-bold">
            {k}: {"⭐".repeat(v)}{"☆".repeat(5 - v)}
          </p>
        ))}
        <p className="mt-3 text-sm font-bold text-stone-500">출처: {job.source}</p>
      </div>
      <JobRealPlaces jobCode={code} jobName={job.name} />
    </div>
  );
}
