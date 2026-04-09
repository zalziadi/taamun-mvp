/**
 * Narrative sentences — turns a Timeline into story lines.
 *
 * No dashboards, no percentages as goals. One felt sentence per moment.
 * Every output must answer: "why is this appearing now, for me, today?"
 *
 * Pure module — no React, no IO.
 */

import type { JourneyPhase } from "./memory";
import { phaseFromDay } from "./memory";
import { PHASE_LABEL_AR } from "./phases";
import type { Timeline } from "./timeline";

export interface NarrativeSnapshot {
  /** One sentence describing where the user is right now. */
  currentSentence: string;
  /** One sentence describing the inner movement. */
  transitionSentence: string;
  /** "Why you are here now" — three lines: past, present, future. */
  bridge: {
    past: string;
    present: string;
    future: string;
  };
  /** Next recommended action with a human reason. */
  nextAction: {
    label: string;
    route: string;
    reason: string;
  };
}

function describePast(timeline: Timeline): string {
  const { totals } = timeline;
  if (totals.completedDays === 0 && totals.reflections === 0) {
    return "لم تبدأ بعد — كل رحلة تبدأ بخطوة واحدة.";
  }
  if (totals.completedDays === 0 && totals.reflections > 0) {
    return `كتبت ${totals.reflections} تأمّلاً دون أن تُكمل يوماً بعد.`;
  }
  if (totals.reflections === 0) {
    return `أكملت ${totals.completedDays} يوماً في صمت — خطوات بلا كلمات.`;
  }
  return `في ما مضى: ${totals.completedDays} يوم مكتمل و${totals.reflections} تأمّل مكتوب.`;
}

function describePresent(lastActiveDay: number): string {
  if (lastActiveDay === 0) return "أنت على حافة البداية — اللحظة مفتوحة.";
  const phase = phaseFromDay(lastActiveDay);
  const phaseAr = PHASE_LABEL_AR[phase];
  return `أنت الآن في مرحلة ${phaseAr}، عند يوم ${lastActiveDay}.`;
}

function describeFuture(lastActiveDay: number, hasAnyReflection: boolean): string {
  if (lastActiveDay === 0) return "الخطوة التالية: أن تبدأ اليوم الأول بهدوء.";
  if (lastActiveDay >= 28) return "الخطوة التالية: أن تعود وتتأمّل كل ما عشته.";
  if (!hasAnyReflection) {
    return `الخطوة التالية: أن تكتب كلمة واحدة عن يوم ${lastActiveDay} قبل أن تتقدّم.`;
  }
  return `الخطوة التالية: استئناف يوم ${lastActiveDay + 1}.`;
}

function nextRoute(lastActiveDay: number): string {
  if (lastActiveDay <= 0) return "/program/day/1";
  if (lastActiveDay >= 28) return "/progress";
  return `/program/day/${lastActiveDay + 1}`;
}

function nextLabel(lastActiveDay: number): string {
  if (lastActiveDay <= 0) return "ابدأ اليوم الأول";
  if (lastActiveDay >= 28) return "تأمّل رحلتك";
  return `استأنف يوم ${lastActiveDay + 1}`;
}

function currentSentenceFor(lastActiveDay: number, phase: JourneyPhase): string {
  if (lastActiveDay <= 0) {
    return "أنت على عتبة الرحلة — لا خلف ولا أمام، فقط الآن.";
  }
  const phaseAr = PHASE_LABEL_AR[phase];
  return `أنت في ${phaseAr}، وما عشته حتى اليوم ${lastActiveDay} جزء منك.`;
}

function transitionSentenceFor(timeline: Timeline): string {
  const { totals } = timeline;
  if (totals.completedDays === 0) {
    return "لم يبدأ التحوّل بعد — والبداية نفسها تحوّل.";
  }

  const withNotes = totals.reflections;
  if (withNotes >= totals.completedDays && totals.completedDays >= 3) {
    return "تنتقل من الفعل إلى الملاحظة — تكتب ما كنت تعيشه بصمت.";
  }
  if (withNotes === 0 && totals.completedDays >= 3) {
    return "تتحرّك بفعل، والكلمات ستأتي حين تحتاجها.";
  }
  return "تسير خطوةً خطوة — هذا هو الإيقاع.";
}

/**
 * Compose a full narrative snapshot from a merged timeline.
 * Pure — no IO, no side effects.
 */
export function composeNarrative(timeline: Timeline): NarrativeSnapshot {
  const lastActiveDay = timeline.totals.lastActiveDay;
  const phase = phaseFromDay(Math.max(1, lastActiveDay));
  const hasAnyReflection = timeline.totals.reflections > 0;

  return {
    currentSentence: currentSentenceFor(lastActiveDay, phase),
    transitionSentence: transitionSentenceFor(timeline),
    bridge: {
      past: describePast(timeline),
      present: describePresent(lastActiveDay),
      future: describeFuture(lastActiveDay, hasAnyReflection),
    },
    nextAction: {
      label: nextLabel(lastActiveDay),
      route: nextRoute(lastActiveDay),
      reason:
        lastActiveDay <= 0
          ? "لأنّ أول يوم هو أصعب يوم — ويستحقّ أن يُعاش الآن."
          : lastActiveDay >= 28
            ? "لأنّك أكملت الرحلة — الآن وقت الملاحظة الشاملة."
            : `لأنّ يوم ${lastActiveDay} وراءك، ويوم ${lastActiveDay + 1} ينتظر حضورك.`,
    },
  };
}
