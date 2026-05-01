"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DAYS, TOTAL_DAYS } from "@/lib/days";
import { DayCard } from "@/components/DayCard";
import { ProgressBar } from "@/components/ProgressBar";
import { useProgressStore } from "@/store/useProgressStore";
import { PHASE_META } from "@/lib/types";

export default function JourneyPage() {
  const progress = useProgressStore((s) => s.progress);
  const isUnlocked = useProgressStore((s) => s.isUnlocked);
  const percent = useProgressStore((s) => s.percent());
  const completed = useProgressStore((s) => s.completed());

  const grouped = useMemo(() => {
    return DAYS.reduce<Record<string, typeof DAYS>>((acc, d) => {
      (acc[d.phase] ||= []).push(d);
      return acc;
    }, {});
  }, []);

  const nextDay = DAYS.find((d) => isUnlocked(d.id) && !progress.days[d.id]?.completed);

  return (
    <div className="space-y-12">
      <header className="space-y-6">
        <div>
          <p className="text-xs font-medium text-wafrah-700">الرحلة</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink-900">١٤ يوم — ٤ مراحل</h1>
          <p className="mt-2 text-sm text-ink-600 max-w-xl leading-relaxed">
            افتح يوماً واحداً في كل مرة. اكتب إجابتك بصدق ثم أكمل اليوم لتفتح التالي.
          </p>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft">
          <ProgressBar value={percent} />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-ink-600">
              أكملت <strong className="text-ink-900 tabular-nums">{completed}</strong> من{" "}
              <strong className="text-ink-900 tabular-nums">{TOTAL_DAYS}</strong>
            </span>
            {nextDay && (
              <Link
                href={`/day/${nextDay.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
              >
                تابع اليوم {nextDay.id} ←
              </Link>
            )}
          </div>
        </div>
      </header>

      {(Object.keys(grouped) as Array<keyof typeof PHASE_META>).map((phase) => (
        <section key={phase} className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-ink-900">
              {PHASE_META[phase].label}
            </h2>
            <span className="text-xs text-ink-400">{PHASE_META[phase].range}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[phase].map((day, idx) => (
              <DayCard
                key={day.id}
                day={day}
                index={idx}
                unlocked={isUnlocked(day.id)}
                completed={progress.days[day.id]?.completed === true}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
