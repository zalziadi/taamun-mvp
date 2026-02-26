"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { EntitlementGate } from "@/components/EntitlementGate";
import { ProgramProgressBar } from "@/components/program/ProgramProgressBar";
import { ProgramDaysGrid } from "@/components/program/ProgramDaysGrid";
import { programDayRoute } from "@/lib/routes";

type ProgramProgressPayload = {
  ok?: boolean;
  error?: string;
  total_days?: number;
  current_day?: number;
  completed_days?: number[];
  completed_count?: number;
  percent?: number;
};

export default function ProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(28);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/program/progress", { cache: "no-store" });
        const data = (await res.json()) as ProgramProgressPayload;

        if (res.status === 401) {
          router.replace("/auth?next=/program");
          return;
        }

        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل بيانات البرنامج الآن.");
          return;
        }

        const total = data.total_days ?? 28;
        const completed = Array.isArray(data.completed_days) ? data.completed_days : [];
        const count = data.completed_count ?? completed.length;

        setTotalDays(total);
        setCurrentDay(data.current_day ?? 1);
        setCompletedDays(completed);
        setPercent(data.percent ?? Math.round((count / total) * 100));
      } catch {
        setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const completedCount = useMemo(() => completedDays.length, [completedDays]);

  if (loading) return null;

  return (
    <EntitlementGate>
      <div className="mx-auto max-w-[980px] space-y-6">
        <Card className="space-y-5 p-6">
          <h1 className="h1">برنامج 28 يوم</h1>
          <ProgramProgressBar
            completedCount={completedCount}
            totalDays={totalDays}
            percent={percent}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="h2">الأيام</h2>
            <button
              type="button"
              className="focus-ring rounded-xl border border-border bg-panel2 px-4 py-2 text-sm font-medium text-text hover:bg-panel"
              onClick={() => router.push(programDayRoute(currentDay))}
            >
              متابعة اليوم {currentDay}
            </button>
          </div>
          <ProgramDaysGrid
            totalDays={totalDays}
            currentDay={currentDay}
            completedDays={completedDays}
          />
        </Card>
      </div>
    </EntitlementGate>
  );
}
