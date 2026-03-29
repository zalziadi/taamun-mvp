"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/NavAuth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { APP_NAME } from "@/lib/appConfig";
import {
  CITY_ROUTE,
  GUIDE_ROUTE,
  JOURNAL_ROUTE,
  JOURNEY_ROUTE,
  PRICING_ROUTE,
  REFLECTION_ROUTE,
  SOURCES_ROUTE,
  TASBEEH_ROUTE,
} from "@/lib/routes";

function shouldHideGlobalChrome(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === "/" || pathname === "/breathing" || pathname === "/journal" || pathname === "/tasbeeh") return true;
  if (pathname.startsWith("/ramadan")) return true;
  return false;
}

export function AppChrome({
  children,
  ramadanClosed,
}: {
  children: React.ReactNode;
  ramadanClosed: boolean;
}) {
  const pathname = usePathname();
  const hide = shouldHideGlobalChrome(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {!hide ? (
        <header className="sticky top-0 z-40 border-b border-[#e5dfd3] bg-[#f4f1ea]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 text-[#8c7851]">
              <span className="text-sm opacity-70">â¦</span>
              <Link
                href="/"
                className="tm-heading rounded-md text-2xl font-bold text-[#7b694a] outline-none transition-colors duration-200 hover:text-[#6d5e44] focus-visible:ring-2 focus-visible:ring-[#8c7851]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
              >
                {APP_NAME}
              </Link>
            </div>

            <nav aria-label="Ø§ÙØ±Ø¦ÙØ³ÙØ©" className="hidden items-center gap-6 lg:flex">
              <Link href="/" className="tm-nav-link">
                Ø§ÙØ±Ø¦ÙØ³ÙØ©
              </Link>
              <Link href="/program" className="tm-nav-link">
                Ø§ÙØ¨Ø±ÙØ§ÙØ¬
              </Link>
              <Link href={JOURNEY_ROUTE} className="tm-nav-link">
                Ø§ÙØ±Ø­ÙØ©
              </Link>
              <Link href={REFLECTION_ROUTE} className="tm-nav-link">
                Ø§ÙØªØ£ÙÙ
              </Link>
              <Link href={JOURNAL_ROUTE} className="tm-nav-link">
                Ø§ÙØ¯ÙØªØ±
              </Link>
              <Link href={CITY_ROUTE} className="tm-nav-link">
                Ø§ÙÙØ¯ÙÙØ©
              </Link>
              <Link href={GUIDE_ROUTE} className="tm-nav-link">
                Ø§ÙÙØ±Ø´Ø¯
              </Link>
              <Link href={PRICING_ROUTE} className="tm-nav-link">
                Ø§ÙØ£Ø³Ø¹Ø§Ø±
              </Link>
              <Link href={SOURCES_ROUTE} className="tm-nav-link">
                ÙØµØ§Ø¯Ø±
              </Link>
                            <Link href={TASBEEH_ROUTE} className="tm-nav-link">
                المسبحة
              </Link>
  <Link href="/account" className="tm-nav-link">
                Ø­Ø³Ø§Ø¨Ù
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden text-[#8c7851] md:inline">â§</span>
              <div className="rounded-lg border border-[#d8cdb9] bg-[#fcfaf7]/80 px-3 py-1.5">
                <NavAuth />
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <main className={hide ? "flex-1" : "flex-1 pb-24 md:pb-0"}>{children}</main>

      {!hide ? (
        <footer className="border-t border-[#e5dfd3] bg-[#f4f1ea]/70 py-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
            <span className="text-xs text-[#8c7851]/90">â¦</span>
            <p className="text-sm text-[#7d7362]">
              {APP_NAME} Â© {new Date().getFullYear()} Â· ÙÙ ÙØ´Ø§Ø±ÙØ¹ Ø§ÙØ¯ÙØ± Ø§ÙØ±ÙÙÙ
            </p>
          </div>
        </footer>
      ) : null}

      {!hide ? <MobileBottomNav ramadanClosed={ramadanClosed} /> : null}
    </div>
  );
}
