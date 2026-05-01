"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useProgressStore } from "@/store/useProgressStore";
import { TOTAL_DAYS } from "@/lib/days";

const PHASES = [
  { id: 1, label: "الوعي", days: "اليوم 1 — 3", desc: "ترى علاقتك بالمال على حقيقتها." },
  { id: 2, label: "الفكّ", days: "اليوم 4 — 7", desc: "تتحرّر من المعتقدات والتسريبات الصامتة." },
  { id: 3, label: "إعادة البناء", days: "اليوم 8 — 11", desc: "تبني نظاماً مالياً واعياً ومستداماً." },
  { id: 4, label: "التوسّع", days: "اليوم 12 — 14", desc: "تتحوّل لنسختك المالية الجديدة." },
];

export default function LandingPage() {
  const completed = useProgressStore((s) => s.completed());
  const started = completed > 0;
  const ctaHref = started ? "/journey" : "/journey";
  const ctaLabel = started ? "تابع الرحلة" : "ابدأ الرحلة";

  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-white via-wafrah-50 to-sand-50 px-6 py-16 sm:px-12 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-wafrah-200 bg-white/80 px-3 py-1 text-xs font-medium text-wafrah-700">
            <span className="h-1.5 w-1.5 rounded-full bg-wafrah-500" />
            رحلة وعي مالي · ١٤ يوم
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.2] text-ink-900 sm:text-5xl">
            من الوعي البدائي
            <br />
            إلى الوعي التوسّعي.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-600">
            تطبيق تفاعلي يأخذك يوماً بيوم في تحويل علاقتك بالمال — فكرة قصيرة،
            تمرين عملي، وسؤال تأملي يفتح ما لم تره من قبل.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-900/20"
            >
              {ctaLabel}
              <span aria-hidden>←</span>
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-ink-400"
            >
              تقدمي
            </Link>
          </div>
          {started && (
            <p className="mt-4 text-xs text-ink-400">
              أكملت {completed} من {TOTAL_DAYS} أيام
            </p>
          )}
        </motion.div>
      </section>

      <section className="space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">أربع مراحل · رحلة واحدة</h2>
            <p className="mt-1 text-sm text-ink-600">
              كل مرحلة تبني على ما قبلها. ما تقفز — تتدرّج.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-wafrah-700">المرحلة {p.id}</span>
                <span className="text-[11px] text-ink-400">{p.days}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-ink-900">{p.label}</h3>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{p.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-ink-50/40 p-8 sm:p-12 text-center">
        <p className="text-sm font-medium text-wafrah-700">جوهر التطبيق</p>
        <h2 className="mt-3 text-2xl font-semibold text-ink-900 sm:text-3xl leading-snug">
          ليس برنامجاً تعليمياً — بل نظام تحويل وعي مالي تدريجي.
        </h2>
        <p className="mt-4 mx-auto max-w-xl text-base leading-relaxed text-ink-600">
          كل يوم خطوة صغيرة تكتشفها بنفسك، تكتبها بصدقك، وتعود لها متى أردت.
        </p>
        <Link
          href="/journey"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-wafrah-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-wafrah-700"
        >
          ادخل الرحلة
          <span aria-hidden>←</span>
        </Link>
      </section>
    </div>
  );
}
