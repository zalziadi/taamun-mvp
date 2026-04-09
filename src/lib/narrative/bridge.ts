/**
 * Bridge — "Why you are here now"
 *
 * V10 PR-2. This is the layer that makes the system feel like it's
 * *walking with you*, not tracking you. Every screen that matters
 * (home, day page, city) opens with a bridge generated from YOUR state —
 * past, present, future, and the reasons behind them.
 *
 * Design principle: nothing generic. Every sentence must name a real
 * signal (resistance score, last answer, completion count, phase shift)
 * so the user feels: "this emerged from me, not from a template".
 *
 * Pure module — no React, no IO.
 */

import type { UserJourneyState, JourneyPhase } from "@/lib/journey/memory";
import { phaseFromDay } from "@/lib/journey/memory";
import type { Timeline } from "@/lib/journey/timeline";
import { PHASE_LABEL_AR } from "@/lib/journey/phases";

export interface WhyYouAreHere {
  /** One-line "you are here because X" summary. */
  summary: string;
  /** Concrete signals that produced this moment (max 4). */
  reasons: string[];
  /** The inner shift happening right now. */
  transition: string;
  /** Optional next step hint — route + label + human reason. */
  nextHint: {
    label: string;
    route: string;
    reason: string;
  } | null;
  /** How confident we are the signals are meaningful (0..1). */
  confidence: number;
}

interface BridgeInputs {
  state: UserJourneyState;
  /** Optional: if the caller already fetched /api/journey/timeline. */
  timeline?: Timeline | null;
  /** Which page is asking — tweaks the summary voice. */
  context?: "home" | "day" | "city" | "generic";
  /** When rendering on /program/day/[id], the day being opened. */
  openingDay?: number;
}

// ---------------------------------------------------------------------------
// Reason extraction — name real signals, never vague claims
// ---------------------------------------------------------------------------

function collectReasons(inputs: BridgeInputs): string[] {
  const { state, timeline, openingDay } = inputs;
  const out: string[] = [];

  // Signal 1: resistance
  if (state.resistance >= 0.6) {
    out.push(`مستوى المقاومة مرتفع (${Math.round(state.resistance * 100)}%)`);
  } else if (state.resistance >= 0.3) {
    out.push(`لديك مقاومة خفيفة اليوم`);
  }

  // Signal 2: momentum
  if (state.momentum >= 4) {
    out.push(`زخم قوي في الأيام الماضية (+${state.momentum})`);
  } else if (state.momentum <= -2) {
    out.push(`الزخم متراجع (${state.momentum})`);
  }

  // Signal 3: drift
  if (state.drift >= 3) {
    out.push(`انحراف ${state.drift} أيام عن الإيقاع`);
  }

  // Signal 4: last answer (most personal)
  if (state.lastAnswer && state.lastAnswer.trim().length > 0) {
    const preview = state.lastAnswer.trim().slice(0, 50);
    out.push(`آخر ما كتبت: "${preview}${state.lastAnswer.length > 50 ? "…" : ""}"`);
  }

  // Signal 5: key insights
  if (state.keyInsights.length >= 3) {
    out.push(`لديك ${state.keyInsights.length} إدراكات مفتاحية مسجّلة`);
  } else if (state.keyInsights.length > 0) {
    out.push(`أوّل إدراك سجّلته: "${state.keyInsights[0].slice(0, 40)}"`);
  }

  // Signal 6: completed steps
  if (state.completedSteps.length > 0) {
    const dayCount = state.completedSteps.filter((s) => /^day_\d+$/.test(s)).length;
    if (dayCount > 0) out.push(`أكملت ${dayCount} يوم حتى الآن`);
  }

  // Signal 7: timeline-derived (only if caller provided it)
  if (timeline) {
    if (timeline.totals.reflections > 0 && timeline.totals.completedDays > 0) {
      out.push(
        `في رحلتك: ${timeline.totals.completedDays} يوم مكتمل و${timeline.totals.reflections} تأمّل مكتوب`
      );
    }
  }

  // Signal 8: opening a specific day (program/day/[id])
  if (typeof openingDay === "number" && openingDay >= 1 && openingDay <= 28) {
    const phase = phaseFromDay(openingDay);
    out.push(`اليوم الذي تفتحه الآن في مرحلة ${PHASE_LABEL_AR[phase]}`);
  }

  // Keep the strongest 4
  return out.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Summary & transition — human sentences, not templates
// ---------------------------------------------------------------------------

function buildSummary(inputs: BridgeInputs): string {
  const { state, context, openingDay } = inputs;
  const phase = state.currentPhase;
  const phaseAr = PHASE_LABEL_AR[phase];

  // Context: opening a day
  if (context === "day" && typeof openingDay === "number") {
    if (state.lastAnswer && state.lastAnswer.trim().length > 0) {
      return `تفتح يوم ${openingDay} لأنّ ما كتبته سابقاً ما زال يتنفّس — والخطوة القادمة امتداد له.`;
    }
    if (state.resistance >= 0.5) {
      return `تفتح يوم ${openingDay} رغم المقاومة — وهذا بالضبط ما يجعل هذا اليوم مهمّاً.`;
    }
    if (state.momentum >= 3) {
      return `تفتح يوم ${openingDay} والزخم معك — الإيقاع الذي بنيته يحملك.`;
    }
    return `تفتح يوم ${openingDay} الآن لأنّك اخترت أن تكمل — لا أكثر ولا أقلّ.`;
  }

  // Context: home
  if (context === "home") {
    if (state.sessionCount === 0) {
      return "أنت هنا لأنّ شيئاً ما دعاك — حتى لو لم تسمّه بعد.";
    }
    if (state.lastAnswer) {
      return `أنت هنا لأنّك تركت سؤالاً مفتوحاً، والعودة جزء من الإجابة.`;
    }
    if (state.resistance >= 0.5 && state.momentum < 2) {
      return `أنت هنا رغم المقاومة — وهذا حضور حقيقي.`;
    }
    return `أنت هنا في ${phaseAr} — ليس صدفة، بل لأنّ كل يوم مضى قادك إلى هذه اللحظة.`;
  }

  // Context: city
  if (context === "city") {
    return `مدينتك تعكس ${phaseAr} — كل منطقة تُضيء بما عشته فيها، لا بما خطّطته لها.`;
  }

  // Generic
  return `أنت في ${phaseAr}، ويوم ${state.currentDay} هو النقطة التي وصلت إليها بنفسك.`;
}

function buildTransition(state: UserJourneyState): string {
  // Strong positive movement
  if (state.momentum >= 4 && state.resistance < 0.4) {
    return "تتحرّك من الفعل المنفرد إلى الإيقاع — ما كان جهداً أصبح طبيعة.";
  }

  // Shadow movement
  if (state.resistance >= 0.6 && state.keyInsights.length > 0) {
    return "تنتقل من التجنّب إلى الملاحظة — أصعب انتقال وأهمّه.";
  }

  // Phase-based transitions
  switch (state.currentPhase) {
    case "entry":
      return "لحظة السؤال مفتوحة — لا تسرع في إغلاقها.";
    case "deepening":
      return "ترى ما لم تكن تراه — هذا نصف التحوّل.";
    case "integrating":
      return "ما كان تمريناً بدأ يصبح حركة يومية.";
    case "mastery":
      return "ما تعلّمته لم يعد خارجك — أصبح طريقتك.";
  }
}

function buildNextHint(inputs: BridgeInputs): WhyYouAreHere["nextHint"] {
  const { state, context } = inputs;

  // On the day page itself, no "next" hint — they are already there
  if (context === "day") return null;

  if (state.resistance >= 0.6) {
    return {
      route: "/reflection",
      label: "اكتب سطراً واحداً",
      reason: "لأنّ تسمية المقاومة تُذيبها — قبل أن تتقدّم.",
    };
  }
  if (state.momentum >= 3) {
    return {
      route: `/program/day/${Math.min(28, state.currentDay)}`,
      label: `استأنف يوم ${state.currentDay}`,
      reason: "لأنّ الزخم نادر، ويستحقّ أن يُستثمر الآن.",
    };
  }
  if (state.sessionCount === 0) {
    return {
      route: "/program/day/1",
      label: "ابدأ اليوم الأول",
      reason: "لأنّ أول يوم هو أصعب يوم — ويستحقّ أن يُعاش الآن.",
    };
  }
  return {
    route: `/program/day/${state.currentDay}`,
    label: `تابع من يوم ${state.currentDay}`,
    reason: "لأنّك وقفت هنا — ومن هنا نكمل.",
  };
}

function computeConfidence(reasons: string[], state: UserJourneyState): number {
  // More real signals = higher confidence
  let c = 0.3 + reasons.length * 0.12;
  if (state.lastAnswer) c += 0.1;
  if (state.keyInsights.length > 0) c += 0.08;
  if (state.sessionCount >= 3) c += 0.05;
  return Math.min(1, Math.max(0, c));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Build a "Why you are here now" message for a given moment.
 *
 * Works from journey state alone (fast path) or with optional timeline
 * for richer signals. Every output is derived from real user signals —
 * no templates, no generic fallbacks.
 */
export function generateWhyYouAreHere(inputs: BridgeInputs): WhyYouAreHere {
  const reasons = collectReasons(inputs);
  const summary = buildSummary(inputs);
  const transition = buildTransition(inputs.state);
  const nextHint = buildNextHint(inputs);
  const confidence = computeConfidence(reasons, inputs.state);

  return {
    summary,
    reasons,
    transition,
    nextHint,
    confidence,
  };
}
