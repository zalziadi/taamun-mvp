"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { programDayRoute } from "@/lib/routes";
import DecisionCTA from "@/components/DecisionCTA";
import IdentityReflectionCard from "@/components/IdentityReflectionCard";

const TOTAL_DAYS = 28;

type CatchUpOption = { type: string; label: string; days?: number[] };
type CatchUpData = { message: string; missedDays: number[]; options: CatchUpOption[] };
type JourneyStatePayload = { currentMode: string; emotionalState: string; riskLevel: string; momentum: number };

type ProgressPayload = {
  ok?: boolean;
  error?: string;
  total_days?: number;
  current_day?: number;
  completed_days?: number[];
  completed_count?: number;
  percent?: number;
  // Cognitive OS fields
  drift?: number;
  mode?: string;
  momentum?: number;
  emotional_drift?: string;
  missed_days?: number[];
  streak?: number;
  catch_up?: CatchUpData | null;
  journey_state?: JourneyStatePayload | null;
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

export default function ProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(TOTAL_DAYS);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [percent, setPercent] = useState(0);
  const [catchUp, setCatchUp] = useState<CatchUpData | null>(null);
  const [mode, setMode] = useState<string>("normal");
  const [momentum, setMomentum] = useState(0);
  // V6: Decision lock + Identity reflection from orchestrator
  const [flowLockEnabled, setFlowLockEnabled] = useState(false);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [identityReflection, setIdentityReflection] = useState<{
    message: string;
    before_state?: string;
    after_state?: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/program/progress", { cache: "no-store" });
        if (res.status === 401) {
          setRedirecting(true);
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
          ? data.completed_days.filter((day) => Number.isInteger(day)).sort((a, b) => a - b)
          : [];
        const count = data.completed_count ?? completed.length;

        setTotalDays(total);
        setCurrentDay(Math.max(1, Math.min(total, data.current_day ?? 1)));
        setCompletedDays(completed);
        setPercent(Math.max(0, Math.min(100, data.percent ?? Math.round((count / total) * 100))));
        setCatchUp(data.catch_up ?? null);
        setMode(data.mode ?? "normal");
        setMomentum(data.momentum ?? 0);

        // V6: Fetch orchestrator state for decision lock + identity reflection
        try {
          const cd = data.current_day ?? 1;
          const dayRes = await fetch(`/api/program/day/${cd}`, { cache: "no-store" });
          const dayData = await dayRes.json();
          if (dayData.orchestrator?.flowLock?.enabled) {
            setFlowLockEnabled(true);
            setDecisionReason(dayData.orchestrator.currentStep?.reason ?? "");
          }
          if (dayData.orchestrator?.identityReflection?.message) {
            setIdentityReflection(dayData.orchestrator.identityReflection);
          }
        } catch {
          // Best-effort enrichment
        }
      } catch {
        setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const completedCount = completedDays.length;
  const streak = useMemo(() => calculateStreak(completedDays), [completedDays]);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  const orderedDays = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );
  const weekGroups = useMemo(() => chunkDays(orderedDays, 7), [orderedDays]);

  if (loading || redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#7d7362]">جارٍ تحميل البرنامج...</p>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6">
      {/* V6: Decision CTA — banner at top when flow is locked */}
      <DecisionCTA visible={flowLockEnabled} reason={decisionReason} variant="banner" />

      {/* V6: Identity Reflection milestone */}
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
            <h1 className="tm-heading text-4xl leading-tight sm:text-5xl text-[#2f2619]">برنامج الرحلة</h1>
            <p className="text-sm text-[#5f5648]/85">{completedCount} من {totalDays} يوم</p>
            {streak > 0 ? (
              <p className="text-sm text-[#8c7851]">استمرارية: {streak} يوم متتالي</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => router.push(programDayRoute(currentDay))}
            className="tm-gold-btn rounded-xl px-5 py-2.5 text-sm"
          >
            متابعة اليوم {currentDay}
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

        {/* Momentum indicator */}
        {momentum !== 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-[#7d7362]">الزخم:</span>
            <span className={momentum > 0 ? "text-[#6b8c51]" : "text-[#9b5548]"}>
              {momentum > 0 ? `+${momentum}` : momentum} {momentum > 3 ? "قوي" : momentum > 0 ? "إيجابي" : momentum > -3 ? "ضعيف" : "منخفض"}
            </span>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-[#9b5548]">{error}</p> : null}
      </section>

      {/* Catch-up card */}
      {catchUp && (
        <section className="tm-card border-[#c4a265]/30 bg-[#faf6ee] p-5 sm:p-6 space-y-3">
          <p className="text-sm font-semibold text-[#5a4531]">{catchUp.message}</p>
          <div className="flex flex-wrap gap-2">
            {catchUp.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (opt.type === "continue") router.push(programDayRoute(currentDay));
                  else if (opt.type === "review" && opt.days?.length) router.push(programDayRoute(opt.days[0]));
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

      <section className="tm-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="tm-heading text-3xl text-[#2f2619]">الأيام</h2>
          <p className="text-xs text-[#7d7362]">مرتبة تلقائيًا من 1 إلى {totalDays}</p>
        </div>

        <div className="space-y-5">
          {weekGroups.map((weekDays, weekIndex) => (
            <div key={`week-${weekIndex + 1}`} className="space-y-3">
              <p className="text-xs text-[#8c7851]">الأسبوع {weekIndex + 1}</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" dir="ltr">
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
                      onClick={() => router.push(programDayRoute(day))}
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
                      <div className="text-[11px]">اليوم</div>
                      <div className="mt-1 text-lg font-semibold">{day}</div>
                      <div className="mt-1 text-xs">
                        {isDone ? "مكتمل" : isToday ? "اليوم" : isLocked ? "مغلق" : "متاح"}
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
