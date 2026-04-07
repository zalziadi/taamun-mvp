"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VersePage } from "@/components/stitch/VersePage";
import { TopBar } from "@/components/stitch/TopBar";
import { Alert, Button, Card } from "@/components/ui";
import { APP_NAME } from "@/lib/appConfig";

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
        setAiResponse("تعذّر إنشاء التمعّن الآن، لكن تم حفظ إجاباتك.");
        return;
      }
      setAiResponse(json.ai_response || "تم حفظ اليوم بنجاح.");
    } catch {
      setAiResponse("تعذّر الاتصال. إجاباتك محفوظة.");
    } finally {
      setSaving(false);
    }
  }

  if (!loading && data && step === "verse") {
    return (
      <VersePage
        verseArabic={data.quranText.arabic}
        verseEnglish=""
        surahName={`سورة ${data.ref.surah}`}
        verseNumber={`الآية ${data.ref.ayahStart}`}
        contextTitle="موضوع اليوم"
        contextText={data.theme}
        onReflect={goNext}
        backHref="/ramadan"
      />
    );
  }

  return (
    <div dir="rtl" lang="ar" className="dark min-h-screen bg-background pb-28 pt-16 text-on-surface">
      <TopBar title={`اليوم ${day}`} showBack backHref="/ramadan" />

      <div className="mx-auto w-full max-w-[860px] space-y-5 px-4">
        <Card className="space-y-4 border-outline-variant/20 bg-surface-container-low/40 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-on-surface-variant">{`اليوم ${day}`}</div>
            <div className="text-sm text-primary">{STEP_LABEL[step]}</div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`rounded-lg border px-2 py-1 text-center text-xs ${
                  i <= stepIndex ? "border-primary/40 bg-primary/10 text-primary" : "border-outline-variant bg-surface-container text-on-surface-variant"
                }`}
              >
                {STEP_LABEL[s]}
              </div>
            ))}
          </div>
        </Card>

        {loading ? (
          <Card className="border-outline-variant/20 bg-surface-container-low/40 p-5 text-on-surface-variant">جاري التحميل...</Card>
        ) : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}

        {!loading && data && (step === "observe" || step === "insight" || step === "contemplate") ? (
          <Card className="space-y-4 border-outline-variant/20 bg-surface-container-low/40 p-6">
            <p className="text-lg leading-relaxed text-on-surface">{currentQuestion}</p>
            <textarea
              className="focus-ring min-h-[150px] w-full resize-none rounded-xl border border-outline-variant bg-surface-container p-4 text-on-surface"
              value={answers[step]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [step]: e.target.value }))}
              placeholder="اكتب ما يخطر ببالك..."
            />
            {step === "contemplate" ? (
              <textarea
                className="focus-ring min-h-[110px] w-full resize-none rounded-xl border border-outline-variant bg-surface-container p-4 text-on-surface"
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
          <Card className="space-y-4 border-outline-variant/20 bg-surface-container-low/40 p-6">
            {saving ? (
              <div className="text-on-surface-variant">يتأمل في إجاباتك...</div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-primary">تأمل اليوم</h3>
                <p className="leading-loose text-on-surface">{aiResponse || "لا يوجد رد بعد."}</p>
                {day < 28 ? (
                  <Link
                    href={`/ramadan?day=${day + 1}`}
                    className="inline-flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container px-5 py-3 text-base font-medium text-on-surface transition-colors hover:bg-surface-container-high"
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
    </div>
  );
}
