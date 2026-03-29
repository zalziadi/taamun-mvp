/**
 * Computes the current streak from an array of completed day numbers.
 * Streak = longest consecutive run ending at the highest completed day.
 * e.g. [1,2,3,5,6] → streak is 2 (days 5 and 6 are consecutive at the top).
 */
export function computeStreak(days: number[]): number {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] - 1) streak++;
    else break;
  }
  return streak;
}
