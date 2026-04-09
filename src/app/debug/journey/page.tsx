"use client";

/**
 * Journey Debug Inspector
 *
 * A dev-only surface that shows the full journey state machine in one
 * page. Gated behind a query key so it's not discoverable in production
 * but still usable on the live site for end-to-end verification.
 *
 * What you can see:
 *   - Current UserJourneyState (from useJourneyMemory)
 *   - resolveJourneyRoute decision
 *   - whyYouAreHere bridge (voice v2)
 *   - Journey timeline stack (from stack.ts)
 *   - Recent journey events (from navigation.ts event log)
 *
 * What you can do:
 *   - Reset state + events + stack (local only — server unchanged)
 *   - Simulate marking a day as completed
 *   - Refresh the snapshot
 *
 * Access:
 *   /debug/journey?key=taamun-debug
 *
 * Security note: this page reads/writes localStorage ONLY on the
 * current device. It does not touch server data. The gate is a
 * convenience, not a security boundary.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useJourneyMemory } from "@/hooks/useJourneyMemory";
import { resolveJourneyRoute, hasStarted, resumeRoute } from "@/lib/journey/continuity";
import {
  readJourneyEvents,
  clearJourneyEvents,
  type JourneyEvent,
} from "@/lib/journey/navigation";
import { loadTimeline, clearTimeline, type JourneyTimeline } from "@/lib/journey/stack";
import { clearLocalJourneyState } from "@/lib/journey/memory";

const DEBUG_KEY = "taamun-debug";

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#d8cdb9] bg-[#fcfaf7] p-5 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#8c7851]">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function Json({ data }: { data: unknown }) {
  return (
    <pre className="rounded-lg border border-[#e1d7c7] bg-[#f9f3e7]/60 p-3 text-[11px] leading-relaxed text-[#3a2e1c] overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Row({ label, value }: { label: string; value: string | number | boolean | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-[#8c7851]">{label}</span>
      <code className="font-mono text-[12px] text-[#2f2619]">{String(value)}</code>
    </div>
  );
}

function Button({
  children,
  onClick,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "neutral" | "danger" | "primary";
}) {
  const cls =
    tone === "danger"
      ? "border-[#9b5548]/40 bg-[#9b5548]/10 text-[#9b5548] hover:bg-[#9b5548]/15"
      : tone === "primary"
        ? "border-[#8c7851] bg-[#8c7851] text-white hover:opacity-90"
        : "border-[#d8cdb9] bg-[#fcfaf7] text-[#5f5648] hover:bg-[#f9f3e7]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

function Gate({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (params.get("key") === DEBUG_KEY) setAllowed(true);
  }, [params]);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-[#2f2619]">Journey Debug — مغلق</h1>
        <p className="text-sm text-[#5f5648]">
          هذه الصفحة أداة فحص داخلية. أضف <code className="font-mono">?key={DEBUG_KEY}</code> للوصول.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg border border-[#d8cdb9] bg-[#fcfaf7] px-5 py-2 text-sm text-[#5f5648] hover:bg-[#f9f3e7]"
        >
          ← الرئيسية
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Main inspector
// ---------------------------------------------------------------------------

function Inspector() {
  const journey = useJourneyMemory({
    pageName: "/debug/journey",
    loadTimeline: false, // we inspect the state layer, not the server timeline
    bridgeContext: "generic",
  });

  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [timelineStack, setTimelineStack] = useState<JourneyTimeline | null>(null);
  const [, setTick] = useState(0);

  // Refresh helper — re-reads localStorage after any action
  const refresh = () => {
    setEvents(readJourneyEvents());
    setTimelineStack(loadTimeline());
    setTick((t) => t + 1);
  };

  useEffect(() => {
    refresh();
  }, []);

  const decision = useMemo(
    () => resolveJourneyRoute(journey.state),
    [journey.state]
  );

  const hasStartedFlag = useMemo(
    () => hasStarted(journey.state),
    [journey.state]
  );

  const resume = useMemo(() => resumeRoute(journey.state), [journey.state]);

  // --- Actions ---

  const resetAll = () => {
    if (!confirm("سيتم مسح حالة الرحلة + الأحداث + الـ stack من localStorage. متأكّد؟")) return;
    clearLocalJourneyState();
    clearJourneyEvents();
    clearTimeline();
    // Force full reload so useJourneyMemory re-initializes from the empty state
    window.location.reload();
  };

  const simulateCompleteDay = (day: number) => {
    journey.update({
      completedStep: `day_${day}`,
      currentDay: day,
      progressDelta: 5,
      emotionalState: "flow",
    });
    setTimeout(refresh, 50);
  };

  const simulateResistance = () => {
    journey.update({
      resistance: 0.75,
      momentum: -2,
      emotionalState: "resistance",
    });
    setTimeout(refresh, 50);
  };

  const simulateMomentum = () => {
    journey.update({
      momentum: 6,
      resistance: 0.1,
      emotionalState: "flow",
    });
    setTimeout(refresh, 50);
  };

  const simulateLastAnswer = () => {
    journey.update({
      lastAnswer: "حاسس إني مو قادر أكمل اليوم",
      emotionalState: "resistance",
    });
    setTimeout(refresh, 50);
  };

  return (
    <div className="mx-auto max-w-[840px] px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#2f2619]">Journey Debug Inspector</h1>
          <Link href="/" className="text-sm text-[#8c7851] hover:text-[#2f2619]">
            ← الرئيسية
          </Link>
        </div>
        <p className="text-xs text-[#5f5648]/80">
          أداة فحص محلّية. كل تغيير يُكتب في localStorage على هذا الجهاز فقط.
          لا تمسّ البيانات على السيرفر.
        </p>
      </header>

      {/* Quick summary */}
      <Section title="الملخّص">
        <div className="space-y-1.5">
          <Row label="hasStarted" value={hasStartedFlag} />
          <Row label="currentDay" value={journey.state.currentDay} />
          <Row label="currentPhase" value={journey.state.currentPhase} />
          <Row label="sessionCount" value={journey.state.sessionCount} />
          <Row label="completedSteps.length" value={journey.state.completedSteps.length} />
          <Row label="keyInsights.length" value={journey.state.keyInsights.length} />
          <Row label="momentum" value={journey.state.momentum} />
          <Row label="resistance" value={journey.state.resistance} />
          <Row label="drift" value={journey.state.drift} />
          <Row label="emotionalState" value={journey.state.emotionalState} />
          <Row label="lastPageVisited" value={journey.state.lastPageVisited ?? "—"} />
        </div>
      </Section>

      {/* resolveJourneyRoute decision */}
      <Section title="resolveJourneyRoute(state)">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Row label="kind" value={decision.kind} />
            {"day" in decision && <Row label="day" value={decision.day} />}
            {"route" in decision && <Row label="route" value={decision.route} />}
            {"reason" in decision && <Row label="reason" value={decision.reason} />}
          </div>
          <div className="text-xs text-[#5f5648]/80">
            مقارنة: <code className="font-mono">resumeRoute(state) = {resume}</code>
          </div>
        </div>
      </Section>

      {/* WhyYouAreHere bridge */}
      <Section title="whyYouAreHere (bridge — voice v2)">
        <div className="space-y-2">
          <Row label="situation" value={journey.whyYouAreHere.situation} />
          <Row label="confidence" value={journey.whyYouAreHere.confidence.toFixed(2)} />
          <div className="mt-3 space-y-2 rounded-lg border border-[#c4a265]/40 bg-[#faf4e4] p-3">
            <p className="text-sm font-semibold text-[#2f2619] whitespace-pre-line">
              {journey.whyYouAreHere.summary}
            </p>
            <p className="text-xs italic text-[#5f5648]/85 whitespace-pre-line">
              {journey.whyYouAreHere.transition}
            </p>
            <div className="mt-2 rounded-md border-r-2 border-[#c4a265]/60 bg-[#f4ead7]/50 px-3 py-2">
              <p className="text-xs text-[#3a2e1c] whitespace-pre-line">
                {journey.whyYouAreHere.mirror}
              </p>
            </div>
          </div>
          {journey.whyYouAreHere.reasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-[#5f5648]/85">
              {journey.whyYouAreHere.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Timeline stack */}
      <Section title="Journey Timeline Stack">
        {timelineStack ? (
          <div className="space-y-2">
            <Row label="current" value={timelineStack.current ?? "—"} />
            <Row label="stack.length" value={timelineStack.stack.length} />
            <Row label="history.length" value={timelineStack.history.length} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-[#8c7851] mb-1">Stack (oldest → newest):</p>
              <ol className="text-[11px] text-[#5f5648] font-mono space-y-0.5">
                {timelineStack.stack.length === 0 ? (
                  <li className="italic text-[#8c7851]/60">(empty)</li>
                ) : (
                  timelineStack.stack.map((r, i) => <li key={i}>{i + 1}. {r}</li>)
                )}
              </ol>
            </div>
          </div>
        ) : (
          <p className="text-xs italic text-[#8c7851]/60">loading…</p>
        )}
      </Section>

      {/* Event log */}
      <Section title={`Event Log — ${events.length} events`}>
        {events.length === 0 ? (
          <p className="text-xs italic text-[#8c7851]/60">
            لا أحداث مسجّلة بعد. تصفّح الموقع ثم ارجع هنا.
          </p>
        ) : (
          <ol className="text-[11px] space-y-1 max-h-[280px] overflow-y-auto">
            {[...events].reverse().map((e, i) => (
              <li
                key={i}
                className="font-mono flex items-start gap-2 border-b border-[#e1d7c7]/50 py-1"
              >
                <span className="text-[#8c7851] w-[130px] flex-shrink-0">
                  {e.at.slice(11, 19)}
                </span>
                <span
                  className={`w-[120px] flex-shrink-0 font-semibold ${
                    e.kind.startsWith("nav_blocked") ||
                    e.kind === "state_corrupted" ||
                    e.kind === "state_reset"
                      ? "text-[#9b5548]"
                      : e.kind === "nav_allowed" || e.kind === "day_completed"
                        ? "text-[#6b8c51]"
                        : "text-[#5f5648]"
                  }`}
                >
                  {e.kind}
                </span>
                <span className="text-[#2f2619] flex-1 break-all">
                  {e.route ?? ""}
                  {e.rule ? ` · ${e.rule}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Raw state */}
      <Section title="Full UserJourneyState (raw JSON)">
        <Json data={journey.state} />
      </Section>

      {/* Actions */}
      <Section title="Actions">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#8c7851]">محاكاة حالات</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => simulateCompleteDay(1)}>أكمل يوم ١</Button>
              <Button onClick={() => simulateCompleteDay(3)}>أكمل يوم ٣</Button>
              <Button onClick={() => simulateCompleteDay(6)}>أكمل يوم ٦</Button>
              <Button onClick={() => simulateCompleteDay(14)}>أكمل يوم ١٤</Button>
              <Button onClick={() => simulateCompleteDay(28)}>أكمل يوم ٢٨</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#8c7851]">محاكاة إشارات داخلية</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={simulateResistance}>مقاومة عالية</Button>
              <Button onClick={simulateMomentum}>زخم قويّ</Button>
              <Button onClick={simulateLastAnswer}>آخر كلمة ثقيلة</Button>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#e1d7c7]">
            <p className="text-xs font-semibold text-[#9b5548]">خطر: يمسح الحالة المحلّية</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={refresh}>تحديث اللقطة</Button>
              <Button onClick={resetAll} tone="danger">
                مسح كلّ شيء + إعادة تحميل
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Quick nav */}
      <Section title="روابط سريعة للاختبار">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/" className="underline text-[#8c7851]">/</Link>
          <Link href="/program" className="underline text-[#8c7851]">/program</Link>
          <Link href="/program/day/1" className="underline text-[#8c7851]">/program/day/1</Link>
          <Link href="/program/day/3" className="underline text-[#8c7851]">/program/day/3</Link>
          <Link href="/program/day/6" className="underline text-[#8c7851]">/program/day/6</Link>
          <Link href="/program/day/20" className="underline text-[#8c7851]">/program/day/20 (forward)</Link>
          <Link href="/progress" className="underline text-[#8c7851]">/progress</Link>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function JourneyDebugPage() {
  // useSearchParams() inside Gate requires a Suspense boundary
  // for Next 14 static prerender to succeed.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
          <p className="text-sm text-[#8c7851]">جارٍ التحميل…</p>
        </div>
      }
    >
      <Gate>
        <Inspector />
      </Gate>
    </Suspense>
  );
}
