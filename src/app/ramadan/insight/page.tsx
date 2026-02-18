"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { APP_NAME } from "@/lib/appConfig";
import { EntitlementGate } from "@/components/EntitlementGate";

type BaseInsight = {
  dominantPattern: string;
  shadow: string;
  gift: string;
  bestPotential: string;
  advice: string;
  clarityScore: number;
  responsibilityScore: number;
  trustScore: number;
  surrenderScore: number;
  confidence: number;
};

type EvolutionPoint = {
  week: number;
  clarityScore: number;
  responsibilityScore: number;
  trustScore: number;
  surrenderScore: number;
};

type FinalInsight = BaseInsight & {
  evolution: EvolutionPoint[];
  transformationSummary: string;
};

type InsightResult = {
  insight: BaseInsight | FinalInsight | null;
  cached: boolean;
  loading: boolean;
  error: string | null;
};

function scoreRows(insight: BaseInsight) {
  return [
    { label: "الوضوح", value: insight.clarityScore },
    { label: "المسؤولية", value: insight.responsibilityScore },
    { label: "الثقة", value: insight.trustScore },
    { label: "التسليم", value: insight.surrenderScore },
  ];
}

export default function RamadanInsightPage() {
  const [weeks, setWeeks] = useState<Record<number, InsightResult>>({
    1: { insight: null, cached: false, loading: true, error: null },
    2: { insight: null, cached: false, loading: true, error: null },
    3: { insight: null, cached: false, loading: true, error: null },
    4: { insight: null, cached: false, loading: true, error: null },
  });
  const [finalState, setFinalState] = useState<InsightResult>({
    insight: null,
    cached: false,
    loading: true,
    error: null,
  });

  async function loadWeek(week: number, generate = false) {
    setWeeks((prev) => ({
      ...prev,
      [week]: { ...prev[week], loading: true, error: null },
    }));
    try {
      const query = generate ? "" : "?cacheOnly=true";
      const res = await fetch(`/api/ramadan/insight${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "weekly", week }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setWeeks((prev) => ({
          ...prev,
          [week]: { ...prev[week], loading: false, error: "سجّل دخولك للمتابعة" },
        }));
        return;
      }
      if (!res.ok || !data.ok) {
        setWeeks((prev) => ({
          ...prev,
          [week]: {
            ...prev[week],
            loading: false,
            insight: null,
            cached: false,
            error: generate ? "تعذر إنشاء Insight لهذا الأسبوع." : null,
          },
        }));
        return;
      }

      setWeeks((prev) => ({
        ...prev,
        [week]: {
          insight: data.insight,
          cached: Boolean(data.cached),
          loading: false,
          error: null,
        },
      }));
    } catch {
      setWeeks((prev) => ({
        ...prev,
        [week]: { ...prev[week], loading: false, error: "تعذر الاتصال — حاول مرة أخرى" },
      }));
    }
  }

  async function loadFinal(generate = false) {
    setFinalState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const query = generate ? "" : "?cacheOnly=true";
      const res = await fetch(`/api/ramadan/insight${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "final" }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setFinalState((prev) => ({ ...prev, loading: false, error: "سجّل دخولك للمتابعة" }));
        return;
      }
      if (!res.ok || !data.ok) {
        setFinalState((prev) => ({
          ...prev,
          loading: false,
          insight: null,
          cached: false,
          error: generate ? "تعذر إنشاء Insight النهائي." : null,
        }));
        return;
      }

      setFinalState({
        insight: data.insight,
        cached: Boolean(data.cached),
        loading: false,
        error: null,
      });
    } catch {
      setFinalState((prev) => ({
        ...prev,
        loading: false,
        error: "تعذر الاتصال — حاول مرة أخرى",
      }));
    }
  }

  useEffect(() => {
    [1, 2, 3, 4].forEach((week) => {
      void loadWeek(week, false);
    });
    void loadFinal(false);
  }, []);

  const evolution = useMemo(() => {
    if (!finalState.insight) return [];
    const maybeFinal = finalState.insight as Partial<FinalInsight>;
    if (Array.isArray(maybeFinal.evolution) && maybeFinal.evolution.length > 0) {
      return maybeFinal.evolution;
    }

    return [1, 2, 3, 4]
      .map((week) => {
        const item = weeks[week]?.insight as BaseInsight | null;
        if (!item) return null;
        return {
          week,
          clarityScore: item.clarityScore,
          responsibilityScore: item.responsibilityScore,
          trustScore: item.trustScore,
          surrenderScore: item.surrenderScore,
        };
      })
      .filter(Boolean) as EvolutionPoint[];
  }, [finalState.insight, weeks]);

  return (
    <EntitlementGate>
      <div className="mx-auto max-w-[1100px] space-y-6">
      <Card className="space-y-2 p-6">
        <h1 className="h1">{`رؤى ${APP_NAME}`}</h1>
        <p className="p-muted">
          تتبّع رؤيتك الأسبوعية والخلاصة النهائية مع تطور الأبعاد الأربعة.
        </p>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((week) => (
          <WeekCard
            key={week}
            week={week}
            state={weeks[week]}
            onGenerate={() => loadWeek(week, true)}
          />
        ))}
      </section>

      <FinalCard state={finalState} onGenerate={() => loadFinal(true)} />

      <Card className="space-y-4 p-6">
        <h2 className="h2">منحنى التطور</h2>
        {evolution.length > 0 ? (
          <EvolutionChart data={evolution} />
        ) : (
          <p className="p-muted">سيظهر الرسم بعد توفر رؤى أسبوعية أو insight نهائي.</p>
        )}
      </Card>
      </div>
    </EntitlementGate>
  );
}

function WeekCard({
  week,
  state,
  onGenerate,
}: {
  week: number;
  state: InsightResult;
  onGenerate: () => void;
}) {
  const insight = state.insight as BaseInsight | null;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">الأسبوع {week}</h3>
        <Button variant="secondary" onClick={onGenerate} disabled={state.loading}>
          {state.loading ? "جارٍ..." : insight ? "إعادة التوليد" : "Generate"}
        </Button>
      </div>

      {state.cached && insight && (
        <div className="text-xs text-success">تم تحميل نسخة محفوظة خلال آخر 24 ساعة</div>
      )}

      {state.error && <Alert variant="danger">{state.error}</Alert>}

      {!insight && !state.loading && !state.error ? (
        <Alert variant="muted">لا توجد رؤية لهذا الأسبوع بعد. اضغط Generate.</Alert>
      ) : null}

      {insight && (
        <div className="space-y-3">
          <InsightBlock title="النمط الغالب" text={insight.dominantPattern} />
          <InsightBlock title="الظل" text={insight.shadow} />
          <InsightBlock title="الهدية" text={insight.gift} />
          <InsightBlock title="أفضل احتمال" text={insight.bestPotential} />
          <InsightBlock title="النصيحة" text={insight.advice} />

          <div className="grid grid-cols-2 gap-2">
            {scoreRows(insight).map((score) => (
              <div key={score.label} className="rounded-xl border border-border bg-panel2 p-3">
                <div className="text-xs text-muted">{score.label}</div>
                <div className="mt-1 text-base font-semibold text-text">{score.value}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FinalCard({
  state,
  onGenerate,
}: {
  state: InsightResult;
  onGenerate: () => void;
}) {
  const insight = state.insight as FinalInsight | null;
  const summary = insight?.transformationSummary ?? "";

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="h2">الخلاصة النهائية</h2>
        <Button onClick={onGenerate} disabled={state.loading}>
          {state.loading ? "جارٍ..." : insight ? "إعادة التوليد" : "Generate"}
        </Button>
      </div>

      {state.cached && insight && (
        <div className="text-xs text-success">تم تحميل نسخة محفوظة خلال آخر 24 ساعة</div>
      )}

      {state.error && <Alert variant="danger">{state.error}</Alert>}

      {!insight && !state.loading && !state.error ? (
        <Alert variant="muted">لا توجد خلاصة نهائية بعد. اضغط Generate.</Alert>
      ) : null}

      {insight && (
        <div className="space-y-3">
          <InsightBlock title="النمط الغالب" text={insight.dominantPattern} />
          <InsightBlock title="الظل" text={insight.shadow} />
          <InsightBlock title="الهدية" text={insight.gift} />
          <InsightBlock title="أفضل احتمال" text={insight.bestPotential} />
          <InsightBlock title="النصيحة" text={insight.advice} />
          {summary ? <InsightBlock title="ملخص التحول" text={summary} /> : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {scoreRows(insight).map((score) => (
              <div key={score.label} className="rounded-xl border border-border bg-panel2 p-3">
                <div className="text-xs text-muted">{score.label}</div>
                <div className="mt-1 text-base font-semibold text-text">{score.value}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function InsightBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel2 p-3">
      <div className="text-xs text-muted">{title}</div>
      <p className="mt-1 text-sm leading-6 text-text">{text || "-"}</p>
    </div>
  );
}

function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const width = 860;
  const height = 260;
  const padding = 34;

  const x = (week: number) =>
    padding + ((week - 1) / Math.max(1, data.length - 1)) * (width - padding * 2);
  const y = (score: number) => height - padding - (score / 100) * (height - padding * 2);

  const lines = [
    { key: "clarityScore", label: "الوضوح", color: "#6D8BFF" },
    { key: "responsibilityScore", label: "المسؤولية", color: "#EAB308" },
    { key: "trustScore", label: "الثقة", color: "#10B981" },
    { key: "surrenderScore", label: "التسليم", color: "#A78BFA" },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-panel2 p-3">
        <svg width={width} height={height} role="img" aria-label="رسم تطور الأبعاد الأربعة">
          <rect x={0} y={0} width={width} height={height} fill="transparent" />
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding}
                y1={y(tick)}
                x2={width - padding}
                y2={y(tick)}
                stroke="#2a3548"
                strokeWidth={1}
              />
              <text x={8} y={y(tick) + 4} fontSize={11} fill="#8fa1c2">
                {tick}
              </text>
            </g>
          ))}

          {data.map((d) => (
            <text key={`w-${d.week}`} x={x(d.week) - 10} y={height - 10} fontSize={11} fill="#8fa1c2">
              أ{d.week}
            </text>
          ))}

          {lines.map((line) => {
            const points = data.map((d) => `${x(d.week)},${y(d[line.key])}`).join(" ");
            return (
              <g key={line.key}>
                <polyline fill="none" stroke={line.color} strokeWidth={3} points={points} />
                {data.map((d) => (
                  <circle key={`${line.key}-${d.week}`} cx={x(d.week)} cy={y(d[line.key])} r={4} fill={line.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {lines.map((line) => (
          <div key={line.key} className="inline-flex items-center gap-2 text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}
