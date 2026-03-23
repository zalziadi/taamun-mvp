import type { Metadata } from "next";
import { Amiri, Manrope, Noto_Serif } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AppChrome } from "@/components/AppChrome";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/appConfig";
import { isRamadanProgramClosed } from "@/lib/season";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

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
      <body
        className={`${amiri.variable} ${manrope.variable} ${notoSerif.variable} tm-body antialiased`}
      >
        <AnalyticsProvider />
        <AppChrome ramadanClosed={ramadanClosed}>{children}</AppChrome>
      </body>
    </html>
  );
}
