import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "형님의 비밀기지",
  description: "초등학생이 우리동네를 탐험하고 직업을 알아가는 비밀기지",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 border-b-4 border-amber-300 bg-[#FFF3C4]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="text-2xl font-black">
              🗝️ 형님의 비밀기지
            </Link>
            <nav className="flex flex-wrap gap-2 text-lg font-bold" aria-label="주요 메뉴">
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/town">
                동네탐험
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/jobs">
                직업도감
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/games">
                게임
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/battle">
                배틀
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/friends">
                친구
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/quiz">
                퀴즈
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/mybox">
                수집함
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 shadow" href="/profile">
                내정보
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t-2 border-amber-200 bg-white/70">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm font-bold text-stone-600">
            <span>나라 통계를 쉬운 말로 바꿨어요. 로그인 없어요.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
