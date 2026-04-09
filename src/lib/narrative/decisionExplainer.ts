/**
 * Decision Explainer
 *
 * Takes any action/step the system decides to show and produces a
 * structured explanation:
 *   - title: "لماذا هذه الخطوة؟"
 *   - reasons: bullet evidence naming real user signals
 *   - humanSentence: one-line "because you..."
 *
 * Lives alongside the orchestrator, not inside it. The orchestrator can
 * call this at the end to enrich its output, OR the UI can call this
 * on any CTA (home, day page, city) to attach a "why" without touching
 * the orchestrator internals.
 *
 * Pure module — no React, no IO.
 */

import type { UserJourneyState } from "@/lib/journey/memory";

export type ExplainableAction =
  | "start_day_one"
  | "continue_day"
  | "reflection"
  | "city_visit"
  | "resume_where_left"
  | "read_previous_insight"
  | "open_program"
  | "custom";

export interface DecisionExplanation {
  /** Localized title shown above the reasons list. */
  title: string;
  /** Machine-readable action label (for analytics/debug). */
  action: ExplainableAction;
  /** 1-4 short Arabic bullets — each naming a concrete signal. */
  reasons: string[];
  /** A single human sentence: "لأنّك ..." */
  humanSentence: string;
  /** Confidence 0..1 that this decision is well-grounded. */
  confidence: number;
}

interface ExplainInputs {
  action: ExplainableAction;
  state: UserJourneyState;
  /** Optional custom title override. */
  title?: string;
  /** Optional extra context to inject as a reason (e.g., "المدينة تُضيء الهوية"). */
  contextReason?: string;
}

// ---------------------------------------------------------------------------
// Signal-based reason builders
// ---------------------------------------------------------------------------

function baseSignals(state: UserJourneyState): string[] {
  const out: string[] = [];

  if (state.resistance >= 0.6) {
    out.push("مقاومةٌ مرتفعة");
  } else if (state.resistance >= 0.3) {
    out.push("مقاومةٌ خفيفة");
  }

  if (state.momentum >= 4) {
    out.push(`زخمٌ متراكم (+${state.momentum})`);
  } else if (state.momentum <= -2) {
    out.push("إيقاعٌ متراجع");
  }

  if (state.drift >= 3) {
    out.push(`${state.drift} أيام بلا كتابة`);
  }

  if (state.emotionalState === "resistance") out.push("ما تشعر به الآن: مقاومة");
  else if (state.emotionalState === "flow") out.push("ما تشعر به الآن: انسياب");
  else if (state.emotionalState === "avoidant") out.push("ما تشعر به الآن: تجنّب");
  else if (state.emotionalState === "clear") out.push("ما تشعر به الآن: وضوح");

  return out;
}

function reasonsFor(action: ExplainableAction, state: UserJourneyState): string[] {
  const base = baseSignals(state);

  switch (action) {
    case "start_day_one":
      return [
        state.sessionCount === 0
          ? "هذه أول زيارة لك"
          : `زرت النظام ${state.sessionCount} مرة دون أن تبدأ`,
        "يوم واحد يكفي لبدء التحوّل",
      ];

    case "continue_day":
      return [
        `أنت عند يوم ${state.currentDay}`,
        ...(state.momentum >= 2 ? [`زخم +${state.momentum}`] : []),
        ...(state.drift < 2 ? ["أنت ملتزم بالإيقاع"] : []),
      ].slice(0, 4);

    case "reflection":
      return [
        ...(state.resistance >= 0.5 ? ["المقاومة الحالية تحتاج تسميتها"] : []),
        ...(state.lastAnswer && state.lastAnswer.length < 30
          ? ["آخر تأمّل كان قصيراً — ربما يحتاج مساحة"]
          : []),
        ...(state.keyInsights.length === 0 ? ["لم تسجّل إدراكاً مفتاحياً بعد"] : []),
        ...base.slice(0, 1),
      ].slice(0, 4);

    case "city_visit":
      return [
        `منطقتك النشطة: ${state.currentZone}`,
        ...(state.completedSteps.length > 0
          ? [`لديك ${state.completedSteps.length} خطوة مكتملة لتراها في خريطتك`]
          : []),
        ...base.slice(0, 1),
      ].slice(0, 4);

    case "resume_where_left":
      return [
        state.lastPageVisited
          ? `آخر صفحة زرتها: ${state.lastPageVisited}`
          : `أنت عند يوم ${state.currentDay}`,
        ...(state.lastAnswer
          ? [`تركت كلماتك: "${state.lastAnswer.slice(0, 40)}${state.lastAnswer.length > 40 ? "…" : ""}"`]
          : []),
        ...base.slice(0, 1),
      ].slice(0, 4);

    case "read_previous_insight":
      return state.keyInsights.length > 0
        ? [
            `لديك ${state.keyInsights.length} إدراكات مسجّلة`,
            `آخرها: "${state.keyInsights[0].slice(0, 50)}"`,
          ]
        : ["لم تسجّل إدراكات بعد — هذا اقتراح لبدء القراءة"];

    case "open_program":
      return [
        `أنت في ${state.currentPhase}`,
        `يوم ${state.currentDay} من 28`,
        ...base.slice(0, 2),
      ].slice(0, 4);

    case "custom":
    default:
      return base.slice(0, 3);
  }
}

function humanSentenceFor(action: ExplainableAction, state: UserJourneyState): string {
  switch (action) {
    case "start_day_one":
      return "لأنّ أوّل يومٍ لا يختفي — يبقى منتظراً حتى تدخله.";
    case "continue_day":
      return "لأنّك لا تبدأ من جديد. أنتَ تكمل من حيث توقفت — حتى لو لم يعجبك هذا المكان.";
    case "reflection":
      return state.resistance >= 0.5
        ? "لأنّ ما لا تُسمّيه يظلّ يتحكّم بك من الخلف."
        : "لأنّ الكلمة الواحدة تعرف أحياناً ما لا تعرفه مئات الكلمات.";
    case "city_visit":
      return "لأنّ مدينتك تعرفك أكثر ممّا تعرف نفسك الآن.";
    case "resume_where_left":
      return state.lastAnswer
        ? "لأنّ ما لم تُكمله لا يختفي. يبقى في الخلفية… إلى أن تنظر إليه بوضوح."
        : "لأنّك لستَ بعيداً. أنتَ فقط تحتاج أن ترى أين توقفت.";
    case "read_previous_insight":
      return "لأنّ ما أدركتَه بالأمس قد يكون الجواب الذي تبحث عنه اليوم.";
    case "open_program":
      return "لأنّ الرحلة لم تنتظر — هي تسير فيك، حتى حين لا تفتحها.";
    case "custom":
    default:
      return "لأنّ هذه الخطوة هي ما طلبه ما عشتَه — لا ما اخترناه لك.";
  }
}

function computeConfidence(reasons: string[], state: UserJourneyState): number {
  let c = 0.35 + Math.min(reasons.length, 4) * 0.1;
  if (state.sessionCount >= 3) c += 0.1;
  if (state.keyInsights.length > 0) c += 0.08;
  return Math.min(1, Math.max(0, c));
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Produce a structured explanation for a CTA/decision shown to the user.
 *
 * Usage:
 *   const exp = explainDecision({ action: "continue_day", state: journey.state });
 *   <DecisionExplainer explanation={exp} />
 */
export function explainDecision(inputs: ExplainInputs): DecisionExplanation {
  const reasons = reasonsFor(inputs.action, inputs.state);
  if (inputs.contextReason) reasons.unshift(inputs.contextReason);

  return {
    title: inputs.title ?? "لماذا هذه الخطوة؟",
    action: inputs.action,
    reasons: reasons.slice(0, 4),
    humanSentence: humanSentenceFor(inputs.action, inputs.state),
    confidence: computeConfidence(reasons, inputs.state),
  };
}
