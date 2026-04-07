/**
 * Adaptive Pressure System
 *
 * Controls intensity dynamically based on user state.
 *
 * Returns 0-1 where:
 * 0 = soft, gentle, low urgency
 * 1 = high stakes, decisive, urgent
 *
 * Rules:
 * - High resistance → low pressure (don't push when user resists)
 * - High momentum → higher pressure (ride the wave)
 * - Low commitment → soft pressure (build gently)
 */

export interface PressureInput {
  resistance: number;      // 0-1 (how much user is resisting/avoiding)
  momentum: number;        // -10 to +10
  commitment: number;      // 0-100
}

/**
 * Compute pressure level 0-1.
 */
export function detectPressure(input: PressureInput): number {
  let pressure = 0.5; // baseline

  // High resistance reduces pressure significantly
  if (input.resistance >= 0.7) pressure -= 0.35;
  else if (input.resistance >= 0.4) pressure -= 0.2;

  // High momentum amplifies pressure
  if (input.momentum >= 6) pressure += 0.3;
  else if (input.momentum >= 3) pressure += 0.15;
  else if (input.momentum < 0) pressure -= 0.1;

  // Low commitment requires soft pressure
  if (input.commitment < 30) pressure -= 0.2;
  else if (input.commitment < 50) pressure -= 0.1;
  else if (input.commitment >= 70) pressure += 0.1;

  return Math.max(0, Math.min(1, Math.round(pressure * 100) / 100));
}

// ── Pressure Levels ──

export type PressureLevel = "gentle" | "soft" | "moderate" | "firm" | "urgent";

// V4 spec: simplified 3-class system
export type PressureClassSimple = "soft" | "medium" | "strong";

export function classifyPressure(pressure: number): PressureLevel {
  if (pressure < 0.2) return "gentle";
  if (pressure < 0.4) return "soft";
  if (pressure < 0.6) return "moderate";
  if (pressure < 0.8) return "firm";
  return "urgent";
}

// V4 spec: 3-class mapping
// 0.0–0.3 → soft
// 0.3–0.6 → medium
// 0.6–1.0 → strong
export function classifyPressureSimple(pressure: number): PressureClassSimple {
  if (pressure < 0.3) return "soft";
  if (pressure < 0.6) return "medium";
  return "strong";
}

// ── Pressure-aware CTA text ──

const CTA_BY_PRESSURE: Record<PressureLevel, string[]> = {
  gentle:   ["خذ وقتك", "ابدأ بخطوة بسيطة", "خلينا نأخذ خطوة بسيطة الآن"],
  soft:     ["خطوة واحدة اليوم", "ابدأ من حيث تستطيع", "افعل اللي تقدر عليه"],
  moderate: ["ابدأ الآن", "خطوة واضحة", "قرار اليوم"],
  firm:     ["وقت الفعل", "لا تأجل", "افعل الآن"],
  urgent:   ["هذا هو الوقت — لا تؤجل", "الآن أو لا شيء", "كل ثانية تأجيل تثبّت العادة"],
};

/**
 * Returns a pressure-appropriate CTA label.
 */
export function buildPressureCTA(pressure: number): string {
  const level = classifyPressure(pressure);
  const options = CTA_BY_PRESSURE[level];
  // Deterministic pick based on pressure × 10 mod options
  const idx = Math.floor(pressure * 10) % options.length;
  return options[idx];
}

/**
 * Apply pressure to a message — adjusts urgency markers.
 */
export function applyPressureToMessage(message: string, pressure: number): string {
  const level = classifyPressure(pressure);

  if (level === "gentle") {
    return `${message} — برفق`;
  }
  if (level === "urgent") {
    return `${message} — الآن`;
  }
  return message;
}
