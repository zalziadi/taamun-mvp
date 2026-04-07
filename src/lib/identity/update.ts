/**
 * Identity Update Engine
 *
 * Every action updates identity.
 * Returns shift + trajectory delta to be merged into UserIdentity.
 */

export type IdentityActionType = "decision" | "ritual" | "progress" | "reflection";

export interface IdentityUpdateInput {
  action: IdentityActionType;
  intensity: number;       // 0-1 (how strong the action was)
}

export interface IdentityUpdateResult {
  identity_shift: number;          // -1 to +1 (positive = identity strengthening)
  trajectory_delta: number;        // -1 to +1 (positive = trajectory improving)
  reason: string;                  // Arabic explanation
}

/**
 * Action weights:
 * - decision: high shift (decisive moments transform identity)
 * - ritual: stability (consistent identity reinforcement)
 * - progress: correction (catching up = realignment)
 * - reflection: gentle deepening
 */
const ACTION_WEIGHTS: Record<IdentityActionType, { shift: number; trajectory: number }> = {
  decision:   { shift: 0.6, trajectory: 0.4 },
  ritual:     { shift: 0.2, trajectory: 0.3 },
  progress:   { shift: 0.3, trajectory: 0.5 },
  reflection: { shift: 0.4, trajectory: 0.2 },
};

const ACTION_REASONS: Record<IdentityActionType, string> = {
  decision:   "القرار يحوّل من 'يفكّر' إلى 'يفعل' — أعمق تغيير في الهوية",
  ritual:     "الطقس اليومي يثبّت من تكون — ليس لحظة، بل بناء",
  progress:   "العودة بعد التوقف هي إعادة التزام بنفسك",
  reflection: "كل تأمل يضيف طبقة جديدة لفهمك لذاتك",
};

export function updateIdentityState(input: IdentityUpdateInput): IdentityUpdateResult {
  const weights = ACTION_WEIGHTS[input.action];
  const intensity = Math.max(0, Math.min(1, input.intensity));

  return {
    identity_shift: Math.round(weights.shift * intensity * 100) / 100,
    trajectory_delta: Math.round(weights.trajectory * intensity * 100) / 100,
    reason: ACTION_REASONS[input.action],
  };
}

/**
 * Compute cumulative shift across multiple actions.
 */
export function aggregateIdentityUpdates(updates: IdentityUpdateResult[]): {
  total_shift: number;
  total_trajectory_delta: number;
} {
  const total_shift = updates.reduce((sum, u) => sum + u.identity_shift, 0);
  const total_trajectory_delta = updates.reduce((sum, u) => sum + u.trajectory_delta, 0);

  return {
    total_shift: Math.round(total_shift * 100) / 100,
    total_trajectory_delta: Math.round(total_trajectory_delta * 100) / 100,
  };
}
