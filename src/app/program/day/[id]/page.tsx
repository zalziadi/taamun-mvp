"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { EntitlementGate } from "@/components/EntitlementGate";
import { ProgramProgressBar } from "@/components/program/ProgramProgressBar";
import { PROGRAM_ROUTE, programDayRoute } from "@/lib/routes";

const TOTAL_DAYS = 28;

type ProgramDayPayload = {
  ok?: boolean;
  error?: string;
  day?: number;
  total_days?: number;
  current_day?: number;
  is_completed?: boolean;
  verse?: {
    title: string;
    text: string;
    surah_number: number;
    ayah_number: number;
    prompts: {
      observe: string;
      insight: string;
      contemplate: string;
      rebuild: string;
    };
  } | null;
};

type ProgramProgressResponse = {
  ok?: boolean;
  error?: string;
  total_days?: number;
  current_day?: number;
  completed_days?: number[];
  completed_count?: number;
  percent?: number;
};

export default function ProgramDayPage() {
  const router = useRouter();
  const params = useParams();
  const day = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(TOTAL_DAYS);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [verse, setVerse] = useState<ProgramDayPayload["verse"]>(null);

  useEffect(() => {
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
      router.replace(programDayRoute(1));
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const [dayRes, progressRes] = await Promise.all([
          fetch(`/api/program/day/${day}`, { cache: "no-store" }),
          fetch("/api/program/progress", { cache: "no-store" }),
        ]);

        if (dayRes.status === 401 || progressRes.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
          return;
        }

        const dayData = (await dayRes.json()) as ProgramDayPayload;
        const progressData = (await progressRes.json()) as ProgramProgressResponse;

        if (!dayRes.ok || dayData.ok === false || !progressRes.ok || progressData.ok === false) {
          setError("تعذر تحميل بيانات اليوم.");
          return;
        }

        const completed = Array.isArray(progressData.completed_days) ? progressData.completed_days : [];
        const total = progressData.total_days ?? dayData.total_days ?? TOTAL_DAYS;

        setVerse(dayData.verse ?? null);
        setCurrentDay(progressData.current_day ?? dayData.current_day ?? 1);
        setCompletedDays(completed);
        setTotalDays(total);
      } catch {
        setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [day, router]);

  const completedCount = useMemo(() => completedDays.length, [completedDays]);
  const isCompleted = useMemo(() => completedDays.includes(day), [completedDays, day]);
  const isLocked = day > currentDay;

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    setMessage(null);

    const optimisticCompleted = Array.from(new Set([...completedDays, day])).sort((a, b) => a - b);
    setCompletedDays(optimisticCompleted);

    try {
      const res = await fetch("/api/program/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });

      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
        return;
      }

      const data = (await res.json()) as ProgramProgressResponse;
      if (!res.ok || data.ok === false) {
        setCompletedDays(completedDays);
        setError("تعذر تسجيل الإنجاز الآن.");
        return;
      }

      const nextCompleted = Array.isArray(data.completed_days) ? data.completed_days : optimisticCompleted;
      setCompletedDays(nextCompleted);
      setCurrentDay(data.current_day ?? currentDay);
      setTotalDays(data.total_days ?? totalDays);
      setMessage(day === TOTAL_DAYS ? "ممتاز! أنهيت البرنامج بالكامل." : "تم تسجيل اليوم كمنجز.");
    } catch {
      setCompletedDays(completedDays);
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return null;

  return (
    <EntitlementGate>
      <div className="mx-auto max-w-[840px] space-y-6">
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="h1">اليوم {day}</h1>
            <Link href={PROGRAM_ROUTE} className="text-sm text-muted hover:text-text">
              العودة للبرنامج
            </Link>
          </div>

          <ProgramProgressBar completedCount={completedCount} totalDays={totalDays} />
        </Card>

        <Card className="space-y-5 p-6">
          {verse ? (
            <>
              <h2 className="h2">{verse.title || `تأمل اليوم ${day}`}</h2>
              <p className="text-lg leading-8 text-text">{verse.text ? `﴿ ${verse.text} ﴾` : "لا يوجد نص آية لهذا اليوم بعد."}</p>
              <div className="space-y-2 rounded-xl border border-border bg-panel2 p-4 text-sm text-muted">
                <p>{verse.prompts.observe}</p>
                <p>{verse.prompts.insight}</p>
                <p>{verse.prompts.contemplate}</p>
                <p>{verse.prompts.rebuild}</p>
              </div>
            </>
          ) : (
            <Alert variant="muted">لا توجد مادة مسجلة لهذا اليوم حالياً.</Alert>
          )}

          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {isLocked ? (
            <Alert variant="muted">هذا اليوم غير متاح بعد. أكمل الأيام السابقة أولاً.</Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleComplete} disabled={isLocked || isCompleted || completing}>
              {completing ? "جارٍ التسجيل..." : "تم الإنجاز"}
            </Button>

            {day < totalDays ? (
              <Button
                variant="secondary"
                onClick={() => router.push(programDayRoute(day + 1))}
              >
                اليوم التالي
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </EntitlementGate>
  );
}
