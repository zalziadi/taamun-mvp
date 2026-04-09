/**
 * Bridge — "Why you are here now"
 *
 * V10 PR-2 · Voice v2 (Real Layer). This module produces the language
 * that opens every screen that matters (home, day, city). The voice
 * was tuned in conversation with the user to remove "beautification"
 * and add friction — the mirror must be honest, not elegant.
 *
 * Voice laws (enforced in every generator below):
 *
 *   1. No imperative verbs in summary/transition/mirror. Only in CTA.
 *   2. No softeners like "لعلّك" / "ربّما" / "قد يكون" in the mirror line.
 *      The mirror is the one place the system tells the truth directly.
 *   3. No metaphors unless they're concrete. "بابٌ لم يُطرق" → out.
 *      "أنتَ تتجنّبه" → in.
 *   4. Every signal block ends with a meta-reason when the user is
 *      overcoming something: "ومع ذلك — أنت هنا".
 *   5. The last line always returns time to the user, not demand.
 *
 * Structure (four layers, not three):
 *
 *   summary    → the observation    (what is)
 *   transition → the interpretation (what it means)
 *   mirror     → the direct truth   (what you already know)
 *   nextHint   → the step           (where to go, if anywhere)
 *
 * Pure module — no React, no IO.
 */

import type { UserJourneyState } from "@/lib/journey/memory";
import { phaseFromDay } from "@/lib/journey/memory";
import type { Timeline } from "@/lib/journey/timeline";
import { PHASE_LABEL_AR } from "@/lib/journey/phases";

// ---------------------------------------------------------------------------
// Public type — now includes `mirror` as a first-class layer
// ---------------------------------------------------------------------------

export interface WhyYouAreHere {
  /** The observation — what is happening, named without judgment. */
  summary: string;
  /** The interpretation — what the observation means under the surface. */
  transition: string;
  /**
   * The mirror — the direct truth. This is the one line that doesn't
   * soften anything. "أنتَ لا تبدأ من جديد". "أنتَ تتجنّبه". May contain
   * multiple short lines separated by \n.
   */
  mirror: string;
  /** Concrete signals that produced this moment (max 5). */
  reasons: string[];
  /** Optional next step hint — route + label + human reason. */
  nextHint: {
    label: string;
    route: string;
    reason: string;
  } | null;
  /** How grounded these signals are (0..1). */
  confidence: number;
  /** Machine-readable situation label — for debug/analytics. */
  situation: Situation;
}

interface BridgeInputs {
  state: UserJourneyState;
  /** Optional: if the caller already fetched /api/journey/timeline. */
  timeline?: Timeline | null;
  /** Which page is asking — tweaks the voice. */
  context?: "home" | "day" | "city" | "generic";
  /** When rendering on /program/day/[id], the day being opened. */
  openingDay?: number;
}

// ---------------------------------------------------------------------------
// Situation classifier — the voice is chosen by the situation, not context
// ---------------------------------------------------------------------------

export type Situation =
  | "first_visit"
  | "returning_after_break"
  | "returning_with_resistance"
  | "scattered"
  | "momentum_rising"
  | "silent_doer"
  | "word_heavy"
  | "stuck"
  | "opening_day_resistance"
  | "opening_day_momentum"
  | "opening_day_default"
  | "baseline";

function classifySituation(inputs: BridgeInputs): Situation {
  const { state, context, openingDay } = inputs;

  // --- Day page branches first — they override everything else ---
  if (context === "day" && typeof openingDay === "number") {
    if (state.resistance >= 0.5 || state.momentum <= 0) return "opening_day_resistance";
    if (state.momentum >= 3) return "opening_day_momentum";
    return "opening_day_default";
  }

  // --- First visit: nothing yet ---
  const hasAnyActivity =
    state.sessionCount > 1 ||
    state.completedSteps.length > 0 ||
    state.keyInsights.length > 0 ||
    !!state.lastAnswer;
  if (!hasAnyActivity) return "first_visit";

  // --- Returning (drift + previously active) ---
  if (state.drift >= 3 && state.resistance >= 0.4) return "returning_with_resistance";
  if (state.drift >= 3) return "returning_after_break";

  // --- Stuck: big drift, no movement ---
  if (state.drift >= 5 && state.momentum <= 0) return "stuck";

  // --- Scattered: only detectable with timeline signal ---
  // Proxy: if timeline shows multiple phases touched in short time with
  // no concentration, or currentZone keeps flipping. For now we detect
  // it via timeline.totals when available.
  if (inputs.timeline) {
    const tl = inputs.timeline;
    const sectionsReached = tl.sections.filter((s) => s.reached).length;
    const tooThin =
      sectionsReached >= 2 &&
      tl.totals.reflections <= 1 &&
      tl.totals.completedDays >= 3;
    if (tooThin) return "scattered";
  }

  // --- Momentum rising ---
  if (state.momentum >= 4 && state.resistance < 0.4) return "momentum_rising";

  // --- Silent doer: actions without words ---
  if (
    completedDayCount(state) >= 2 &&
    state.keyInsights.length === 0 &&
    !state.lastAnswer
  ) {
    return "silent_doer";
  }

  // --- Word heavy: words without actions ---
  if (state.keyInsights.length >= 3 && completedDayCount(state) <= 1) {
    return "word_heavy";
  }

  return "baseline";
}

// ---------------------------------------------------------------------------
// Tiny helpers — Arabic numerals stay ASCII; counting phrases are fus7a
// ---------------------------------------------------------------------------

function completedDayCount(state: UserJourneyState): number {
  return state.completedSteps.filter((s) => /^day_\d+$/.test(s)).length;
}

function arabicDaysPhrase(n: number, shape: "passed" | "without_writing" | "started"): string {
  // "يومٌ واحد" / "يومان" / "3 أيام" / "11 يوماً"
  const count =
    n === 1 ? "يومٌ واحد" :
    n === 2 ? "يومان" :
    n >= 3 && n <= 10 ? `${n} أيام` :
    `${n} يوماً`;

  switch (shape) {
    case "passed":
      return `${count} مرّت`;
    case "without_writing":
      return `${count} لم تكتب فيها`;
    case "started":
      return n === 1
        ? `يومٌ واحد بدأتَه ثم توقفت`
        : n === 2
          ? `يومان بدأتَهما ثم توقفت`
          : `${count} بدأتَها ثم توقفت`;
  }
}

function previewAnswer(state: UserJourneyState, max = 50): string | null {
  if (!state.lastAnswer) return null;
  const t = state.lastAnswer.trim();
  if (!t.length) return null;
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

// ---------------------------------------------------------------------------
// Voice generators — one block per situation, tuned in the v2 conversation
// ---------------------------------------------------------------------------

interface Lines {
  summary: string;
  transition: string;
  mirror: string;
}

function linesFor(sit: Situation, inputs: BridgeInputs): Lines {
  const { state, openingDay } = inputs;
  const day = openingDay ?? state.currentDay;

  switch (sit) {
    case "first_visit":
      return {
        summary: "أنتَ هنا الآن، ولا شيء يُلزمك بالبقاء.",
        transition: "ومع ذلك، فتحتَ هذه الصفحة.",
        mirror:
          "هذا وحده يعني شيئاً.\nلا يحتاج إلى تفسير، ولا إلى تبرير.",
      };

    case "returning_after_break":
      return {
        summary: `${arabicDaysPhrase(Math.max(1, state.drift || 2), "passed")}، وفي داخلك جزءٌ لم يقبل أن يكتمل المشهد بدونك.`,
        transition: "لم يكن الصمت راحةً كاملة… كان محاولة للابتعاد، ثم رجوع.",
        mirror:
          "ما زال هناك شيء لم تُواجهه بعد.\nوشيءٌ فيك يعرف ذلك، لذلك لم يتركك تبتعد تماماً.",
      };

    case "returning_with_resistance":
      return {
        summary: `${arabicDaysPhrase(Math.max(1, state.drift || 2), "passed")}، وعدتَ — رغم أنّ شيئاً فيك كان يُقاوم العودة.`,
        transition: "لم يكن الانقطاع نسياناً. كان ثقلاً لم تعرف كيف تحمله.",
        mirror:
          "ومع ذلك — أنت هنا.\nوهذا ليس ضعفاً في المقاومة.\nهذا ما هو أقوى منها.",
      };

    case "scattered":
      return {
        summary:
          "تحرّكتَ في أكثر من اتجاه هذا الأسبوع، لكنّ الخطوات لم تمسك بيد بعضها.",
        transition: "هذا ليس تنوّعاً فقط. هذا تشتّت لم يُحسم بعد.",
        mirror:
          "أنتَ لا تجهل مركزك.\nأنتَ تتجنّبه.",
      };

    case "momentum_rising":
      return {
        summary: `${state.momentum} نقاطٍ من الزخم — ولم تلتفت إليها بعد.`,
        transition: "هذا الإيقاع لم يأتِ صدفة.",
        mirror:
          "أنتَ من صنعه.\nحتى لو لم تنتبه أنّك كنتَ تصنعه.",
      };

    case "silent_doer": {
      const dc = completedDayCount(state);
      return {
        summary: `${arabicDaysPhrase(dc, "passed").replace("مرّت", "عشتَها")}، بلا كلمةٍ واحدةٍ مكتوبة.`,
        transition:
          "لستَ صامتاً لأنّك لا تعرف. أنتَ صامتٌ لأنّ الكلمات لم تُطلَب منك بعد.",
        mirror:
          "لكنّ ما عشتَه بدأ يضغط.\nوما يضغط، يخرج — إمّا بالكلمة أو بغيرها.",
      };
    }

    case "word_heavy":
      return {
        summary: `${state.keyInsights.length} إدراكات مسجّلة، ويومٌ واحد مكتمل.`,
        transition: "الكلماتُ عندك. الخطواتُ تنتظر.",
        mirror:
          "أنتَ تعرف.\nما زال الباقي أن تعيش ما تعرفه.",
      };

    case "stuck":
      return {
        summary: `${arabicDaysPhrase(state.drift, "without_writing")}، وإيقاعٌ يقترب من الصمت.`,
        transition: "هذا ليس فشلاً. هذا حدّ.",
        mirror:
          "والحدّ ليس نهاية.\nهو المكان الذي يصبح فيه الاختيار مرئيّاً.",
      };

    case "opening_day_resistance":
      return {
        summary: `هذا اليوم قد لا يكون مريحاً.\nوهذا واضحٌ من الزخم الذي تحته.`,
        transition:
          "لكن وجودك هنا يعني شيئاً واحداً: جزءٌ منكَ لم ينسحب بالكامل.",
        mirror:
          "أنتَ لا تبدأ من جديد.\nأنتَ تكمل من حيث توقفت… حتى لو لم يعجبك هذا المكان.",
      };

    case "opening_day_momentum":
      return {
        summary: `يوم ${day}، والإيقاع يحملك.`,
        transition: "هذه ليست لحظة صدفة. هي امتدادٌ لما بنيتَه.",
        mirror:
          "ما كان جهداً بالأمس، أصبح طريقةً اليوم.\nوأنتَ من صنع هذا.",
      };

    case "opening_day_default":
      return {
        summary: `يوم ${day} — وأنتَ هنا.`,
        transition: "لم تأتِ لتُكمل واجباً. أتيتَ لأنّ شيئاً ما لم يُحسم بعد.",
        mirror:
          "هذه الصفحة ليست اختباراً.\nهي لحظةٌ تخصّك، كما أنتَ الآن.",
      };

    case "baseline":
    default: {
      const phaseAr = PHASE_LABEL_AR[state.currentPhase];
      return {
        summary: `أنتَ في ${phaseAr}، وما عشتَه حتى الآن جزءٌ منك.`,
        transition: "لم تصل إلى هنا صدفة، ولم تصل إليه بمخطّط.",
        mirror:
          "وصلتَ لأنّ كلّ يومٍ مضى طلب منك شيئاً… وأجبتَه.",
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Reasons — short, factual, and end with "ومع ذلك — أنت هنا" when earned
// ---------------------------------------------------------------------------

function collectReasons(inputs: BridgeInputs, sit: Situation): string[] {
  const { state, timeline, openingDay } = inputs;
  const out: string[] = [];

  // Most personal first: what they last said to themselves
  const last = previewAnswer(state);
  if (last) out.push(`آخر ما قلتَه: "${last}"`);

  // Completed days framed by situation
  const dc = completedDayCount(state);
  if (dc > 0) {
    if (sit === "returning_after_break" || sit === "returning_with_resistance") {
      out.push(arabicDaysPhrase(dc, "started"));
    } else if (sit === "silent_doer") {
      out.push(`${dc === 1 ? "يومٌ واحد" : dc === 2 ? "يومان" : `${dc} أيام`} بلا كلمة`);
    } else {
      out.push(
        dc === 1
          ? "يومٌ واحد مكتمل"
          : dc === 2
            ? "يومان مكتملان"
            : `${dc} أيام مكتملة`
      );
    }
  }

  // Drift framed as silence
  if (state.drift >= 2) {
    out.push(arabicDaysPhrase(state.drift, "without_writing"));
  }

  // Resistance — only when the mirror doesn't already name it
  if (state.resistance >= 0.5 && sit !== "momentum_rising") {
    out.push("مقاومةٌ مرتفعة");
  }

  // Momentum
  if (state.momentum >= 4 && sit === "momentum_rising") {
    out.push(`زخمٌ متراكم (+${state.momentum})`);
  } else if (state.momentum <= -2) {
    out.push("إيقاعٌ لم يستقرّ");
  }

  // Insights — "words in your possession"
  if (state.keyInsights.length >= 3) {
    out.push(`${state.keyInsights.length} إدراكاتٍ مسجّلة`);
  }

  // Day context
  if (typeof openingDay === "number") {
    out.push(`يوم ${openingDay} في مرحلة ${PHASE_LABEL_AR[phaseFromDay(openingDay)]}`);
  }

  // Timeline enrichment (baseline situations only — don't clutter confrontational ones)
  if (timeline && sit === "baseline") {
    if (timeline.totals.completedDays > 0) {
      out.push(
        `${timeline.totals.completedDays} يوم مكتمل و${timeline.totals.reflections} تأمّل`
      );
    }
  }

  // Scattered situation — name the avoidance using last zone
  if (sit === "scattered" && state.currentZone) {
    out.push(`أعمق ما ظهر كان في: ${state.currentZone}`);
    out.push("ثم ابتعدتَ عنها");
  }

  // THE META REASON — "ومع ذلك — أنت هنا"
  const deservesMeta =
    sit === "returning_after_break" ||
    sit === "returning_with_resistance" ||
    sit === "opening_day_resistance" ||
    sit === "stuck";
  if (deservesMeta) {
    out.push("ومع ذلك — أنت هنا");
  }

  return out.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Next hint — the CTA. The only place where imperative verbs are allowed.
// ---------------------------------------------------------------------------

function buildNextHint(inputs: BridgeInputs, sit: Situation): WhyYouAreHere["nextHint"] {
  const { state, context } = inputs;

  // On the day page the CTA is the day itself — no hint here
  if (context === "day") return null;

  switch (sit) {
    case "first_visit":
      return {
        route: "/program/day/1",
        label: "ادخل يوم ١",
        reason:
          "ليس لأنّه أوّل يوم، بل لأنّه أوّل ما قلتَه لنفسك: \"سأحاول\".",
      };

    case "returning_after_break":
    case "returning_with_resistance":
      return {
        route: "/reflection",
        label: "اقرأ آخر ما كتبتَه",
        reason: "ليس لإكماله… بل لترى أين توقفتَ فعلاً.",
      };

    case "scattered":
      return {
        route: "/reflection",
        label: "عُد إلى أعمق ما كتبتَه",
        reason:
          "ما تهرب منه لا يختفي. يبقى في الخلف… إلى أن تواجهه مباشرة.",
      };

    case "momentum_rising":
      return {
        route: `/program/day/${Math.min(28, state.currentDay)}`,
        label: `تابع من يوم ${state.currentDay}`,
        reason:
          "الإيقاع ليس عطاءً دائماً. هو نافذةٌ — وأنتَ داخلها الآن.",
      };

    case "silent_doer":
      return {
        route: "/reflection",
        label: "اكتب سطراً واحداً",
        reason:
          "ما عشتَه بدأ يضغط. هذا السطر يُخفّف الضغط قبل أن يُثقلك.",
      };

    case "word_heavy":
      return {
        route: `/program/day/${Math.min(28, state.currentDay)}`,
        label: `اعبر إلى يوم ${state.currentDay}`,
        reason:
          "الكلماتُ وصلت إلى حدّها. ما يلي هو الحركة.",
      };

    case "stuck":
      return {
        route: "/reflection",
        label: "اكتب كلمةً واحدة",
        reason:
          "لا تحتاج أن تبدأ الرحلة من جديد. تحتاج أن تُسمّي المكان الذي أنتَ فيه.",
      };

    case "baseline":
    default:
      return {
        route: `/program/day/${Math.min(28, state.currentDay)}`,
        label: `تابع من يوم ${state.currentDay}`,
        reason:
          "ليس لأنّه مكتوبٌ في البرنامج، بل لأنّك وقفتَ هنا بإرادتك.",
      };
  }
}

// ---------------------------------------------------------------------------
// Confidence — more real signals = more confident
// ---------------------------------------------------------------------------

function computeConfidence(reasons: string[], state: UserJourneyState): number {
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
 * The voice is chosen by the SITUATION, not the page. Every line is
 * derived from real state — no templates, no generic fallbacks. When
 * in doubt, the mirror tells the truth that the summary and transition
 * were too polite to say.
 */
export function generateWhyYouAreHere(inputs: BridgeInputs): WhyYouAreHere {
  const situation = classifySituation(inputs);
  const { summary, transition, mirror } = linesFor(situation, inputs);
  const reasons = collectReasons(inputs, situation);
  const nextHint = buildNextHint(inputs, situation);
  const confidence = computeConfidence(reasons, inputs.state);

  return {
    summary,
    transition,
    mirror,
    reasons,
    nextHint,
    confidence,
    situation,
  };
}
