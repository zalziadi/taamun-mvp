/**
 * Anticipation Loop (Micro-Addiction)
 *
 * Makes the user look forward to the next session.
 * Returns a hint of what's coming + a normalized progress indicator.
 *
 * Purpose: build psychological anticipation, not anxiety.
 */

export interface AnticipationInput {
  streak: number;          // consecutive days
  momentum: number;        // -10 to +10
}

export interface Anticipation {
  hint: string;
  progress: number;        // 0-1 normalized streak
  nextMilestone: number;   // streak day of next reward
}

const STREAK_MILESTONES = [3, 7, 14, 21, 28];

function nextMilestoneAfter(streak: number): number {
  for (const m of STREAK_MILESTONES) {
    if (m > streak) return m;
  }
  return 28;
}

function buildHint(streak: number, momentum: number): string {
  // Negative momentum = encouraging restart
  if (momentum < 0) {
    return "خطوة واحدة اليوم تكسر الجمود — وغداً يصير أسهل";
  }

  if (streak === 0) {
    return "اليوم الأول هو الأصعب — لكن الأقوى";
  }
  if (streak < 3) {
    return "أكمل يومين وبتبدأ تشعر بالفرق";
  }
  if (streak <= 7) {
    return "أنت قريب من مرحلة وضوح أعلى";
  }
  if (streak <= 14) {
    return "المرحلة القادمة: استقرار داخلي أقوى";
  }
  if (streak <= 21) {
    return "أنت تبني هوية جديدة — ليس مجرد عادة";
  }
  return "اقتربت من إكمال الرحلة — التحوّل في أعمق مراحله";
}

export function buildAnticipation(input: AnticipationInput): Anticipation {
  const safeStreak = Math.max(0, Math.min(28, input.streak));
  const progress = Math.round((safeStreak / 28) * 100) / 100;
  const nextMilestone = nextMilestoneAfter(safeStreak);
  const hint = buildHint(safeStreak, input.momentum);

  return { hint, progress, nextMilestone };
}

// Export for testing
export { nextMilestoneAfter, buildHint, STREAK_MILESTONES };
