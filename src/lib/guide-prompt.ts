/**
 * Guide prompt builder — يبني system prompt لدليل التمعّن
 */

export interface UserMemory {
  patterns: string[];
  awareness_level: string;
  commitment_score: number;
  last_topic: string | null;
  last_action_taken: boolean;
  current_day: number;
  conversion_stage: string;
  actions_completed: number;
}

/**
 * يبني system prompt بناءً على ذاكرة المستخدم
 */
export function buildGuideSystemPrompt(memory: UserMemory): string {
  const stage = detectConversionStage(memory);
  const dayContext = memory.current_day <= 7
    ? "المرحلة الأولى — بناء عادة التأمل"
    : memory.current_day <= 14
      ? "المرحلة الثانية — تعميق الملاحظة"
      : memory.current_day <= 21
        ? "المرحلة الثالثة — اكتشاف الأنماط"
        : "المرحلة الرابعة — التحوّل";

  return `أنت دليل التمعّن — مرشد روحي هادئ يساعد المتمعّن على اكتشاف المعنى في القرآن.

## مبادئك:
- لا تُلقّن. اسأل أسئلة تفتح باب التأمل
- كل إجابة قصيرة (جملتين-ثلاث)
- ابدأ بالملاحظة قبل التفسير
- اربط بين النص والحياة اليومية
- لا تستخدم لغة وعظية أو أكاديمية

## سياق المتمعّن:
- اليوم: ${memory.current_day}/28 (${dayContext})
- مستوى الوعي: ${memory.awareness_level}
- الالتزام: ${memory.commitment_score}/100
- الأنماط المكتشفة: ${memory.patterns.length > 0 ? memory.patterns.slice(-5).join("، ") : "لم تُكتشف بعد"}
- المرحلة: ${stage}
${memory.last_topic ? `- آخر موضوع: ${memory.last_topic}` : ""}
${memory.last_action_taken ? "- أكمل التمرين الأخير ✓" : ""}

## أسلوب الرد:
أجب بـ JSON فقط:
{
  "reply": "ردك هنا",
  "stage": "question|reflection|action|growth_trigger",
  "memory_update": { "patterns": [], "awareness_level": "", "action_given": "" },
  "done": false
}`;
}

/**
 * يحدد مرحلة التحويل بناءً على ذاكرة المستخدم
 */
export function detectConversionStage(memory: UserMemory): string {
  if (memory.conversion_stage && memory.conversion_stage !== "cold") {
    return memory.conversion_stage;
  }
  if (memory.actions_completed >= 5) return "ready";
  if (memory.actions_completed >= 2) return "warm";
  if (memory.commitment_score >= 50) return "interested";
  return "cold";
}
