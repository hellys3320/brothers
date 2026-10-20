import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MainNav, MainNavFallback } from "@/components/MainNav";
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
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
            <Link href="/" className="text-lg font-black leading-tight sm:text-2xl">
              🗝️ 형님의 비밀기지
            </Link>
            <Suspense fallback={<MainNavFallback />}>
              <MainNav />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-24 sm:pb-6">{children}</main>
      </body>
    </html>
  );
}
