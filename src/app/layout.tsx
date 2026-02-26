import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/appConfig";
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
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic antialiased">
        <AnalyticsProvider />
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-panel">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" className="font-bold text-gold hover:opacity-90">
                {APP_NAME}
              </Link>
              <nav aria-label="الرئيسية" className="flex items-center gap-4">
                <Link href="/" className="text-sm text-muted hover:text-text">
                  الرئيسية
                </Link>
                <Link href="/program" className="text-sm text-muted hover:text-text">
                  البرنامج
                </Link>
                <Link href="/program" className="text-sm text-muted hover:text-text">
                  تقدمك
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-panel py-4">
            <div className="container text-center p-muted text-sm">
              {APP_NAME} © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
