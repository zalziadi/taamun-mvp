"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isEntitled } from "../../lib/storage";
import { VerseCard } from "../../components/VerseCard";
import { ChoiceChips } from "../../components/ChoiceChips";
import { getDayData, getRamadanDayInfo } from "../../lib/ramadan-28";
import { upsertEntry, loadProgress, getTodayUtcDateKey } from "../../lib/storage";
import type { Phase } from "../../lib/types";

const LABELS: Record<Phase, string> = {
  shadow: "ظل",
  awareness: "إدراك",
  contemplation: "تمعّن",
};

export default function DayPage() {
  const router = useRouter();
  const [entitled, setEntitled] = useState<boolean | null>(null);

  const { dayIndex, status } = getRamadanDayInfo();
  const state = loadProgress();
  const existing = state.entries[String(dayIndex)];
  const [phase, setPhase] = useState<Phase | null>(existing?.phase ?? null);
  const [note, setNote] = useState(existing?.note ?? "");

  useEffect(() => {
    if (!isEntitled()) {
      router.replace("/subscribe?reason=locked");
      return;
    }
    const id = setTimeout(() => setEntitled(true), 0);
    return () => clearTimeout(id);
  }, [router]);

  const handleSave = useCallback(() => {
    if (!phase) return;
    upsertEntry({
      dayId: dayIndex,
      phase,
      note: note.trim() || undefined,
      answeredAtISO: new Date().toISOString(),
    });
    window.location.reload();
  }, [dayIndex, phase, note]);

  if (entitled === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جاري التوجيه...</p>
      </div>
    );
  }

  const todayUtc = getTodayUtcDateKey();
  const isLocked = state.lastSavedUtcDate === todayUtc;
  const dayData = getDayData(dayIndex);

  if (!dayData) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6 text-white">
        <p>اليوم غير موجود</p>
        <Link href="/" className="text-white/80 underline">
          الرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/progress" className="text-white/70 hover:text-white">
          التقدم
        </Link>
        <Link href="/subscribe" className="text-white/70 hover:text-white">
          الاشتراك
        </Link>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-white">اليوم {dayIndex} من 28</h1>

      {status === "before" && (
        <p className="mb-4 text-sm text-amber-400/90">رمضان لم يبدأ بعد — عرض اليوم 1</p>
      )}
      {status === "after" && (
        <p className="mb-4 text-sm text-amber-400/90">انتهت أيام البرنامج — عرض اليوم 28</p>
      )}

      <VerseCard verse={dayData.verse} reference={dayData.reference} />

      {isLocked ? (
        <div className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-6">
          <p className="text-xl font-medium text-emerald-400">تم حفظ جلسة اليوم ✅</p>
          <Link
            href="/progress"
            className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            ارجع للتقدم
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            <p className="text-white/80">{dayData.questions.shadow}</p>
            <p className="text-white/80">{dayData.questions.awareness}</p>
            <p className="text-white/80">{dayData.questions.contemplation}</p>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-white/90">اختر مرحلة:</p>
            <ChoiceChips value={phase} onChange={setPhase} labels={LABELS} />
          </div>

          <div className="mt-8">
            <label htmlFor="note" className="mb-2 block text-white/90">
              ملاحظة (اختياري)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
              placeholder="اكتب ملاحظاتك..."
            />
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={!phase}
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] disabled:cursor-not-allowed disabled:opacity-40"
            >
              حفظ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
