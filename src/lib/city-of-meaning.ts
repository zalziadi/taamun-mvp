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
  },
  {
    key: "relationships",
    title: "العلاقات",
    hint: "كيف أرى الناس بعدل ورحمة؟",
    color: "from-rose-500/20 to-rose-300/5",
  },
  {
    key: "growth",
    title: "النمو",
    hint: "ما الخطوة التي تنقلني اليوم؟",
    color: "from-emerald-500/20 to-emerald-300/5",
  },
  {
    key: "building",
    title: "البناء",
    hint: "ما الذي أبنيه برسالتي؟",
    color: "from-amber-500/20 to-amber-300/5",
  },
  {
    key: "beauty",
    title: "الجمال",
    hint: "كيف أرى أثر الجمال الإلهي؟",
    color: "from-fuchsia-500/20 to-fuchsia-300/5",
  },
  {
    key: "family",
    title: "الأسرة",
    hint: "كيف أصلح الدائرة الأقرب؟",
    color: "from-orange-500/20 to-orange-300/5",
  },
  {
    key: "reflection",
    title: "المراجعة",
    hint: "ماذا علّمني هذا اليوم؟",
    color: "from-sky-500/20 to-sky-300/5",
  },
  {
    key: "money",
    title: "المال",
    hint: "هل المال في اليد أم في القلب؟",
    color: "from-teal-500/20 to-teal-300/5",
  },
  {
    key: "giving",
    title: "العطاء",
    hint: "ما الذي أستطيع بذله الآن؟",
    color: "from-yellow-500/20 to-yellow-300/5",
  },
] as const;
