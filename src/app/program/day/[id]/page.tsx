"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyJourney, type JourneyContent } from "@/components/journey/DailyJourney";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";
import { useJourneyMemory } from "@/hooks/useJourneyMemory";

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

type ProgressPayload = {
  ok?: boolean;
  error?: string;
  current_day?: number;
  completed_days?: number[];
};

type ReflectionsPayload = {
  ok?: boolean;
  reflections?: Array<{ id: string; day: number }>;
};

function calculateStreak(completedDays: number[]): number {
  if (!completedDays.length) return 0;
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = sorted[0];
  for (const d of sorted) {
    if (d === expected) { streak++; expected--; }
    else break;
  }
  return streak;
}

export default function ProgramDayPage() {
  const router = useRouter();
  const params = useParams();
  const day = Number(params.id);
  // V9: Journey memory — track day visit + completion
  const journey = useJourneyMemory({ pageName: `/program/day/${day}` });

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<JourneyContent | null>(null);
  const [streak, setStreak] = useState(0);
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
        const progressData = (await progressRes.json()) as ProgressPayload;
        const reflectionsData = (await reflectionsRes.json()) as ReflectionsPayload;

        // Streak from completed days
        const completed = Array.isArray(progressData.completed_days)
          ? progressData.completed_days
          : [];
        setStreak(calculateStreak(completed));

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

  if (loading || !content) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment journey-shell">
        <div className="breathe-circle w-16 h-16 rounded-full bg-breath/30" />
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
        streak={streak}
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
