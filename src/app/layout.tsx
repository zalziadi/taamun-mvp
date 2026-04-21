import type { Metadata } from "next";
import Script from "next/script";
import { Amiri, IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Manrope, Noto_Sans_Arabic, Noto_Serif } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AppChrome } from "@/components/AppChrome";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME } from "@/lib/appConfig";
import { isRamadanProgramClosed } from "@/lib/season";
import { organizationSchema, jsonLdString } from "@/lib/json-ld";
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

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/favicon.svg",
    apple: "/brand/favicon.svg",
  },
  themeColor: "#5a4a35",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  metadataBase: new URL(APP_DOMAIN),
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      en: "/en",
      "x-default": "/",
    },
  },
  // v2.2: Google Search Console verification — populated via env var
  // so we never commit the code. Set GOOGLE_SITE_VERIFICATION in Vercel.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
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
        {/* v1.9: global Organization schema — surfaces sitelinks + brand box in SERP */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(organizationSchema()) }}
        />
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="lazyOnload">
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
        className={`${amiri.variable} ${manrope.variable} ${notoSerif.variable} ${ibmPlexMono.variable} ${ibmPlexSansArabic.variable} ${notoSansArabic.variable} tm-body antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[9999] focus:rounded-lg focus:bg-[#7b694a] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#f4f1ea]"
        >
          تخطي إلى المحتوى
        </a>
        <AnalyticsProvider />
        <ServiceWorkerRegistrar />
        <AppChrome ramadanClosed={ramadanClosed}>{children}</AppChrome>
      </body>
    </html>
  );
}
