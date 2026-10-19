"use client";

// 상단(데스크톱) 메뉴 + 하단(모바일) 탭바. 현재 위치를 강조한다.
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/town", label: "동네탐험", short: "탐험", icon: "🗺️" },
  { href: "/jobs", label: "직업도감", short: "직업", icon: "💼" },
  { href: "/games", label: "게임", short: "게임", icon: "🎮" },
  { href: "/battle", label: "배틀", short: "배틀", icon: "⚔️" },
  { href: "/friends", label: "친구", short: "친구", icon: "👫" },
  { href: "/mybox", label: "수집함", short: "수집", icon: "🎒" },
  { href: "/profile", label: "내정보", short: "정보", icon: "🙋" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 활성 표시 없는 정적 버전 (Suspense 폴백·프리렌더용) */
export function MainNavFallback() {
  return <NavShell active={null} />;
}

export function MainNav() {
  const pathname = usePathname();
  return <NavShell active={pathname} />;
}

function NavShell({ active }: { active: string | null }) {
  const on = (href: string) => (active ? isActive(active, href) : false);
  return (
    <>
      {/* 데스크톱 상단 메뉴 */}
      <nav aria-label="주요 메뉴" className="hidden flex-wrap gap-2 text-lg font-bold sm:flex">
        {NAV_ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on(it.href) ? "page" : undefined}
            className={`rounded-2xl px-4 py-2 shadow transition-colors ${on(it.href) ? "bg-amber-300" : "bg-white hover:bg-amber-100"}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>

      {/* 모바일 하단 탭바 */}
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-amber-300 bg-[#FFF3C4] pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="flex items-stretch">
          {NAV_ITEMS.map((it) => (
            <li key={it.href} className="min-w-0 flex-1">
              <Link
                href={it.href}
                aria-current={on(it.href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-black ${on(it.href) ? "bg-amber-300 text-stone-800" : "text-stone-600"}`}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {it.icon}
                </span>
                {it.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
