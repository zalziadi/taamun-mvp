const TOTAL_DAYS = 28;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate the 1-based calendar day from a subscription start date.
 * Day 1 = enrollment day. Returns 1..28 clamped.
 */
export function computeCalendarDay(
  subscriptionStartDate: string | null | undefined,
  now: Date = new Date()
): number {
  if (!subscriptionStartDate) return 1;

  const start = new Date(subscriptionStartDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY) + 1; // +1: enrollment day = day 1

  return Math.max(1, Math.min(TOTAL_DAYS, diffDays));
}
