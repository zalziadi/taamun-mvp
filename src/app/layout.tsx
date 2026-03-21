import type { Metadata } from "next";
import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/appConfig";
import { CITY_ROUTE, GUIDE_ROUTE, JOURNAL_ROUTE, JOURNEY_ROUTE, PRICING_ROUTE, REFLECTION_ROUTE, SOURCES_ROUTE } from "@/lib/routes";
import { isRamadanProgramClosed } from "@/lib/season";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  metadataBase: new URL(APP_DOMAIN),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: APP_DOMAIN,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ramadanClosed = isRamadanProgramClosed();

  return (
    <html lang="ar" dir="rtl">
      <body className="tm-body antialiased">
        <AnalyticsProvider />
        <div className="flex min-h-screen flex-col bg-transparent">
          <header className="sticky top-0 z-40 border-b border-[#e5dfd3] bg-[#f4f1ea]/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 text-[#8c7851]">
                <span className="text-sm opacity-70">✦</span>
                <Link href="/" className="tm-heading rounded-md text-2xl font-bold text-[#7b694a] outline-none transition-colors duration-200 hover:text-[#6d5e44] focus-visible:ring-2 focus-visible:ring-[#8c7851]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]">
                  {APP_NAME}
                </Link>
              </div>

              <nav aria-label="الرئيسية" className="hidden items-center gap-6 lg:flex">
                <Link href="/" className="tm-nav-link">الرئيسية</Link>
                {!ramadanClosed ? (
                  <Link href="/program" className="tm-nav-link">البرنامج</Link>
                ) : null}
                <Link href={JOURNEY_ROUTE} className="tm-nav-link">الرحلة</Link>
                <Link href={REFLECTION_ROUTE} className="tm-nav-link">التأمل</Link>
                <Link href={JOURNAL_ROUTE} className="tm-nav-link">الدفتر</Link>
                <Link href={CITY_ROUTE} className="tm-nav-link">المدينة</Link>
                <Link href={GUIDE_ROUTE} className="tm-nav-link">المرشد</Link>
                <Link href={PRICING_ROUTE} className="tm-nav-link">الأسعار</Link>
                <Link href={SOURCES_ROUTE} className="tm-nav-link">مصادر</Link>
                
              </nav>

              <div className="flex items-center gap-3">
                <span className="hidden text-[#8c7851] md:inline">✧</span>
                <div className="rounded-lg border border-[#d8cdb9] bg-[#fcfaf7]/80 px-3 py-1.5">
                  <NavAuth />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 pb-24 md:pb-0">{children}</main>
          <footer className="border-t border-[#e5dfd3] bg-[#f4f1ea]/70 py-10">
            <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
              <span className="text-xs text-[#8c7851]/90">✦</span>
              <p className="text-sm text-[#7d7362]">
                {APP_NAME} © {new Date().getFullYear()} · من مشاريع الدير الرقمي
              </p>
            </div>
          </footer>
          <MobileBottomNav ramadanClosed={ramadanClosed} />
        </div>
      </body>
    </html>
  );
}
