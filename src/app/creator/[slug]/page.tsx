"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Journey {
  slug: string;
  creator_user_id: string;
  title: string;
  description: string;
  duration_days: number;
  creator_display_name: string;
  status: string;
  subscriber_count: number;
}

interface Day {
  id: string;
  day_number: number;
  verse_text: string;
  verse_ref: string;
  reflection_prompt: string;
  exercise: string | null;
}

export default function CreatorJourneyEditor() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [savingMeta, setSavingMeta] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Day form state (mirrors the selected day_number)
  const [verseText, setVerseText] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [prompt, setPrompt] = useState("");
  const [exercise, setExercise] = useState("");
  const [dayPending, setDayPending] = useState(false);

  async function load() {
    const res = await fetch(`/api/creator/journeys/${slug}`);
    if (res.status === 401) {
      router.push(`/auth?next=/creator/${slug}`);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.journey) {
      setJourney(data.journey);
      setDays(data.days ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // When activeDay changes, hydrate the day form
  useEffect(() => {
    const existing = days.find((d) => d.day_number === activeDay);
    setVerseText(existing?.verse_text ?? "");
    setVerseRef(existing?.verse_ref ?? "");
    setPrompt(existing?.reflection_prompt ?? "");
    setExercise(existing?.exercise ?? "");
  }, [activeDay, days]);

  async function saveDay(e: React.FormEvent) {
    e.preventDefault();
    if (dayPending || !journey) return;
    setDayPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator/journeys/${slug}/days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_number: activeDay,
          verse_text: verseText.trim(),
          verse_ref: verseRef.trim(),
          reflection_prompt: prompt.trim(),
          exercise: exercise.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.day) {
        setMessage(`✓ تم حفظ اليوم ${activeDay}`);
        await load();
      } else {
        setMessage(
          data?.error === "invalid_day"
            ? "تحقّق من الحقول — النصوص قصيرة جداً"
            : "تعذّر الحفظ"
        );
      }
    } finally {
      setDayPending(false);
    }
  }

  async function publish() {
    if (!journey) return;
    setSavingMeta(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator/journeys/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(
          data.journey?.status === "flagged"
            ? "الرحلة في المراجعة (وُضع علم تلقائياً)"
            : "✓ تم النشر"
        );
        await load();
      } else if (data.error === "missing_days") {
        setMessage(`يجب إضافة جميع الأيام (${data.found}/${data.expected})`);
      } else {
        setMessage("تعذّر النشر");
      }
    } finally {
      setSavingMeta(false);
    }
  }

  async function unpublish() {
    if (!journey) return;
    setSavingMeta(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator/journeys/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (res.ok) {
        setMessage("تم التحويل الى مسوّدة");
        await load();
      } else {
        setMessage("تعذّر التحديث");
      }
    } finally {
      setSavingMeta(false);
    }
  }

  async function remove() {
    if (!journey) return;
    if (!confirm("حذف الرحلة نهائياً؟")) return;
    const res = await fetch(`/api/creator/journeys/${slug}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/creator");
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-12 text-center" dir="rtl">
        <p className="text-xs text-[#8c7851] italic">تحميل...</p>
      </main>
    );
  }

  if (!journey) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-12 text-center space-y-4" dir="rtl">
        <h1 className="text-xl font-bold text-[#2f2619]">الرحلة غير موجودة</h1>
        <Link
          href="/creator"
          className="inline-block border border-[#5a4a35] text-[#5a4a35] px-5 py-2 text-xs font-bold"
        >
          العودة
        </Link>
      </main>
    );
  }

  const duration = journey.duration_days;
  const dayNumbers = Array.from({ length: duration }, (_, i) => i + 1);
  const filledCount = days.length;
  const isPublished = journey.status === "published";
  const isFlagged = journey.status === "flagged";

  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 space-y-8" dir="rtl">
      <nav className="text-xs text-[#8c7851]">
        <Link href="/creator" className="hover:text-[#5a4a35]">لوحة المبدع</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">{journey.title}</span>
      </nav>

      <header className="tm-card p-6 sm:p-8 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2f2619] leading-tight">
            {journey.title}
          </h1>
          <span
            className={
              "text-[11px] shrink-0 " +
              (isPublished
                ? "text-[#5c7a3f]"
                : isFlagged
                ? "text-[#a6772b]"
                : "text-[#8c7851]")
            }
          >
            {isPublished
              ? "منشورة"
              : isFlagged
              ? "قيد المراجعة"
              : "مسوّدة"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#3d342a]">{journey.description}</p>
        <p className="text-[11px] text-[#8c7851]">
          {duration} يوم · {filledCount}/{duration} مكتمل · {journey.subscriber_count} مشترك
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isPublished && (
            <button
              onClick={publish}
              disabled={savingMeta || filledCount < duration}
              className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-5 py-2 text-xs font-bold disabled:opacity-40"
            >
              {savingMeta ? "..." : "نشر"}
            </button>
          )}
          {isPublished && (
            <button
              onClick={unpublish}
              disabled={savingMeta}
              className="border border-[#5a4a35] text-[#5a4a35] px-5 py-2 text-xs font-bold disabled:opacity-40"
            >
              تحويل الى مسوّدة
            </button>
          )}
          {isPublished && (
            <Link
              href={`/journey/${slug}`}
              className="text-xs text-[#5a4a35] underline"
            >
              معاينة عامة
            </Link>
          )}
          <Link
            href={`/creator/${slug}/analytics`}
            className="text-xs text-[#5a4a35] underline"
          >
            تحليلات
          </Link>
          <button
            onClick={remove}
            className="mr-auto text-[11px] text-[#a64b3f] hover:underline"
          >
            حذف
          </button>
        </div>

        {message && (
          <p className="text-[11px] text-[#8c7851] italic">{message}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-[#5a4a35]">الأيام</h2>

        <div className="flex flex-wrap gap-2">
          {dayNumbers.map((n) => {
            const filled = days.some((d) => d.day_number === n);
            const active = n === activeDay;
            return (
              <button
                key={n}
                onClick={() => setActiveDay(n)}
                className={
                  "px-3 py-1.5 text-xs border " +
                  (active
                    ? "border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7]"
                    : filled
                    ? "border-[#5a4a35]/40 text-[#5a4a35]"
                    : "border-[#c9bda8] text-[#8c7851]")
                }
              >
                {n}
                {filled && !active && " ✓"}
              </button>
            );
          })}
        </div>

        <form onSubmit={saveDay} className="tm-card p-5 sm:p-6 space-y-3">
          <h3 className="text-xs font-bold text-[#5a4a35]">اليوم {activeDay}</h3>
          <textarea
            placeholder="نص الآية"
            value={verseText}
            onChange={(e) => setVerseText(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851] resize-none"
            required
          />
          <input
            type="text"
            placeholder="المرجع (مثال: البقرة: ٢٥٥)"
            value={verseRef}
            onChange={(e) => setVerseRef(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851]"
            required
          />
          <textarea
            placeholder="سؤال التمعّن"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851] resize-none"
            required
          />
          <textarea
            placeholder="تمرين عملي (اختياري)"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851] resize-none"
          />
          <button
            type="submit"
            disabled={dayPending}
            className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-5 py-2 text-xs font-bold disabled:opacity-40"
          >
            {dayPending ? "..." : "حفظ اليوم"}
          </button>
        </form>
      </section>
    </main>
  );
}
