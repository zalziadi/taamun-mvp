/**
 * Decision Engine — DPOS Logic
 *
 * Transforms scattered ideas into ONE clear decision + ONE actionable step.
 * NOT a chatbot — a structured decision pipeline.
 *
 * Pipeline: CLARIFY → PRIORITIZE → ELIMINATE → SELECT → EXECUTE
 */

// ── Types ──

export interface CurrentState {
  financial?: string;
  emotional?: string;
  practical?: string;
}

export interface Goal {
  shortTerm: string;
  longTerm?: string;
}

export interface Constraints {
  money?: string;
  time?: string;
  obligations?: string;
  risks?: string;
}

export interface DecisionInput {
  currentState: CurrentState;
  goal: Goal;
  constraints: Constraints;
}

export type DecisionStage = "clarify" | "prioritize" | "eliminate" | "select" | "execute";

export interface StageOutput {
  stage: DecisionStage;
  output: string;
}

export interface Decision {
  decision: string;          // 🎯 ONE clear statement
  reasoning: string;         // 🧠 Why this decision
  actionStep: string;        // ⚡ Today's action
  ignore: string[];          // ⛔ Anti-focus list
  pipeline: StageOutput[];   // Trace of all 5 stages
  markdown: string;          // Full markdown output
  confidence: number;        // 0-1
}

// ── Stage 1: CLARIFY ──

function clarify(input: DecisionInput): string {
  const parts: string[] = [];
  if (input.currentState.financial) parts.push(`المالي: ${input.currentState.financial}`);
  if (input.currentState.emotional) parts.push(`العاطفي: ${input.currentState.emotional}`);
  if (input.currentState.practical) parts.push(`العملي: ${input.currentState.practical}`);

  if (parts.length === 0) return "الوضع غير محدد بعد";

  return `الوضع الحالي يحتوي ${parts.length} بُعد رئيسي: ${parts.join(" / ")}. الهدف: ${input.goal.shortTerm}`;
}

// ── Stage 2: PRIORITIZE ──

function prioritize(input: DecisionInput): string {
  const factors: { name: string; weight: number; reason: string }[] = [];

  // Financial constraints carry highest weight if present
  if (input.constraints.money) {
    factors.push({ name: "القيد المالي", weight: 9, reason: input.constraints.money });
  }

  // Time constraints are urgent
  if (input.constraints.time) {
    factors.push({ name: "الضغط الزمني", weight: 8, reason: input.constraints.time });
  }

  // Risks need attention
  if (input.constraints.risks) {
    factors.push({ name: "المخاطر", weight: 7, reason: input.constraints.risks });
  }

  // Emotional state shapes everything
  if (input.currentState.emotional) {
    factors.push({ name: "الحالة العاطفية", weight: 6, reason: input.currentState.emotional });
  }

  if (factors.length === 0) {
    return `الأولوية: ${input.goal.shortTerm}`;
  }

  factors.sort((a, b) => b.weight - a.weight);
  const top = factors[0];
  return `الأولوية الحقيقية الآن: ${top.name} — ${top.reason}`;
}

// ── Stage 3: ELIMINATE ──

function eliminate(input: DecisionInput): string {
  const reasons: string[] = [];

  if (input.constraints.money) {
    reasons.push("كل خيار يتطلب رأس مال إضافي");
  }
  if (input.constraints.time) {
    reasons.push("كل خيار يحتاج أكثر من أسبوعين");
  }
  if (input.constraints.obligations) {
    reasons.push("كل خيار يتعارض مع الالتزامات الحالية");
  }

  if (reasons.length === 0) {
    return "لا حاجة للإقصاء — الخيارات مفتوحة";
  }

  return `استبعد: ${reasons.join(" • ")}`;
}

// ── Stage 4: SELECT ──

function select(input: DecisionInput): { decision: string; reasoning: string } {
  const goal = input.goal.shortTerm;
  const hasMoney = !!input.constraints.money;
  const hasTime = !!input.constraints.time;
  const hasEmotion = !!input.currentState.emotional;

  // Decision selection logic based on constraint pattern
  let decision: string;
  let reasoning: string;

  if (hasMoney && hasTime) {
    decision = `ركّز على أصغر خطوة قابلة للتنفيذ نحو "${goal}" بدون رأس مال وفي أقل من ساعة اليوم`;
    reasoning = "القيد المزدوج (مال + وقت) يفرض البدء بأقل مجهود وأقل تكلفة. النتائج الكبيرة تأتي من تراكم الخطوات الصغيرة";
  } else if (hasMoney) {
    decision = `استخدم ما لديك الآن لبدء "${goal}" — لا تنتظر التمويل`;
    reasoning = "القيد المالي حقيقي، لكن الانتظار يكلفك أكثر من البداية بإمكانياتك الحالية";
  } else if (hasTime) {
    decision = `قسّم "${goal}" إلى خطوة واحدة يومية لا تتجاوز 30 دقيقة`;
    reasoning = "ضغط الوقت يعني أن الخطط الكبيرة لن تنفّذ. الخطوات الصغيرة المتكررة هي الحل";
  } else if (hasEmotion) {
    decision = `قبل أي قرار، خذ 24 ساعة لتسمية ما تشعر به بالضبط، ثم ارجع لـ "${goal}"`;
    reasoning = "الحالة العاطفية تشوّش القرار. اللحظات العاطفية ليست لحظات قرار — هي لحظات ملاحظة";
  } else {
    decision = `ابدأ "${goal}" اليوم بأول خطوة عملية مهما كانت صغيرة`;
    reasoning = "لا يوجد قيد حاسم — التأخير الآن سببه الذهن وليس الواقع";
  }

  return { decision, reasoning };
}

// ── Stage 5: EXECUTE ──

function execute(decision: string, input: DecisionInput): string {
  const goal = input.goal.shortTerm;

  // Generate today-level action
  if (input.constraints.time) {
    return `خذ 15 دقيقة الآن — اكتب على ورقة: "أول خطوة عملية نحو ${goal}". ثم نفّذها قبل النوم`;
  }
  if (input.constraints.money) {
    return `اليوم: ابحث عن شخص واحد فعل ما تريد فعله بدون رأس مال — خذ منه فكرة واحدة وطبّقها`;
  }
  if (input.currentState.emotional) {
    return `اليوم: اكتب 3 جمل تصف بالضبط ما تشعر به. لا تقرر شيء — فقط لاحظ`;
  }
  return `اليوم: نفّذ أول خطوة من ${goal} — لا تخطط، لا تبحث، فقط ابدأ`;
}

// ── Anti-Focus (What to Ignore) ──

function buildIgnoreList(input: DecisionInput): string[] {
  const ignore: string[] = [];

  if (input.constraints.money) {
    ignore.push("أي خطة تحتاج تمويل خارجي");
    ignore.push("مقارنة نفسك بمن لديه موارد أكثر");
  }
  if (input.constraints.time) {
    ignore.push("الخطط الطموحة الطويلة المدى");
    ignore.push("المهام التي تستغرق أكثر من ساعة يومياً");
  }
  if (input.currentState.emotional) {
    ignore.push("اتخاذ قرارات كبيرة في لحظات الضعف العاطفي");
  }
  if (input.goal.longTerm) {
    ignore.push("القلق على النتيجة النهائية — ركّز على اليوم فقط");
  }

  if (ignore.length === 0) {
    ignore.push("التشتت بين أكثر من اتجاه");
    ignore.push("المقارنة مع الآخرين");
  }

  return ignore;
}

// ── Confidence Score ──

function computeConfidence(input: DecisionInput): number {
  let score = 0.4;

  // More inputs = higher confidence
  if (input.currentState.financial) score += 0.1;
  if (input.currentState.emotional) score += 0.1;
  if (input.currentState.practical) score += 0.05;
  if (input.goal.shortTerm.length > 10) score += 0.15;
  if (input.constraints.money || input.constraints.time) score += 0.1;
  if (input.constraints.risks) score += 0.05;

  return Math.max(0.3, Math.min(0.95, Math.round(score * 100) / 100));
}

// ── Markdown Builder ──

function buildMarkdown(decision: Decision, input: DecisionInput): string {
  return `# قرار اليوم

## 🎯 القرار
${decision.decision}

## 🧠 لماذا هذا القرار؟
${decision.reasoning}

## ⚡ الخطوة التنفيذية
${decision.actionStep}

## ⛔ ما يجب تجاهله
${decision.ignore.map((i) => `- ${i}`).join("\n")}

---

### السياق
- **الهدف:** ${input.goal.shortTerm}
${input.goal.longTerm ? `- **المدى البعيد:** ${input.goal.longTerm}` : ""}
${input.constraints.money ? `- **القيد المالي:** ${input.constraints.money}` : ""}
${input.constraints.time ? `- **القيد الزمني:** ${input.constraints.time}` : ""}

### مسار التفكير
${decision.pipeline.map((s) => `**${stageLabel(s.stage)}:** ${s.output}`).join("\n\n")}

---
*مستوى الثقة: ${Math.round(decision.confidence * 100)}%*
`;
}

function stageLabel(stage: DecisionStage): string {
  return {
    clarify: "1. التوضيح",
    prioritize: "2. الأولوية",
    eliminate: "3. الإقصاء",
    select: "4. الاختيار",
    execute: "5. التنفيذ",
  }[stage];
}

// ── Main Pipeline ──

export function runDecisionPipeline(input: DecisionInput): Decision {
  const pipeline: StageOutput[] = [
    { stage: "clarify", output: clarify(input) },
    { stage: "prioritize", output: prioritize(input) },
    { stage: "eliminate", output: eliminate(input) },
  ];

  const selected = select(input);
  pipeline.push({ stage: "select", output: selected.decision });

  const action = execute(selected.decision, input);
  pipeline.push({ stage: "execute", output: action });

  const ignore = buildIgnoreList(input);
  const confidence = computeConfidence(input);

  const decision: Decision = {
    decision: selected.decision,
    reasoning: selected.reasoning,
    actionStep: action,
    ignore,
    pipeline,
    confidence,
    markdown: "",
  };

  decision.markdown = buildMarkdown(decision, input);
  return decision;
}

// ── Health Check Mode ──

export interface HealthCheckResult {
  status: "healthy" | "warning" | "stuck";
  contradictions: string[];
  patterns: string[];
  suggestion: string;
}

export function checkDecisionHealth(recentDecisions: { decision: string; goal: string; date: string }[]): HealthCheckResult {
  if (recentDecisions.length < 3) {
    return {
      status: "healthy",
      contradictions: [],
      patterns: [],
      suggestion: "ما عندك بيانات كافية بعد — استمر في تسجيل القرارات",
    };
  }

  // Detect repeated goals (sign of stuck loop)
  const goalCounts = new Map<string, number>();
  for (const d of recentDecisions) {
    goalCounts.set(d.goal, (goalCounts.get(d.goal) ?? 0) + 1);
  }

  const repeatedGoals = [...goalCounts.entries()].filter(([_, count]) => count >= 3);

  if (repeatedGoals.length > 0) {
    return {
      status: "stuck",
      contradictions: [],
      patterns: repeatedGoals.map(([goal]) => `هدف "${goal}" تكرر ${goalCounts.get(goal)} مرات`),
      suggestion: "يبدو أنك عالق على نفس الهدف. السؤال الحقيقي: هل المشكلة في الهدف نفسه أم في طريقة المحاولة؟",
    };
  }

  return {
    status: "healthy",
    contradictions: [],
    patterns: [],
    suggestion: "قراراتك متنوّعة — استمر",
  };
}

// Export internal functions for testing
export { clarify, prioritize, eliminate, select, execute, buildIgnoreList, computeConfidence };
