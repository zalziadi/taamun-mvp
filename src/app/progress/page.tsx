"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { track } from "@/lib/analytics";
import { APP_NAME, APP_SLUG } from "@/lib/appConfig";
import { dayRoute } from "@/lib/routes";
import { EntitlementGate } from "@/components/EntitlementGate";

const TOTAL_DAYS = 28;

export default function ProgressPage() {
  const router = useRouter();
  const [completedCount, setCompletedCount] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awarenessLoading, setAwarenessLoading] = useState(false);
  const [awareness, setAwareness] = useState<{
    weekly: Array<{
      week: number;
      insight: string;
      scores: {
        clarity: number;
        responsibility: number;
        trust: number;
        surrender: number;
      };
    }>;
    final: null | {
      insight: string;
      scores: {
        clarity: number;
        responsibility: number;
        trust: number;
        surrender: number;
      };
    };
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          current_day?: number;
          completed_days?: number[];
        };
        if (res.status === 401) {
          router.replace("/auth?next=/progress");
          return;
        }
        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل تقدمك.");
          return;
        }
        setCurrentDay(data.current_day ?? 1);
        setCompletedCount(Array.isArray(data.completed_days) ? data.completed_days.length : 0);

        const awarenessRes = await fetch("/api/awareness", { cache: "no-store" });
        if (awarenessRes.ok) {
          const awarenessData = await awarenessRes.json();
          setAwareness({
            weekly: awarenessData.weekly ?? [],
            final: awarenessData.final ?? null,
          });
        }
      } catch {
        setError("تعذر الاتصال — حاول مرة أخرى");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const percentage = (completedCount / TOTAL_DAYS) * 100;

  async function handleExport() {
    const res = await fetch("/api/history", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${APP_SLUG}-history.json`;
    a.click();
    URL.revokeObjectURL(url);
    track("export_json", { exportedDays: completedCount });
  }

  async function handleGenerateAwareness() {
    setAwarenessLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/awareness", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("تعذر إنشاء تحليل الوعي الآن.");
        return;
      }
      setAwareness({
        weekly: data.weekly ?? [],
        final: data.final ?? null,
      });
    } catch {
      setError("تعذر الاتصال — حاول مرة أخرى");
    } finally {
      setAwarenessLoading(false);
    }
  }

  if (loading) return null;

  return (
    <EntitlementGate>
      <div className="mx-auto max-w-[760px] space-y-6">
      <Card className="space-y-5 p-6">
        <h1 className="h1">{`تقدمك في ${APP_NAME}`}</h1>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">الأيام المكتملة</div>
          <div className="text-sm font-medium">
            {completedCount} / {TOTAL_DAYS}
          </div>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Button size="lg" onClick={() => router.push(dayRoute(currentDay))}>
            متابعة اليوم الحالي
          </Button>

          <Button variant="secondary" size="lg" onClick={handleExport}>
            {`تحميل ملف ${APP_NAME}`}
          </Button>
        </div>

        {error && <div className="text-sm text-danger">{error}</div>}
      </Card>

      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="h2">Smart Awareness Engine</h2>
          <Button
            variant="secondary"
            onClick={handleGenerateAwareness}
            disabled={awarenessLoading}
          >
            {awarenessLoading ? "جارٍ التحليل..." : "تحديث التحليل"}
          </Button>
        </div>

        {awareness?.final ? (
          <>
            <Alert variant="muted" title="الخلاصة النهائية">
              {awareness.final.insight}
            </Alert>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreChip label="الوضوح" value={awareness.final.scores.clarity} />
              <ScoreChip label="المسؤولية" value={awareness.final.scores.responsibility} />
              <ScoreChip label="الثقة" value={awareness.final.scores.trust} />
              <ScoreChip label="التسليم" value={awareness.final.scores.surrender} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">لا يوجد تحليل بعد. احفظ عدة أيام ثم حدّث التحليل.</p>
        )}

        {awareness?.weekly?.length ? (
          <div className="space-y-3">
            {awareness.weekly.map((week) => (
              <div key={week.week} className="rounded-xl border border-border bg-panel2 p-4">
                <p className="text-sm font-semibold text-text">أسبوع {week.week}</p>
                <p className="mt-1 text-sm text-muted">{week.insight}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
      </div>
    </EntitlementGate>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-panel2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-text">{value}%</div>
    </div>
  );
}
