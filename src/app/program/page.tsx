"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { programDayRoute } from "@/lib/routes";

const TOTAL_DAYS = 28;

type ProgressPayload = {
  ok?: boolean;
  error?: string;
  total_days?: number;
  current_day?: number;
  completed_days?: number[];
  completed_count?: number;
  percent?: number;
};

function calculateStreak(completedDays: number[]): number {
  if (!completedDays.length) return 0;
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = sorted[0];
  for (const d of sorted) {
    if (d === expected) { streak++; expected--; }
    else break;
  }
  return streak;
}

export default function ProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(TOTAL_DAYS);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/program/progress", { cache: "no-store" });
        if (res.status === 401) {
          setRedirecting(true);
          router.replace("/auth?next=/program");
          return;
        }
        const data = (await res.json()) as ProgressPayload;
        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل بيانات البرنامج الآن.");
          return;
        }
        const total = data.total_days ?? TOTAL_DAYS;
        const completed = Array.isArray(data.completed_days) ? data.completed_days : [];
        const count = data.completed_count ?? completed.length;
        setTotalDays(total);
        setCurrentDay(data.current_day ?? 1);
        setCompletedDays(completed);
        setPercent(data.percent ?? Math.round((count / total) * 100));
      } catch {
        setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const completedCount = useMemo(() => completedDays.length, [completedDays]);
  const streak = useMemo(() => calculateStreak(completedDays), [completedDays]);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  if (loading || redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 py-8 space-y-8">

      {/* Streak + progress header */}
      <div className="rounded-2xl border border-border bg-panel p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">برنامج 28 يوم</h1>
            {streak > 0 && (
              <p className="mt-1 text-sm text-gold">
                اليوم {streak} من التمعّن · {streak} {streak === 1 ? "يوم" : "أيام"} متتالية
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push(programDayRoute(currentDay))}
            className="focus-ring rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-90 transition-opacity"
          >
            متابعة اليوم {currentDay}
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted">
            <span>{completedCount} من {totalDays} يوماً</span>
            <span>{percent}٪</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      {/* Days grid */}
      <div className="rounded-2xl border border-border bg-panel p-6 space-y-5">
        <h2 className="text-xl font-semibold text-text">الأيام</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const isDone = completedSet.has(day);
            const isToday = day === currentDay;
            const isLocked = day > currentDay;

            return (
              <button
                key={day}
                type="button"
                disabled={isLocked}
                onClick={() => router.push(programDayRoute(day))}
                className={[
                  "focus-ring rounded-xl border p-3 text-center transition-colors",
                  isDone
                    ? "border-gold bg-gold/10 text-gold"
                    : isToday
                    ? "border-gold/60 bg-gold/5 text-text ring-1 ring-gold/40"
                    : isLocked
                    ? "border-border bg-panel2 text-muted cursor-not-allowed opacity-50"
                    : "border-border bg-panel text-text hover:bg-panel2",
                ].join(" ")}
              >
                <div className="text-xs font-medium">اليوم</div>
                <div className="mt-1 text-lg font-semibold">{day}</div>
                <div className="mt-1 text-xs">
                  {isDone ? "✓" : isToday ? "اليوم" : isLocked ? "🔒" : "·"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/progress")}
          className="text-sm text-muted hover:text-text transition-colors"
        >
          عرض سجل التأملات →
        </button>
      </div>
    </div>
  );
}
