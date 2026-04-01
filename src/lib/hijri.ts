/**
 * Hijri date utilities using Intl.DateTimeFormat (no external dependencies).
 * Calendar: islamic-umalqura (Saudi Arabia official calendar).
 */

const HIJRI_MONTHS = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
] as const;

type HijriDate = {
  year: number;
  month: number;
  day: number;
};

/** Parse Hijri parts from a Gregorian Date using Intl. */
export function gregorianToHijri(date: Date = new Date()): HijriDate {
  const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? 0);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 0);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 0);
  return { year, month, day };
}

/** Current Hijri date. */
export function getHijriDate(): HijriDate {
  return gregorianToHijri(new Date());
}

/** Format: "٣ رمضان ١٤٤٧" */
export function formatHijri(hijri: HijriDate): string {
  const dayAr = hijri.day.toLocaleString("ar-SA");
  const yearAr = hijri.year.toLocaleString("ar-SA");
  const monthName = getHijriMonthName(hijri.month);
  return `${dayAr} ${monthName} ${yearAr}`;
}

/** Month name in Arabic (1-indexed). */
export function getHijriMonthName(month: number): string {
  return HIJRI_MONTHS[month - 1] ?? "";
}
