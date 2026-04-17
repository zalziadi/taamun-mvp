/**
 * Streak Protection — "اليوم الحقيقي" ينتهي عند الفجر (3 AM) لا منتصف الليل.
 *
 * Many users pray/reflect late at night. Ending the "day" at midnight UTC
 * or even local midnight punishes late-night users by breaking their streak.
 *
 * This utility treats 00:00-02:59 as still "yesterday" — giving users a
 * 3-hour grace period to complete their reflection without losing streak.
 */

/** Returns the effective date for a reflection, treating 00:00-02:59 as previous day. */
export function getEffectiveDate(date: Date = new Date()): Date {
  const hour = date.getHours();
  if (hour < 3) {
    // Still "yesterday" in spiritual time
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  return date;
}

/** Returns YYYY-MM-DD for the effective date */
export function getEffectiveDateString(date: Date = new Date()): string {
  const eff = getEffectiveDate(date);
  const year = eff.getFullYear();
  const month = String(eff.getMonth() + 1).padStart(2, "0");
  const day = String(eff.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Time left before "day" ends (3 AM tomorrow).
 * Returns a human-readable Arabic string, or null if day just started.
 */
export function getTimeUntilDayEnd(): string | null {
  const now = new Date();
  const hour = now.getHours();

  // Before 3 AM: day ends at 3 AM today
  // After 3 AM: day ends at 3 AM tomorrow
  const endOfDay = new Date(now);
  if (hour < 3) {
    endOfDay.setHours(3, 0, 0, 0);
  } else {
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(3, 0, 0, 0);
  }

  const msLeft = endOfDay.getTime() - now.getTime();
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  // Only show for the last 4 hours — don't nag users
  if (hoursLeft >= 4) return null;

  if (hoursLeft < 1) {
    return `تبقى ${minutesLeft} دقيقة قبل نهاية يومك`;
  }
  return `تبقى ${toArabicNumber(hoursLeft)} ساعات قبل نهاية يومك`;
}

/**
 * Check if user is in "late night" mode (00:00-02:59).
 * Used to show softer messaging: "اليوم لم ينتهِ بعد".
 */
export function isLateNight(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 3;
}

function toArabicNumber(n: number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n).split("").map((d) => map[parseInt(d, 10)] ?? d).join("");
}
