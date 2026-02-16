import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "تمَعُّن — رحلة 28 يومًا",
    template: "%s — تمَعُّن",
  },
  description:
    "برنامج يومي لمدة 28 يومًا لبناء عادة التمعّن: مراقبة → إدراك → تمَعُّن.",
  metadataBase: new URL("https://taamun-mvp.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://taamun-mvp.vercel.app",
    siteName: "تمَعُّن",
    title: "تمَعُّن — رحلة 28 يومًا",
    description:
      "برنامج يومي لمدة 28 يومًا لبناء عادة التمعّن: مراقبة → إدراك → تمَعُّن.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "تمَعُّن — رحلة 28 يومًا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تمَعُّن — رحلة 28 يومًا",
    description:
      "برنامج يومي لمدة 28 يومًا لبناء عادة التمعّن: مراقبة → إدراك → تمَعُّن.",
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
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-panel">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" className="font-bold text-gold hover:opacity-90">
                تعاون
              </Link>
              <nav aria-label="الرئيسية" className="flex items-center gap-4">
                <Link href="/" className="text-sm text-muted hover:text-text">
                  الرئيسية
                </Link>
                <Link href="/progress" className="text-sm text-muted hover:text-text">
                  تقدمك
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 container py-8">{children}</main>
          <footer className="border-t border-border bg-panel py-4">
            <div className="container text-center p-muted text-sm">
              تعاون © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
