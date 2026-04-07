/**
 * Adaptive Reflection Generator
 *
 * Generates a tailored reflection message based on user pattern.
 * Pure function — same input → same output.
 */

import type { UserPattern, PatternType } from "../patterns/userPattern";

export interface AdaptiveReflection {
  message: string;
  tone: "firm" | "warm" | "challenging" | "neutral";
  emphasis: "high" | "medium" | "low";
}

const REFLECTIONS: Record<PatternType, AdaptiveReflection[]> = {
  avoidant: [
    {
      message: "أنت تعرف الجواب — تحتاج خطوة واحدة للأمام فقط",
      tone: "firm",
      emphasis: "high",
    },
    {
      message: "التأجيل ليس راحة — هو تعب من نوع آخر. خطوة واحدة الآن",
      tone: "firm",
      emphasis: "high",
    },
    {
      message: "الوضوح ما يجي من التفكير. يجي من الفعل. ابدأ بأصغر خطوة",
      tone: "firm",
      emphasis: "high",
    },
  ],
  decisive: [
    {
      message: "وعيك قوي — حوّله إلى عمق، ليس فقط إلى فعل",
      tone: "challenging",
      emphasis: "medium",
    },
    {
      message: "أنت سريع. لكن السرعة بدون عمق تكرار",
      tone: "challenging",
      emphasis: "medium",
    },
    {
      message: "نفّذت كثير. الآن توقّف لحظة — وش اللي يتغيّر فيك؟",
      tone: "challenging",
      emphasis: "medium",
    },
  ],
  explorer: [
    {
      message: "حضورك عميق — الآن وجّهه نحو فعل واضح",
      tone: "warm",
      emphasis: "medium",
    },
    {
      message: "تأملاتك تبني صورة. خذ منها قراراً واحداً",
      tone: "warm",
      emphasis: "medium",
    },
    {
      message: "التأمل بدون فعل يصبح هروباً ذكياً. اربطه بخطوة",
      tone: "warm",
      emphasis: "medium",
    },
  ],
  balanced: [
    {
      message: "أنت في توازن — استمر بنفس الإيقاع",
      tone: "neutral",
      emphasis: "low",
    },
    {
      message: "يومك يحمل خطوة جديدة — ابدأها بصدق",
      tone: "neutral",
      emphasis: "low",
    },
    {
      message: "كل تأمل يضيف طبقة. كل قرار يبني هوية",
      tone: "neutral",
      emphasis: "low",
    },
  ],
};

/**
 * Generates an adaptive reflection message based on user pattern.
 * Uses confidence × index seed for deterministic but varied output.
 */
export function generateReflection(pattern: UserPattern): string {
  const options = REFLECTIONS[pattern.type] ?? REFLECTIONS.balanced;
  // Seed by interaction count to rotate but stay deterministic
  const seed = Math.floor(pattern.confidence * 100) % options.length;
  return options[seed].message;
}

/**
 * Returns full reflection object (message + tone + emphasis).
 */
export function generateReflectionDetailed(pattern: UserPattern): AdaptiveReflection {
  const options = REFLECTIONS[pattern.type] ?? REFLECTIONS.balanced;
  const seed = Math.floor(pattern.confidence * 100) % options.length;
  return options[seed];
}

// Export for testing
export { REFLECTIONS };
