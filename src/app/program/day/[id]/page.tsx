"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import { ProgramProgressBar } from "@/components/program/ProgramProgressBar";
import { PROGRAM_ROUTE, programDayRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

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

type SaveResponse = {
  ok?: boolean;
  error?: string;
  ai_response?: string;
  next_day?: number;
};

type JournalEntry = {
  observe: string;
  insight: string;
  contemplate: string;
  rebuild: string;
};

function JournalTextarea({
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className={cn(
          "w-full rounded-xl border bg-panel2 px-4 py-3 text-text placeholder:text-muted/50",
          "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed",
          "border-border"
        )}
      />
    </div>
  );
}

export default function ProgramDayPage() {
  const router = useRouter();
  const params = useParams();
  const day = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(TOTAL_DAYS);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [verse, setVerse] = useState<ProgramDayPayload["verse"]>(null);

  const [entry, setEntry] = useState<JournalEntry>({
    observe: "",
    insight: "",
    contemplate: "",
    rebuild: "",
  });

  const updateEntry = useCallback((field: keyof JournalEntry, value: string) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
  }, []);

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

        // Redirect to login if not authenticated
        if (dayRes.status === 401 || progressRes.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
          return;
        }

        const dayData = (await dayRes.json()) as ProgramDayPayload;
        const progressData = (await progressRes.json()) as ProgramProgressResponse;

        if (!dayRes.ok || dayData.ok === false) {
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
  const hasText = !!(entry.observe.trim() || entry.insight.trim() || entry.contemplate.trim() || entry.rebuild.trim());

  async function handleSave() {
    if (!hasText) {
      setError("اكتب على الأقل إجابة واحدة قبل الحفظ.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    setAiResponse(null);

    try {
      // Save journal entry
      const saveRes = await fetch("/api/ramadan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          observeText: entry.observe,
          insightText: entry.insight,
          contemplateText: entry.contemplate,
          rebuildText: entry.rebuild,
        }),
      });

      if (saveRes.status === 401) {
        router.replace(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
        return;
      }

      const saveData = (await saveRes.json()) as SaveResponse;
      if (!saveRes.ok || saveData.ok === false) {
        setError("تعذر حفظ تأملك. حاول مجدداً.");
        return;
      }

      // Mark day as complete in progress tracker
      const progressRes = await fetch("/api/program/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      const progressData = (await progressRes.json()) as ProgramProgressResponse;
      if (progressData.completed_days) {
        setCompletedDays(progressData.completed_days);
        setCurrentDay(progressData.current_day ?? currentDay);
      }

      if (saveData.ai_response) {
        setAiResponse(saveData.ai_response);
      }
      setMessage(day === TOTAL_DAYS ? "ممتاز! أنهيت البرنامج بالكامل." : "تم حفظ تأملك ✓");
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-[840px] space-y-6">
      {/* Header card */}
      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="h1">اليوم {day}</h1>
          <Link href={PROGRAM_ROUTE} className="text-sm text-muted hover:text-text">
            العودة للبرنامج
          </Link>
        </div>
        <ProgramProgressBar completedCount={completedCount} totalDays={totalDays} />
      </Card>

      {/* Verse card */}
      {verse && (
        <Card className="space-y-4 p-6">
          <h2 className="h2">{verse.title || `تأمل اليوم ${day}`}</h2>
          <p className="text-lg leading-loose text-text text-center py-2">
            {verse.text ? `﴿ ${verse.text} ﴾` : "لا يوجد نص آية لهذا اليوم بعد."}
          </p>
        </Card>
      )}

      {/* Journal form or locked state */}
      {isLocked ? (
        <Card className="p-6">
          <Alert variant="muted">أكمل الأيام السابقة أولاً للوصول إلى هذا اليوم.</Alert>
        </Card>
      ) : (
        <Card className="space-y-6 p-6">
          <h3 className="text-base font-semibold text-text">تأملك اليوم</h3>

          {verse?.prompts && (
            <div className="space-y-5">
              <JournalTextarea
                label={verse.prompts.observe}
                placeholder="اكتب ما لاحظته..."
                value={entry.observe}
                onChange={(v) => updateEntry("observe", v)}
                disabled={saving || isCompleted}
              />
              <JournalTextarea
                label={verse.prompts.insight}
                placeholder="اكتب إدراكك..."
                value={entry.insight}
                onChange={(v) => updateEntry("insight", v)}
                disabled={saving || isCompleted}
              />
              <JournalTextarea
                label={verse.prompts.contemplate}
                placeholder="اكتب تمعنك..."
                value={entry.contemplate}
                onChange={(v) => updateEntry("contemplate", v)}
                disabled={saving || isCompleted}
              />
              <JournalTextarea
                label={verse.prompts.rebuild}
                placeholder="ما الذي ستعيد بناءه؟"
                value={entry.rebuild}
                onChange={(v) => updateEntry("rebuild", v)}
                disabled={saving || isCompleted}
              />
            </div>
          )}

          {!verse && (
            <Alert variant="muted">لا توجد مادة مسجلة لهذا اليوم حالياً.</Alert>
          )}

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          {/* AI Response block */}
          {aiResponse && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-2">
              <p className="text-xs font-medium text-gold">تأمل معك</p>
              <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {day > 1 && (
              <Button variant="secondary" onClick={() => router.push(programDayRoute(day - 1))}>
                ← اليوم السابق
              </Button>
            )}

            {!isCompleted ? (
              <Button onClick={handleSave} disabled={saving || !hasText || !verse}>
                {saving ? "جارٍ الحفظ..." : "احفظ تأملك"}
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                تم الحفظ ✓
              </Button>
            )}

            {day < totalDays && isCompleted && (
              <Button onClick={() => router.push(programDayRoute(day + 1))}>
                اليوم التالي →
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
