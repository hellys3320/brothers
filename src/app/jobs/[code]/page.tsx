import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_JOBS } from "@/lib/mock";
import HyungnimTalk from "@/components/HyungnimTalk";
import JobRealPlaces from "./_components/JobRealPlaces";
import VisitRecorder from "./_components/VisitRecorder";
import JobExtra from "./_components/JobExtra";

export function generateStaticParams() {
  return MOCK_JOBS.map((j) => ({ code: j.code }));
}

const RARITY_COLOR: Record<string, string> = {
  커먼: "bg-stone-200",
  레어: "bg-sky-200",
  레전드: "bg-amber-300",
};

const POWER_EMOJI: Record<string, string> = {
  힘: "💪",
  말하기: "🗣️",
  그리기: "🎨",
  관찰: "🔍",
  손재주: "✋",
};

export default async function JobDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = MOCK_JOBS.find((j) => j.code === code);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-5">
      <VisitRecorder code={code} />
      <Link href="/jobs" className="font-black text-stone-600">
        ← 직업 도감으로
      </Link>
      <h1 className="text-4xl font-black">
        {job.emoji} {job.name}
      </h1>
      <p>
        <span className={`rounded-full px-3 py-1 font-black ${RARITY_COLOR[job.rarity]}`}>{job.rarity}</span>{" "}
        <span className="rounded-full bg-white px-3 py-1 font-black">{job.field}</span>
      </p>
      <HyungnimTalk text={`${job.name}! ${job.easy3.join(", ")}.`} />
      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">필요한 능력치</h2>
        {(Object.entries(job.powers) as [string, number][]).map(([k, v]) => (
          <p key={k} className="text-xl font-bold">
            {POWER_EMOJI[k] ?? "⭐"} {k}: {"⭐".repeat(v)}{"☆".repeat(5 - v)}
          </p>
        ))}
      </div>
      <JobRealPlaces jobCode={code} jobName={job.name} />
      <JobExtra code={code} name={job.name} spot={job.spot} field={job.field} rarity={job.rarity} />
    </div>
  );
}
