import { APP_NAME } from "@/lib/appConfig";

export type EvolutionScores = {
  clarity: number;
  responsibility: number;
  trust: number;
  surrender: number;
};

export type JournalAnswer = {
  day: number;
  observe: string;
  insight: string;
  contemplate: string;
  rebuild: string | null;
  ai_reflection: string | null;
};

export type WeekInsight = {
  week: 1 | 2 | 3 | 4;
  fromDay: number;
  toDay: number;
  completedDays: number;
  insight: string;
  scores: EvolutionScores;
};

const clamp100 = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function textWeight(value: string) {
  if (!value.trim()) return 0;
  return Math.min(1, value.trim().length / 160);
}

function toScores(answers: JournalAnswer[]): EvolutionScores {
  if (answers.length === 0) {
    return { clarity: 0, responsibility: 0, trust: 0, surrender: 0 };
  }

  let clarity = 0;
  let responsibility = 0;
  let trust = 0;
  let surrender = 0;

  for (const answer of answers) {
    const obs = textWeight(answer.observe);
    const ins = textWeight(answer.insight);
    const con = textWeight(answer.contemplate);
    const reb = textWeight(answer.rebuild ?? "");

    clarity += obs * 0.35 + ins * 0.65;
    responsibility += reb * 0.7 + con * 0.3;
    trust += ins * 0.45 + con * 0.55;
    surrender += con * 0.8 + obs * 0.2;
  }

  const n = answers.length;
  return {
    clarity: clamp100((clarity / n) * 100),
    responsibility: clamp100((responsibility / n) * 100),
    trust: clamp100((trust / n) * 100),
    surrender: clamp100((surrender / n) * 100),
  };
}

function composeInsight(label: string, scores: EvolutionScores, completedDays: number) {
  const strongest = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "clarity") as keyof EvolutionScores;
  const weakest = (Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0] ??
    "surrender") as keyof EvolutionScores;

  const nameMap: Record<keyof EvolutionScores, string> = {
    clarity: "الوضوح",
    responsibility: "المسؤولية",
    trust: "الثقة",
    surrender: "التسليم",
  };

  return `${label}: أنجزت ${completedDays} يوم. أقوى بعد حاليًا هو ${nameMap[strongest]}، وأضعف بعد يحتاج رعاية هو ${nameMap[weakest]}. حافظ على الكتابة اليومية القصيرة لتثبيت التطور.`;
}

export function buildAwareness(answers: JournalAnswer[]) {
  const weeks: WeekInsight[] = [];

  for (let i = 0; i < 4; i++) {
    const fromDay = i * 7 + 1;
    const toDay = fromDay + 6;
    const weekAnswers = answers.filter((a) => a.day >= fromDay && a.day <= toDay);
    const scores = toScores(weekAnswers);
    weeks.push({
      week: (i + 1) as 1 | 2 | 3 | 4,
      fromDay,
      toDay,
      completedDays: weekAnswers.length,
      scores,
      insight: composeInsight(`أسبوع ${i + 1}`, scores, weekAnswers.length),
    });
  }

  const finalScores = toScores(answers);
  const finalInsight = composeInsight("الخلاصة النهائية", finalScores, answers.length);

  return {
    weeks,
    finalInsight,
    evolution: weeks.map((w) => ({
      week: w.week,
      ...w.scores,
    })),
    finalScores,
  };
}

export function buildDailyReflection(input: {
  observe: string;
  insight: string;
  contemplate: string;
  rebuild?: string | null;
}) {
  const observe = input.observe.trim();
  const insight = input.insight.trim();
  const contemplate = input.contemplate.trim();
  const rebuild = (input.rebuild ?? "").trim();

  const lines = [
    observe ? `ما لاحظته اليوم: ${observe.slice(0, 180)}.` : "بدأت الملاحظة بخطوة صادقة.",
    insight ? `أهم إدراك: ${insight.slice(0, 180)}.` : "الإدراك يحتاج جملة واضحة مختصرة.",
    contemplate
      ? `مسار ${APP_NAME}: ${contemplate.slice(0, 180)}.`
      : "حوّل الإدراك إلى فعل يومي صغير.",
  ];
  if (rebuild) {
    lines.push(`إعادة البناء المقترحة: ${rebuild.slice(0, 180)}.`);
  }

  return lines.join(" ");
}
