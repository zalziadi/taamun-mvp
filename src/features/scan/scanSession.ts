/** Quick ayah session: pick shadow/awareness/contemplation questions by ayah keywords */
export interface QuickAyahSession {
  shadow: string;
  awareness: string;
  contemplation: string;
}

const KEYWORDS_Tawhid = ["الله أحد", "الصمد", "لا إله", "رب"];
const KEYWORDS_FearAttach = ["الناس", "الشيطان", "الدنيا", "المال"];
const KEYWORDS_Mercy = ["غفور", "رحيم", "توبة"];
const KEYWORDS_Rizq = ["رزق", "وسع", "بركة"];

const FALLBACK: QuickAyahSession = {
  shadow: "ما أبرز ظلّك اليوم؟",
  awareness: "كيف أدركت نفسك؟",
  contemplation: "ما أعمق تمعّن وصلت إليه؟",
};

const TAWHID: QuickAyahSession = {
  shadow: "ما ظلّ التوحيد في نفسك؟",
  awareness: "كيف تدرك وحدانية الله؟",
  contemplation: "ما أعمق تمعّن في قوله (قل هو الله أحد)؟",
};

const FEAR_ATTACH: QuickAyahSession = {
  shadow: "ما ظلّ التعلق أو الخوف الذي تراه؟",
  awareness: "كيف تدرك نفسك تجاه الدنيا والمال؟",
  contemplation: "ما الاستعاذة الأعمق التي تحتاجها؟",
};

const MERCY: QuickAyahSession = {
  shadow: "ما ظلّ الذنب أو الحاجة للمغفرة؟",
  awareness: "كيف تدرك رحمة الله؟",
  contemplation: "ما التوبة الأعمق التي تنشدها؟",
};

const RIZQ: QuickAyahSession = {
  shadow: "ما ظلّ القلق من الرزق؟",
  awareness: "كيف تدرك سعة رزق الله؟",
  contemplation: "ما البركة التي تبحث عنها؟",
};

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function buildQuickAyahSession(ayahText: string): QuickAyahSession {
  const t = ayahText.trim();
  if (!t) return FALLBACK;
  if (matchKeywords(t, KEYWORDS_Tawhid)) return TAWHID;
  if (matchKeywords(t, KEYWORDS_FearAttach)) return FEAR_ATTACH;
  if (matchKeywords(t, KEYWORDS_Mercy)) return MERCY;
  if (matchKeywords(t, KEYWORDS_Rizq)) return RIZQ;
  return FALLBACK;
}
