"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Alert, Button, Card } from "@/components/ui";
import { APP_NAME } from "@/lib/appConfig";
import { EntitlementGate } from "@/components/EntitlementGate";

interface DayData {
  day: number;
  theme: string;
  ref: { surah: number; ayahStart: number; ayahEnd: number };
  triad: { observe: string; insight: string; contemplate: string };
  quranText: { arabic: string };
}

type Step = "verse" | "observe" | "insight" | "contemplate" | "ai";

const STEPS: Step[] = ["verse", "observe", "insight", "contemplate", "ai"];
const STEP_LABEL: Record<Step, string> = {
  verse: "الآية",
  observe: "مراقبة",
  insight: "إدراك",
  contemplate: APP_NAME,
  ai: "تأمل",
};

export default function TaamunDayPage({ day }: { day: number }) {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("verse");
  const [answers, setAnswers] = useState({
    observe: "",
    insight: "",
    contemplate: "",
    rebuild: "",
  });
  const [aiResponse, setAiResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ramadan/day?day=${day}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setData(json);
          setError(null);
        } else {
          setError("تعذّر تحميل اليوم.");
        }
      })
      .catch(() => setError("تعذّر الاتصال — حاول مرة أخرى"))
      .finally(() => setLoading(false));
  }, [day]);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const currentQuestion = useMemo(() => {
    if (!data) return "";
    if (step === "observe") return data.triad.observe;
    if (step === "insight") return data.triad.insight;
    if (step === "contemplate") return data.triad.contemplate;
    return "";
  }, [data, step]);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  async function handleSaveAndReflect() {
    setSaving(true);
    setError(null);
    setStep("ai");
    try {
      const res = await fetch("/api/ramadan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          observeText: answers.observe,
          insightText: answers.insight,
          contemplateText: answers.contemplate,
          rebuildText: answers.rebuild,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAiResponse("تعذّر إنشاء التأمل الآن، لكن تم حفظ إجاباتك.");
        return;
      }
      setAiResponse(json.ai_response || "تم حفظ اليوم بنجاح.");
    } catch {
      setAiResponse("تعذّر الاتصال. إجاباتك محفوظة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={`رحلة رمضان - اليوم ${day}`}>
      <EntitlementGate>
        <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">{`اليوم ${day}`}</div>
            <div className="text-sm text-gold">{STEP_LABEL[step]}</div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
            <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`rounded-lg border px-2 py-1 text-center text-xs ${
                  i <= stepIndex ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-panel2 text-muted"
                }`}
              >
                {STEP_LABEL[s]}
              </div>
            ))}
          </div>
        </Card>

        {loading ? <Card className="p-5 text-muted">جاري التحميل...</Card> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}

        {!loading && data && step === "verse" ? (
          <Card className="space-y-4 p-6">
            <div className="text-sm text-gold">{data.theme}</div>
            <p className="text-xl leading-loose text-text">{data.quranText.arabic}</p>
            <p className="text-sm text-muted">
              سورة {data.ref.surah} - آية {data.ref.ayahStart}
              {data.ref.ayahEnd !== data.ref.ayahStart ? ` إلى ${data.ref.ayahEnd}` : ""}
            </p>
            <Button size="lg" onClick={goNext}>
              أنا مستعد
            </Button>
          </Card>
        ) : null}

        {!loading && data && (step === "observe" || step === "insight" || step === "contemplate") ? (
          <Card className="space-y-4 p-6">
            <p className="text-lg leading-relaxed text-text">{currentQuestion}</p>
            <textarea
              className="focus-ring min-h-[150px] w-full resize-none rounded-xl border border-border bg-panel2 p-4 text-text"
              value={answers[step]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [step]: e.target.value }))}
              placeholder="اكتب ما يخطر ببالك..."
            />
            {step === "contemplate" ? (
              <textarea
                className="focus-ring min-h-[110px] w-full resize-none rounded-xl border border-border bg-panel2 p-4 text-text"
                value={answers.rebuild}
                onChange={(e) => setAnswers((prev) => ({ ...prev, rebuild: e.target.value }))}
                placeholder="إعادة البناء (اختياري)"
              />
            ) : null}

            {step === "contemplate" ? (
              <Button size="lg" onClick={handleSaveAndReflect} disabled={saving || !answers.contemplate.trim()}>
                {saving ? "جارٍ..." : "أرسل وتأمل"}
              </Button>
            ) : (
              <Button size="lg" onClick={goNext} disabled={!answers[step].trim()}>
                التالي
              </Button>
            )}
          </Card>
        ) : null}

        {step === "ai" ? (
          <Card className="space-y-4 p-6">
            {saving ? (
              <div className="text-muted">يتأمل في إجاباتك...</div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gold">تأمل اليوم</h3>
                <p className="leading-loose text-text">{aiResponse || "لا يوجد رد بعد."}</p>
                {day < 28 ? (
                  <Link
                    href={`/ramadan?day=${day + 1}`}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-panel2 px-5 py-3 text-base font-medium text-text transition-colors hover:bg-panel"
                  >
                    اليوم التالي
                  </Link>
                ) : (
                  <Alert variant="success">أتممت رحلة رمضان. بارك الله فيك.</Alert>
                )}
              </>
            )}
          </Card>
        ) : null}
        </div>
      </EntitlementGate>
    </AppShell>
  );
}
