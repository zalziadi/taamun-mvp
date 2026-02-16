"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { exportTaamunData } from "@/lib/export";

const TOTAL_DAYS = 28;

export default function DayPage() {
  const router = useRouter();
  const params = useParams();
  const dayId = Number(params.dayId);

  const STORAGE_KEY = `TAAMUN_DAY_${dayId}`;

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const [observed, setObserved] = useState("");
  const [insight, setInsight] = useState("");
  const [contemplation, setContemplation] = useState("");

  useEffect(() => {
    if (!dayId || dayId < 1 || dayId > TOTAL_DAYS) {
      router.replace("/day/1");
      return;
    }

    if (dayId > 1) {
      const prevDayKey = `TAAMUN_DAY_${dayId - 1}`;
      const prevCompleted = localStorage.getItem(prevDayKey);

      if (!prevCompleted) {
        router.replace(`/day/${dayId - 1}`);
        return;
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setObserved(data.observed || "");
        setInsight(data.insight || "");
        setContemplation(data.contemplation || "");
      } catch {
        // ignore corrupted storage
      }
    }

    updateProgress();
    setLoading(false);
  }, [dayId, router, STORAGE_KEY]);

  function updateProgress() {
    let count = 0;
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      if (localStorage.getItem(`TAAMUN_DAY_${i}`)) {
        count++;
      }
    }
    setCompletedCount(count);
  }

  function handleSave() {
    if (!observed && !insight && !contemplation) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        observed,
        insight,
        contemplation,
        savedAt: new Date().toISOString(),
      })
    );

    setSaved(true);
    updateProgress();

    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      {/* Progress */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">التقدم</div>
          <div className="text-sm font-medium">
            {completedCount} / {TOTAL_DAYS}
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${(completedCount / TOTAL_DAYS) * 100}%` }}
          />
        </div>
      </Card>

      {/* Day Content */}
      <Card className="space-y-5 p-6">
        <div>
          <h1 className="h1">اليوم {dayId}</h1>
          <p className="p-muted mt-2">﴿ وَاللَّهُ مَعَ الصَّابِرِينَ ﴾</p>
        </div>

        <div className="space-y-4">
          <Textarea
            label="ماذا لاحظت اليوم؟"
            value={observed}
            onChange={setObserved}
          />
          <Textarea
            label="ما الإدراك الذي ظهر لك؟"
            value={insight}
            onChange={setInsight}
          />
          <Textarea
            label="كيف ستتمَعَّن في هذا المعنى؟"
            value={contemplation}
            onChange={setContemplation}
          />
        </div>

        {saved && dayId === TOTAL_DAYS && (
          <Alert variant="success" title="🎉 أكملت 28 يومًا">
            تمَعُّنك أصبح عادة.
          </Alert>
        )}

        {saved && dayId < TOTAL_DAYS && (
          <Alert variant="success" title="تم الحفظ">
            تم حفظ إجاباتك بنجاح.
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleSave}>
            حفظ
          </Button>

          {dayId === TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => exportTaamunData()}
            >
              تحميل ملف التمعّن
            </Button>
          )}

          {dayId < TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(`/day/${dayId + 1}`)}
            >
              اليوم التالي
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-text">{label}</div>
      <textarea
        className="focus-ring w-full min-h-[110px] resize-none rounded-xl border border-border bg-panel2 p-4 text-sm text-text placeholder:text-muted"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
