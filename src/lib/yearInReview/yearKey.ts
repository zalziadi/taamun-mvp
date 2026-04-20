/**
 * Phase 11 — Year-in-Review year_key helpers (YIR-04).
 *
 * Computes `"YYYY_anniversary"` year keys anchored on a user's
 * `activation_started_at` (fallback `created_at`). The anniversary date
 * (month + day) is resolved in Asia/Riyadh calendar time so a user who
 * activated at 23:00 Riyadh time doesn't get the wrong anniversary day
 * when the Vercel function runs in UTC.
 *
 * PITFALL #11 defense: Never use Gregorian `.getFullYear()` on a UTC Date
 * directly. The year-in-review window is anchored on activation anniversary,
 * NOT the Gregorian calendar year.
 *
 * No DB, no fetch, no React. Pure logic. Deterministic via explicit `now`
 * argument. Zero new dependencies (NFR-08).
 */

import { YEAR_KEY_PATTERN } from "./types";

const TIMEZONE = "Asia/Riyadh";

interface RiyadhYMD {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

/**
 * Extract the calendar Y/M/D for an instant as observed in Asia/Riyadh.
 * Uses `en-CA` formatter (produces `YYYY-MM-DD`) — the standard timezone-safe
 * date-extraction trick used elsewhere in the codebase (see calendarDay.ts).
 */
function toRiyadhYMD(d: Date): RiyadhYMD {
  if (isNaN(d.getTime())) {
    throw new Error("yearKey: invalid Date");
  }
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const iso = fmt.format(d); // "YYYY-MM-DD"
  const [y, m, day] = iso.split("-").map((n) => parseInt(n, 10));
  return { year: y, month: m, day };
}

/** Parse a date-ish string, throwing on garbage. */
function safeParseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Compute the year_key for a user profile.
 *
 *   anchor = activation_started_at ?? created_at (both parsed in Asia/Riyadh)
 *   today  = now (defaults to new Date())
 *
 * Strategy: find the most-recent anniversary of `anchor` that is ≤ `today`.
 * The `year_key` is `<that anniversary's year>_anniversary`. This gives
 * the YIR window `[anniversary, anniversary + 1 year)`.
 *
 * Examples:
 *   activation=2026-03-01, now=2027-04-20 → "2027_anniversary" (window 2027-03-01..2028-03-01)
 *   activation=2026-09-01, now=2027-03-01 → "2026_anniversary" (next anniv 2027-09 not reached yet)
 *
 * Throws if both anchor inputs are invalid.
 */
export function yearKeyForUser(
  profile: {
    activation_started_at: string | null | undefined;
    created_at: string | null | undefined;
  },
  now: Date = new Date()
): string {
  const anchor =
    safeParseDate(profile.activation_started_at) ??
    safeParseDate(profile.created_at);
  if (!anchor) {
    throw new Error(
      "yearKeyForUser: neither activation_started_at nor created_at is a valid date"
    );
  }
  if (isNaN(now.getTime())) {
    throw new Error("yearKeyForUser: `now` is an invalid Date");
  }

  const anchorYMD = toRiyadhYMD(anchor);
  const nowYMD = toRiyadhYMD(now);

  // "Has the (anchor's month,day) anniversary already occurred in nowYMD.year?"
  // Comparison is on (month,day) lex-order.
  const nowBeforeAnniv =
    nowYMD.month < anchorYMD.month ||
    (nowYMD.month === anchorYMD.month && nowYMD.day < anchorYMD.day);

  const anniversaryYear = nowBeforeAnniv ? nowYMD.year - 1 : nowYMD.year;

  const key = `${anniversaryYear}_anniversary`;
  // Sanity: should always match, but keep an invariant check so test #3 is meaningful.
  if (!YEAR_KEY_PATTERN.test(key)) {
    throw new Error(`yearKeyForUser: produced malformed key: ${key}`);
  }
  return key;
}

/**
 * Inverse of yearKeyForUser: given a valid `year_key` and the anchor Date
 * (activation_started_at OR created_at — same source used to construct the
 * key), return the [start, end) window boundaries in UTC.
 *
 * The window is anchored on the anchor's month/day at 00:00 UTC. We use UTC
 * here (not Asia/Riyadh) because the window is used against `created_at`
 * timestamps stored in UTC — and the 3h Riyadh offset is immaterial at the
 * year-window granularity.
 *
 * Throws on malformed year_key or invalid anchor.
 */
export function parseYearKey(
  key: string,
  anchor: Date
): { start: Date; end: Date } {
  if (!YEAR_KEY_PATTERN.test(key)) {
    throw new Error(`parseYearKey: malformed key: ${JSON.stringify(key)}`);
  }
  if (isNaN(anchor.getTime())) {
    throw new Error("parseYearKey: invalid anchor Date");
  }
  const year = parseInt(key.slice(0, 4), 10);
  const month = anchor.getUTCMonth(); // 0..11
  const day = anchor.getUTCDate(); // 1..31

  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, month, day, 0, 0, 0, 0));
  return { start, end };
}
