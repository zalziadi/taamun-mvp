/**
 * Decision Justification Engine
 *
 * Makes decisions explainable and persuasive.
 * Returns insight + evidence + emotional_hook in Arabic.
 */

export interface JustificationInput {
  patterns: string[];
  recentEntries: { text?: string; tags?: string[] }[];
  commitmentScore: number;
}

export interface Justification {
  insight: string;
  evidence: string;
  emotional_hook: string;
}

const HESITATION_KEYWORDS = ["تردد", "حيرة", "تأجيل", "مقاومة", "توقف", "تأخير"];

function countKeywordOccurrences(
  entries: { text?: string; tags?: string[] }[],
  keywords: string[]
): { keyword: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const text = (entry.text ?? "").toLowerCase();
    const tags = (entry.tags ?? []).map((t) => t.toLowerCase());

    for (const kw of keywords) {
      if (text.includes(kw) || tags.some((t) => t.includes(kw))) {
        counts.set(kw, (counts.get(kw) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

function detectDominantHesitation(input: JustificationInput): { keyword: string; count: number } | null {
  // First check patterns directly
  const patternHits = HESITATION_KEYWORDS.filter((kw) =>
    input.patterns.some((p) => p.includes(kw))
  );

  // Then check entries
  const entryCounts = countKeywordOccurrences(input.recentEntries, HESITATION_KEYWORDS);

  if (entryCounts.length > 0) return entryCounts[0];
  if (patternHits.length > 0) return { keyword: patternHits[0], count: 1 };
  return null;
}

const INSIGHT_TEMPLATES: Record<string, string> = {
  تردد: "يبدو أنك تعرف القرار لكن تؤجله",
  حيرة: "الحيرة ليست ضعفاً — هي إشارة لقرار مهم لم يُتخذ بعد",
  تأجيل: "التأجيل يكلّف أكثر من القرار نفسه",
  مقاومة: "ما تقاومه يكشف ما يحتاج اهتمامك",
  توقف: "التوقف ليس فشلاً — هو لحظة قبل قرار جديد",
  تأخير: "كل يوم تأخير يبني عادة التأجيل",
};

const EMOTIONAL_HOOKS: Record<string, string> = {
  تردد: "الوضوح الآن يوفر عليك أيام من الدوران",
  حيرة: "قرار واحد اليوم أفضل من 10 خيارات غداً",
  تأجيل: "أصغر خطوة الآن أقوى من أكبر خطة بعد أسبوع",
  مقاومة: "ما تقاومه هو بالضبط ما يحررك",
  توقف: "العودة بقرار واحد أهم من المسير بدون اتجاه",
  تأخير: "اللحظة هي كل ما تملك — استخدمها",
};

function buildInsight(dominant: { keyword: string; count: number } | null, commitmentScore: number): string {
  if (dominant) {
    return INSIGHT_TEMPLATES[dominant.keyword] ?? "هناك نمط يستحق الوقوف عنده";
  }
  if (commitmentScore < 30) {
    return "الالتزام في انخفاض — قرار صغير يعيد الزخم";
  }
  return "الوضوح يأتي من القرار، ليس من التفكير";
}

function buildEvidence(
  dominant: { keyword: string; count: number } | null,
  totalEntries: number,
  commitmentScore: number
): string {
  if (dominant && totalEntries > 0) {
    return `ذكرت "${dominant.keyword}" في ${dominant.count} من آخر ${totalEntries} تأملات`;
  }
  if (commitmentScore < 30) {
    return `الالتزام عند ${commitmentScore}/100 — أقل من المعتاد`;
  }
  return "النمط لم يتضح بعد، لكن الإشارات تستحق الانتباه";
}

function buildHook(dominant: { keyword: string; count: number } | null, commitmentScore: number): string {
  if (dominant) {
    return EMOTIONAL_HOOKS[dominant.keyword] ?? "اللحظة الحاسمة هي الآن";
  }
  if (commitmentScore < 30) {
    return "خطوة واحدة اليوم تكسر ١٠ أيام من الجمود";
  }
  return "كل قرار صغير يبني الشخص اللي تريد تكونه";
}

export function buildJustification(input: JustificationInput): Justification {
  const dominant = detectDominantHesitation(input);
  const totalEntries = input.recentEntries.length;

  return {
    insight: buildInsight(dominant, input.commitmentScore),
    evidence: buildEvidence(dominant, totalEntries, input.commitmentScore),
    emotional_hook: buildHook(dominant, input.commitmentScore),
  };
}

// Export internals for testing
export { HESITATION_KEYWORDS, detectDominantHesitation, countKeywordOccurrences };
