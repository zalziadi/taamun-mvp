"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DAYS, TOTAL_DAYS, getDay } from "@/lib/days";
import { QuestionBox } from "@/components/QuestionBox";
import { useProgressStore } from "@/store/useProgressStore";
import { cn } from "@/lib/utils";

const ANSWER_MIN = 12;

export default function DayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dayId = Number(params?.id);
  const day = useMemo(() => (Number.isFinite(dayId) ? getDay(dayId) : null), [dayId]);

  const hydrated = useProgressStore((s) => s.hydrated);
  const isUnlocked = useProgressStore((s) => s.isUnlocked);
  const getDayState = useProgressStore((s) => s.getDayState);
  const saveAnswer = useProgressStore((s) => s.saveAnswer);
  const completeDay = useProgressStore((s) => s.completeDay);

  const [answer, setAnswer] = useState("");
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    if (!hydrated || !day) return;
    const state = getDayState(day.id);
    setAnswer(state?.answer ?? "");
    setReflection(state?.reflection ?? "");
  }, [hydrated, day, getDayState]);

  useEffect(() => {
    if (!hydrated || !day) return;
    const t = setTimeout(() => {
      if (answer || reflection) {
        saveAnswer(day.id, answer, reflection);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [answer, reflection, day, hydrated, saveAnswer]);

  if (!day) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">اليوم غير موجود</h1>
        <Link
          href="/journey"
          className="mt-4 inline-block rounded-full bg-ink-900 px-5 py-2 text-sm text-white"
        >
          العودة للرحلة
        </Link>
      </div>
    );
  }

  if (hydrated && !isUnlocked(day.id)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-soft">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500 text-lg">
          🔒
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink-900">اليوم {day.id} مقفل</h1>
        <p className="mt-2 text-sm text-ink-600 leading-relaxed">
          أكمل اليوم {day.id - 1} أولاً لتفتح هذا اليوم. الترتيب جزء من التحوّل.
        </p>
        <Link
          href={`/day/${day.id - 1}`}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          اذهب لليوم {day.id - 1} ←
        </Link>
      </div>
    );
  }

  const state = getDayState(day.id);
  const completed = state?.completed === true;
  const canComplete = answer.trim().length >= ANSWER_MIN;
  const prevId = day.id > 1 ? day.id - 1 : null;
  const nextId = day.id < TOTAL_DAYS ? day.id + 1 : null;

  function handleComplete() {
    if (!canComplete || !day) return;
    saveAnswer(day.id, answer, reflection);
    completeDay(day.id);
    if (nextId) {
      router.push(`/day/${nextId}`);
    } else {
      router.push("/progress");
    }
  }

  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <nav className="flex items-center justify-between text-xs text-ink-500">
        <Link href="/journey" className="hover:text-ink-900">
          ← كل الأيام
        </Link>
        <span>
          اليوم <strong className="tabular-nums text-ink-800">{day.id}</strong> من{" "}
          <span className="tabular-nums">{TOTAL_DAYS}</span>
        </span>
      </nav>

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <p className="text-xs font-medium text-wafrah-700">
          {day.phaseLabel} · {day.phaseRange}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
          {day.title}
        </h1>
        <p className="text-base leading-relaxed text-ink-600">{day.intro}</p>
      </motion.header>

      <Section title="فكرة الوعي" tone="awareness">
        <p className="text-lg leading-loose text-ink-800">{day.awareness}</p>
      </Section>

      <Section title="التمرين العملي" tone="exercise">
        <p className="text-base leading-relaxed text-ink-700">{day.exercise}</p>
      </Section>

      <Section title="السؤال التأمّلي" tone="question">
        <p className="text-lg leading-relaxed font-medium text-ink-900">{day.question}</p>
        <div className="mt-5">
          <QuestionBox
            label="إجابتك"
            hint="اكتب بصدق، بدون فلترة. ما تكتبه يبقى محفوظاً تلقائياً."
            value={answer}
            onChange={setAnswer}
            placeholder="ابدأ من أول فكرة تجي ببالك…"
            rows={6}
            minLength={ANSWER_MIN}
          />
        </div>
        <div className="mt-5">
          <QuestionBox
            label="ملاحظة جانبية (اختياري)"
            value={reflection}
            onChange={setReflection}
            placeholder="أي خاطرة، شعور، أو فكرة طرأت أثناء التمرين…"
            rows={3}
          />
        </div>
      </Section>

      <Section title="جملة اليوم" tone="affirmation">
        <p className="text-xl font-semibold leading-relaxed text-wafrah-800">
          “{day.affirmation}”
        </p>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-6">
        <div className="flex items-center gap-2">
          {prevId && (
            <Link
              href={`/day/${prevId}`}
              className="rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:border-ink-400"
            >
              → اليوم {prevId}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {completed && nextId && (
            <Link
              href={`/day/${nextId}`}
              className="rounded-full border border-wafrah-300 bg-wafrah-50 px-4 py-2 text-sm font-medium text-wafrah-800 hover:bg-wafrah-100"
            >
              اليوم {nextId} ←
            </Link>
          )}
          <button
            type="button"
            onClick={handleComplete}
            disabled={!canComplete}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold transition",
              canComplete
                ? "bg-ink-900 text-white hover:bg-ink-800"
                : "bg-ink-100 text-ink-400 cursor-not-allowed"
            )}
          >
            {completed ? "إعادة تأكيد الإكمال" : nextId ? "أكمل وافتح التالي" : "أكمل الرحلة"}
          </button>
        </div>
      </footer>
    </article>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "awareness" | "exercise" | "question" | "affirmation";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    awareness: "border-l-2 border-wafrah-400 bg-wafrah-50/40",
    exercise: "border-l-2 border-ink-300 bg-ink-50/60",
    question: "border-l-2 border-wafrah-600 bg-white",
    affirmation: "border-l-2 border-wafrah-700 bg-gradient-to-l from-wafrah-50 to-white",
  };
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={cn("rounded-xl2 px-6 py-6", toneMap[tone])}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}
