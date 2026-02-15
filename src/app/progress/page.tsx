"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  loadProgress,
  getTodayUtcDateKey,
  clearProgress,
  isAdminEnabled,
  isEntitled,
} from "../../lib/storage";
import { track } from "../../lib/analytics";
import { getDayIndexForToday } from "../../lib/ramadan-28";
import {
  computeTotals,
  computeDominantStage,
  getDailyInsight,
  computeStreak,
} from "../../lib/scoring";
import type { Phase } from "../../lib/types";

const PHASE_LABELS: Record<Phase, string> = {
  shadow: "ظل",
  awareness: "إدراك",
  contemplation: "تمعّن",
};

export default function ProgressPage() {
  const router = useRouter();
  const [state, setState] = useState(() => loadProgress());
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const entries = state.entries;
  const isAdmin = isAdminEnabled();
  const currentDayIndex = getDayIndexForToday();
  const todayUtc = getTodayUtcDateKey();
  const isTodayLocked = state.lastSavedUtcDate === todayUtc;

  useEffect(() => {
    if (!isEntitled()) {
      router.replace("/subscribe?reason=locked");
      return;
    }
    track("progress_opened", {});
    const id = setTimeout(() => setEntitled(true), 0);
    return () => clearTimeout(id);
  }, [router]);

  const { counts, points, totalDays } = useMemo(
    () => computeTotals(entries),
    [entries]
  );
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const dominant = useMemo(
    () => computeDominantStage(counts, points),
    [counts, points]
  );
  const insight = dominant ? getDailyInsight(dominant) : null;

  const handleReset = useCallback(() => {
    if (!confirm("هل تريد مسح كل التقدم؟ لا يمكن التراجع.")) return;
    setState(clearProgress());
  }, []);

  if (entitled === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جاري التوجيه...</p>
      </div>
    );
  }

  const completed = totalDays;
  const totalForPercent = completed > 0 ? completed : 1;

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/subscribe" className="text-white/70 hover:text-white">
          الاشتراك
        </Link>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-white">التقدم</h1>

      {isAdmin && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
          >
            Reset Progress
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/day"
          className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] hover:bg-white/90"
        >
          اكمل اليوم
        </Link>
        <Link
          href="/book"
          className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-white hover:bg-white/10"
        >
          الكتاب
        </Link>
      </div>

      {completed === 0 ? (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-4 text-white/80">لم تبدأ بعد.</p>
          <Link
            href="/day"
            className="inline-block rounded-lg bg-white px-6 py-2 font-medium text-[#0B0F14]"
          >
            ابدأ من صفحة اليوم
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">ملخص تقدمك</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">ظل</span>
                <span className="font-medium text-white">
                  {counts.shadow} يوم · {Math.round((counts.shadow / totalForPercent) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">إدراك</span>
                <span className="font-medium text-white">
                  {counts.awareness} يوم · {Math.round((counts.awareness / totalForPercent) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">تمعّن</span>
                <span className="font-medium text-white">
                  {counts.contemplation} يوم ·{" "}
                  {Math.round((counts.contemplation / totalForPercent) * 100)}%
                </span>
              </div>
            </div>
            {dominant && (
              <div className="mt-4 rounded-lg border border-white/20 bg-white/5 px-4 py-2">
                <span className="text-white/60">المرحلة الغالبة: </span>
                <span className="font-bold text-white">{PHASE_LABELS[dominant]}</span>
              </div>
            )}
            {insight && (
              <p className="mt-4 text-sm leading-relaxed text-white/90">{insight}</p>
            )}
          </div>

          <div className="mb-8 flex flex-wrap gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-white/60">مكتمل</p>
              <p className="text-3xl font-bold text-white">
                {completed} <span className="text-lg font-normal">/ 28</span>
              </p>
              <p className="mt-1 text-sm text-white/60">
                {Math.round((completed / 28) * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-white/60">التوالي</p>
              <p className="text-2xl font-bold text-white">{streak}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-white/60">ظل</p>
              <p className="text-2xl font-bold text-white">{counts.shadow}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-white/60">إدراك</p>
              <p className="text-2xl font-bold text-white">{counts.awareness}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-white/60">تمعّن</p>
              <p className="text-2xl font-bold text-white">{counts.contemplation}</p>
            </div>
          </div>
        </>
      )}

      <p className="mb-4 text-white/80">شبكة 28 يوم</p>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const isCurrent = day === currentDayIndex;
          const hasEntry = !!entries[String(day)];
          const entry = entries[String(day)];

          const cellContent =
            isCurrent && entry && isTodayLocked ? (
              <span className="flex flex-col items-center gap-0.5 text-xs">
                <span className="text-emerald-400">تم ✅</span>
                <span className="text-white/80">{PHASE_LABELS[entry.phase]}</span>
              </span>
            ) : hasEntry ? (
              <span className="flex flex-col items-center gap-0.5 text-xs">
                <span className="text-emerald-400">تم</span>
                <span className="text-white/80">{PHASE_LABELS[entry.phase]}</span>
              </span>
            ) : (
              day
            );

          return (
            <Link
              key={day}
              href="/day"
              className={`flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? "border-2 border-white bg-white/20 text-white"
                  : hasEntry
                    ? "bg-white/20 text-white"
                    : "border border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {cellContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
