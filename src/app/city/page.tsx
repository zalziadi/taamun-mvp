"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InteractiveCityMap from "@/components/city/InteractiveCityMap";
import {
  AWARENESS_STATES,
  LIFE_DOMAINS,
  getDomainState,
  getCityIllumination,
  type AwarenessState,
  type DomainKey,
} from "@/lib/city-of-meaning";
import { programDayRoute } from "@/lib/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackerEntry = { day: number; state: AwarenessState };

type TrackerPayload = {
  ok?: boolean;
  entries?: TrackerEntry[];
  counts?: Record<AwarenessState, number>;
};

type ProgressPayload = {
  ok?: boolean;
  completed_days?: number[];
  current_day?: number;
  percent?: number;
};

// ─── State badge labels ───────────────────────────────────────────────────────

const STATE_LABELS: Record<AwarenessState | "locked", string> = {
  locked: "مقفل",
  shadow: "الظل",
  gift: "الهدية",
  best_possibility: "أفضل احتمال",
};

const STATE_DESCRIPTIONS: Record<AwarenessState | "locked", string> = {
  locked: "أكمل أيام هذا المجال لفتحه",
  shadow: "بدأت الرحلة — واصل لتكشف الهدية",
  gift: "اقتربت من الإضاءة الكاملة",
  best_possibility: "هذا المجال مضيء بالكامل",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CityPage() {
  const router = useRouter();
  const [tracker, setTracker] = useState<TrackerEntry[]>([]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [activeDomain, setActiveDomain] = useState<DomainKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tracker + progress data
  useEffect(() => {
    const load = async () => {
      try {
        const [trackerRes, progressRes] = await Promise.all([
          fetch("/api/awareness-tracker", { cache: "no-store" }),
          fetch("/api/program/progress", { cache: "no-store" }),
        ]);

        if (trackerRes.status === 401 || progressRes.status === 401) {
          router.replace("/auth?next=/city");
          return;
        }

        const trackerData = (await trackerRes.json()) as TrackerPayload;
        const progressData = (await progressRes.json()) as ProgressPayload;

        if (trackerRes.ok && trackerData.ok !== false) {
          setTracker(trackerData.entries ?? []);
        }
        if (progressRes.ok && progressData.ok !== false) {
          setCompletedDays(
            Array.isArray(progressData.completed_days)
              ? progressData.completed_days.sort((a, b) => a - b)
              : []
          );
          setCurrentDay(progressData.current_day ?? 1);
        }
      } catch {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  // Derived data
  const illumination = useMemo(() => getCityIllumination(tracker), [tracker]);
  const activeDomainData = useMemo(() => {
    if (!activeDomain) return null;
    const d = LIFE_DOMAINS.find((item) => item.key === activeDomain);
    if (!d) return null;
    const ds = getDomainState(d.days, tracker);
    return { ...d, ...ds };
  }, [activeDomain, tracker]);

  const allDomainsLit = useMemo(
    () =>
      LIFE_DOMAINS.every(
        (d) => getDomainState(d.days, tracker).state === "best_possibility"
      ),
    [tracker]
  );

  // Save awareness state for a specific day
  async function saveState(day: number, state: AwarenessState) {
    setSaving(true);
    try {
      const res = await fetch("/api/awareness-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, state }),
      });
      if (!res.ok) return;

      setTracker((prev) => {
        const next = prev.filter((e) => e.day !== day);
        next.push({ day, state });
        return next.sort((a, b) => a.day - b.day);
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#7d7362]">جارٍ تحميل المدينة...</p>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="text-center space-y-3">
        <p className="text-xs tracking-[0.26em] text-[#8c7851] uppercase">
          City of Meaning
        </p>
        <h1 className="tm-heading text-4xl sm:text-5xl leading-tight">
          مدينة المعنى
        </h1>
        {allDomainsLit ? (
          <p className="text-sm text-[#c4a265] font-semibold">
            مدينتك أصبحت مضيئة
          </p>
        ) : (
          <p className="text-sm text-[#5f5648]/85 max-w-md mx-auto">
            &ldquo;القرآن ليس مجرد نص، بل نظام تحويل داخلي&rdquo;
          </p>
        )}
      </section>

      {/* ── Interactive Map ─────────────────────────────────────────────── */}
      <section className="relative">
        <InteractiveCityMap
          entries={tracker}
          completedDays={completedDays}
          activeDomain={activeDomain}
          onDomainClick={setActiveDomain}
        />
      </section>

      {/* ── Illumination Progress Ring ─────────────────────────────────── */}
      <section className="flex items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#2a2118"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={illumination >= 80 ? "#e7c468" : "#c4a265"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(illumination / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
              className="city-progress-ring"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#c4a265]">
            {illumination}%
          </span>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-semibold text-[#2f2619]">
            {completedDays.length}/28 يوماً من التدبر
          </p>
          <p className="text-xs text-[#7d7362]">
            {illumination < 30
              ? "المدينة في ظلامها — ابدأ الرحلة"
              : illumination < 60
              ? "بدأ النور يظهر — واصل"
              : illumination < 90
              ? "المدينة تقترب من الإضاءة"
              : allDomainsLit
              ? "رحلتك اكتملت بنور"
              : "لمسات أخيرة نحو الاكتمال"}
          </p>
        </div>
      </section>

      {/* ── Domain Detail Card ──────────────────────────────────────────── */}
      {activeDomainData && (
        <section
          key={activeDomainData.key}
          className="tm-card p-5 sm:p-6 space-y-4 city-card-enter"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="tm-heading text-2xl">{activeDomainData.title}</h2>
              <p className="text-sm text-[#5f5648]/85">
                {activeDomainData.hint}
              </p>
            </div>
            <span
              className={[
                "city-state-badge inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                activeDomainData.state === "best_possibility"
                  ? "border-[#e7c468]/50 bg-[#e7c468]/15 text-[#e7c468]"
                  : activeDomainData.state === "gift"
                  ? "border-[#c4a265]/50 bg-[#c4a265]/15 text-[#c4a265]"
                  : activeDomainData.state === "shadow"
                  ? "border-[#5a4a38]/50 bg-[#5a4a38]/15 text-[#8a7b66]"
                  : "border-[#3d3226]/50 bg-[#3d3226]/15 text-[#5a5044]",
              ].join(" ")}
            >
              {STATE_LABELS[activeDomainData.state]}
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#7d7362]">
              <span>
                {activeDomainData.completedDays} من {activeDomainData.totalDays}{" "}
                أيام
              </span>
              <span>
                {STATE_DESCRIPTIONS[activeDomainData.state]}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#2a2118] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(activeDomainData.completedDays / activeDomainData.totalDays) * 100}%`,
                  backgroundColor:
                    activeDomainData.state === "best_possibility"
                      ? "#e7c468"
                      : activeDomainData.state === "gift"
                      ? "#c4a265"
                      : "#5a4a38",
                }}
              />
            </div>
          </div>

          {/* Days in this domain */}
          <div className="space-y-2">
            <p className="text-xs text-[#7d7362]">أيام المجال:</p>
            <div className="flex flex-wrap gap-2">
              {activeDomainData.days.map((day) => {
                const entry = tracker.find((e) => e.day === day);
                const isCompleted = completedDays.includes(day);
                const isAvailable = day <= currentDay;

                return (
                  <div key={day} className="space-y-1.5">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => router.push(programDayRoute(day))}
                      className={[
                        "flex flex-col items-center rounded-xl border px-3 py-2 min-w-[64px] transition-all",
                        isCompleted
                          ? "border-[#c4a265]/40 bg-[#c4a265]/10 text-[#c4a265]"
                          : isAvailable
                          ? "border-[#5a4a38]/40 bg-[#2a2118]/50 text-[#8a7b66] hover:border-[#c4a265]/40"
                          : "border-[#2a2118]/40 bg-[#1a1610]/50 text-[#4a4038] cursor-not-allowed opacity-50",
                      ].join(" ")}
                    >
                      <span className="text-[10px]">اليوم</span>
                      <span className="text-lg font-semibold">{day}</span>
                      <span className="text-[10px]">
                        {isCompleted ? "مكتمل" : isAvailable ? "متاح" : "مقفل"}
                      </span>
                    </button>

                    {/* Awareness state selector for completed days */}
                    {isCompleted && (
                      <div className="flex gap-1 justify-center">
                        {AWARENESS_STATES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={saving}
                            onClick={() => saveState(day, s.value)}
                            title={s.label}
                            className={[
                              "w-5 h-5 rounded-full border transition-all text-[8px]",
                              entry?.state === s.value
                                ? s.value === "best_possibility"
                                  ? "border-[#e7c468] bg-[#e7c468]/30"
                                  : s.value === "gift"
                                  ? "border-[#c4a265] bg-[#c4a265]/30"
                                  : "border-[#5a4a38] bg-[#5a4a38]/30"
                                : "border-[#3d3226] bg-transparent hover:border-[#5a4a38]",
                            ].join(" ")}
                            aria-label={s.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Domain Overview Grid ───────────────────────────────────────── */}
      <section className="tm-card p-5 sm:p-6 space-y-4">
        <h2 className="tm-heading text-xl">مجالات المدينة</h2>
        <div className="grid grid-cols-3 gap-3">
          {LIFE_DOMAINS.map((d) => {
            const ds = getDomainState(d.days, tracker);
            const isActive = d.key === activeDomain;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDomain(d.key as DomainKey)}
                className={[
                  "rounded-xl border p-3 text-center transition-all space-y-1",
                  isActive
                    ? "border-[#c4a265] bg-[#c4a265]/10"
                    : "border-[#3d3226] bg-[#1a1610]/30 hover:border-[#5a4a38]",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-sm font-semibold",
                    ds.state === "best_possibility"
                      ? "text-[#e7c468]"
                      : ds.state === "gift"
                      ? "text-[#c4a265]"
                      : ds.state === "shadow"
                      ? "text-[#8a7b66]"
                      : "text-[#5a5044]",
                  ].join(" ")}
                >
                  {d.title}
                </p>
                <p className="text-[10px] text-[#7d7362]">
                  {STATE_LABELS[ds.state]}
                </p>
                {/* Mini dots for day progress */}
                <div className="flex justify-center gap-1 pt-1">
                  {d.days.map((day) => {
                    const entry = tracker.find((e) => e.day === day);
                    return (
                      <div
                        key={day}
                        className={[
                          "w-2 h-2 rounded-full",
                          entry?.state === "best_possibility"
                            ? "bg-[#e7c468]"
                            : entry?.state === "gift"
                            ? "bg-[#c4a265]"
                            : entry?.state === "shadow"
                            ? "bg-[#5a4a38]"
                            : "bg-[#2a2118]",
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Completion Message ──────────────────────────────────────────── */}
      {allDomainsLit && (
        <section className="tm-card p-6 text-center space-y-4 city-card-enter">
          <p className="tm-heading text-3xl">رحلتك اكتملت بنور</p>
          <p className="text-sm text-[#5f5648]/85 max-w-md mx-auto">
            لقد أتممت 28 يوماً من التمعّن والبناء. مدينتك الآن تشع بالتوازن
            والانسجام بين كافة جوانب الحياة.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/progress"
              className="tm-ghost-btn rounded-xl px-5 py-2.5 text-sm"
            >
              عرض السجل الكامل
            </Link>
            <Link
              href="/program"
              className="tm-gold-btn rounded-xl px-5 py-2.5 text-sm"
            >
              العودة للبرنامج
            </Link>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      {!allDomainsLit && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push(programDayRoute(currentDay))}
            className="tm-gold-btn rounded-2xl px-8 py-3 text-base"
          >
            ✦ استكمل الرحلة اليومية
          </button>
        </div>
      )}
    </div>
  );
}
