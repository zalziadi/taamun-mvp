"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JourneyContent = {
  day: number;
  verseText: string;   // from Supabase (quran_ayahs)
  verseRef: string;    // e.g. "العلق: ١"
  question: string;
  exercise: string;
  whisper: { text: string; source: string } | null;
};

type Step =
  | "onboarding"
  | "arrival"
  | "verse"
  | "question"
  | "exercise"
  | "reflection"
  | "awareness"
  | "closing";

type Props = {
  content: JourneyContent;
  isFirstTime: boolean;
  onComplete: () => void; // called after Step 7
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Header label shown on arrival + closing screens.
 *
 * BUG FIX (PR-5 Task 0): previously used `streak` (number of consecutive
 * completed days), which caused "اليوم 7 من التمعّن" to show on any day
 * the user opened once their streak reached 7. The correct source is
 * `day` — the day the user is actually opening right now. Streak is
 * still tracked separately and can be rendered elsewhere if needed.
 */
function dayLabel(day: number): string {
  return `اليوم ${day} من التمعّن`;
}

function buildShareText(content: JourneyContent): string {
  return `تمعّن — اليوم ${content.day}\n${content.verseText}\n${content.question}\ntaamun.com`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Layout wrapper for a journey step ───────────────────────────────────────

function StepShell({
  visible,
  children,
  centered = true,
}: {
  visible: boolean;
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={[
        "journey-shell fixed inset-0 z-50 overflow-y-auto",
        centered ? "flex flex-col items-center justify-center" : "",
        visible ? "journey-step-visible" : "journey-step-enter",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// ─── Step 0: Onboarding ───────────────────────────────────────────────────────

function StepOnboarding({
  visible,
  onStart,
}: {
  visible: boolean;
  onStart: () => void;
}) {
  return (
    <StepShell visible={visible}>
      <div className="max-w-sm px-8 text-center space-y-8">
        <div className="space-y-2">
          <p className="text-2xl font-bold text-ink">أهلاً بك في تمعّن</p>
          <p className="text-xl text-ink2">28 يوماً مع القرآن</p>
        </div>
        <p className="text-ink3 leading-relaxed">
          آية. سؤال. تمرين. كل يوم.
        </p>
        <button
          onClick={onStart}
          className="w-full rounded-2xl bg-ink py-4 text-parchment font-semibold text-lg hover:bg-ink2 transition-colors"
        >
          ابدأ رحلتك
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 1: الوصول ───────────────────────────────────────────────────────────

function StepArrival({
  visible,
  day,
  onNext,
}: {
  visible: boolean;
  day: number;
  onNext: () => void;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <StepShell visible={visible}>
      <div className="flex flex-col items-center gap-10 px-6 text-center">
        {/* Breathing circle */}
        <div className="relative flex items-center justify-center">
          <div className="breathe-circle w-32 h-32 rounded-full bg-breath/20" />
          <div className="absolute w-20 h-20 rounded-full bg-breath/30" />
        </div>

        <div className="space-y-2">
          <p className="text-sm tracking-widest text-ink3 uppercase">الوصول</p>
          <p className="text-2xl font-bold text-ink">{dayLabel(day)}</p>
          <p className="text-ink3">خذ ثلاث أنفاس قبل أن تبدأ</p>
        </div>

        <button
          onClick={onNext}
          className={[
            "rounded-2xl px-10 py-3 font-semibold text-parchment transition-all duration-500",
            ready ? "bg-ink opacity-100" : "bg-ink/30 opacity-50 cursor-not-allowed",
          ].join(" ")}
          disabled={!ready}
        >
          أنا مستعد
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 2: الآية ───────────────────────────────────────────────────────────

function StepVerse({
  visible,
  verseText,
  verseRef,
  onNext,
}: {
  visible: boolean;
  verseText: string;
  verseRef: string;
  onNext: () => void;
}) {
  return (
    <StepShell visible={visible}>
      <div className="max-w-2xl px-8 text-center space-y-10">
        <p className="text-xs tracking-widest text-ink3">الآية</p>
        <p className="journey-verse text-2xl sm:text-3xl text-ink leading-[2.4] font-medium">
          ﴿{verseText}﴾
        </p>
        <p className="text-ink3 text-sm">{verseRef}</p>
        <button
          onClick={onNext}
          className="rounded-2xl bg-ink px-10 py-3 text-parchment font-semibold hover:bg-ink2 transition-colors"
        >
          تأملت
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 3: السؤال ──────────────────────────────────────────────────────────

function StepQuestion({
  visible,
  question,
  onNext,
}: {
  visible: boolean;
  question: string;
  onNext: () => void;
}) {
  return (
    <StepShell visible={visible}>
      <div className="max-w-lg px-8 text-center space-y-10">
        <p className="text-xs tracking-widest text-ink3">السؤال</p>
        <p className="text-2xl text-ink leading-relaxed font-medium">{question}</p>
        <button
          onClick={onNext}
          className="rounded-2xl bg-ink px-10 py-3 text-parchment font-semibold hover:bg-ink2 transition-colors"
        >
          استوعبت
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 4: التمرين ──────────────────────────────────────────────────────────

function StepExercise({
  visible,
  exercise,
  onNext,
}: {
  visible: boolean;
  exercise: string;
  onNext: () => void;
}) {
  return (
    <StepShell visible={visible}>
      <div className="max-w-lg px-8 text-center space-y-10">
        <p className="text-xs tracking-widest text-ink3">التمرين</p>
        <div className="rounded-2xl border border-ink/10 bg-parchment2 px-8 py-6">
          <p className="text-lg text-ink leading-relaxed">{exercise}</p>
        </div>
        <button
          onClick={onNext}
          className="rounded-2xl bg-ink px-10 py-3 text-parchment font-semibold hover:bg-ink2 transition-colors"
        >
          جاهز للتسجيل
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 5: التسجيل ──────────────────────────────────────────────────────────

function StepReflection({
  visible,
  day,
  onNext,
}: {
  visible: boolean;
  day: number;
  onNext: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!text.trim()) return;
        setSaving(true);
        try {
          await fetch("/api/reflections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day, note: text }),
          });
          setSaved(true);
        } finally {
          setSaving(false);
        }
      }, 900);
    },
    [day]
  );

  function handleChange(v: string) {
    setNote(v);
    setSaved(false);
    autoSave(v);
  }

  return (
    <StepShell visible={visible} centered={false}>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6">
          <p className="text-xs tracking-widest text-ink3 text-center">التسجيل</p>
          <p className="text-ink2 text-center">سجّل ما تأملته اليوم</p>
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="اكتب ما جال في خاطرك..."
            rows={7}
            className="w-full rounded-2xl border border-ink/10 bg-parchment2 px-5 py-4 text-ink placeholder:text-ink3/50 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink3">
              {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : ""}
            </p>
            <button
              onClick={onNext}
              className="rounded-2xl bg-ink px-8 py-3 text-parchment font-semibold hover:bg-ink2 transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 6: مقياس الوعي ─────────────────────────────────────────────────────

const AWARENESS_OPTIONS = [
  { level: "shadow", label: "الظل" },
  { level: "gift", label: "الهدية" },
  { level: "best_possibility", label: "أفضل احتمال" },
] as const;

function StepAwareness({
  visible,
  day,
  onNext,
}: {
  visible: boolean;
  day: number;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  async function handleSelect(level: string) {
    setSelected(level);
    await fetch("/api/awareness-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, level }),
    });
    setTimeout(onNext, 600);
  }

  return (
    <StepShell visible={visible}>
      <div className="max-w-sm px-8 w-full space-y-8 text-center">
        <p className="text-xs tracking-widest text-ink3">مقياس الوعي</p>
        <p className="text-xl text-ink">أين كان وعيك اليوم؟</p>
        <div className="flex flex-col gap-4">
          {AWARENESS_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              onClick={() => handleSelect(opt.level)}
              className={[
                "w-full rounded-2xl border py-4 text-lg font-semibold transition-all",
                selected === opt.level
                  ? "bg-ink text-parchment border-ink"
                  : "border-ink/20 text-ink hover:border-ink/50 hover:bg-parchment2",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 7: إغلاق اليوم ─────────────────────────────────────────────────────

function StepClosing({
  visible,
  content,
  onComplete,
}: {
  visible: boolean;
  content: JourneyContent;
  onComplete: () => void;
}) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const showQuote = content.whisper !== null && content.day % 3 === 0;

  async function handleShare() {
    const text = buildShareText(content);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2500);
    }
  }

  return (
    <StepShell visible={visible}>
      <div className="max-w-sm px-8 w-full space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-xs tracking-widest text-ink3">إغلاق اليوم</p>
          <p className="text-2xl font-bold text-ink">أتممت اليوم</p>
          <p className="text-ink3">{dayLabel(content.day)}</p>
        </div>

        {showQuote && content.whisper && (
          <div className="rounded-2xl border border-ink/10 bg-parchment2 px-6 py-5 text-right space-y-2">
            <p className="text-ink leading-relaxed text-sm">{content.whisper.text}</p>
            <p className="text-ink3 text-xs">{content.whisper.source} — مدينة المعنى</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full rounded-2xl border border-ink/20 py-3 text-ink font-semibold hover:bg-parchment2 transition-colors"
          >
            {shareStatus === "copied" ? "تم النسخ ✓" : "شارك يومك"}
          </button>
          <button
            onClick={onComplete}
            className="w-full rounded-2xl bg-ink py-3 text-parchment font-semibold hover:bg-ink2 transition-colors"
          >
            العودة للبرنامج
          </button>
        </div>
      </div>
    </StepShell>
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = [
  "arrival",
  "verse",
  "question",
  "exercise",
  "reflection",
  "awareness",
  "closing",
];

export function DailyJourney({ content, isFirstTime, onComplete }: Props) {
  const [step, setStep] = useState<Step>(isFirstTime ? "onboarding" : "arrival");
  const [visible, setVisible] = useState(true);

  function advance(to: Step) {
    setVisible(false);
    setTimeout(() => {
      setStep(to);
      setVisible(true);
    }, 300);
  }

  function next() {
    if (step === "onboarding") { advance("arrival"); return; }
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) advance(STEP_ORDER[idx + 1]);
  }

  async function handleClosingComplete() {
    // Mark day complete in progress table
    try {
      await fetch("/api/program/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: content.day }),
      });
    } catch {
      // best-effort
    }
    onComplete();
  }

  return (
    <>
      {step === "onboarding" && (
        <StepOnboarding visible={visible} onStart={next} />
      )}
      {step === "arrival" && (
        <StepArrival
          visible={visible}
          day={content.day}
          onNext={next}
        />
      )}
      {step === "verse" && (
        <StepVerse
          visible={visible}
          verseText={content.verseText}
          verseRef={content.verseRef}
          onNext={next}
        />
      )}
      {step === "question" && (
        <StepQuestion
          visible={visible}
          question={content.question}
          onNext={next}
        />
      )}
      {step === "exercise" && (
        <StepExercise
          visible={visible}
          exercise={content.exercise}
          onNext={next}
        />
      )}
      {step === "reflection" && (
        <StepReflection visible={visible} day={content.day} onNext={next} />
      )}
      {step === "awareness" && (
        <StepAwareness visible={visible} day={content.day} onNext={next} />
      )}
      {step === "closing" && (
        <StepClosing
          visible={visible}
          content={content}
          onComplete={handleClosingComplete}
        />
      )}
    </>
  );
}
