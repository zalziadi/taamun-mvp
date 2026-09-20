"use client";

import type { Decision } from "@/lib/decisionEngine";

interface Props {
  decision: Decision;
  onReset?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  clarify: "١. التوضيح",
  prioritize: "٢. الأولوية",
  eliminate: "٣. الإقصاء",
  select: "٤. الاختيار",
  execute: "٥. التنفيذ",
};

export default function DecisionOutput({ decision, onReset }: Props) {
  return (
    <div className="space-y-5">
      {/* The Decision — large card */}
      <section className="dbs-card dbs-card-accent p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs text-[color:var(--dbs-muted)]">
          <span>🎯</span>
          <span>القرار</span>
        </div>
        <h2 className="dbs-heading mt-2 text-3xl leading-snug sm:text-4xl">
          {decision.decision}
        </h2>
        <div className="mt-4 dbs-badge">
          مستوى الثقة: {Math.round(decision.confidence * 100)}%
        </div>
      </section>

      {/* Reasoning */}
      <section className="dbs-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-[color:var(--dbs-muted)]">
          <span>🧠</span>
          <span>لماذا هذا القرار</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--dbs-ink)]">{decision.reasoning}</p>
      </section>

      {/* Action Step */}
      <section className="dbs-card p-5 sm:p-6 border-r-4 border-r-[color:var(--dbs-yellow)]">
        <div className="flex items-center gap-2 text-xs text-[color:var(--dbs-muted)]">
          <span>⚡</span>
          <span>الخطوة التنفيذية — اليوم</span>
        </div>
        <p className="mt-3 text-base font-semibold leading-relaxed text-[color:var(--dbs-ink)]">
          {decision.actionStep}
        </p>
      </section>

      {/* Anti-Focus */}
      <section className="dbs-card p-5 sm:p-6 border-r-4 border-r-[color:var(--dbs-red)]">
        <div className="flex items-center gap-2 text-xs text-[color:var(--dbs-red)]">
          <span>⛔</span>
          <span>ما يجب تجاهله</span>
        </div>
        <ul className="mt-3 space-y-2">
          {decision.ignore.map((item, i) => (
            <li key={i} className="text-sm text-[color:var(--dbs-ink-soft)] flex items-start gap-2">
              <span className="text-[color:var(--dbs-red)] mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pipeline trace (collapsible by default — show inline for now) */}
      <details className="dbs-card p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--dbs-ink)]">
          مسار التفكير (5 مراحل)
        </summary>
        <div className="mt-4 space-y-3">
          {decision.pipeline.map((stage, i) => (
            <div key={i} className="rounded-xl border border-[color:var(--dbs-line)] bg-[color:var(--dbs-bg)] p-3">
              <p className="text-xs font-semibold text-[color:var(--dbs-muted)]">{STAGE_LABELS[stage.stage] ?? stage.stage}</p>
              <p className="mt-1 text-sm text-[color:var(--dbs-ink)]">{stage.output}</p>
            </div>
          ))}
        </div>
      </details>

      {onReset && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onReset}
            className="dbs-link"
          >
            ← قرار جديد
          </button>
        </div>
      )}
    </div>
  );
}
