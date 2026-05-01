"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ProgressBar";
import { useProgressStore } from "@/store/useProgressStore";
import { DAYS, TOTAL_DAYS } from "@/lib/days";
import { PHASE_META } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const progress = useProgressStore((s) => s.progress);
  const percent = useProgressStore((s) => s.percent());
  const completed = useProgressStore((s) => s.completed());
  const reset = useProgressStore((s) => s.resetJourney);

  const finished = completed === TOTAL_DAYS;

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="text-xs font-medium text-wafrah-700">تقدمي</p>
        <h1 className="text-3xl font-semibold text-ink-900">حيث أنت الآن</h1>
        <p className="text-sm text-ink-600 leading-relaxed max-w-xl">
          المسار ليس سباقاً. كل يوم يكتمل لمّا تشعر أنه اكتمل بداخلك.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <ProgressBar value={percent} label="نسبة الإنجاز الكلية" />
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <Stat label="مكتمل" value={`${completed}`} />
          <Stat label="متبقّي" value={`${TOTAL_DAYS - completed}`} />
          <Stat label="بدأت في" value={progress.startedAt ? formatDate(progress.startedAt) : "—"} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-900">المراحل</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(PHASE_META) as Array<keyof typeof PHASE_META>).map((phase) => {
            const days = DAYS.filter((d) => d.phase === phase);
            const done = days.filter((d) => progress.days[d.id]?.completed).length;
            const pct = Math.round((done / days.length) * 100);
            return (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink-900">
                    {PHASE_META[phase].label}
                  </h3>
                  <span className="text-xs text-ink-400">{PHASE_META[phase].range}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={pct} label={`${done} / ${days.length} أيام`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-900">كل الأيام</h2>
        <ul className="divide-y divide-ink-100 rounded-xl2 border border-ink-100 bg-white">
          {DAYS.map((d) => {
            const state = progress.days[d.id];
            const done = state?.completed === true;
            return (
              <li key={d.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      done ? "bg-wafrah-600 text-white" : "bg-ink-100 text-ink-500"
                    )}
                  >
                    {done ? "✓" : d.id}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{d.title}</p>
                    <p className="text-xs text-ink-400">{d.phaseLabel}</p>
                  </div>
                </div>
                {done ? (
                  <Link href={`/day/${d.id}`} className="text-xs text-wafrah-700 hover:underline">
                    إعادة قراءة ←
                  </Link>
                ) : (
                  <Link href={`/day/${d.id}`} className="text-xs text-ink-500 hover:underline">
                    افتح
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {finished && (
        <section className="rounded-2xl bg-gradient-to-l from-wafrah-100 to-sand-50 border border-wafrah-200 p-8 text-center">
          <h3 className="text-2xl font-semibold text-ink-900">أكملت الرحلة 🌱</h3>
          <p className="mt-2 text-sm text-ink-700 leading-relaxed max-w-md mx-auto">
            ١٤ يوماً ليست النهاية — هي بداية نسختك المالية الجديدة. ارجع لأي يوم متى احتجت
            إلى التذكير.
          </p>
        </section>
      )}

      <section className="rounded-xl2 border border-dashed border-ink-200 bg-ink-50/40 p-5 text-center">
        <p className="text-sm text-ink-600">تريد أن تبدأ من جديد؟</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("سيتم حذف كل تقدّمك. هل أنت متأكد؟")) reset();
          }}
          className="mt-3 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs text-ink-700 hover:border-ink-400"
        >
          إعادة الرحلة
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50/50 p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink-900 tabular-nums">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}
