"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/NavAuth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { JourneyGuideRail } from "@/components/JourneyGuideRail";
import { SearchBox } from "@/components/SearchBox";
import { APP_NAME } from "@/lib/appConfig";
import { BrandLogo } from "@/components/BrandLogo";
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
  // Note: "/" is intentionally NOT hidden so the search + كهفي show on home
  if (pathname === "/breathing" || pathname === "/journal" || pathname === "/tasbeeh") return true;
  if (pathname.startsWith("/ramadan")) return true;
  if (pathname.startsWith("/admin")) return true;
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
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#8c7851]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
              >
                <BrandLogo variant="mark" size={36} />
                <span className="tm-heading text-2xl font-bold text-[#7b694a]">
                  {APP_NAME}
                </span>
              </Link>
            </div>

            <nav aria-label="الرئيسية" className="hidden items-center gap-6 lg:flex">
              <Link href="/" className="tm-nav-link">
                الرئيسية
              </Link>
              <Link href="/program" className="tm-nav-link">
                البرنامج
              </Link>
              <Link href={JOURNEY_ROUTE} className="tm-nav-link">
                الرحلة
              </Link>
              <Link href={REFLECTION_ROUTE} className="tm-nav-link">
                التمعّن
              </Link>
              <Link href={JOURNAL_ROUTE} className="tm-nav-link">
                الدفتر
              </Link>
              <Link href={CITY_ROUTE} className="tm-nav-link">
                المدينة
              </Link>
              <Link href={GUIDE_ROUTE} className="tm-nav-link">
                المرشد
              </Link>
              <Link href={PRICING_ROUTE} className="tm-nav-link">
                الأسعار
              </Link>
              <Link href={SOURCES_ROUTE} className="tm-nav-link">
                مصادر
              </Link>
              <Link href={TASBEEH_ROUTE} className="tm-nav-link">
                المسبحة
              </Link>
              <Link href="/account" className="tm-nav-link">
                كهفي
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <SearchBox />
              <NavAuth />
            </div>
          </div>
        </header>
      ) : null}

      <main id="main-content" className={hide ? "flex-1" : "flex-1 pb-24 md:pb-0"}>{children}</main>

      {!hide ? (
        <footer className="border-t border-[#e5dfd3] bg-[#f4f1ea]/70 py-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-[#7d7362]">
              {APP_NAME} &copy; {new Date().getFullYear()} &middot; من مشاريع الدير الرقمي
            </p>
          </div>
        </footer>
      ) : null}

      {!hide ? <JourneyGuideRail /> : null}
      {!hide ? <MobileBottomNav ramadanClosed={ramadanClosed} /> : null}
    </div>
  );
}

