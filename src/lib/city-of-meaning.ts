export const AWARENESS_STATES = [
  { value: "shadow", label: "الظل" },
  { value: "gift", label: "الهدية" },
  { value: "best_possibility", label: "أفضل احتمال" },
] as const;

export type AwarenessState = (typeof AWARENESS_STATES)[number]["value"];

export const PRACTICES = [
  { key: "observe", label: "الملاحظة" },
  { key: "insight", label: "الإدراك" },
  { key: "contemplate", label: "التمعّن" },
] as const;

export const LIFE_DOMAINS = [
  {
    key: "identity",
    title: "الهوية",
    hint: "من أنا أمام الله؟",
    color: "from-indigo-500/20 to-indigo-300/5",
    icon: "fingerprint",
    days: [1, 2, 3],
  },
  {
    key: "relationships",
    title: "العلاقات",
    hint: "كيف أرى الناس بعدل ورحمة؟",
    color: "from-rose-500/20 to-rose-300/5",
    icon: "people",
    days: [4, 5, 6],
  },
  {
    key: "growth",
    title: "النمو",
    hint: "ما الخطوة التي تنقلني اليوم؟",
    color: "from-emerald-500/20 to-emerald-300/5",
    icon: "trending",
    days: [7, 8, 9],
  },
  {
    key: "building",
    title: "البناء",
    hint: "ما الذي أبنيه برسالتي؟",
    color: "from-amber-500/20 to-amber-300/5",
    icon: "building",
    days: [10, 11, 12],
  },
  {
    key: "beauty",
    title: "الجمال",
    hint: "كيف أرى أثر الجمال الإلهي؟",
    color: "from-fuchsia-500/20 to-fuchsia-300/5",
    icon: "sparkle",
    days: [13, 14, 15],
  },
  {
    key: "family",
    title: "الأسرة",
    hint: "كيف أصلح الدائرة الأقرب؟",
    color: "from-orange-500/20 to-orange-300/5",
    icon: "home",
    days: [16, 17, 18],
  },
  {
    key: "reflection",
    title: "المراجعة",
    hint: "ماذا علّمني هذا اليوم؟",
    color: "from-sky-500/20 to-sky-300/5",
    icon: "mirror",
    days: [19, 20, 21],
  },
  {
    key: "money",
    title: "المال",
    hint: "هل المال في اليد أم في القلب؟",
    color: "from-teal-500/20 to-teal-300/5",
    icon: "coins",
    days: [22, 23, 24],
  },
  {
    key: "giving",
    title: "العطاء",
    hint: "ما الذي أستطيع بذله الآن؟",
    color: "from-yellow-500/20 to-yellow-300/5",
    icon: "heart",
    days: [25, 26, 27, 28],
  },
] as const;

export type LifeDomain = (typeof LIFE_DOMAINS)[number];
export type DomainKey = LifeDomain["key"];

/** Determine the dominant awareness state for a domain based on its days' entries */
export function getDomainState(
  domainDays: readonly number[],
  entries: { day: number; state: AwarenessState }[]
): { state: AwarenessState | "locked"; completedDays: number; totalDays: number } {
  const domainEntries = entries.filter((e) => domainDays.includes(e.day));
  const totalDays = domainDays.length;
  const completedDays = domainEntries.length;

  if (completedDays === 0) return { state: "locked", completedDays: 0, totalDays };

  // Highest state reached across any day in this domain
  const hasBest = domainEntries.some((e) => e.state === "best_possibility");
  const hasGift = domainEntries.some((e) => e.state === "gift");

  // Domain state = best state achieved AND majority of days completed
  if (hasBest && completedDays >= Math.ceil(totalDays * 0.67)) return { state: "best_possibility", completedDays, totalDays };
  if (hasGift || hasBest) return { state: "gift", completedDays, totalDays };
  return { state: "shadow", completedDays, totalDays };
}

/** Calculate overall city illumination percentage (0-100) */
export function getCityIllumination(
  entries: { day: number; state: AwarenessState }[]
): number {
  let totalScore = 0;
  const maxScore = LIFE_DOMAINS.length * 3; // 3 = best_possibility weight

  for (const domain of LIFE_DOMAINS) {
    const ds = getDomainState(domain.days, entries);
    if (ds.state === "best_possibility") totalScore += 3;
    else if (ds.state === "gift") totalScore += 2;
    else if (ds.state === "shadow") totalScore += 1;
    // locked = 0
  }

  return Math.round((totalScore / maxScore) * 100);
}
