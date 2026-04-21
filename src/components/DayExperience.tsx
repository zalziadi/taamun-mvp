"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { getDay, PROGRESSION_MILESTONES } from "../lib/taamun-content";
import { DailyHint } from "./DailyHint";
import { CompanionVerse } from "./CompanionVerse";
import { CustomQuestion } from "./CustomQuestion";
import { checkAccess, isTrialExpired } from "@/lib/subscriptionAccess";
import { Paywall } from "./Paywall";

interface DayExperienceProps {
  day: number;
}

type AwarenessLevel = "present" | "tried" | "distracted";

const AWARENESS_OPTIONS: { value: AwarenessLevel; label: string; emoji: string }[] = [
  { value: "present", label: "كنت واعياً فعلاً", emoji: "✦" },
  { value: "tried", label: "حاولت", emoji: "◎" },
  { value: "distracted", label: "كنت مشتتاً", emoji: "○" },
];

// ── SilenceGate ───────────────────────────────────────────────────────────────
function SilenceGate({ prompt, onStart }: { prompt: string; onStart: () => void }) {
  return (
    <div className="flex min-h-[60vh] sm:min-h-[70vh] flex-col items-center justify-center gap-6 sm:gap-8 px-4 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="mb-2 text-xs uppercase tracking-widest text-white/40">لحظة صمت</p>
        <p className="text-lg leading-loose text-white/80">{prompt}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-2xl bg-white px-10 py-4 text-base font-semibold text-[#0A0908] transition-opacity hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908]"
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
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908]"
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

const AWARENESS_REFLECTIONS: Record<AwarenessLevel, string> = {
  present: "هذا الحضور هو ما تبنيه الرحلة. لاحظ: ماذا فعلت اليوم بشكل مختلف جعلك أكثر وعياً؟",
  tried: "المحاولة وعيٌ بحد ذاتها. ما الذي شتّتك — وهل تراه الآن بوضوح أكبر؟",
  distracted: "التشتت ليس فشلاً — بل إشارة. ما الذي كان يشغل بالك حقاً اليوم؟",
};

function AwarenessMeter({ day }: { day: number }) {
  const [selected, setSelected] = useState<AwarenessLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const evolved = day > 10;

  const handleSelect = async (level: AwarenessLevel) => {
    setSelected(level);
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from("awareness_logs").upsert(
        { user_id: session.user.id, day, level },
        { onConflict: "user_id,day" }
      );
      if (error) console.error("[AwarenessMeter] save failed:", error);

      // Day 28 completion: queue celebration email (fire-and-forget)
      if (!error && day === 28) {
        fetch("/api/program/complete-journey", { method: "POST" }).catch(() => {});
      }
    } catch (err) {
      console.error("[AwarenessMeter] unexpected error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        {evolved
          ? "بعد كل هذه الأيام — كيف تصف وعيك اليوم؟"
          : "كيف كان مستوى وعيك اليوم؟"}
      </p>
      <div className="flex gap-3">
        {AWARENESS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={saving}
            aria-label={opt.label}
            aria-pressed={selected === opt.value}
            className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908] ${
              selected === opt.value
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            <span className="text-base" aria-hidden="true">{opt.emoji}</span>
            <span className="text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
      {evolved && selected && (
        <p className="mt-2 text-xs leading-relaxed text-white/40 italic">
          {AWARENESS_REFLECTIONS[selected]}
        </p>
      )}
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
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908]"
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
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<{
    completed_days?: number[];
    current_cycle?: number;
  } | null>(null);
  const [ctaState, setCtaState] = useState<"idle" | "submitting" | "raced" | "error">("idle");
  const router = useRouter();
  const content = getDay(day);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    }
    loadProfile();
  }, []);

  // Load progress (canonical client-facing endpoint — returns completed_days + current_cycle)
  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      try {
        const res = await fetch("/api/program/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProgress({
          completed_days: Array.isArray(data.completed_days) ? data.completed_days : [],
          current_cycle: typeof data.current_cycle === "number" ? data.current_cycle : 1,
        });
      } catch {
        // leave progress null — CTA simply won't render
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [day]);

  // Canonical Day-28 completion derivation (plan-checker gap #5)
  const isCompleted = progress?.completed_days?.includes(28) ?? false;

  const handleStartCycle2 = useCallback(async () => {
    if (ctaState !== "idle") return;
    setCtaState("submitting");
    const currentCycle = progress?.current_cycle ?? 1;
    try {
      const res = await fetch("/api/program/start-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle: currentCycle + 1,
          expected_current_cycle: currentCycle,
        }),
      });
      if (res.ok) {
        // Server is authoritative — refresh re-reads /program server component,
        // which redirects to day 1 of the new cycle.
        router.refresh();
        return;
      }
      if (res.status === 409) {
        setCtaState("raced");
        return;
      }
      setCtaState("error");
      setTimeout(() => {
        setCtaState((s) => (s === "error" ? "idle" : s));
      }, 3000);
    } catch {
      setCtaState("error");
      setTimeout(() => {
        setCtaState((s) => (s === "error" ? "idle" : s));
      }, 3000);
    }
  }, [ctaState, progress, router]);

  if (!content) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-white/40">اليوم {day} غير متاح بعد.</p>
      </div>
    );
  }

  // Check if trial has expired - if so, only show verse
  if (profile && isTrialExpired(profile)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-white/30">اليوم {day}</p>
          <p className="text-xs text-white/30">{content.chapter}</p>
        </div>
        
        <h1 className="text-2xl font-bold text-white">{content.title}</h1>
        
        {/* Only show the verse */}
        <VerseBlock verse={content.verse} verseRef={content.verseRef} />
        
        {/* Trial ended paywall */}
        <Paywall type="trial_ended" profile={profile} />
      </div>
    );
  }

  if (!started) {
    return <SilenceGate prompt={content.silencePrompt} onStart={() => setStarted(true)} />;
  }

  // Check access for steps 4-5
  const step4_5_access = checkAccess('day_steps_4_5', profile);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-white/30">اليوم {day}</p>
        <p className="text-xs text-white/30">{content.chapter}</p>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white">{content.title}</h1>

      {/* Daily Hint */}
      <DailyHint cycleDay={day} />

      {/* Progression Badge */}
      <ProgressionBadge day={day} />

      {/* Verse */}
      <VerseBlock verse={content.verse} verseRef={content.verseRef} />

      {/* Companion Verse */}
      <CompanionVerse cycleDay={day} />

      {/* Custom Question */}
      <CustomQuestion cycleDay={day} />

      {/* Hidden Layer — open for first 3 days or subscribers */}
      {(day <= 3 || step4_5_access.allowed) ? (
        <HiddenLayer text={content.hiddenLayer} />
      ) : null}

      {/* Book Quote */}
      <BookQuote quote={content.bookQuote} chapter={content.bookChapter} />

      {/* Exercise — open for first 3 days or subscribers */}
      {(day <= 3 || step4_5_access.allowed) ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-1 text-xs uppercase tracking-widest text-white/40">تمرين اليوم</p>
          <p className="text-sm leading-loose text-white/80">{content.exercise}</p>
        </div>
      ) : null}

      {/* Reflection Journal — open for first 3 days or subscribers */}
      {(day <= 3 || step4_5_access.allowed) ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-4 text-xs uppercase tracking-widest text-white/40">تأمّل يومي</p>
          <ReflectionJournal day={day} question={content.question} />
        </div>
      ) : null}

      {/* Smart Paywall — single paywall after day 3 for trial users */}
      {day > 3 && !step4_5_access.allowed && (
        <Paywall
          type="smart_paywall"
          message="عشت ٣ أيام كاملة مع تمعّن. الرحلة بدأت تتعمّق — هل تكمل؟"
        />
      )}

      {/* Awareness Meter */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AwarenessMeter day={day} />
      </div>

      {/* Share */}
      <ShareCard day={day} verse={content.verse} verseRef={content.verseRef} />

      {/* Day-28 closing moment — quiet verse, no buttons, no celebration.
          Adds tonal depth to the completion moment before the cycle-2 CTA.
          Framer-motion subtle fade · contemplative · no confetti · no share.
          v1.4 addition — Stage 3 CX depth. */}
      <AnimatePresence>
        {day === 28 && isCompleted && (
          <motion.section
            key="day-28-closing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            aria-label="لحظة ختام اليوم الثامن والعشرين"
            className="mb-6 border-t border-b border-white/5 py-10 text-center"
          >
            <p
              className="mx-auto mb-4 max-w-md font-serif text-xl leading-loose text-white/85 sm:text-2xl"
              dir="rtl"
            >
              ﴿ يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ · ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً ﴾
            </p>
            <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-white/30">
              الفجر · ٢٧–٢٨
            </p>
            <div className="my-6 flex items-center justify-center gap-3 text-white/25" aria-hidden="true">
              <span className="h-px w-10 bg-white/15" />
              <span className="text-xs">·</span>
              <span className="h-px w-10 bg-white/15" />
            </div>
            <p className="mx-auto max-w-sm text-sm leading-loose text-white/55">
              ثمانية وعشرون يومًا — تمعّن معك.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Day-28 Cycle 2 CTA — inline, no modal, Arabic-native (RETURN-01/03/04) */}
      <AnimatePresence>
        {day === 28 && isCompleted && (
          <motion.section
            key="cycle-2-cta"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 1.4 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
              الحلقة الثانية — نفس الآيات، تعمّق أعمق
            </p>
            <p className="mb-5 text-sm leading-loose text-white/80">
              بعد هذه المرحلة، تعود الآيات كما هي، ويتغيّر قلبك. حين تكون مستعدًا، واصل.
            </p>

            {ctaState === "raced" ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-white/70">
                  تم بدء الحلقة من جهاز آخر. حدّث الصفحة لمتابعة رحلتك.
                </p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-sm text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908]"
                >
                  تحديث
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStartCycle2}
                  aria-busy={ctaState === "submitting"}
                  aria-disabled={ctaState !== "idle"}
                  disabled={ctaState !== "idle"}
                  className={`w-full rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#0A0908] transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0908] ${
                    ctaState === "idle"
                      ? "hover:opacity-90 active:scale-[0.99]"
                      : "cursor-not-allowed opacity-60"
                  }`}
                >
                  {ctaState === "submitting" ? "جارٍ البدء..." : "واصل الرحلة"}
                </button>
                {ctaState === "idle" && (
                  <p className="text-center text-xs text-white/40">
                    (ستبقى تأمّلاتك السابقة محفوظة)
                  </p>
                )}
                {ctaState === "error" && (
                  <p className="text-center text-xs leading-relaxed text-white/60">
                    تعذّر بدء الحلقة. جرّب مرة أخرى بعد لحظات.
                  </p>
                )}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
