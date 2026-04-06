import type { JourneyState } from "./journeyState";
import type { UserIdentity } from "./identityTracker";
import type { CognitiveContext } from "./cognitiveContext";
import type { Narrative } from "./narrativeEngine";
import type { ProgressState } from "./progressEngine";

export type GuidanceTone = "supportive" | "challenging" | "reflective";
export type GuidanceFocus = "continue" | "recover" | "deepen" | "decide";

export interface Guidance {
  message: string;
  tone: GuidanceTone;
  focus: GuidanceFocus;
  suggestedPath: {
    type: "action" | "reflection" | "review";
    reason: string;
  };
  confidence: number;
}

export interface GuidanceInputs {
  progress: ProgressState;
  journey: JourneyState;
  identity: UserIdentity | null;
  context: CognitiveContext | null;
  narrative: Narrative | null;
}

// ── Tone ──

function deriveTone(inputs: GuidanceInputs): GuidanceTone {
  const { progress, journey } = inputs;
  if (progress.momentum <= -3 || journey.emotionalState === "lost") return "supportive";
  if (progress.momentum >= 5 && journey.emotionalState === "engaged") return "challenging";
  return "reflective";
}

// ── Focus ──

function deriveFocus(inputs: GuidanceInputs): GuidanceFocus {
  const { progress, journey, identity } = inputs;

  if (progress.drift > 3 || journey.currentMode === "recovery") return "recover";
  if (journey.emotionalState === "resistant" || identity?.trajectory === "declining") return "decide";
  if (identity?.reflectionDepth === "deep" || journey.currentMode === "breakthrough") return "deepen";
  return "continue";
}

// ── Path ──

function derivePath(
  focus: GuidanceFocus,
  inputs: GuidanceInputs
): Guidance["suggestedPath"] {
  const { progress } = inputs;

  if (focus === "recover") {
    return progress.missedDays.length > 3
      ? { type: "review", reason: "إعادة الاتصال بالرحلة أهم من التعويض" }
      : { type: "reflection", reason: "خطوة خفيفة تعيد الزخم" };
  }

  if (focus === "decide") {
    return { type: "action", reason: "الوقت مناسب لقرار واعي عن مسار الرحلة" };
  }

  if (focus === "deepen") {
    return { type: "reflection", reason: "أنت في مرحلة عمق — التأمل يكشف المزيد" };
  }

  // continue
  return { type: "action", reason: "تابع بنفس الإيقاع — الاستمرارية هي القوة" };
}

// ── Confidence ──

function deriveConfidence(inputs: GuidanceInputs): number {
  let c = 0.5;

  const { progress, identity } = inputs;

  // More data = more confidence
  if (progress.completedDays.length > 7) c += 0.1;
  if (progress.completedDays.length > 14) c += 0.1;
  if (identity && identity.totalReflections > 5) c += 0.1;
  if (identity && identity.identityTimeline.length > 3) c += 0.05;

  // Consistent behavior = more confidence
  if (progress.streak > 5) c += 0.1;
  if (identity?.completionPattern === "consistent") c += 0.1;

  // High drift = less confidence
  if (progress.drift > 5) c -= 0.15;
  if (progress.drift > 2) c -= 0.05;

  return Math.max(0.1, Math.min(0.99, Math.round(c * 100) / 100));
}

// ── Message Generation (Arabic) ──

function buildMessage(
  tone: GuidanceTone,
  focus: GuidanceFocus,
  inputs: GuidanceInputs
): string {
  const { progress, narrative, context, identity } = inputs;

  // Use narrative story if available
  if (narrative && narrative.story.length > 20) {
    // Shorten narrative to 1-2 sentences for guidance
    const firstSentence = narrative.story.split("—")[0]?.trim() ?? narrative.story.slice(0, 80);
    return addToneLayer(firstSentence, tone, focus);
  }

  // Use context interpretation if available
  if (context?.contextInterpretation && context.contextInterpretation.length > 10) {
    return addToneLayer(context.contextInterpretation, tone, focus);
  }

  // Fallback messages by focus + tone
  return getFallbackMessage(tone, focus, progress, identity);
}

function addToneLayer(base: string, tone: GuidanceTone, focus: GuidanceFocus): string {
  if (tone === "supportive" && focus === "recover") {
    return `${base} — خذ وقتك، الرحلة ما زالت هنا`;
  }
  if (tone === "challenging" && focus === "deepen") {
    return `${base} — الوقت مناسب تدفع نفسك أعمق`;
  }
  if (tone === "challenging" && focus === "continue") {
    return `${base} — لا تتوقف الآن`;
  }
  if (tone === "reflective") {
    return `${base} — توقف لحظة وتأمل`;
  }
  return base;
}

function getFallbackMessage(
  tone: GuidanceTone,
  focus: GuidanceFocus,
  progress: ProgressState,
  identity: UserIdentity | null
): string {
  if (focus === "recover") {
    if (tone === "supportive") {
      return `رجعت بعد ${progress.drift} أيام — وهذا بحد ذاته خطوة. خلنا نبدأ بخطوة خفيفة`;
    }
    return `مرّت ${progress.drift} أيام. الرحلة ما توقفت — أنت اللي توقفت. تعال نرجع`;
  }

  if (focus === "decide") {
    return "شيء يحتاج قرار — ليس كل تقدم يكون للأمام. أحياناً القرار الأهم هو: كيف أكمل؟";
  }

  if (focus === "deepen") {
    const theme = identity?.recurringThemes?.[0];
    if (theme) return `نمط "${theme}" يتكرر — اليوم ممكن تفهمه بشكل أعمق`;
    return "أنت في مرحلة عمق — التأمل اليوم يحمل شيء مختلف";
  }

  // continue
  if (progress.streak > 3) {
    return `${progress.streak} أيام متتالية — الاستمرارية هي اللي تبني التحوّل الحقيقي`;
  }
  return "يوم جديد، معنى جديد — تابع بنفس الإيقاع";
}

// ── Main Function ──

export function generateGuidance(inputs: GuidanceInputs): Guidance {
  const tone = deriveTone(inputs);
  const focus = deriveFocus(inputs);
  const suggestedPath = derivePath(focus, inputs);
  const confidence = deriveConfidence(inputs);
  const message = buildMessage(tone, focus, inputs);

  return { message, tone, focus, suggestedPath, confidence };
}

// Export for testing
export { deriveTone, deriveFocus, derivePath, deriveConfidence };
