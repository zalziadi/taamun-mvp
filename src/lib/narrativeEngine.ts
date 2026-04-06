import type { Pattern, EmotionalArc } from "./reflectionLinker";

export type NarrativeArc = "hero" | "seeker" | "resistant" | "transforming";

export interface Narrative {
  title: string;
  story: string;
  arc: NarrativeArc;
}

function classifyNarrativeArc(
  emotionalArc: EmotionalArc,
  completionRate: number,
  drift: number
): NarrativeArc {
  if (drift > 5 && completionRate < 0.3) return "resistant";
  if (emotionalArc === "deepening" && completionRate >= 0.7) return "hero";
  if (emotionalArc === "shifting") return "transforming";
  return "seeker";
}

const ARC_TITLES: Record<NarrativeArc, string> = {
  hero: "رحلة البطل",
  seeker: "رحلة الباحث",
  resistant: "رحلة المقاوم",
  transforming: "رحلة التحوّل",
};

function buildStory(
  arc: NarrativeArc,
  patterns: Pattern[],
  currentDay: number,
  completedCount: number,
  drift: number
): string {
  const topPatterns = patterns.slice(0, 3);
  const patternNames = topPatterns.map((p) => `"${p.keyword}"`).join(" و");

  if (arc === "hero") {
    if (topPatterns.length > 0) {
      return `أنت في يومك ${currentDay}، وقد أكملت ${completedCount} يوماً. رحلتك تتعمّق حول ${patternNames}. كل يوم يكشف طبقة جديدة من المعنى — أنت لا تتعلم فقط، أنت تتحوّل.`;
    }
    return `${completedCount} يوماً من الالتزام المتواصل. أنت لا تمشي في الرحلة — أنت تصنعها.`;
  }

  if (arc === "seeker") {
    if (topPatterns.length > 0) {
      return `أنت الآن في يوم ${currentDay}. بدأت تلاحظ أنماطاً: ${patternNames}. الباحث لا يجد الإجابة دفعة واحدة — يجدها في كل سؤال يسأله.`;
    }
    return `أنت في يوم ${currentDay} من رحلة الـ 28. كل يوم تفتحه هو سؤال جديد — والسؤال نفسه هو البداية.`;
  }

  if (arc === "resistant") {
    return `مرّت ${drift} أيام. شيء ما أوقفك — وهذا طبيعي. المقاومة ليست فشلاً، هي إشارة أن شيئاً عميقاً يحاول الظهور. السؤال: ما الذي تقاومه فعلاً؟`;
  }

  // transforming
  if (topPatterns.length > 0) {
    return `رحلتك تتحوّل. ما بدأ كـ ${patternNames} يأخذ شكلاً جديداً. أنت لست نفس الشخص الذي بدأ يوم 1 — وهذا بالضبط المعنى.`;
  }
  return `شيء يتغيّر فيك. قد لا تراه بوضوح بعد، لكن كل تأمل يقرّبك من الصورة الكاملة.`;
}

export function generateNarrative(
  patterns: Pattern[],
  emotionalArc: EmotionalArc,
  currentDay: number,
  completedCount: number,
  drift: number
): Narrative {
  const arc = classifyNarrativeArc(emotionalArc, completedCount / Math.max(1, currentDay), drift);
  const title = ARC_TITLES[arc];
  const story = buildStory(arc, patterns, currentDay, completedCount, drift);

  return { title, story, arc };
}

// Export for testing
export { classifyNarrativeArc, buildStory };
