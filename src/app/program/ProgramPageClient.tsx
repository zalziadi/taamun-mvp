"use client";

/**
 * ProgramPageClient — the 28-day grid UI.
 *
 * DB-first architecture: this component does NOT make routing decisions.
 * The parent Server Component (page.tsx) reads from DB and either:
 *   - redirects started users to their current day (server redirect)
 *   - renders this component for fresh users (the grid = welcome UI)
 *
 * What this component DOES:
 *   - Fetch progress data for UI display (percent, streak, momentum)
 *   - Fetch orchestrator enrichment (decision lock, identity reflection)
 *   - Render the 28-day grid with day states (done/today/locked)
 *   - Navigate to days via router.push
 *
 * What this component does NOT do:
 *   - No resolveJourneyRoute / hasStarted / classifyVisit
 *   - No localStorage-based redirect decisions
 *   - No journey.state for routing
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { programDayRoute } from "@/lib/routes";
import DecisionCTA from "@/components/DecisionCTA";
import IdentityReflectionCard from "@/components/IdentityReflectionCard";
import { useUserBehavior } from "@/hooks/useUserBehavior";

const TOTAL_DAYS = 28;

type CatchUpOption = { type: string; label: string; days?: number[] };
type CatchUpData = {
  message: string;
  missedDays: number[];
  options: CatchUpOption[];
};

type ProgressPayload = {
  ok?: boolean;
  error?: string;
  total_days?: number;
  current_day?: number;
  completed_days?: number[];
  completed_count?: number;
  percent?: number;
  drift?: number;
  mode?: string;
  momentum?: number;
  emotional_drift?: string;
  missed_days?: number[];
  streak?: number;
  catch_up?: CatchUpData | null;
};

function calculateStreak(completedDays: number[]): number {
  if (!completedDays.length) return 0;
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = sorted[0];
  for (const day of sorted) {
    if (day === expected) {
      streak += 1;
      expected -= 1;
    } else {
      break;
    }
  }
  return streak;
}

function chunkDays(days: number[], size = 7): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < days.length; i += size) {
    chunks.push(days.slice(i, i + size));
  }
  return chunks;
}

interface Props {
  /** The DB-confirmed current day, passed from the Server Component. */
  serverCurrentDay: number;
}

export default function ProgramPageClient({ serverCurrentDay }: Props) {
  const router = useRouter();
  const { pattern, track } = useUserBehavior("program");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(TOTAL_DAYS);
  const [currentDay, setCurrentDay] = useState(serverCurrentDay);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [percent, setPercent] = useState(0);
  const [catchUp, setCatchUp] = useState<CatchUpData | null>(null);
  const [momentum, setMomentum] = useState(0);
  const [flowLockEnabled, setFlowLockEnabled] = useState(false);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [identityReflection, setIdentityReflection] = useState<{
    message: string;
    before_state?: string;
    after_state?: string;
  } | null>(null);

  // System Activation: intelligence-driven adaptive UI
  const [intelligenceAction, setIntelligenceAction] = useState<{
    type: string;
    route: string;
    reason: string;
  } | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<string | null>(null);
  const [engagementLevel, setEngagementLevel] = useState<string | null>(null);
  const [behavioralScore, setBehavioralScore] = useState<number | null>(null);
  // Awareness Layer — Gene Keys secondary lens (non-disruptive badge)
  const [awarenessLabel, setAwarenessLabel] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/program/progress", {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/auth?next=/program");
          return;
        }
        const data = (await res.json()) as ProgressPayload;
        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل بيانات البرنامج الآن.");
          return;
        }

        const total = Math.max(1, data.total_days ?? TOTAL_DAYS);
        const completed = Array.isArray(data.completed_days)
          ? data.completed_days
              .filter((d) => Number.isInteger(d))
              .sort((a, b) => a - b)
          : [];
        const count = data.completed_count ?? completed.length;

        setTotalDays(total);
        setCurrentDay(
          Math.max(1, Math.min(total, data.current_day ?? serverCurrentDay))
        );
        setCompletedDays(completed);
        setPercent(
          Math.max(
            0,
            Math.min(100, data.percent ?? Math.round((count / total) * 100))
          )
        );
        setCatchUp(data.catch_up ?? null);
        setMomentum(data.momentum ?? 0);

        // Fetch orchestrator enrichment (best-effort)
        try {
          const cd = data.current_day ?? serverCurrentDay;
          const dayRes = await fetch(`/api/program/day/${cd}`, {
            cache: "no-store",
          });
          const dayData = await dayRes.json();
          if (dayData.orchestrator?.flowLock?.enabled) {
            setFlowLockEnabled(true);
            setDecisionReason(
              dayData.orchestrator.currentStep?.reason ?? ""
            );
          }
          if (dayData.orchestrator?.identityReflection?.message) {
            setIdentityReflection(dayData.orchestrator.identityReflection);
          }
        } catch {
          // Best-effort enrichment
        }

        // System Activation: fetch intelligence for adaptive UI
        try {
          const intRes = await fetch("/api/journey/intelligence", {
            cache: "no-store",
          });
          if (intRes.ok) {
            const intData = await intRes.json();
            if (intData.ok) {
              if (intData.nextAction) setIntelligenceAction(intData.nextAction);
              if (intData.feedback?.summary) setFeedbackSummary(intData.feedback.summary);
              if (intData.signals?.engagementLevel) setEngagementLevel(intData.signals.engagementLevel);
              if (typeof intData.signals?.behavioralScore === "number") setBehavioralScore(intData.signals.behavioralScore);
              // Awareness layer — safe secondary badge
              if (intData.awareness?.label) setAwarenessLabel(intData.awareness.label);
            }
          }
        } catch {
          // Intelligence is progressive enhancement — never blocks
        }
      } catch {
        setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router, serverCurrentDay]);

  const completedCount = completedDays.length;
  const streak = useMemo(
    () => calculateStreak(completedDays),
    [completedDays]
  );
  const completedSet = useMemo(
    () => new Set(completedDays),
    [completedDays]
  );
  const orderedDays = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );
  const weekGroups = useMemo(
    () => chunkDays(orderedDays, 7),
    [orderedDays]
  );

  if (loading) {
    return (
      <div className="tm-shell space-y-6">
        <div className="tm-card p-6 sm:p-7 space-y-4 animate-pulse">
          <div className="h-4 w-24 rounded bg-[#e1d7c7]" />
          <div className="h-8 w-48 rounded bg-[#e1d7c7]" />
          <div className="h-3 w-32 rounded bg-[#eadfcd]" />
          <div className="mt-4 h-2.5 w-full rounded-full bg-[#eadfcd]" />
        </div>
        <div className="tm-card p-6 sm:p-7 space-y-4 animate-pulse">
          <div className="h-6 w-20 rounded bg-[#e1d7c7]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#eadfcd]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6">
      <DecisionCTA
        visible={flowLockEnabled}
        reason={decisionReason}
        variant="banner"
        patternType={pattern.type}
        onClick={() => track.decisionClick()}
      />

      {identityReflection && (
        <IdentityReflectionCard
          message={identityReflection.message}
          beforeState={identityReflection.before_state}
          afterState={identityReflection.after_state}
          variant="milestone"
        />
      )}

      <section className="tm-card p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#7b694a]">
              رحلة المعنى
            </div>
            <h1 className="tm-heading text-2xl leading-tight sm:text-4xl md:text-5xl text-[#2f2619]">
              برنامج الرحلة
            </h1>
            <p className="text-sm text-[#5f5648]/85">
              {completedCount} من {totalDays} يوم
            </p>
            {streak > 0 && (
              <p className="text-sm text-[#8c7851]">
                استمرارية: {streak} يوم متتالي
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              // Intelligence-driven CTA: use the recommended route when available
              const route = intelligenceAction?.route ?? programDayRoute(currentDay);
              router.push(route);
            }}
            className="tm-gold-btn rounded-xl px-5 py-2.5 text-sm"
          >
            {completedCount > 0
              ? `تابع من يوم ${currentDay}`
              : `ابدأ يوم ${currentDay}`}
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-[#7d7362]">
            <span>نسبة الإنجاز</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eadfcd]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8c7851] to-[#b39b71] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {momentum !== 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-[#7d7362]">الزخم:</span>
            <span
              className={
                momentum > 0 ? "text-[#6b8c51]" : "text-[#9b5548]"
              }
            >
              {momentum > 0 ? `+${momentum}` : momentum}{" "}
              {momentum > 3
                ? "قوي"
                : momentum > 0
                  ? "إيجابي"
                  : momentum > -3
                    ? "ضعيف"
                    : "منخفض"}
            </span>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-[#9b5548]">{error}</p>
        )}
      </section>

      {/* System Activation: intelligence-driven insight card */}
      {(feedbackSummary || intelligenceAction?.reason) && (
        <section className="tm-card border-[#c4a265]/30 bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7] p-5 sm:p-6 space-y-3">
          {behavioralScore !== null && (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  engagementLevel === "high"
                    ? "bg-[#c4a265]/20 text-[#8c7851]"
                    : engagementLevel === "medium"
                      ? "bg-[#b39b71]/15 text-[#7b694a]"
                      : "bg-[#d8cdb9]/20 text-[#7d7362]"
                }`}
              >
                {behavioralScore}
              </div>
              <div>
                <p className="text-xs tracking-[0.18em] text-[#8c7851]/80">
                  {engagementLevel === "high"
                    ? "حضورٌ مرتفع"
                    : engagementLevel === "medium"
                      ? "حضورٌ متوسّط"
                      : "حضورٌ خفيف"}
                </p>
              </div>
            </div>
          )}
          {feedbackSummary && (
            <p className="text-sm leading-relaxed text-[#5f5648]/90 italic">
              {feedbackSummary}
            </p>
          )}
          {intelligenceAction?.reason && (
            <p className="text-sm leading-relaxed text-[#2f2619]">
              {intelligenceAction.reason}
            </p>
          )}
          {/* Awareness badge — Gene Keys secondary lens. Non-disruptive,
              purely informational. Does NOT affect routing, CTA, or scoring. */}
          {awarenessLabel && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#d8cdb9]/50">
              <span className="text-xs tracking-[0.15em] text-[#8c7851]/70">
                وعي الرحلة
              </span>
              <span className="text-xs font-semibold text-[#5a4531]">
                {awarenessLabel}
              </span>
            </div>
          )}
        </section>
      )}

      {catchUp && (
        <section className="tm-card border-[#c4a265]/30 bg-[#faf6ee] p-5 sm:p-6 space-y-3">
          <p className="text-sm font-semibold text-[#5a4531]">
            {catchUp.message}
          </p>
          <div className="flex flex-wrap gap-2">
            {catchUp.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (opt.type === "continue")
                    router.push(programDayRoute(currentDay));
                  else if (opt.type === "review" && opt.days?.length)
                    router.push(programDayRoute(opt.days[0]));
                }}
                className={[
                  "rounded-lg px-4 py-2 text-sm transition-colors",
                  i === 0
                    ? "bg-[#8c7851] text-white"
                    : "border border-[#d8cdb9] bg-white text-[#5f5648] hover:bg-[#f9f3e7]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Journey Phase Indicator */}
      <section className="tm-card p-5 sm:p-6">
        <p className="mb-3 text-xs tracking-[0.15em] text-[#8c7851]/80">مراحل الرحلة</p>
        <div className="flex items-center gap-0" dir="ltr">
          {[
            { label: "الظل", days: "١–٧", end: 7 },
            { label: "الهدية", days: "٨–١٤", end: 14 },
            { label: "الاكتشاف", days: "١٥–٢١", end: 21 },
            { label: "التحوّل", days: "٢٢–٢٨", end: 28 },
          ].map((phase, i) => {
            const isActive = currentDay >= (phase.end - 6) && currentDay <= phase.end;
            const isDone = currentDay > phase.end;
            return (
              <div key={phase.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div className={`h-0.5 flex-1 ${isDone || isActive ? "bg-[#8c7851]" : "bg-[#e1d7c7]"}`} />
                  )}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#8c7851] text-[#f4f1ea] shadow-md"
                        : isDone
                          ? "bg-[#b39b71] text-[#f4f1ea]"
                          : "border border-[#d8cdb9] bg-[#f6f1e8] text-[#7d7362]"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  {i < 3 && (
                    <div className={`h-0.5 flex-1 ${isDone ? "bg-[#8c7851]" : "bg-[#e1d7c7]"}`} />
                  )}
                </div>
                <span className={`text-center text-[10px] leading-tight ${isActive ? "font-bold text-[#5a4a35]" : "text-[#7d7362]"}`}>
                  {phase.label}
                </span>
                <span className="text-[9px] text-[#8c7851]/60">{phase.days}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tm-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="tm-heading text-xl sm:text-3xl text-[#2f2619]">الأيام</h2>
          <p className="text-xs text-[#7d7362]">
            مرتبة تلقائيًا من 1 إلى {totalDays}
          </p>
        </div>

        <div className="space-y-5">
          {weekGroups.map((weekDays, weekIndex) => (
            <div key={`week-${weekIndex + 1}`} className="space-y-3">
              <p className="text-xs text-[#8c7851]">
                الأسبوع {weekIndex + 1}
              </p>
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
                dir="ltr"
              >
                {weekDays.map((day) => {
                  const isDone = completedSet.has(day);
                  const isToday = day === currentDay;
                  const isLocked = day > currentDay;

                  return (
                    <button
                      key={day}
                      type="button"
                      dir="rtl"
                      disabled={isLocked}
                      onClick={() =>
                        router.push(programDayRoute(day))
                      }
                      className={[
                        "rounded-xl border p-3 text-center transition-all",
                        isDone
                          ? "border-[#8c7851]/45 bg-[#e9ddc6] text-[#5a4531]"
                          : isToday
                            ? "border-[#8c7851] bg-[#f4ead7] text-[#2f2619] shadow-[0_8px_24px_rgba(140,120,81,0.14)]"
                            : isLocked
                              ? "cursor-not-allowed border-[#e1d7c7] bg-[#f7f2e8] text-[#a79b88] opacity-70"
                              : "border-[#ded4c2] bg-[#fcfaf7] text-[#5f5648] hover:border-[#8c7851]/40 hover:bg-[#f9f3e7]",
                      ].join(" ")}
                    >
                      <div className="text-xs">اليوم</div>
                      <div className="mt-1 text-lg font-semibold">
                        {day}
                      </div>
                      <div className="mt-1 text-xs">
                        {isDone
                          ? "مكتمل"
                          : isToday
                            ? "اليوم"
                            : isLocked
                              ? "مغلق"
                              : "متاح"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/progress")}
          className="text-sm text-[#7d7362] transition-colors hover:text-[#2f2619]"
        >
          عرض سجل التمعّنات →
        </button>
      </div>
    </div>
  );
}
