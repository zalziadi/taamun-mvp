"use client";

import type { VoiceSessionState } from "./useVoiceSession";

type Props = {
  state: VoiceSessionState;
};

const VARIANTS: Record<VoiceSessionState, string> = {
  idle: "bg-slate-700/40 animate-[pulse_4s_ease-in-out_infinite]",
  listening: "bg-amber-500/50 animate-[pulse_0.9s_ease-in-out_infinite] ring-4 ring-amber-300/40",
  thinking: "bg-sky-500/40 animate-[pulse_1.4s_ease-in-out_infinite] ring-4 ring-sky-300/30",
};

const LABELS: Record<VoiceSessionState, string> = {
  idle: "اضغط مطوّلاً للحديث",
  listening: "أتحدّث أستمع…",
  thinking: "أتأمّل ردّك…",
};

export function VoiceOrb({ state }: Props) {
  return (
    <div className="flex flex-col items-center gap-6" aria-live="polite">
      <div
        className={`h-48 w-48 rounded-full transition-colors duration-500 ${VARIANTS[state]}`}
        role="img"
        aria-label={LABELS[state]}
      />
      <p className="text-lg text-slate-200">{LABELS[state]}</p>
    </div>
  );
}
