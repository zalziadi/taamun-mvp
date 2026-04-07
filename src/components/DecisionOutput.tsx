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
      <section className="tm-card border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs text-[#8c7851]">
          <span>🎯</span>
          <span>القرار</span>
        </div>
        <h2 className="tm-heading mt-2 text-3xl leading-snug text-[#2f2619] sm:text-4xl">
          {decision.decision}
        </h2>
        <div className="mt-4 inline-flex items-center rounded-full border border-[#c4a265]/40 bg-white/60 px-3 py-1 text-xs text-[#7b694a]">
          مستوى الثقة: {Math.round(decision.confidence * 100)}%
        </div>
      </section>

      {/* Reasoning */}
      <section className="tm-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-[#8c7851]">
          <span>🧠</span>
          <span>لماذا هذا القرار</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#2f2619]">{decision.reasoning}</p>
      </section>

      {/* Action Step */}
      <section className="tm-card border-[#8c7851]/40 bg-[#f9f3e7] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-[#8c7851]">
          <span>⚡</span>
          <span>الخطوة التنفيذية — اليوم</span>
        </div>
        <p className="mt-3 text-base font-semibold leading-relaxed text-[#5a4531]">
          {decision.actionStep}
        </p>
      </section>

      {/* Anti-Focus */}
      <section className="tm-card border-[#9b5548]/20 bg-[#fdf6f4] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs text-[#9b5548]">
          <span>⛔</span>
          <span>ما يجب تجاهله</span>
        </div>
        <ul className="mt-3 space-y-2">
          {decision.ignore.map((item, i) => (
            <li key={i} className="text-sm text-[#7d5048] flex items-start gap-2">
              <span className="text-[#9b5548] mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pipeline trace (collapsible by default — show inline for now) */}
      <details className="tm-card p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold text-[#2f2619]">
          مسار التفكير (5 مراحل)
        </summary>
        <div className="mt-4 space-y-3">
          {decision.pipeline.map((stage, i) => (
            <div key={i} className="rounded-xl border border-[#e1d7c7] bg-[#fcfaf7] p-3">
              <p className="text-xs font-semibold text-[#8c7851]">{STAGE_LABELS[stage.stage] ?? stage.stage}</p>
              <p className="mt-1 text-sm text-[#2f2619]">{stage.output}</p>
            </div>
          ))}
        </div>
      </details>

      {onReset && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-[#7d7362] hover:text-[#2f2619]"
          >
            ← قرار جديد
          </button>
        </div>
      )}
    </div>
  );
}
