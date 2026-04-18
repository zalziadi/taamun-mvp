/**
 * Calendar Day Helper — Asia/Riyadh anchored.
 *
 * INVARIANT (RETURN-06 + PITFALLS.md #3):
 *   Day boundaries MUST resolve to the Asia/Riyadh calendar date, never
 *   the server's local timezone (Vercel functions run in UTC by default),
 *   never UTC directly. A user who activates at 23:00 Riyadh time on day 27
 *   and returns at 06:00 the next morning MUST see Day 28.
 *
 * IMPLEMENTATION NOTE:
 *   We use `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", ... })`
 *   because `en-CA` produces ISO-like `YYYY-MM-DD` formatting which sorts
 *   lexicographically as a date — the standard trick for timezone-safe
 *   date extraction without a third-party library.
 *
 *   `Intl` is built into the JavaScript runtime in both Node.js (Vercel
 *   Functions) and browsers, so this preserves NFR-08 (zero new runtime
 *   dependencies).
 */

const TOTAL_DAYS = 28;
const TIMEZONE = "Asia/Riyadh";
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Canonical "YYYY-MM-DD in Asia/Riyadh" extractor.
function toRiyadhDateString(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date); // "YYYY-MM-DD"
}

// Calendar-day delta between two instants, measured in Asia/Riyadh.
function riyadhDaysBetween(startIso: string, nowDate: Date): number {
  const startDate = new Date(startIso);
  if (isNaN(startDate.getTime())) return 0;
  const startStr = toRiyadhDateString(startDate);
  const nowStr = toRiyadhDateString(nowDate);
  // Parse both as midnight UTC to measure calendar-day delta without TZ drift.
  const startMidnight = new Date(`${startStr}T00:00:00Z`).getTime();
  const nowMidnight = new Date(`${nowStr}T00:00:00Z`).getTime();
  const diffMs = nowMidnight - startMidnight;
  return Math.floor(diffMs / MS_PER_DAY);
}

/**
 * Calculate the 1-based calendar day from a subscription start date.
 * Day 1 = enrollment day. Returns 1..28 clamped.
 *
 * Anchored to Asia/Riyadh — see file-header invariant.
 */
export function computeCalendarDay(
  subscriptionStartDate: string | null | undefined,
  now: Date = new Date()
): number {
  if (!subscriptionStartDate) return 1;

  const deltaDays = riyadhDaysBetween(subscriptionStartDate, now);
  // +1 so enrollment day = day 1 (preserves existing contract).
  const dayNumber = deltaDays + 1;

  return Math.max(1, Math.min(TOTAL_DAYS, dayNumber));
}
