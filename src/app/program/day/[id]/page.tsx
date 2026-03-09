"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DailyJourney, type JourneyContent } from "@/components/journey/DailyJourney";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";

const TOTAL_DAYS = 28;

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

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<JourneyContent | null>(null);
  const [streak, setStreak] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
      router.replace("/program/day/1");
      return;
    }

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

        setContent({
          day,
          verseText,
          verseRef,
          question: jsonEntry?.question ?? dayData.verse?.title ?? "",
          exercise: jsonEntry?.exercise ?? "",
          whisper: jsonEntry?.whisper ?? null,
        });
      } catch {
        // On error, redirect to program overview
        router.replace(PROGRAM_ROUTE);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [day, router]);

  if (loading || !content) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment journey-shell">
        <div className="breathe-circle w-16 h-16 rounded-full bg-breath/30" />
      </div>
    );
  }

  return (
    <DailyJourney
      content={content}
      streak={streak}
      isFirstTime={isFirstTime}
      onComplete={() => router.push(PROGRAM_ROUTE)}
    />
  );
}
