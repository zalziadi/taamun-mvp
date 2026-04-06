import type { ProgressState } from "./progressEngine";
import type { LinkedReflection } from "./reflectionLinker";

export interface CognitiveAction {
  type: "reflection" | "review" | "decision" | "practice";
  label: string;
  description: string;
  suggestedNextStep: string;
  priority: "low" | "medium" | "high";
}

export interface ActionFeedback {
  completed: boolean;
  impact: "low" | "medium" | "high";
  note?: string;
}

function actionFromDrift(progress: ProgressState): CognitiveAction | null {
  if (progress.mode === "intervention") {
    return {
      type: "decision",
      label: "قرار العودة",
      description: `مرّت ${progress.drift} أيام — هل تريد متابعة الرحلة أم إعادة ضبط الوتيرة؟`,
      suggestedNextStep: "اختر: تابع من اليوم الحالي أو ارجع لآخر يوم أكملته",
      priority: "high",
    };
  }

  if (progress.mode === "catch_up" && progress.missedDays.length > 0) {
    const firstMissed = progress.missedDays[0];
    return {
      type: "review",
      label: `راجع يوم ${firstMissed}`,
      description: `فاتك يوم ${firstMissed} — فيه معنى ينتظرك`,
      suggestedNextStep: `افتح يوم ${firstMissed} واقرأ الآية ببطء`,
      priority: "medium",
    };
  }

  if (progress.mode === "recovery_boost") {
    return {
      type: "practice",
      label: "زخم العودة",
      description: "رجعت بقوة — خلنا نثبّت هذا الزخم",
      suggestedNextStep: "اكتب سطر واحد: ما الذي أعادني؟",
      priority: "medium",
    };
  }

  return null;
}

function actionFromReflection(linked: LinkedReflection): CognitiveAction | null {
  if (linked.patterns.length === 0) return null;

  const top = linked.patterns[0];

  if (top.recurrence >= 3) {
    return {
      type: "reflection",
      label: `نمط "${top.keyword}" يتكرر`,
      description: `ظهر ${top.recurrence} مرات في تأملاتك — يستحق التوقف عنده`,
      suggestedNextStep: `اكتب: ما الذي يريد "${top.keyword}" أن يقوله لي؟`,
      priority: "high",
    };
  }

  if (linked.connectedDays.length > 0) {
    return {
      type: "review",
      label: `ارجع ليوم ${linked.connectedDays[0]}`,
      description: `تأملك اليوم يتصل بيوم ${linked.connectedDays[0]}`,
      suggestedNextStep: `اقرأ ما كتبته يوم ${linked.connectedDays[0]} وأضف سطر جديد`,
      priority: "low",
    };
  }

  return {
    type: "practice",
    label: "تمرين اليوم",
    description: "لاحظ ردة فعلك الأولى لأي موقف اليوم",
    suggestedNextStep: "قبل النوم، اكتب ما لاحظته",
    priority: "low",
  };
}

export function generateAction(
  progress: ProgressState,
  linked: LinkedReflection | null
): CognitiveAction {
  // Priority: drift actions > reflection actions > default practice
  const driftAction = actionFromDrift(progress);
  if (driftAction) return driftAction;

  if (linked) {
    const refAction = actionFromReflection(linked);
    if (refAction) return refAction;
  }

  return {
    type: "practice",
    label: "تأمل اليوم",
    description: "اقرأ الآية ببطء وكرّرها 3 مرات",
    suggestedNextStep: "اكتب أول كلمة تأتيك بعد القراءة",
    priority: "low",
  };
}
