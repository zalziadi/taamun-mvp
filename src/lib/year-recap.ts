/**
 * Year-end recap helpers.
 *
 * Two cadences, per v1.4 spec (both fire):
 *   - Gregorian: Dec 31 (familiar calendar for most users)
 *   - Hijri: Muharram 1 (Hijri new year — contextually appropriate)
 *
 * Both produce the same email payload: a link to /recap + a short
 * highlight pulled from their activity over the past year.
 */

/** Hijri Islamic calendar helpers via Intl. Works in all modern Node (22+) + Vercel runtime. */
export function islamicDateParts(d: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  // "en" Islamic years include an "AH" era marker on the year part; strip if present
  const yearRaw = parts.find((p) => p.type === "year")?.value ?? "0";
  const year = parseInt(yearRaw.replace(/\D/g, ""), 10) || 0;
  return { year, month: get("month"), day: get("day") };
}

export function isHijriNewYear(d: Date = new Date()): boolean {
  const { month, day } = islamicDateParts(d);
  return month === 1 && day === 1;
}

export function isGregorianYearEnd(d: Date = new Date()): boolean {
  // Use Asia/Riyadh to match user base's primary timezone
  const fmt = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Riyadh",
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return get("month") === 12 && get("day") === 31;
}

export function currentYearLabel(variant: "gregorian" | "hijri", d: Date = new Date()): string {
  if (variant === "hijri") {
    return `${islamicDateParts(d).year}هـ`;
  }
  const fmt = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
  return fmt.format(d);
}
