import type { UserIdentity } from "./identityTracker";
import type { ProgressState } from "./progressEngine";
import type { Pattern } from "./reflectionLinker";

// ── Types ──

export type PersonalityStyle = "supportive" | "challenger" | "analytical" | "spiritual";
export type CommunicationType = "direct" | "gentle" | "provocative" | "reflective";
export type MotivationType = "fear-driven" | "growth-driven" | "purpose-driven";

export interface PersonalityProfile {
  style: PersonalityStyle;
  communication: CommunicationType;
  motivationType: MotivationType;
  sensitivityLevel: "low" | "medium" | "high";
  adaptationScore: number; // 0 → 1 (how confident is the profile)
}

export interface MicroReward {
  type: "streak" | "breakthrough" | "consistency" | "return" | "depth";
  message: string;
  intensity: "low" | "medium" | "high";
}

export interface PersonalityInputs {
  identity: UserIdentity | null;
  progress: ProgressState;
  patterns: Pattern[];
  recentFeedbackImpacts: ("low" | "medium" | "high")[];
}

// ── Style Classification ──

function deriveStyle(inputs: PersonalityInputs): PersonalityStyle {
  const { identity, progress, patterns } = inputs;

  // Deep reflections + cognitive patterns → spiritual
  const cognitivePatterns = patterns.filter((p) => p.type === "cognitive");
  if (identity?.reflectionDepth === "deep" && cognitivePatterns.length >= 2) return "spiritual";

  // Analytical: moderate depth + behavioral patterns
  const behavioralPatterns = patterns.filter((p) => p.type === "behavioral");
  if (identity?.reflectionDepth === "moderate" && behavioralPatterns.length >= 2) return "analytical";

  // High momentum + consistent → challenger
  if (progress.momentum >= 4 && identity?.completionPattern === "consistent") return "challenger";

  // Default for low engagement or new users
  return "supportive";
}

// ── Communication Classification ──

function deriveCommunication(inputs: PersonalityInputs): CommunicationType {
  const { identity, progress } = inputs;

  // Declining trajectory + avoidance patterns → provocative (gentle shock)
  if (identity?.trajectory === "declining" && progress.drift > 3) return "provocative";

  // High engagement + high momentum → direct
  if (identity?.engagementScore && identity.engagementScore >= 60 && progress.momentum >= 3) return "direct";

  // Deep reflections → reflective
  if (identity?.reflectionDepth === "deep") return "reflective";

  // Default
  return "gentle";
}

// ── Motivation Type ──

function deriveMotivation(inputs: PersonalityInputs): MotivationType {
  const { identity, patterns } = inputs;

  // Emotional patterns with خوف/قلق → fear-driven
  const fearPatterns = patterns.filter(
    (p) => p.type === "emotional" && (p.keyword === "خوف" || p.keyword === "قلق")
  );
  if (fearPatterns.length > 0 && fearPatterns[0].recurrence >= 2) return "fear-driven";

  // Cognitive patterns with معنى/وعي → purpose-driven
  const purposePatterns = patterns.filter(
    (p) => p.type === "cognitive" && (p.keyword === "معنى" || p.keyword === "وعي" || p.keyword === "إدراك")
  );
  if (purposePatterns.length > 0) return "purpose-driven";

  // Default
  return "growth-driven";
}

// ── Sensitivity Level ──

function deriveSensitivity(inputs: PersonalityInputs): PersonalityProfile["sensitivityLevel"] {
  const { identity, progress } = inputs;

  if (progress.emotionalDrift === "high" || identity?.awarenessProgression === "fluctuating") return "high";
  if (identity?.engagementScore && identity.engagementScore >= 60) return "low";
  return "medium";
}

// ── Adaptation Score ──

function computeAdaptation(inputs: PersonalityInputs): number {
  let score = 0.3; // base

  const { identity, patterns, recentFeedbackImpacts } = inputs;

  // More patterns = better understanding
  if (patterns.length >= 3) score += 0.1;
  if (patterns.length >= 6) score += 0.1;

  // More reflections = better data
  if (identity && identity.totalReflections >= 5) score += 0.1;
  if (identity && identity.totalReflections >= 10) score += 0.1;

  // Timeline data = temporal understanding
  if (identity && identity.identityTimeline.length >= 5) score += 0.1;

  // Feedback data = calibration
  if (recentFeedbackImpacts.length >= 3) score += 0.1;
  const highImpact = recentFeedbackImpacts.filter((i) => i === "high").length;
  if (highImpact >= 2) score += 0.05;

  return Math.max(0.1, Math.min(0.99, Math.round(score * 100) / 100));
}

// ── Main Function ──

export function buildPersonalityProfile(inputs: PersonalityInputs): PersonalityProfile {
  return {
    style: deriveStyle(inputs),
    communication: deriveCommunication(inputs),
    motivationType: deriveMotivation(inputs),
    sensitivityLevel: deriveSensitivity(inputs),
    adaptationScore: computeAdaptation(inputs),
  };
}

// ── Micro-Rewards ──

export function generateMicroReward(
  progress: ProgressState,
  identity: UserIdentity | null
): MicroReward | null {
  // Streak rewards
  if (progress.streak === 3) {
    return { type: "streak", message: "٣ أيام متتالية — بداية عادة حقيقية", intensity: "low" };
  }
  if (progress.streak === 7) {
    return { type: "streak", message: "أسبوع كامل بلا توقف — أنت تبني شيء حقيقي", intensity: "medium" };
  }
  if (progress.streak === 14) {
    return { type: "streak", message: "١٤ يوم — نصف الرحلة أكملتها بلا انقطاع. هذا ليس عادياً", intensity: "high" };
  }
  if (progress.streak === 21) {
    return { type: "consistency", message: "٢١ يوم — العادة صارت جزء منك", intensity: "high" };
  }

  // Breakthrough: deep reflections + high engagement
  if (identity?.transformationSignal === "deepening" && identity.reflectionDepth === "deep") {
    return { type: "breakthrough", message: "شيء يتغيّر فيك — التمعّنات تتعمّق بشكل واضح", intensity: "medium" };
  }
  if (identity?.transformationSignal === "integrated") {
    return { type: "breakthrough", message: "وصلت مرحلة التكامل — المعنى صار جزء من يومك", intensity: "high" };
  }

  // Return after gap
  if (progress.mode === "recovery_boost") {
    return { type: "return", message: "رجعت — وهذا أهم من أنك توقفت", intensity: "medium" };
  }

  // Depth milestone
  if (identity && identity.totalReflections === 7) {
    return { type: "depth", message: "٧ تأملات — بدأت تتكوّن صورة عنك", intensity: "low" };
  }
  if (identity && identity.totalReflections === 14) {
    return { type: "depth", message: "١٤ تأمل — النظام يعرفك أكثر الحين", intensity: "medium" };
  }

  return null;
}

// ── Personality-Adapted Messages ──

const STYLE_SUFFIXES: Record<PersonalityStyle, string[]> = {
  supportive: ["— أنت مو لحالك في هذا", "— كل خطوة تعتبر", "— الرحلة تسندك"],
  challenger: ["— ادفع أكثر", "— الراحة مو هنا", "— وش بتسوي الحين؟"],
  analytical: ["— لاحظ النمط", "— البيانات تقول شيء", "— تأمل في التسلسل"],
  spiritual: ["— المعنى أقرب مما تتخيل", "— اسمع ما بداخلك", "— الآية تخاطبك اليوم"],
};

const COMM_PREFIXES: Record<CommunicationType, string> = {
  direct: "",
  gentle: "بلطف: ",
  provocative: "سؤال صريح: ",
  reflective: "تأمل: ",
};

export function adaptMessage(
  baseMessage: string,
  profile: PersonalityProfile
): string {
  const prefix = COMM_PREFIXES[profile.communication];
  const suffixes = STYLE_SUFFIXES[profile.style];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  // For high sensitivity, avoid provocative endings
  if (profile.sensitivityLevel === "high" && profile.communication === "provocative") {
    return `${prefix}${baseMessage} — خذ وقتك`;
  }

  return `${prefix}${baseMessage} ${suffix}`;
}

// Export for testing
export { deriveStyle, deriveCommunication, deriveMotivation, deriveSensitivity, computeAdaptation };
