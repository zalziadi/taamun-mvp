"use client";

import { PatternTimeline } from "@/components/PatternTimeline";
import { ThemeCloud } from "@/components/ThemeCloud";
import { DepthChart } from "@/components/DepthChart";
import Link from "next/link";

type InsightRow = {
  cycle_day: number;
  depth_score: number;
  shift_detected: boolean;
  shift_description: string | null;
  themes: string[];
  daily_hint: string;
  weekly_summary: string | null;
  week_number: number;
  hijri_year: number;
  hijri_month: number;
  hijri_day: number;
};

interface PatternsClientProps {
  insights: InsightRow[];
  currentDay: number;
  hijriLabel: string;
}

function aggregateThemes(insights: InsightRow[]) {
  const counts = new Map<string, number>();
  for (const row of insights) {
    for (const theme of row.themes) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

export function PatternsClient({ insights, currentDay, hijriLabel }: PatternsClientProps) {
  const shifts = insights.filter((i) => i.shift_detected && i.shift_description);
  const themes = aggregateThemes(insights);

  // Group weekly summaries
  const weekSummaries = [1, 2, 3, 4]
    .map((w) => {
      const weekInsights = insights.filter((i) => i.week_number === w);
      const summary = weekInsights.find((i) => i.weekly_summary)?.weekly_summary;
      return summary ? { week: w, summary } : null;
    })
    .filter(Boolean) as { week: number; summary: string }[];

  if (insights.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-2xl text-white/40">✦</p>
        <p className="mt-4 text-base text-white/60">
          لم تتراكم أنماط بعد — واصل التمعّن اليومي وستظهر أنماطك هنا.
        </p>
        <Link
          href="/day/1"
          className="mt-6 inline-block rounded-xl bg-white/10 px-6 py-3 text-sm text-white/80 hover:bg-white/15 transition-colors"
        >
          ابدأ التمعّن
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">أنماطي</h1>
        <p className="text-xs text-white/40">{hijriLabel}</p>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <PatternTimeline
          days={insights.map((i) => ({
            cycle_day: i.cycle_day,
            depth_score: i.depth_score,
            shift_detected: i.shift_detected,
          }))}
          currentDay={currentDay}
        />
      </div>

      {/* Theme Cloud */}
      {themes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <ThemeCloud themes={themes} />
        </div>
      )}

      {/* Depth Chart */}
      {insights.length >= 2 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <DepthChart
            points={insights.map((i) => ({
              cycle_day: i.cycle_day,
              depth_score: i.depth_score,
            }))}
          />
        </div>
      )}

      {/* Shift Moments */}
      {shifts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/40">لحظات التحوّل</p>
          {shifts.map((s) => (
            <div
              key={s.cycle_day}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">◈</span>
                <span className="text-xs text-amber-400/70">يوم {s.cycle_day}</span>
              </div>
              <p className="text-sm leading-relaxed text-amber-100/80">
                {s.shift_description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Summaries */}
      {weekSummaries.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/40">ملخصات أسبوعية</p>
          {weekSummaries.map((ws) => (
            <div
              key={ws.week}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="mb-2 text-xs text-white/40">الأسبوع {ws.week}</p>
              <p className="text-sm leading-relaxed text-white/70">{ws.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
