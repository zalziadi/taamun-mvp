import type { Metadata } from "next";
import Script from "next/script";
import { Amiri, Manrope, Noto_Serif } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AppChrome } from "@/components/AppChrome";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/appConfig";
import { isRamadanProgramClosed } from "@/lib/season";
import "./globals.css";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
  icons: {
    icon: "/brand/favicon.svg",
    apple: "/brand/favicon.svg",
  },
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
      <head>
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body
        className={`${amiri.variable} ${manrope.variable} ${notoSerif.variable} tm-body antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[9999] focus:rounded-lg focus:bg-[#7b694a] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#f4f1ea]"
        >
          تخطي إلى المحتوى
        </a>
        <AnalyticsProvider />
        <AppChrome ramadanClosed={ramadanClosed}>{children}</AppChrome>
      </body>
    </html>
  );
}
