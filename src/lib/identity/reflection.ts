/**
 * Identity Reflection Layer
 *
 * Makes the user FEEL the transformation, not just see data.
 * After every action, generates a "before → after" mirror message in Arabic.
 */

export type IdentityReflectionAction = "decision" | "ritual" | "progress" | "reflection";

export interface IdentityReflectionInput {
  action: IdentityReflectionAction;
  identityShift: number;        // 0-1 from identity update
  previousState?: string;       // optional override
}

export interface IdentityReflection {
  message: string;
  before_state: string;
  after_state: string;
}

// ── State Maps ──

const STATE_MAP: Record<IdentityReflectionAction, { before: string; after: string }> = {
  decision: {
    before: "تفكير وتأجيل",
    after: "وضوح وفعل",
  },
  ritual: {
    before: "تشتت",
    after: "حضور",
  },
  progress: {
    before: "انحراف",
    after: "تصحيح المسار",
  },
  reflection: {
    before: "ملاحظة سطحية",
    after: "إدراك أعمق",
  },
};

// ── Intensity Modifiers ──

function intensifyState(state: string, shift: number): string {
  if (shift >= 0.5) return state;          // strong shift, use as-is
  if (shift >= 0.25) return `أقرب إلى ${state}`;
  return `بداية ${state}`;
}

function buildMessage(before: string, after: string, shift: number): string {
  if (shift >= 0.5) {
    return `أنت الآن ${after} بدل ما كنت ${before}`;
  }
  if (shift >= 0.25) {
    return `بدأت تتحرك من ${before} نحو ${after}`;
  }
  return `لاحظ التحول الصغير: من ${before} إلى ${after}`;
}

// ── Main ──

export function buildIdentityReflection(input: IdentityReflectionInput): IdentityReflection {
  const { action, identityShift } = input;
  const states = STATE_MAP[action];

  const before_state = input.previousState ?? states.before;
  const after_state = intensifyState(states.after, identityShift);
  const message = buildMessage(before_state, after_state, identityShift);

  return { message, before_state, after_state };
}

// Export internals for testing
export { STATE_MAP, intensifyState, buildMessage };
