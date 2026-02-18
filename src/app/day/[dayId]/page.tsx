"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { track } from "@/lib/analytics";
import { exportTaamunData } from "@/lib/export";
import { APP_NAME } from "@/lib/appConfig";
import { DAY1_ROUTE, dayRoute } from "@/lib/routes";

const TOTAL_DAYS = 28;

type ProgressPayload = {
  current_day: number;
  completed_days: number[];
  total_days: number;
};

type DayPayload = {
  day: number;
  verse: {
    text: string;
    title: string;
    prompts: {
      observe: string;
      insight: string;
      contemplate: string;
      rebuild: string;
    };
  } | null;
  progress: ProgressPayload;
  answer: {
    observe: string;
    insight: string;
    contemplate: string;
    rebuild: string;
    ai_reflection: string;
  } | null;
};

export default function DayPage() {
  const router = useRouter();
  const params = useParams();
  const dayId = Number(params.dayId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [verseText, setVerseText] = useState("﴿ وَاللَّهُ مَعَ الصَّابِرِينَ ﴾");
  const [observePrompt, setObservePrompt] = useState("ماذا لاحظت اليوم؟");
  const [insightPrompt, setInsightPrompt] = useState("ما الإدراك الذي ظهر لك؟");
  const [contemplatePrompt, setContemplatePrompt] = useState(`كيف ستطبق ${APP_NAME} في هذا المعنى؟`);
  const [rebuildPrompt, setRebuildPrompt] = useState("ما الذي ستعيد بناءه في نفسك؟");
  const [aiReflection, setAiReflection] = useState("");

  const [observe, setObserve] = useState("");
  const [insight, setInsight] = useState("");
  const [contemplate, setContemplate] = useState("");
  const [rebuild, setRebuild] = useState("");

  useEffect(() => {
    if (!dayId || dayId < 1 || dayId > TOTAL_DAYS) {
      router.replace(DAY1_ROUTE);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/day/${dayId}`, { cache: "no-store" });
        const data = (await res.json()) as DayPayload & { ok?: boolean; error?: string };

        if (res.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/day/${dayId}`)}`);
          return;
        }
        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل يومك الحالي.");
          return;
        }

        const progress = data.progress;
        const completed = Array.isArray(progress.completed_days) ? progress.completed_days : [];
        setCurrentDay(progress.current_day ?? 1);
        setCompletedCount(completed.length);

        if (dayId > (progress.current_day ?? 1)) {
          const target = Math.max(1, (progress.current_day ?? 1) - 1);
          track("day_locked_redirect", { fromDay: dayId, toDay: target });
          router.replace(dayRoute(target));
          return;
        }

        if (data.verse?.text) setVerseText(`﴿ ${data.verse.text} ﴾`);
        if (data.verse?.prompts.observe) setObservePrompt(data.verse.prompts.observe);
        if (data.verse?.prompts.insight) setInsightPrompt(data.verse.prompts.insight);
        if (data.verse?.prompts.contemplate) setContemplatePrompt(data.verse.prompts.contemplate);
        if (data.verse?.prompts.rebuild) setRebuildPrompt(data.verse.prompts.rebuild);

        setObserve(data.answer?.observe ?? "");
        setInsight(data.answer?.insight ?? "");
        setContemplate(data.answer?.contemplate ?? "");
        setRebuild(data.answer?.rebuild ?? "");
        setAiReflection(data.answer?.ai_reflection ?? "");
      } catch {
        setError("تعذر الاتصال — حاول مرة أخرى");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dayId, router]);

  async function handleSave() {
    if (!observe && !insight && !contemplate && !rebuild) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: dayId,
          observe,
          insight,
          contemplate,
          rebuild,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        answer?: { ai_reflection?: string };
      };

      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent(`/day/${dayId}`)}`);
        return;
      }
      if (!res.ok || !data.ok) {
        setError("تعذر حفظ الإجابات. حاول مرة أخرى.");
        return;
      }

      setAiReflection(data.answer?.ai_reflection ?? "");
      setMessage("تم الحفظ بنجاح.");
      track("day_save", { dayId });
    } catch {
      setError("تعذر الاتصال — حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteDay() {
    setCompleting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        current_day?: number;
        completed_days?: number[];
      };
      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent(`/day/${dayId}`)}`);
        return;
      }
      if (!res.ok || !data.ok) {
        if (data.error === "answers_required") {
          setError("احفظ إجاباتك أولاً قبل إكمال اليوم.");
        } else if (data.error === "locked_day") {
          setError("هذا اليوم غير متاح بعد.");
        } else {
          setError("تعذر إكمال اليوم.");
        }
        return;
      }

      const nextCompleted = Array.isArray(data.completed_days) ? data.completed_days.length : 0;
      setCompletedCount(nextCompleted);
      setCurrentDay(data.current_day ?? currentDay);
      setMessage(dayId === TOTAL_DAYS ? "🎉 أكملت 28 يومًا." : "تم إكمال اليوم بنجاح.");
    } catch {
      setError("تعذر الاتصال — حاول مرة أخرى");
    } finally {
      setCompleting(false);
    }
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
          <p className="p-muted mt-2">{verseText}</p>
        </div>

        <div className="space-y-4">
          <Textarea
            label={observePrompt}
            value={observe}
            onChange={setObserve}
          />
          <Textarea
            label={insightPrompt}
            value={insight}
            onChange={setInsight}
          />
          <Textarea
            label={contemplatePrompt}
            value={contemplate}
            onChange={setContemplate}
          />
          <Textarea
            label={rebuildPrompt}
            value={rebuild}
            onChange={setRebuild}
          />
        </div>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {!!aiReflection && (
          <Alert variant="muted" title="انعكاس اليوم">
            {aiReflection}
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCompleteDay}
            disabled={completing || dayId > currentDay}
          >
            {completing ? "جارٍ الإكمال..." : "إكمال اليوم"}
          </Button>

          {dayId === TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const { exportedDays } = exportTaamunData();
                track("export_json", { exportedDays });
              }}
            >
              {`تحميل ملف ${APP_NAME}`}
            </Button>
          )}

          {dayId < TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(dayRoute(Math.min(dayId + 1, currentDay)))}
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
