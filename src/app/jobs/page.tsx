import HyungnimTalk from "@/components/HyungnimTalk";
import JobMatcher from "./_components/JobMatcher";

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">💼 직업 도감</h1>
      <HyungnimTalk text="우리동네 빵집에는 제빵사 형님이, 병원에는 간호사 누나가 있어. 카드를 눌러봐!" />
      <JobMatcher />
    </div>
  );
}
