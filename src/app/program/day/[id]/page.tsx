"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyJourney, type JourneyContent } from "@/components/journey/DailyJourney";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";
import { useJourneyMemory } from "@/hooks/useJourneyMemory";
import { WhyYouAreHereCard } from "@/components/journey/WhyYouAreHereCard";
import { ResumeNotice } from "@/components/journey/ResumeNotice";
import {
  resolveJourneyRoute,
  classifyVisit,
  reconciliationFor,
} from "@/lib/journey/continuity";

const TOTAL_DAYS = 28;

type RitualPayload = {
  entry?: { message: string; breathCue?: boolean };
  intention?: { focusArea: string; intentionText: string };
  action?: { type: string; instruction: string };
  closing?: { message: string; integration: string };
} | null;

type GuidancePayload = {
  message?: string;
  tone?: string;
  focus?: string;
} | null;

type ProgramDayPayload = {
  ok?: boolean;
  error?: string;
  day?: number;
  is_completed?: boolean;
  verse?: {
    title: string;
    text: string;
    surah_number: number;
    ayah_number: number;
  } | null;
  ritual?: RitualPayload;
  guidance?: GuidancePayload;
  micro_reward?: { type: string; message: string; intensity: string } | null;
};

type ReflectionsPayload = {
  ok?: boolean;
  reflections?: Array<{ id: string; day: number }>;
};

export default function ProgramDayPage() {
  const router = useRouter();
  const params = useParams();
  const day = Number(params.id);
  // V10 PR-2: Journey memory with day-context bridge
  const journey = useJourneyMemory({
    pageName: `/program/day/${day}`,
    loadTimeline: true,
    bridgeContext: "day",
    openingDay: day,
  });
  const [bridgeDismissed, setBridgeDismissed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<JourneyContent | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [ritual, setRitual] = useState<RitualPayload>(null);
  const [guidanceMsg, setGuidanceMsg] = useState<string | null>(null);
  const [microReward, setMicroReward] = useState<{ message: string; intensity: string } | null>(null);

  useEffect(() => {
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
      router.replace("/program/day/1");
      return;
    }

    // V9: Record that user entered this day (updates currentDay in memory)
    journey.update({ currentDay: day });

    const load = async () => {
      setLoading(true);
      try {
        const [dayRes, progressRes, reflectionsRes] = await Promise.all([
          fetch(`/api/program/day/${day}`, { cache: "no-store" }),
          fetch("/api/program/progress", { cache: "no-store" }),
          fetch("/api/reflections", { cache: "no-store" }),
        ]);

        if (dayRes.status === 401 || progressRes.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
          return;
        }

        const dayData = (await dayRes.json()) as ProgramDayPayload;
        const reflectionsData = (await reflectionsRes.json()) as ReflectionsPayload;

        // First time check
        const reflectionCount = reflectionsData.reflections?.length ?? 0;
        setIsFirstTime(reflectionCount === 0);

        // Build journey content
        const jsonEntry = getTaamunDailyByDay(day);
        const verseText = dayData.verse?.text ?? jsonEntry?.verse.arabic ?? "";
        const surahNum = dayData.verse?.surah_number ?? 0;
        const ayahNum = dayData.verse?.ayah_number ?? jsonEntry?.verse.ayah ?? 0;
        const verseRef = jsonEntry?.verse.surah
          ? `${jsonEntry.verse.surah}: ${ayahNum}`
          : surahNum
          ? `سورة ${surahNum}: ${ayahNum}`
          : "";

        // Use ritual action instruction as exercise if available
        const ritualAction = dayData.ritual?.action?.instruction;
        const exercise = ritualAction ?? jsonEntry?.exercise ?? "";

        setContent({
          day,
          verseText,
          verseRef,
          question: jsonEntry?.question ?? dayData.verse?.title ?? "",
          exercise,
          whisper: jsonEntry?.whisper ?? null,
        });

        // Set cognitive data
        setRitual(dayData.ritual ?? null);
        setGuidanceMsg(dayData.guidance?.message ?? null);
        setMicroReward(dayData.micro_reward ?? null);
      } catch {
        // On error, redirect to program overview
        router.replace(PROGRAM_ROUTE);
      } finally {
        setLoading(false);
      }
    };

    load();
    // journey.update is stable (useCallback); intentionally not in deps to avoid re-run loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, router]);

  // Hybrid Journey Guard.
  //
  //   welcome && day === 1             → ALLOW (fresh user's entry point)
  //   welcome && day > 1               → redirect to /program/day/1
  //   completed                        → redirect to /progress
  //   day && URL > decision.day        → forward mismatch → redirect
  //   day && URL < decision.day        → backward revisit → soft notice
  //   day && URL === decision.day      → match → render normally
  //
  // The welcome-allows-day-1 rule fixes the bootstrap paradox: fresh
  // users couldn't enter day 1, but day 1 is their only path out of
  // "welcome" state. Without this, every "Start" button in the app
  // created an infinite redirect loop.
  const decision = resolveJourneyRoute(journey.state);
  let redirectTo: string | null = null;
  if (decision.kind === "welcome") {
    if (day !== 1) {
      redirectTo = "/program/day/1";
    }
    // day === 1 → fall through, allow rendering
  } else if (decision.kind === "completed") {
    redirectTo = "/progress";
  } else if (decision.kind === "day" && day > decision.day) {
    // Forward mismatch: URL is ahead of state → strict redirect
    redirectTo = decision.route;
  }

  // Backward revisit: compute the soft reconciliation to display.
  // classifyVisit returns behind_state, reconciliationFor produces
  // the voice-v2 message ("يوم X — مكتملٌ من قبل. لا بأس بالعودة...").
  const isBackwardRevisit =
    decision.kind === "day" && day < decision.day;
  const softReconciliation = isBackwardRevisit
    ? reconciliationFor(classifyVisit(day, journey.state))
    : null;

  // Fire redirect as a side effect (not during render).
  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (loading || !content || redirectTo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment journey-shell">
        <div className="breathe-circle w-16 h-16 rounded-full bg-breath/30" />
      </div>
    );
  }

  // V10 PR-2: Bridge shown once before DailyJourney takes over
  if (!bridgeDismissed) {
    return (
      <div className="min-h-screen bg-parchment py-10 px-4">
        <div className="mx-auto max-w-[720px] space-y-6">
          {/* Hybrid guard: backward revisit notice (non-blocking).
              Only shown when URL day < state.currentDay — the user
              is deliberately revisiting a past day. */}
          {softReconciliation && softReconciliation.visible && (
            <ResumeNotice reconciliation={softReconciliation} variant="parchment" />
          )}

          <WhyYouAreHereCard
            bridge={journey.whyYouAreHere}
            variant="parchment"
            hideNext
            headingLabel={`يوم ${day} — لماذا الآن`}
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setBridgeDismissed(true)}
              className="tm-gold-btn inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-semibold"
            >
              ابدأ يوم {day} ←
            </button>
          </div>
          <p className="text-center text-[11px] text-[#8c7851]/70">
            هذه اللحظة لك. خذها حين تكون مستعدّاً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Micro-reward toast */}
      {microReward && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-[#c4a265]/30 bg-[#2a2118]/95 backdrop-blur-sm p-3 text-center animate-fade-in">
          <p className="text-xs font-semibold text-[#e7c468]">{microReward.message}</p>
        </div>
      )}

      <DailyJourney
        content={content}
        isFirstTime={isFirstTime}
        onComplete={() => {
          // V9: Record day completion in journey memory
          journey.update({
            completedStep: `day_${day}`,
            currentDay: day,
            progressDelta: 5,
            emotionalState: "flow",
          });
          router.push(PROGRAM_ROUTE);
        }}
      />

      {/* Ritual closing (after journey is done, shown subtly) */}
      {ritual?.closing && (
        <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-[#d8cdb9] bg-[#fcfaf7]/95 backdrop-blur-sm p-4 text-center">
          <p className="text-sm text-[#5a4531]">{ritual.closing.message}</p>
          <p className="mt-1 text-xs text-[#8c7851]">{ritual.closing.integration}</p>
        </div>
      )}
    </>
  );
}
