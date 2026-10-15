import HyungnimTalk from "@/components/HyungnimTalk";
import DreamMaker from "./_components/DreamMaker";

export const metadata = {
  title: "꿈 발표장 - 형님의 비밀기지",
};

export default function DreamPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🌟 꿈 발표장</h1>
      <HyungnimTalk text="20년 뒤의 너를 발표해봐! 수집함에 저장되고 기록표에도 나와!" />
      <DreamMaker />
    </div>
  );
}
