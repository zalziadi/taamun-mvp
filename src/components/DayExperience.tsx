"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getDay, PROGRESSION_MILESTONES } from "../lib/taamun-content";

interface DayExperienceProps {
  day: number;
}

type AwarenessLevel = "aware" | "tried" | "distracted";

const AWARENESS_OPTIONS: { value: AwarenessLevel; label: string; emoji: string }[] = [
  { value: "aware", label: "كنت واعياً فعلاً", emoji: "✦" },
  { value: "tried", label: "حاولت", emoji: "◎" },
  { value: "distracted", label: "كنت مشتتاً", emoji: "○" },
];

// ── SilenceGate ───────────────────────────────────────────────────────────────
function SilenceGate({ prompt, onStart }: { prompt: string; onStart: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="mb-2 text-xs uppercase tracking-widest text-white/40">لحظة صمت</p>
        <p className="text-lg leading-loose text-white/80">{prompt}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-2xl bg-white px-10 py-4 text-base font-semibold text-[#15130f] transition-opacity hover:opacity-90 active:scale-95"
      >
        ابدأ التمعّن
      </button>
    </div>
  );
}

// ── VerseBlock ────────────────────────────────────────────────────────────────
function VerseBlock({ verse, verseRef }: { verse: string; verseRef: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
      <p className="mb-4 text-2xl leading-loose text-white">{verse}</p>
      <p className="text-sm text-white/50">{verseRef}</p>
    </div>
  );
}

// ── HiddenLayer ───────────────────────────────────────────────────────────────
function HiddenLayer({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span className="text-xs">◈</span>
        {open ? "أغلق الطبقة" : "طبقة أعمق"}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm leading-loose text-white/80">{text}</p>
        </div>
      )}
    </div>
  );
}

// ── BookQuote ─────────────────────────────────────────────────────────────────
function BookQuote({ quote, chapter }: { quote: string; chapter: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <p className="mb-3 text-sm uppercase tracking-widest text-amber-400/60">من الكتاب</p>
      <p className="mb-2 text-base leading-loose text-amber-100/90">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs text-amber-400/50">{chapter}</p>
    </div>
  );
}

// ── ReflectionJournal ─────────────────────────────────────────────────────────
function ReflectionJournal({ day, question }: { day: number; question: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      setStatus("saving");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setStatus("idle");
          return;
        }
        const { error } = await supabase.from("reflections").upsert(
          { user_id: session.user.id, day, note: value },
          { onConflict: "user_id,day" }
        );
        setStatus(error ? "error" : "saved");
      } catch {
        setStatus("error");
      }
    },
    [day]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) return;
    timerRef.current = setTimeout(() => save(text), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, save]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">{question}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus("idle");
        }}
        placeholder="اكتب ما يخطر ببالك..."
        rows={5}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-loose text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
      />
      <p className="h-4 text-xs text-white/30">
        {status === "saving" && "يحفظ..."}
        {status === "saved" && "✓ محفوظ"}
        {status === "error" && "تعذّر الحفظ"}
      </p>
    </div>
  );
}

// ── AwarenessMeter ────────────────────────────────────────────────────────────
function AwarenessMeter({ day }: { day: number }) {
  const [selected, setSelected] = useState<AwarenessLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (level: AwarenessLevel) => {
    setSelected(level);
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from("awareness_logs").upsert(
        { user_id: session.user.id, day, level },
        { onConflict: "user_id,day" }
      );
    } catch {
      // save silently fails — selection still shows
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">كيف كان مستوى وعيك اليوم؟</p>
      <div className="flex gap-3">
        {AWARENESS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={saving}
            className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs transition-all ${
              selected === opt.value
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            <span className="text-base">{opt.emoji}</span>
            <span className="text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ShareCard ─────────────────────────────────────────────────────────────────
function ShareCard({ day, verse, verseRef }: { day: number; verse: string; verseRef: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `اليوم ${day} من رحلة تمعّن\n\n${verse}\n\n${verseRef}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      <span className="text-base">↗</span>
      {copied ? "تم النسخ" : "شارك اليوم"}
    </button>
  );
}

// ── ProgressionBadge ──────────────────────────────────────────────────────────
function ProgressionBadge({ day }: { day: number }) {
  if (!(PROGRESSION_MILESTONES as readonly number[]).includes(day)) return null;

  const labels: Record<number, string> = {
    1: "بداية الرحلة",
    3: "ثلاثة أيام من الوعي",
    7: "أسبوع كامل",
    14: "نصف الرحلة",
    21: "الأيام الحاسمة",
    28: "أتممت الرحلة",
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-sm">
      <p className="mb-1 text-2xl">◈</p>
      <p className="text-base font-semibold text-white">{labels[day]}</p>
      <p className="mt-1 text-xs text-white/50">اليوم {day}</p>
    </div>
  );
}

// ── DayExperience ─────────────────────────────────────────────────────────────
export function DayExperience({ day }: DayExperienceProps) {
  const [started, setStarted] = useState(false);
  const content = getDay(day);

  if (!content) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-white/40">اليوم {day} غير متاح بعد.</p>
      </div>
    );
  }

  if (!started) {
    return <SilenceGate prompt={content.silencePrompt} onStart={() => setStarted(true)} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-white/30">اليوم {day}</p>
        <p className="text-xs text-white/30">{content.chapter}</p>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">{content.title}</h1>

      {/* Progression Badge */}
      <ProgressionBadge day={day} />

      {/* Verse */}
      <VerseBlock verse={content.verse} verseRef={content.verseRef} />

      {/* Hidden Layer */}
      <HiddenLayer text={content.hiddenLayer} />

      {/* Book Quote */}
      <BookQuote quote={content.bookQuote} chapter={content.bookChapter} />

      {/* Exercise */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-1 text-xs uppercase tracking-widest text-white/40">تمرين اليوم</p>
        <p className="text-sm leading-loose text-white/80">{content.exercise}</p>
      </div>

      {/* Reflection Journal */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <p className="mb-4 text-xs uppercase tracking-widest text-white/40">تأمّل يومي</p>
        <ReflectionJournal day={day} question={content.question} />
      </div>

      {/* Awareness Meter */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AwarenessMeter day={day} />
      </div>

      {/* Share */}
      <ShareCard day={day} verse={content.verse} verseRef={content.verseRef} />
    </div>
  );
}
