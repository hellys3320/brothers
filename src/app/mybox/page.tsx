import HyungnimTalk from "@/components/HyungnimTalk";
import MyBoxClient from "./_components/MyBoxClient";

export default function MyBoxPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🎒 나의 수집함</h1>
      <HyungnimTalk text="네 보물을 여기에 모아둘게. 로그인 없이 이 태블릿에만 저장돼." />
      <MyBoxClient />
    </div>
  );
}
