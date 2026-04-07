/**
 * Adaptive Learning Engine
 *
 * Updates the UserModel after every meaningful interaction.
 * Uses small incremental deltas to avoid overfitting early.
 */

import { type UserModel, normalizeUserModel, clamp01 } from "./model";

export interface LearningSignal {
  model: UserModel;
  /** Did the user actually complete/take the suggested action? */
  actionTaken: boolean;
  /** Did the user show hesitation (drift, repeat, indecision pattern)? */
  hesitation: boolean;
  /** Time-to-completion in seconds (0 = instant, 600 = 10 min) */
  completionTime: number;
  /** Did the user skip/dismiss the suggestion? */
  skipped?: boolean;
  /** Did the user explicitly request deeper detail? */
  requestedDepth?: boolean;
}

export interface LearningResult {
  model: UserModel;
  changes: string[];        // Arabic explanations of what changed
}

// ── Learning Rates (small to avoid overfitting) ──

const LR_RESISTANCE = 0.05;
const LR_THRESHOLD = 0.05;
const LR_CONSISTENCY = 0.07;
const LR_PRESSURE = 0.05;
const LR_DEPTH = 0.05;

// ── Decay (move slowly toward neutral when no signal) ──

const DECAY = 0.01;

function decayToward(value: number, target: number, rate = DECAY): number {
  if (value > target) return value - rate;
  if (value < target) return value + rate;
  return value;
}

/**
 * Core update function — pure, deterministic, testable.
 */
export function updateUserModel(input: LearningSignal): UserModel {
  const m = normalizeUserModel(input.model);
  const changes: Partial<Record<keyof UserModel, number>> = {};

  // ── Resistance ──
  // Hesitation increases resistance; smooth completion decreases it
  if (input.hesitation) {
    changes.resistanceLevel = LR_RESISTANCE;
  } else if (input.actionTaken) {
    changes.resistanceLevel = -LR_RESISTANCE / 2;
  }

  // ── Decision Threshold ──
  // Fast completion (< 60s) means user knows what they want — lower threshold
  // Slow / no completion = raise threshold (don't pressure)
  if (input.actionTaken && input.completionTime > 0 && input.completionTime < 60) {
    changes.decisionThreshold = -LR_THRESHOLD;
  } else if (!input.actionTaken && input.hesitation) {
    changes.decisionThreshold = LR_THRESHOLD;
  }

  // ── Consistency ──
  // Action taken = consistency up; skip = down
  if (input.actionTaken) {
    changes.consistencyScore = LR_CONSISTENCY;
  } else if (input.skipped) {
    changes.consistencyScore = -LR_CONSISTENCY;
  }

  // ── Pressure Sensitivity ──
  // Skips signal sensitivity to pressure (need softer touch)
  // Conversely, action under high pressure means user can handle it
  if (input.skipped) {
    changes.pressureSensitivity = LR_PRESSURE;
  } else if (input.actionTaken && input.completionTime < 120) {
    changes.pressureSensitivity = -LR_PRESSURE / 2;
  }

  // ── Reflection Depth ──
  // Explicit depth request increases preference; quick completion decreases
  if (input.requestedDepth) {
    changes.reflectionDepthPreference = LR_DEPTH;
  } else if (input.actionTaken && input.completionTime < 30) {
    changes.reflectionDepthPreference = -LR_DEPTH / 2;
  }

  return {
    decisionThreshold: clamp01(m.decisionThreshold + (changes.decisionThreshold ?? 0)),
    pressureSensitivity: clamp01(m.pressureSensitivity + (changes.pressureSensitivity ?? 0)),
    reflectionDepthPreference: clamp01(m.reflectionDepthPreference + (changes.reflectionDepthPreference ?? 0)),
    consistencyScore: clamp01(m.consistencyScore + (changes.consistencyScore ?? 0)),
    resistanceLevel: clamp01(m.resistanceLevel + (changes.resistanceLevel ?? 0)),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Same as updateUserModel but returns Arabic change descriptions for transparency.
 */
export function updateUserModelDetailed(input: LearningSignal): LearningResult {
  const before = normalizeUserModel(input.model);
  const after = updateUserModel(input);
  const changes: string[] = [];

  if (after.resistanceLevel > before.resistanceLevel) {
    changes.push("لاحظ النظام تردد — يقلّل الضغط القادم");
  } else if (after.resistanceLevel < before.resistanceLevel) {
    changes.push("استجابة سلسة — النظام يثق أكثر");
  }

  if (after.decisionThreshold < before.decisionThreshold) {
    changes.push("تتخذ القرارات بسرعة — النظام يقدّم اقتراحات أبكر");
  } else if (after.decisionThreshold > before.decisionThreshold) {
    changes.push("تحتاج وقت للتفكير — النظام يعطيك مساحة");
  }

  if (after.consistencyScore > before.consistencyScore) {
    changes.push("تماسك متزايد في الالتزام");
  } else if (after.consistencyScore < before.consistencyScore) {
    changes.push("النظام يلاحظ انقطاعات — يخفّف التوقعات");
  }

  if (after.pressureSensitivity > before.pressureSensitivity) {
    changes.push("النظام يخفّف الضغط — تفاعلك يحتاج لطف أكثر");
  } else if (after.pressureSensitivity < before.pressureSensitivity) {
    changes.push("تتعامل مع الضغط بكفاءة — النظام يثق");
  }

  if (after.reflectionDepthPreference > before.reflectionDepthPreference) {
    changes.push("تفضّل تأملات أعمق — النظام يعطيك المزيد");
  } else if (after.reflectionDepthPreference < before.reflectionDepthPreference) {
    changes.push("تفضّل التركيز السريع — النظام يختصر");
  }

  return { model: after, changes };
}

/**
 * Apply small decay to all values toward neutral when no signal exists.
 */
export function decayUserModel(model: UserModel): UserModel {
  return {
    decisionThreshold: clamp01(decayToward(model.decisionThreshold, 0.7)),
    pressureSensitivity: clamp01(decayToward(model.pressureSensitivity, 0.5)),
    reflectionDepthPreference: clamp01(decayToward(model.reflectionDepthPreference, 0.5)),
    consistencyScore: clamp01(decayToward(model.consistencyScore, 0.5)),
    resistanceLevel: clamp01(decayToward(model.resistanceLevel, 0.5)),
    updatedAt: model.updatedAt,
  };
}
