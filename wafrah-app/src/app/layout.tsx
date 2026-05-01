import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HydrateGate } from "@/components/HydrateGate";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "لمة وفرة — رحلة الوعي المالي ١٤ يوم",
    template: "%s · لمة وفرة",
  },
  description:
    "تطبيق تفاعلي بسيط وعميق ينقلك خلال ١٤ يوماً من الوعي المالي البدائي إلى وعي توسّعي وتطبيق يومي عملي.",
  applicationName: "لمة وفرة",
};

export const viewport: Viewport = {
  themeColor: "#207651",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${arabic.variable}`}>
      <body className="min-h-screen bg-white font-sans text-ink-900 antialiased">
        <HydrateGate>
          <Header />
          <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">{children}</main>
          <Footer />
        </HydrateGate>
      </body>
    </html>
  );
}
