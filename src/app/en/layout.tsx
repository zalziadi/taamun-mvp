import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taamun — Quranic Reflection in 28 Days",
  description:
    "Five minutes a day, twenty-eight days. A Quranic reflection journey designed for the modern heart.",
  alternates: {
    canonical: "https://www.taamun.com/en",
    languages: {
      ar: "https://www.taamun.com/",
      "x-default": "https://www.taamun.com/",
    },
  },
  openGraph: {
    title: "Taamun — Quranic Reflection in 28 Days",
    description:
      "A 28-day Quranic reflection journey for busy minds. Arabic-native, built for serious seekers.",
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
};

/**
 * /en section — English marketing bridge for expat Muslims.
 *
 * Important: no AppChrome inside this layout. The global layout already
 * wraps all pages with AppChrome, but we don't want the Arabic-first nav
 * to dominate English pages. We rely on the root layout's chrome being
 * hidden by pathname logic when appropriate; if that regresses, we can
 * introduce an explicit opt-out here.
 *
 * Direction: LTR. No RTL here — English reads left to right.
 */
export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div lang="en" dir="ltr">{children}</div>;
}
