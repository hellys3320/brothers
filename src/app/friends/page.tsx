import HyungnimTalk from "@/components/HyungnimTalk";
import FriendsClient from "./_components/FriendsClient";

export const metadata = {
  title: "내 친구들 - 형님의 비밀기지",
};

export default function FriendsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">👫 내 친구들</h1>
      <HyungnimTalk text="친구 코드를 주고받으면 카드배틀을 신청할 수 있어!" />
      <FriendsClient />
    </div>
  );
}
