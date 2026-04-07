/**
 * Adaptive User Model
 *
 * A per-user model that evolves over time.
 * Stored inside user_memory.identity.adaptive_model (JSONB).
 *
 * All values clamped to 0-1.
 */

export interface UserModel {
  /** Probability threshold to trigger predictive decision (0.5-0.95) */
  decisionThreshold: number;

  /** How sensitive the user is to system pressure (0=needs hard push, 1=needs gentle) */
  pressureSensitivity: number;

  /** Preference for narrative depth (0=short, 1=full deep narrative) */
  reflectionDepthPreference: number;

  /** How consistent the user is in completing actions */
  consistencyScore: number;

  /** How resistant the user is to system suggestions */
  resistanceLevel: number;

  /** Last time the model was updated (ISO string, optional) */
  updatedAt?: string;
}

/**
 * Default user model — neutral starting point.
 * After ~5-10 interactions, the model converges toward user reality.
 */
export const DEFAULT_USER_MODEL: UserModel = {
  decisionThreshold: 0.7,
  pressureSensitivity: 0.5,
  reflectionDepthPreference: 0.5,
  consistencyScore: 0.5,
  resistanceLevel: 0.5,
};

/**
 * Clamp a value to [0, 1].
 */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

/**
 * Validate and normalize a UserModel from possibly-untyped storage.
 */
export function normalizeUserModel(input: Partial<UserModel> | null | undefined): UserModel {
  if (!input) return { ...DEFAULT_USER_MODEL };

  return {
    decisionThreshold: clamp01(input.decisionThreshold ?? DEFAULT_USER_MODEL.decisionThreshold),
    pressureSensitivity: clamp01(input.pressureSensitivity ?? DEFAULT_USER_MODEL.pressureSensitivity),
    reflectionDepthPreference: clamp01(
      input.reflectionDepthPreference ?? DEFAULT_USER_MODEL.reflectionDepthPreference
    ),
    consistencyScore: clamp01(input.consistencyScore ?? DEFAULT_USER_MODEL.consistencyScore),
    resistanceLevel: clamp01(input.resistanceLevel ?? DEFAULT_USER_MODEL.resistanceLevel),
    updatedAt: input.updatedAt,
  };
}
