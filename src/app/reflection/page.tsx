"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AWARENESS_STATES, PRACTICES, type AwarenessState } from "@/lib/city-of-meaning";

type AnswerPayload = {
  ok?: boolean;
  answer?: {
    observe?: string;
    insight?: string;
    contemplate?: string;
  } | null;
};

export default function ReflectionPage() {
  const router = useRouter();
  const [day, setDay] = useState(1);
  const [observe, setObserve] = useState("");
  const [insight, setInsight] = useState("");
  const [contemplate, setContemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [emotion, setEmotion] = useState("");
  const [surah, setSurah] = useState("");
  const [ayah, setAyah] = useState<number>(1);
  const [awarenessState, setAwarenessState] = useState<AwarenessState>("shadow");
  const [engineOutput, setEngineOutput] = useState<{
    insight: string;
    suggested_question: string;
    suggested_contemplation_practice: string;
  } | null>(null);
  const [linkedInsight, setLinkedInsight] = useState<{
    insight: string;
    patterns: string[];
    emotional_arc: string;
  } | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<{
    label: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const today = Math.max(1, Math.min(28, new Date().getDate()));
    setDay(today);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const res = await fetch(`/api/answers?day=${day}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/auth?next=/reflection");
          return;
        }
        const data = (await res.json()) as AnswerPayload;
        if (!res.ok || data.ok === false) return;
        setObserve(data.answer?.observe ?? "");
        setInsight(data.answer?.insight ?? "");
        setContemplate(data.answer?.contemplate ?? "");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [day, router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const reflectionRes = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          note: [observe, insight, contemplate].filter(Boolean).join("\n\n"),
          surah,
          ayah,
          emotion,
          awareness_state: awarenessState,
        }),
      });
      const reflectionData = (await reflectionRes.json()) as {
        ok?: boolean;
        linked?: { insight: string; patterns: string[]; emotional_arc: string };
        action?: { label: string; description: string };
      };
      const reflectionSaved = reflectionRes.ok && reflectionData.ok !== false;

      // Capture linked insight + action from cognitive system
      if (reflectionData.linked) setLinkedInsight(reflectionData.linked);
      if (reflectionData.action) setSuggestedAction(reflectionData.action);

      // Keep legacy answers in sync as best-effort only.
      let answerSaved = false;
      try {
        const answerRes = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, observe, insight, contemplate }),
        });
        const answerData = (await answerRes.json()) as { ok?: boolean };
        answerSaved = answerRes.ok && answerData.ok !== false;
      } catch {
        answerSaved = false;
      }

      if (reflectionSaved) {
        setStatus(answerSaved ? "تم الحفظ بنجاح" : "تم حفظ التمعّن (مع تخطي مزامنة ثانوية).");
      } else {
        setStatus("تعذر حفظ التمعّن");
      }
    } catch {
      setStatus("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function runMeaningEngine() {
    setStatus(null);
    setEngineOutput(null);
    try {
      const res = await fetch("/api/meaning-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ayah: `${surah || "آية"}/${ayah}`,
          emotion,
          awareness_state: awarenessState,
          reflection: [observe, insight, contemplate].filter(Boolean).join("\n"),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        insight?: string;
        suggested_question?: string;
        suggested_contemplation_practice?: string;
      };
      if (!res.ok || data.ok === false) {
        setStatus("تعذر تشغيل Meaning Engine");
        return;
      }
      if (data.insight && data.suggested_question && data.suggested_contemplation_practice) {
        setEngineOutput({
          insight: data.insight,
          suggested_question: data.suggested_question,
          suggested_contemplation_practice: data.suggested_contemplation_practice,
        });
      }
    } catch {
      setStatus("تعذر تشغيل Meaning Engine");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">جارٍ تجهيز صفحة التمعّن...</p>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6">
      <section className="tm-card p-7 text-center">
        <div className="inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#7b694a]">
          نقاء اليقين
        </div>
        <h1 className="tm-heading mt-3 text-5xl leading-tight">صفحة التمعّن</h1>
        <p className="mx-auto mt-2 max-w-[820px] text-sm leading-relaxed text-[#5f5648]/85">
          لكل آية: ملاحظة، إدراك، تمعّن. اكتب بصدق ثم حوّل الفهم إلى فعل واضح متسق مع أفضل احتمال فيك.
        </p>
      </section>

      <section className="tm-card px-6 py-9 text-center">
        <blockquote className="tm-heading text-[2.2rem] leading-[2.1] sm:text-[2.5rem]">
          أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
        </blockquote>
        <div className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-[#8c7851]/45 to-transparent" />
        <p className="tm-mono mt-4 text-xs text-[#8c7851]">الرعد · ٢٨</p>
        <div className="my-6 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#8c7851]/40" />
          <span className="text-xs text-[#8c7851]/70">✦</span>
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#8c7851]/40" />
        </div>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#8c7851]/20 tm-breathe-gold">
          <span className="tm-heading text-3xl text-[#8c7851]">۞</span>
        </div>
        <p className="mt-4 text-sm text-[#7d7362]">أغمض عينيك. تنفّس. ثم عُد للآية.</p>
      </section>

      <form onSubmit={onSave} className="tm-card p-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm text-[#7d7362]">اليوم</span>
            <input
              type="number"
              min={1}
              max={28}
              value={day}
              onChange={(e) => setDay(Math.max(1, Math.min(28, Number(e.target.value) || 1)))}
              className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-[#2f2619]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-[#7d7362]">السورة</span>
            <input
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
              placeholder="مثال: البقرة"
              className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-[#2f2619]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-[#7d7362]">الآية</span>
            <input
              type="number"
              min={1}
              value={ayah}
              onChange={(e) => setAyah(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-[#2f2619]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-[#7d7362]">المشاعر</span>
            <input
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="مثال: قلق، امتنان"
              className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-[#2f2619]"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-[#7d7362]">حالة الوعي</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {AWARENESS_STATES.map((state) => (
              <button
                key={state.value}
                type="button"
                onClick={() => setAwarenessState(state.value)}
                className={[
                  "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  awarenessState === state.value
                    ? "border-[#8c7851] bg-[#cdb98f]/18 text-[#7b694a]"
                    : "border-[#d8cdb9] bg-[#fcfaf7] text-[#7d7362] hover:border-[#8c7851]/40 hover:text-[#2f2619]",
                ].join(" ")}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#2f2619]">{PRACTICES[0].label}</span>
            <textarea
              value={observe}
              onChange={(e) => setObserve(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-3 text-sm leading-relaxed text-[#2f2619] placeholder:text-[#7d7362] focus:outline-none focus:ring-2 focus:ring-[#8c7851]/30"
              placeholder="ماذا رأيت في نفسك أو موقفك اليوم؟"
            />
            <p className="text-xs text-[#7d7362]">وصف الواقع كما هو، بلا تبرير ولا إنكار.</p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#2f2619]">{PRACTICES[1].label}</span>
            <textarea
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-3 text-sm leading-relaxed text-[#2f2619] placeholder:text-[#7d7362] focus:outline-none focus:ring-2 focus:ring-[#8c7851]/30"
              placeholder="ما المعنى الذي اتضح لك؟"
            />
            <p className="text-xs text-[#7d7362]">ما الفكرة أو الرسالة التي انكشفت لك من الموقف؟</p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#2f2619]">{PRACTICES[2].label}</span>
            <textarea
              value={contemplate}
              onChange={(e) => setContemplate(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-3 text-sm leading-relaxed text-[#2f2619] placeholder:text-[#7d7362] focus:outline-none focus:ring-2 focus:ring-[#8c7851]/30"
              placeholder="ما الخطوة العملية التي ستأخذها اليوم؟"
            />
            <p className="text-xs text-[#7d7362]">اختر فعلًا صغيرًا واضحًا قابلًا للتنفيذ اليوم.</p>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#7d7362]">{status ?? " "}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runMeaningEngine}
              className="tm-ghost-btn"
            >
              تشغيل Meaning Engine
            </button>
            <button
              type="submit"
              disabled={saving}
              className="tm-gold-btn"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ التمعّن"}
            </button>
          </div>
        </div>
      </form>

      {/* Linked insight from Cognitive OS */}
      {linkedInsight ? (
        <section className="rounded-3xl border border-[#c4a265]/30 bg-gradient-to-b from-[#f4ead7]/40 to-transparent p-6 space-y-3">
          <h2 className="tm-heading text-xl text-[#5a4531]">ربط التمعّنات</h2>
          <div className="rounded-xl border border-[#c9bda8] bg-[#fcfaf7] px-4 py-3">
            <p className="text-xs text-[#7d7362]">البصيرة</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2f2619]">{linkedInsight.insight}</p>
          </div>
          {linkedInsight.patterns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkedInsight.patterns.map((p, i) => (
                <span key={i} className="rounded-full border border-[#c4a265]/30 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#7b694a]">
                  {p}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-[#8c7851]">
            القوس العاطفي: {linkedInsight.emotional_arc === "deepening" ? "يتعمّق" : linkedInsight.emotional_arc === "shifting" ? "يتحوّل" : linkedInsight.emotional_arc === "repeating" ? "يتكرر" : "يبدأ بالظهور"}
          </p>
        </section>
      ) : null}

      {/* Suggested action from Cognitive OS */}
      {suggestedAction ? (
        <section className="rounded-3xl border border-[#8c7851]/25 bg-[#f9f3e7] p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-[#5a4531]">{suggestedAction.label}</p>
          <p className="text-xs text-[#7d7362]">{suggestedAction.description}</p>
        </section>
      ) : null}

      {engineOutput ? (
        <section className="rounded-3xl border border-[#b39b71]/35 bg-gradient-to-b from-[#cdb98f]/20 to-transparent p-6">
          <h2 className="tm-heading text-xl text-[#7b694a]">Meaning Engine</h2>
          <div className="mt-4 rounded-xl border border-[#c9bda8] bg-[#fcfaf7] px-4 py-3">
            <p className="text-xs text-[#7d7362]">البصيرة</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2f2619]">{engineOutput.insight}</p>
          </div>
          <div className="mt-3 rounded-xl border border-[#c9bda8] bg-[#fcfaf7] px-4 py-3">
            <p className="text-xs text-[#7d7362]">السؤال المقترح</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2f2619]">{engineOutput.suggested_question}</p>
          </div>
          <div className="mt-3 rounded-xl border border-[#c9bda8] bg-[#fcfaf7] px-4 py-3">
            <p className="text-xs text-[#7d7362]">ممارسة التمعّن المقترحة</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2f2619]">
              {engineOutput.suggested_contemplation_practice}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
