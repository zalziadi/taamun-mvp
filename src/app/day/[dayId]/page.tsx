"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Button, Card } from "@/components/ui";
import CompleteDayButton from "@/components/CompleteDayButton";
import { track } from "@/lib/analytics";
import { exportTaamunData } from "@/lib/export";
import { getDayData } from "@/lib/ramadan-28";

const TOTAL_DAYS = 28;
type QuestionTrack = "surface" | "mirror";

export default function DayPage() {
  const router = useRouter();
  const params = useParams();
  const dayNumber = Number(params.dayId);
  const dayData = Number.isInteger(dayNumber) ? getDayData(dayNumber) : undefined;

  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [observed, setObserved] = useState("");
  const [insight, setInsight] = useState("");
  const [contemplation, setContemplation] = useState("");
  const [observedTrack, setObservedTrack] = useState<QuestionTrack>("surface");
  const [insightTrack, setInsightTrack] = useState<QuestionTrack>("surface");
  const [contemplationTrack, setContemplationTrack] = useState<QuestionTrack>("surface");
  const [saved, setSaved] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!dayNumber || dayNumber < 1 || dayNumber > TOTAL_DAYS) {
      router.replace("/day/1");
      return;
    }

    let cancelled = false;

    async function loadAnswers() {
      setLoadingAnswers(true);
      setLoadError(null);
      setSaveError(null);
      setCompleteError(null);
      try {
        const res = await fetch(`/api/answers?day=${dayNumber}`, { method: "GET" });
        if (res.status === 401) {
          if (!cancelled) {
            setLoadError("سجّل دخولك للمتابعة");
            setSaved(false);
          }
          return;
        }

        const data = await res.json();
        const found = Boolean(data?.found ?? data?.answer);
        if (data?.ok && found) {
          const answer = data.answer;
          if (!cancelled) {
            setObserved(answer?.observed ?? "");
            setInsight(answer?.insight ?? "");
            setContemplation(answer?.contemplation ?? "");
            setObservedTrack(answer?.observed_track === "mirror" ? "mirror" : "surface");
            setInsightTrack(answer?.insight_track === "mirror" ? "mirror" : "surface");
            setContemplationTrack(
              answer?.contemplation_track === "mirror" ? "mirror" : "surface"
            );
            setSaved(true);
          }
        } else if (!cancelled) {
          setObserved("");
          setInsight("");
          setContemplation("");
          setObservedTrack("surface");
          setInsightTrack("surface");
          setContemplationTrack("surface");
          setSaved(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError("تعذر تحميل إجابات اليوم");
          setSaved(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingAnswers(false);
          setLoading(false);
        }
      }
    }

    loadAnswers();

    return () => {
      cancelled = true;
    };
  }, [dayNumber, router]);

  useEffect(() => {
    updateProgress();
  }, []);

  function updateProgress() {
    let count = 0;
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      if (localStorage.getItem(`TAAMUN_DAY_${i}`)) {
        count++;
      }
    }
    setCompletedCount(count);
  }

  async function handleSave() {
    setSaveError(null);
    setCompleteError(null);

    if (!observed.trim() || !insight.trim() || !contemplation.trim()) {
      setSaveError("لا يمكن الحفظ بدون كتابة المراحل الثلاث");
      return;
    }

    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: dayNumber,
          observed,
          insight,
          contemplation,
          observedTrack,
          insightTrack,
          contemplationTrack,
        }),
      });

      if (res.status === 401) {
        setSaveError("سجّل دخولك للمتابعة");
        setSaved(false);
        return;
      }

      const data = await res.json();
      if (!data?.ok) {
        setSaveError("تعذر حفظ الإجابات");
        setSaved(false);
        return;
      }
    } catch {
      setSaveError("تعذر حفظ الإجابات");
      setSaved(false);
      return;
    }
    track("day_save", { dayId: dayNumber });
    setSaved(true);
    updateProgress();
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
          <h1 className="h1">اليوم {dayNumber}</h1>
          <p className="p-muted mt-2">﴿ {dayData?.verse ?? "وَاللَّهُ مَعَ الصَّابِرِينَ"} ﴾</p>
          <p className="mt-1 text-xs text-muted">{dayData?.reference ?? "السورة: آية"}</p>
        </div>

        {loadingAnswers && (
          <Alert variant="muted" title="جاري التحميل">
            جارٍ تحميل إجاباتك المحفوظة...
          </Alert>
        )}

        {loadError && (
          <Alert variant="danger" title="تعذر التحميل">
            {loadError}
          </Alert>
        )}

        <div className="space-y-4">
          <PhaseQuestionCard
            title="لحظة المراقبة"
            description="اختر المسار الذي يناسبك اليوم ثم اكتب إجابتك."
            surfaceQuestion={dayData?.questions.shadow.surface ?? "ماذا لاحظت اليوم؟"}
            mirrorQuestion={dayData?.questions.shadow.mirror ?? "ماذا يكشف هذا عن حالك؟"}
            selectedTrack={observedTrack}
            onTrackChange={(trackType) => {
              setObservedTrack(trackType);
              setSaved(false);
              setCompleteError(null);
            }}
          />
          <Textarea
            label="إجابتك في المراقبة"
            value={observed}
            onChange={(v) => {
              setObserved(v);
              setSaved(false);
              setCompleteError(null);
            }}
          />
          <PhaseQuestionCard
            title="لحظة الإدراك"
            surfaceQuestion={dayData?.questions.awareness.surface ?? "ما المعنى الذي ظهر لك؟"}
            mirrorQuestion={
              dayData?.questions.awareness.mirror ?? "ماذا حدث داخلك وأنت تقرأ الآية؟"
            }
            selectedTrack={insightTrack}
            onTrackChange={(trackType) => {
              setInsightTrack(trackType);
              setSaved(false);
              setCompleteError(null);
            }}
          />
          <Textarea
            label="إجابتك في الإدراك"
            value={insight}
            onChange={(v) => {
              setInsight(v);
              setSaved(false);
              setCompleteError(null);
            }}
          />
          <PhaseQuestionCard
            title="لحظة التمعّن"
            surfaceQuestion={
              dayData?.questions.contemplation.surface ?? "كيف ستحمل المعنى معك لليوم؟"
            }
            mirrorQuestion={
              dayData?.questions.contemplation.mirror ?? "ما الذي بقي من الآية في حياتك؟"
            }
            selectedTrack={contemplationTrack}
            onTrackChange={(trackType) => {
              setContemplationTrack(trackType);
              setSaved(false);
              setCompleteError(null);
            }}
          />
          <Textarea
            label="إجابتك في التمعّن"
            value={contemplation}
            onChange={(v) => {
              setContemplation(v);
              setSaved(false);
              setCompleteError(null);
            }}
          />
        </div>

        {saved && !saveError && (
          <Alert variant="success" title="تم الحفظ">
            تم الحفظ
          </Alert>
        )}

        {saveError && (
          <Alert variant="danger" title="تعذر الحفظ">
            {saveError}
          </Alert>
        )}

        {saved && dayNumber === TOTAL_DAYS && (
          <Alert variant="success" title="🎉 أكملت 28 يومًا">
            تمَعُّنك أصبح عادة.
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <CompleteDayButton
            day={dayNumber}
            disabled={!saved}
            onError={(error) => {
              setCompleteError(error);
            }}
            onCompleted={(nextDay) => {
              setCompleteError(null);
              if (nextDay > dayNumber && nextDay <= TOTAL_DAYS) {
                router.push(`/day/${nextDay}`);
              }
            }}
          />

          {!saved && (
            <div className="w-full text-sm text-muted">احفظ إجاباتك أولاً لتفعيل الإكمال</div>
          )}

          {completeError === "answers_required" && (
            <div className="w-full text-sm text-danger">لا يمكن الإكمال قبل الحفظ</div>
          )}

          {completeError === "locked_day" && (
            <div className="w-full text-sm text-danger">هذا اليوم مقفول — أكمل يومك الحالي أولاً</div>
          )}

          {dayNumber === TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const { exportedDays } = exportTaamunData();
                track("export_json", { exportedDays });
              }}
            >
              تحميل ملف التمعّن
            </Button>
          )}

          {dayNumber < TOTAL_DAYS && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push(`/day/${dayNumber + 1}`)}
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

function PhaseQuestionCard({
  title,
  description,
  surfaceQuestion,
  mirrorQuestion,
  selectedTrack,
  onTrackChange,
}: {
  title: string;
  description?: string;
  surfaceQuestion: string;
  mirrorQuestion: string;
  selectedTrack: QuestionTrack;
  onTrackChange: (value: QuestionTrack) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel2 p-4">
      <div className="text-sm font-semibold text-text">{title}</div>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}

      <div className="mt-3 grid gap-2">
        <QuestionOption
          label="السؤال الظاهري"
          question={surfaceQuestion}
          checked={selectedTrack === "surface"}
          onSelect={() => onTrackChange("surface")}
        />
        <QuestionOption
          label="السؤال المرآوي"
          question={mirrorQuestion}
          checked={selectedTrack === "mirror"}
          onSelect={() => onTrackChange("mirror")}
        />
      </div>
    </div>
  );
}

function QuestionOption({
  label,
  question,
  checked,
  onSelect,
}: {
  label: string;
  question: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-right transition ${
        checked
          ? "border-gold bg-gold/10 text-text"
          : "border-border bg-panel hover:border-gold/50 hover:bg-panel2"
      }`}
      aria-pressed={checked}
    >
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm text-text">{question}</div>
    </button>
  );
}
