"use client";

/**
 * DayPageClient — all client-side UI logic for /program/day/[id].
 *
 * DB-first architecture: this component does NOT make routing decisions.
 * The parent Server Component (page.tsx) handles auth + forward-jump
 * guard using DB as the source of truth. By the time this component
 * renders, the day is already validated.
 *
 * What this component DOES:
 *   - Fetch day content (verse, question, exercise)
 *   - Show the WhyYouAreHere bridge (UX, not routing)
 *   - Render DailyJourney (7-step experience)
 *   - Record completion in both journey memory (UX) and progress API (DB)
 *   - Show micro-rewards and ritual closing
 *
 * What this component does NOT do:
 *   - No forward-jump guard (server handles it)
 *   - No resolveJourneyRoute, hasStarted, classifyVisit
 *   - No redirect logic based on localStorage
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DailyJourney, type JourneyContent } from "@/components/journey/DailyJourney";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";
import { useJourneyMemory } from "@/hooks/useJourneyMemory";
import { WhyYouAreHereCard } from "@/components/journey/WhyYouAreHereCard";

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

interface Props {
  /** The validated day number — already confirmed by the server guard. */
  day: number;
}

export default function DayPageClient({ day }: Props) {
  const router = useRouter();

  // Journey memory — for UX enhancements (bridge, voice, continuity
  // banner), NOT for routing decisions. The server already validated
  // the day against DB progress.
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
  const [microReward, setMicroReward] = useState<{
    message: string;
    intensity: string;
  } | null>(null);

  useEffect(() => {
    // Record that user entered this day (UX memory, not routing)
    journey.update({ currentDay: day });

    const load = async () => {
      setLoading(true);
      try {
        const [dayRes, reflectionsRes] = await Promise.all([
          fetch(`/api/program/day/${day}`, { cache: "no-store" }),
          fetch("/api/reflections", { cache: "no-store" }),
        ]);

        if (dayRes.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
          return;
        }

        const dayData = (await dayRes.json()) as ProgramDayPayload;
        const reflectionsData = (await reflectionsRes.json()) as ReflectionsPayload;

        const reflectionCount = reflectionsData.reflections?.length ?? 0;
        setIsFirstTime(reflectionCount === 0);

        const jsonEntry = getTaamunDailyByDay(day);
        const verseText = dayData.verse?.text ?? jsonEntry?.verse.arabic ?? "";
        const surahNum = dayData.verse?.surah_number ?? 0;
        const ayahNum = dayData.verse?.ayah_number ?? jsonEntry?.verse.ayah ?? 0;
        const verseRef = jsonEntry?.verse.surah
          ? `${jsonEntry.verse.surah}: ${ayahNum}`
          : surahNum
            ? `سورة ${surahNum}: ${ayahNum}`
            : "";

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

        setRitual(dayData.ritual ?? null);
        setMicroReward(dayData.micro_reward ?? null);
      } catch {
        router.replace(PROGRAM_ROUTE);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, router]);

  // Loading state
  if (loading || !content) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment journey-shell">
        <div className="breathe-circle w-16 h-16 rounded-full bg-breath/30" />
      </div>
    );
  }

  // Bridge — UX only, not a routing guard
  if (!bridgeDismissed) {
    return (
      <div className="min-h-screen bg-parchment py-10 px-4">
        <div className="mx-auto max-w-[720px] space-y-6">
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
      {microReward && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-[#c4a265]/30 bg-[#2a2118]/95 backdrop-blur-sm p-3 text-center animate-fade-in">
          <p className="text-xs font-semibold text-[#e7c468]">
            {microReward.message}
          </p>
        </div>
      )}

      <DailyJourney
        content={content}
        isFirstTime={isFirstTime}
        onComplete={() => {
          // Record completion in journey memory (UX). The DB write
          // happens inside DailyJourney.handleClosingComplete which
          // POSTs to /api/program/progress — that's the real source
          // of truth. This localStorage update is for the bridge voice
          // and continuity banner only.
          const nextDay = Math.min(28, day + 1);
          journey.update({
            completedStep: `day_${day}`,
            currentDay: nextDay,
            progressDelta: 5,
            emotionalState: "flow",
          });
          router.push(PROGRAM_ROUTE);
        }}
      />

      {ritual?.closing && (
        <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-[#d8cdb9] bg-[#fcfaf7]/95 backdrop-blur-sm p-4 text-center">
          <p className="text-sm text-[#5a4531]">{ritual.closing.message}</p>
          <p className="mt-1 text-xs text-[#8c7851]">
            {ritual.closing.integration}
          </p>
        </div>
      )}
    </>
  );
}
