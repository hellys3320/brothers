import { Suspense } from "react";
import PrintView from "./_components/PrintView";

export const metadata = {
  title: "탐험 기록표 인쇄 - 형님의 비밀기지",
};

export default function PrintPage() {
  return (
    <Suspense fallback={<p className="rounded-3xl bg-white p-6 text-xl font-black">⏳ 기록표를 준비중...</p>}>
      <PrintView />
    </Suspense>
  );
}
