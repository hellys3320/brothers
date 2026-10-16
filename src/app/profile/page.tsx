import HyungnimTalk from "@/components/HyungnimTalk";
import ProfileClient from "./_components/ProfileClient";

export const metadata = {
  title: "내 정보 - 형님의 비밀기지",
};

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">🪪 내 정보</h1>
      <HyungnimTalk text="네 이름과 우리집을 확인하고 바꿀 수 있어!" />
      <ProfileClient />
    </div>
  );
}
