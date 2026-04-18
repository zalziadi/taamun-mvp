"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LivingCityMap } from "@/components/city/motion";
import type { CityMap } from "@/lib/cityEngine";
import type { MicroReward } from "@/lib/personalityEngine";
import DecisionCTA from "@/components/DecisionCTA";
import NextStepPanel from "@/components/NextStepPanel";
import { getNextStepOptions } from "@/lib/nextStep";
import { useUserBehavior } from "@/hooks/useUserBehavior";
import { useSystemBrain } from "@/hooks/useSystemBrain";
import { useJourneyMemory } from "@/hooks/useJourneyMemory";
import { WhyYouAreHereCard } from "@/components/journey/WhyYouAreHereCard";

type DayPayload = {
  ok?: boolean;
  city?: CityMap | null;
  micro_reward?: MicroReward | null;
  guidance?: { focus?: string; message?: string } | null;
  orchestrator?: {
    flowLock?: { enabled?: boolean; reason?: string };
    currentStep?: { reason?: string };
  } | null;
};

type ProgressPayload = {
  ok?: boolean;
  current_day?: number;
  journey_state?: { emotionalState?: string } | null;
};

export default function CityPage() {
  const router = useRouter();
  const { behavior, pattern, track } = useUserBehavior("city");
  // V8: Brain drives dailyFocus + greeting message
  const { decision: brainDecision } = useSystemBrain({ pageName: "city" });
  // V10 PR-2: Bridge — "why your city looks like this now"
  const journey = useJourneyMemory({
    pageName: "/city",
    loadTimeline: true,
    bridgeContext: "city",
  });
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<CityMap | null>(null);
  const [microReward, setMicroReward] = useState<MicroReward | null>(null);
  const [emotionalState, setEmotionalState] = useState<"engaged" | "resistant" | "lost" | "curious">("curious");
  const [guidanceFocus, setGuidanceFocus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flowLockEnabled, setFlowLockEnabled] = useState(false);
  const [decisionReason, setDecisionReason] = useState("");
  const [currentDay, setCurrentDay] = useState(1);

  // System Activation: intelligence-driven city rendering
  const [intelligenceZone, setIntelligenceZone] = useState<string | null>(null);
  const [intelligenceReason, setIntelligenceReason] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const progressRes = await fetch("/api/program/progress", { cache: "no-store" });
        if (progressRes.status === 401) {
          router.replace("/auth?next=/city");
          return;
        }
        const progressData = (await progressRes.json()) as ProgressPayload;
        if (!progressRes.ok || progressData.ok === false) {
          setError("تعذر تحميل بيانات الرحلة");
          return;
        }

        const cd = progressData.current_day ?? 1;
        setCurrentDay(cd);
        const journeyEmotion = progressData.journey_state?.emotionalState;
        if (
          journeyEmotion === "engaged" ||
          journeyEmotion === "resistant" ||
          journeyEmotion === "lost" ||
          journeyEmotion === "curious"
        ) {
          setEmotionalState(journeyEmotion);
        }

        const dayRes = await fetch(`/api/program/day/${cd}`, { cache: "no-store" });
        const dayData = (await dayRes.json()) as DayPayload;

        if (dayData.city) setCity(dayData.city);
        if (dayData.micro_reward) setMicroReward(dayData.micro_reward);
        if (dayData.guidance?.focus) setGuidanceFocus(dayData.guidance.focus);
        if (dayData.orchestrator?.flowLock?.enabled) {
          setFlowLockEnabled(true);
          setDecisionReason(dayData.orchestrator.currentStep?.reason ?? "");
        }
        // System Activation: fetch intelligence for city signals
        try {
          const intRes = await fetch("/api/journey/intelligence", { cache: "no-store" });
          if (intRes.ok) {
            const intData = await intRes.json();
            if (intData.ok && intData.citySignals) {
              if (intData.citySignals.highlightZone) {
                setIntelligenceZone(intData.citySignals.highlightZone);
              }
              if (intData.citySignals.reason) {
                setIntelligenceReason(intData.citySignals.reason);
              }
              // Map behavioral state to emotional state for city rendering
              const state = intData.profile?.behavioralState;
              if (state === "deep_reflector") setEmotionalState("engaged");
              else if (state === "avoidant") setEmotionalState("resistant");
              else if (state === "inconsistent") setEmotionalState("lost");
              else if (state === "new_user") setEmotionalState("curious");
            }
          }
        } catch {
          // Intelligence is progressive — never blocks
        }
      } catch {
        setError("تعذر الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#7d7362]">جارٍ تحميل المدينة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#9b5548]">{error}</p>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6 pb-10">
      {/* V6/V7: Decision CTA — banner when flow is locked (pattern-aware) */}
      <DecisionCTA
        visible={flowLockEnabled}
        reason={decisionReason}
        variant="banner"
        patternType={pattern.type}
        onClick={() => track.decisionClick()}
      />

      {/* V10 PR-2: Bridge — why your city looks like this now */}
      <WhyYouAreHereCard
        bridge={journey.whyYouAreHere}
        variant="parchment"
        headingLabel="لماذا مدينتك هكذا الآن"
      />

      <section className="tm-card p-6 sm:p-7 text-center">
        <div className="inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#D6D1C8]">
          مدينة الوعي الحيّة
        </div>
        <h1 className="tm-heading mt-3 text-4xl leading-tight sm:text-5xl text-[#14110F]">
          ٩ مناطق من حياتك
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] text-sm leading-relaxed text-[#A8A29A]/85">
          كل منطقة تمثل بُعداً من حياتك. توهّجها يعكس وعيك الحالي. اضغط على أي منطقة لترى رسالتها.
        </p>
      </section>

      {/* V8: Brain-driven daily focus banner */}
      {brainDecision?.uiHints?.showToast && (
        <section className="tm-card border-[#c4a265] bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7] p-4 sm:p-5 text-center space-y-2">
          <p className="text-xs tracking-[0.18em] text-[#C9A84C]/80">توجيه النظام</p>
          <p className="text-base font-semibold text-[#14110F]">{brainDecision.message}</p>
          {brainDecision.uiHints.highlightZone && city?.zones?.find((z) => z.id === brainDecision.uiHints.highlightZone) && (
            <p className="text-xs text-[#A8A29A]/85">
              منطقة اليوم: <span className="font-semibold text-[#5a4531]">
                {city.zones.find((z) => z.id === brainDecision.uiHints.highlightZone)?.name}
              </span>
            </p>
          )}
        </section>
      )}

      {/* System Activation: intelligence-driven zone highlight reason */}
      {intelligenceReason && (
        <section className="tm-card border-[#c4a265]/30 bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7] p-4 text-center">
          <p className="text-xs tracking-[0.18em] text-[#C9A84C]/80">ما يُضيء الآن</p>
          <p className="mt-1 text-sm font-semibold text-[#14110F]">{intelligenceReason}</p>
        </section>
      )}

      {city ? (
        <section className="tm-card relative bg-[#0A0908] p-6 sm:p-8 overflow-hidden">
          <LivingCityMap
            city={city}
            emotionalState={emotionalState}
            focusZoneId={intelligenceZone ?? brainDecision?.uiHints?.highlightZone ?? guidanceFocus}
            microReward={microReward}
          />
        </section>
      ) : (
        <section className="tm-card p-6 text-center">
          <p className="text-sm text-[#7d7362]">المدينة تتشكّل مع تقدّمك في الرحلة</p>
        </section>
      )}

      {city && (
        <section className="tm-card p-5 space-y-3">
          <h2 className="tm-heading text-2xl text-[#14110F]">حالة المناطق</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {city.zones.map((zone) => (
              <div
                key={zone.id}
                className={[
                  "rounded-xl border p-3 text-right",
                  zone.state === "thriving"
                    ? "border-[#c4a265] bg-[#f4ead7]"
                    : zone.state === "stable"
                    ? "border-[#c4a265]/60 bg-[#faf6ee]"
                    : zone.state === "growing"
                    ? "border-[#d8cdb9] bg-[#fcfaf7]"
                    : "border-[#e1d7c7] bg-[#f7f2e8] opacity-80",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#C9A84C]">
                    {zone.state === "weak"
                      ? "ضعيف"
                      : zone.state === "growing"
                      ? "ينمو"
                      : zone.state === "stable"
                      ? "مستقر"
                      : "مزدهر"}
                  </span>
                  <span className="text-sm font-semibold text-[#5a4531]">{zone.name}</span>
                </div>
                <p className="text-xs text-[#7d7362] leading-relaxed">{zone.signal}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* V6/V7: NextStepPanel — bridge city → journey/day (pattern-aware) */}
      {!flowLockEnabled && (
        <NextStepPanel
          actions={getNextStepOptions({
            currentDay,
            totalDays: 28,
            hasReflections: true,
            fromPage: "city",
            behavior,
            pattern,
          })}
          patternType={pattern.type}
          onActionClick={() => track.nextStepClicked()}
        />
      )}

      <div className="text-center">
        <Link href="/city/classic" className="text-sm text-[#7d7362] hover:text-[#14110F]">
          ← المدينة الكلاسيكية (الإصدار القديم)
        </Link>
      </div>
    </div>
  );
}
