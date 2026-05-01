"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useProgressStore } from "@/store/useProgressStore";
import { DAYS } from "@/lib/days";

export default function ReflectionPage() {
  const progress = useProgressStore((s) => s.progress);
  const entries = DAYS
    .map((d) => ({ day: d, state: progress.days[d.id] }))
    .filter((row) => row.state && (row.state.answer.trim() || row.state.reflection.trim()));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-medium text-wafrah-700">التأمّلات</p>
        <h1 className="text-3xl font-semibold text-ink-900">ما كتبته خلال الرحلة</h1>
        <p className="text-sm text-ink-600 leading-relaxed max-w-xl">
          هذه صفحتك الخاصة — كلّ ما كتبته من إجابات وملاحظات يجتمع هنا حتى ترى المسار كاملاً.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-ink-200 bg-white p-10 text-center">
          <p className="text-base text-ink-700">لم تكتب أي تأمّل بعد.</p>
          <p className="mt-1 text-sm text-ink-500">
            ابدأ من اليوم الأول لتظهر إجاباتك هنا.
          </p>
          <Link
            href="/day/1"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            ابدأ اليوم 1 ←
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map(({ day, state }, idx) => (
            <motion.article
              key={day.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
              className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-medium text-wafrah-700">
                    اليوم {day.id} · {day.phaseLabel}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink-900">{day.title}</h2>
                </div>
                <Link
                  href={`/day/${day.id}`}
                  className="text-xs text-ink-500 hover:text-ink-900"
                >
                  افتح ←
                </Link>
              </div>

              <blockquote className="text-sm text-ink-500 italic mb-4 leading-relaxed">
                {day.question}
              </blockquote>

              {state!.answer.trim() && (
                <div className="prose-quiet whitespace-pre-wrap text-base text-ink-800 leading-relaxed">
                  {state!.answer}
                </div>
              )}

              {state!.reflection.trim() && (
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <p className="text-xs text-ink-400 mb-1">ملاحظة جانبية</p>
                  <p className="prose-quiet whitespace-pre-wrap text-sm text-ink-600 leading-relaxed">
                    {state!.reflection}
                  </p>
                </div>
              )}

              <p className="mt-4 text-[11px] text-ink-400">
                آخر تحديث: {new Date(state!.updatedAt).toLocaleString("ar")}
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
