import HyungnimTalk from "@/components/HyungnimTalk";
import QuizRunner from "./_components/QuizRunner";

export default function QuizPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🎯 오늘의 비밀퀴즈</h1>
      <HyungnimTalk text="10문제! 5초 안에 풀어봐! 8개 이상 맞히면 동네박사야!" />
      <QuizRunner />
    </div>
  );
}
