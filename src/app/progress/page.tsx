"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROGRAM_ROUTE } from "@/lib/routes";
import { loadProgress } from "@/lib/storage";
import { useSystemBrain } from "@/hooks/useSystemBrain";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import {
  buildTimeline,
  type Timeline,
  type PhaseSection,
  type JourneyFact,
} from "@/lib/journey/timeline";
import {
  composeNarrative,
  type NarrativeSnapshot,
} from "@/lib/journey/narrative";
import {
  PHASE_LABEL_AR,
  PHASE_SUBTITLE_AR,
  phaseOrder,
} from "@/lib/journey/phases";

type TimelinePayload = {
  ok?: boolean;
  error?: string;
  current_day?: number;
  timeline?: Timeline;
  narrative?: NarrativeSnapshot;
};

type LoadStatus = "idle" | "loading" | "ok" | "offline" | "unauthenticated";

/**
 * Build a timeline from localStorage when the server is unreachable
 * or the user is a guest. Keeps /progress useful in every mode.
 */
function buildLocalTimeline(): { timeline: Timeline; narrative: NarrativeSnapshot } {
  const local = loadProgress();
  const entries = Object.values(local.entries).filter(
    (e) => e.dayId >= 1 && e.dayId <= 28
  );

  const reflections = entries.map((e) => ({
    day: e.dayId,
    note: e.note ?? null,
    created_at: e.answeredAtISO,
    updated_at: e.answeredAtISO,
  }));

  // A local entry implies both written + visited, so we treat it as completed.
  const completedDays = entries.map((e) => e.dayId);

  const dayMeta: Record<number, { theme?: string | null; verseArabic?: string | null }> = {};
  const unique = new Set<number>([...reflections.map((r) => r.day), ...completedDays]);
  for (const d of unique) {
    const entry = getTaamunDailyByDay(d);
    if (entry) {
      dayMeta[d] = {
        theme: entry.theme ?? entry.title ?? null,
        verseArabic: entry.verse?.arabic ?? null,
      };
    }
  }

  const timeline = buildTimeline({
    reflections,
    completedDays,
    dayMeta,
  });
  const narrative = composeNarrative(timeline);
  return { timeline, narrative };
}

export default function ProgressPage() {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [narrative, setNarrative] = useState<NarrativeSnapshot | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const res = await fetch("/api/journey/timeline", { cache: "no-store" });

      if (res.status === 401) {
        // Guest mode: fall back to local timeline
        const local = buildLocalTimeline();
        setTimeline(local.timeline);
        setNarrative(local.narrative);
        setStatus("unauthenticated");
        return;
      }

      const data = (await res.json()) as TimelinePayload;
      if (!res.ok || data.ok === false || !data.timeline || !data.narrative) {
        const local = buildLocalTimeline();
        setTimeline(local.timeline);
        setNarrative(local.narrative);
        setStatus("offline");
        return;
      }

      setTimeline(data.timeline);
      setNarrative(data.narrative);
      setStatus("ok");
    } catch {
      const local = buildLocalTimeline();
      setTimeline(local.timeline);
      setNarrative(local.narrative);
      setStatus("offline");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // V8 brain — must be called before any early return (rules-of-hooks)
  const { decision: brainDecision } = useSystemBrain({ pageName: "progress" });

  if (status === "loading" || !timeline || !narrative) {
    return (
      <div className="min-h-screen bg-[#15130f] flex items-center justify-center">
        <p className="text-[#c9b88a] text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  const isEmpty = timeline.facts.length === 0;

  return (
    <div className="min-h-screen bg-[#15130f] p-6">
      <div className="mx-auto max-w-[720px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#e8e1d9]">رحلتك</h1>
          <Link
            href={PROGRAM_ROUTE}
            className="text-sm text-[#c9b88a] hover:text-[#e8e1d9] transition-colors"
          >
            ← البرنامج
          </Link>
        </div>

        {/* Offline notice */}
        {status === "offline" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c9b88a]/25 bg-[#c9b88a]/5 px-4 py-3 text-xs text-[#c9b88a]">
            <span>ما قدرنا نوصل للخادم الآن — جرّب مرة أخرى</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-[#c9b88a]/30 bg-[#c9b88a]/10 px-3 py-1 text-[11px] font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/20 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Unauthenticated notice */}
        {status === "unauthenticated" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c9b88a]/25 bg-[#c9b88a]/5 px-4 py-3 text-xs text-[#c9b88a]">
            <span>سجّل الدخول لحفظ رحلتك عبر كل أجهزتك</span>
            <Link
              href="/login?next=/progress"
              className="rounded-lg border border-[#c9b88a]/30 bg-[#c9b88a]/10 px-3 py-1 text-[11px] font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/20 transition-colors"
            >
              دخول
            </Link>
          </div>
        )}

        {/* Narrative header — story, not dashboard */}
        <section className="rounded-2xl border border-[#c9b88a]/30 bg-[#c9b88a]/5 p-6 space-y-3">
          <p className="text-base text-[#e8e1d9] leading-relaxed">
            {narrative.currentSentence}
          </p>
          <p className="text-sm text-[#c9b88a] leading-relaxed italic">
            {narrative.transitionSentence}
          </p>
        </section>

        {/* Bridge — "why you are here now" */}
        {!isEmpty && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="space-y-2 text-sm leading-relaxed">
              <p className="text-[#c9b88a]/80 italic">{narrative.bridge.past}</p>
              <p className="text-[#e8e1d9] font-semibold">{narrative.bridge.present}</p>
              <p className="text-[#c9b88a]">{narrative.bridge.future}</p>
            </div>
            <div className="pt-2">
              <Link
                href={narrative.nextAction.route}
                className="inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
              >
                ← {narrative.nextAction.label}
              </Link>
              <p className="mt-2 text-xs text-[#c9b88a]/70">
                {narrative.nextAction.reason}
              </p>
            </div>
          </section>
        )}

        {/* Empty state — brain-driven */}
        {isEmpty && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9b88a]/30 bg-[#c9b88a]/5">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c9b88a"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#e8e1d9]">
                {brainDecision?.message ?? "ابدأ رحلتك الآن"}
              </p>
              <p className="text-xs text-[#c9b88a]/80">
                كل يوم وكل تأمّل يُحفظ هنا — لتعود إليه وتبني عليه
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {brainDecision ? (
                <>
                  <Link
                    href={brainDecision.primaryAction.target}
                    className="inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
                  >
                    ← {brainDecision.primaryAction.label}
                  </Link>
                  {brainDecision.secondaryActions.map((a) => (
                    <Link
                      key={a.target}
                      href={a.target}
                      className="inline-block rounded-xl border border-[#c9b88a]/40 px-5 py-2.5 text-sm text-[#c9b88a] hover:bg-[#c9b88a]/10 transition-colors"
                    >
                      {a.label}
                    </Link>
                  ))}
                </>
              ) : (
                <Link
                  href="/program/day/1"
                  className="inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
                >
                  ابدأ اليوم الأول
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Phase sections — four stages of transformation */}
        {!isEmpty && (
          <div className="space-y-4">
            {phaseOrder().map((phase) => {
              const section = timeline.sections.find((s) => s.phase === phase);
              if (!section) return null;
              return <PhaseBlock key={phase} section={section} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PhaseBlock — collapsed when not reached, story when reached
// ---------------------------------------------------------------------------

function PhaseBlock({ section }: { section: PhaseSection }) {
  const label = PHASE_LABEL_AR[section.phase];
  const subtitle = PHASE_SUBTITLE_AR[section.phase];

  return (
    <section
      className={`rounded-2xl border p-5 space-y-4 ${
        section.reached
          ? "border-[#c9b88a]/30 bg-white/5"
          : "border-white/10 bg-white/[0.02] opacity-60"
      }`}
    >
      <header className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[#e8e1d9]">{label}</h2>
          <span className="text-xs text-[#c9b88a]/70">{section.summary}</span>
        </div>
        <p className="text-xs text-[#c9b88a]/80 italic">{subtitle}</p>
      </header>

      {section.reached && section.facts.length > 0 && (
        <ol className="space-y-2">
          {section.facts.map((fact) => (
            <FactLine key={fact.id} fact={fact} />
          ))}
        </ol>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// FactLine — one lived moment, not a checkbox
// ---------------------------------------------------------------------------

function FactLine({ fact }: { fact: JourneyFact }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#15130f]/50 px-3 py-2.5">
      <span
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          fact.completed
            ? "bg-[#c9b88a]/15 text-[#c9b88a]"
            : "bg-white/5 text-[#c9b88a]/60"
        }`}
      >
        {fact.day}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-[#e8e1d9] leading-relaxed">{fact.sentence}</p>
        {fact.note && fact.kind !== "day_completion" && (
          <p className="text-xs text-[#c9b88a]/70 leading-relaxed whitespace-pre-wrap line-clamp-3">
            {fact.note}
          </p>
        )}
      </div>
      <Link
        href={`/program/day/${fact.day}`}
        className="flex-shrink-0 text-[11px] text-[#c9b88a]/70 hover:text-[#c9b88a] transition-colors"
      >
        فتح
      </Link>
    </li>
  );
}
