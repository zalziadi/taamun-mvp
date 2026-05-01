export type Phase = "awareness" | "release" | "rebuild" | "expansion";

export interface DayContent {
  id: number;
  phase: Phase;
  phaseLabel: string;
  phaseRange: string;
  title: string;
  intro: string;
  awareness: string;
  exercise: string;
  question: string;
  affirmation: string;
}

export interface DayState {
  answer: string;
  reflection: string;
  completed: boolean;
  updatedAt: string;
}

export interface Progress {
  version: 1;
  startedAt: string | null;
  days: Record<number, DayState>;
}

export const PHASE_META: Record<Phase, { label: string; range: string; tone: string }> = {
  awareness: { label: "الوعي", range: "اليوم 1 — 3", tone: "from-wafrah-100 to-sand-100" },
  release: { label: "الفكّ", range: "اليوم 4 — 7", tone: "from-sand-100 to-wafrah-50" },
  rebuild: { label: "إعادة البناء", range: "اليوم 8 — 11", tone: "from-wafrah-50 to-wafrah-100" },
  expansion: { label: "التوسّع", range: "اليوم 12 — 14", tone: "from-wafrah-100 to-wafrah-200" },
};
