import type { Metadata } from "next";
import Link from "next/link";
import { faqSchema, jsonLdString } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Taamun",
  description:
    "Answers about Taamun: pricing, privacy, the 28-day program, creator mode, refunds.",
  alternates: {
    canonical: "https://www.taamun.com/en/faq",
    languages: {
      ar: "https://www.taamun.com/faq",
      "x-default": "https://www.taamun.com/faq",
    },
  },
  openGraph: {
    title: "Taamun FAQ",
    description:
      "Everything a thoughtful newcomer asks before starting a Quranic reflection journey.",
    locale: "en_US",
  },
};

type Pair = { question: string; answer: string };

const FAQ: Pair[] = [
  {
    question: "How does the Taamun program work?",
    answer:
      "Every day for 28 days you open the day’s page and find: a short verse, a silence gate, a hidden layer with deeper meaning, a quote from the accompanying book, a reflection question you answer in your own words, and an awareness meter. Five minutes a day, morning-friendly.",
  },
  {
    question: "What plans are available?",
    answer:
      "Quarterly (90 days), yearly (365 days), and VIP — which adds creator mode, a Gene Keys hologenetic profile, and BaZi insight. Full details are on the pricing page. The experience itself is Arabic-native.",
  },
  {
    question: "Can I try Taamun for free first?",
    answer:
      "Yes. Every new account gets a 7-day free trial with no card required. If the rhythm earns its place in your morning, you pick the plan when the trial ends.",
  },
  {
    question: "What is creator mode?",
    answer:
      "If you are a VIP member you can publish your own 7- or 14-day Quranic reflection journey for other members to subscribe to. You see subscriber counts and per-day drop-off through a private analytics dashboard. The creator guide walks through the five steps.",
  },
  {
    question: "How does the invite system work?",
    answer:
      "Every subscriber has a unique invite code. When your friend subscribes through your code, both of you receive an extra 30 days of membership appended to your current expiry date.",
  },
  {
    question: "How do you protect my reflections?",
    answer:
      "Your journal entries and awareness metrics are private to you. Nothing is exposed unless you opt into sharing a short insight on the public /shared board. Even the AI guide reads an encrypted summary — never the raw text.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Within the first 7 days of a paid subscription, if you feel Taamun is not for you, message us on WhatsApp and we will refund the full amount — no questions asked.",
  },
  {
    question: "Does Taamun work offline?",
    answer:
      "Partially. The app is a PWA that caches recently visited pages, so you can re-read days you’ve opened. Saving new reflections and chatting with the guide still require an internet connection.",
  },
];

export default function EnglishFAQ() {
  const schema = faqSchema(FAQ);
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="ltr">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
      />
      <nav className="text-xs text-[#8c7851]">
        <Link href="/en" className="hover:text-[#5a4a35]">Taamun English</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">FAQ</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619]">
          Frequently asked questions
        </h1>
        <p className="text-sm text-[#5a4a35]">
          Short answers for thoughtful newcomers.
        </p>
      </header>

      <dl className="space-y-4">
        {FAQ.map((pair) => (
          <div key={pair.question} className="tm-card p-5 sm:p-6 space-y-2">
            <dt className="text-sm font-bold text-[#2f2619]">{pair.question}</dt>
            <dd className="text-xs sm:text-sm text-[#3d342a] leading-relaxed">
              {pair.answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="text-center pt-2 space-y-3">
        <p className="text-xs text-[#5a4a35]">Still have a question?</p>
        <Link
          href="/"
          className="inline-block border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-5 py-2 text-xs font-bold"
        >
          Open Taamun (Arabic)
        </Link>
        <p className="mt-2">
          <Link
            href="/faq"
            hrefLang="ar"
            className="text-xs text-[#5a4a35] underline hover:no-underline"
          >
            الأسئلة الشائعة بالعربية
          </Link>
        </p>
      </div>
    </main>
  );
}
