import type { Phase } from "../lib/types";

interface ChoiceChipsProps {
  value: Phase | null;
  onChange: (phase: Phase) => void;
  labels: Record<Phase, string>;
}

const PHASES: Phase[] = ["shadow", "awareness", "contemplation"];

export function ChoiceChips({ value, onChange, labels }: ChoiceChipsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {PHASES.map((phase) => (
        <button
          key={phase}
          type="button"
          onClick={() => onChange(phase)}
          className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
            value === phase
              ? "bg-white text-[#0B0F14]"
              : "border border-white/30 bg-transparent text-white hover:border-white/50"
          }`}
        >
          {labels[phase]}
        </button>
      ))}
    </div>
  );
}
