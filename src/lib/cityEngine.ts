import type { UserIdentity } from "./identityTracker";
import type { ProgressState } from "./progressEngine";
import type { CognitiveContext } from "./cognitiveContext";
import type { JourneyState } from "./journeyState";
import type { Pattern } from "./reflectionLinker";

// ── Types ──

export type ZoneState = "weak" | "growing" | "stable" | "thriving";

export interface CityZone {
  id: string;
  name: string;
  state: ZoneState;
  signal: string;
  energy: number; // 0-100, internal scoring (exposed for system, not UI)
}

export interface CityMap {
  zones: CityZone[];
  dominantZone: string | null;
  weakestZone: string | null;
}

export interface CityInputs {
  identity: UserIdentity | null;
  progress: ProgressState;
  context: CognitiveContext | null;
  journey: JourneyState;
  patterns: Pattern[];
  actionsCompleted: number;
  actionEffectiveness: number; // avg 0-10
}

// ── Zone Definitions ──

const ZONE_META: { id: string; name: string }[] = [
  { id: "identity", name: "الهوية" },
  { id: "relationships", name: "العلاقات" },
  { id: "new_experiences", name: "التجارب الجديدة" },
  { id: "discipline", name: "البناء والنظام" },
  { id: "beauty", name: "الجمال والمغامرة" },
  { id: "family", name: "العائلة والعطاء" },
  { id: "reflection", name: "التمعّن والتدبر" },
  { id: "power", name: "المال والقوة" },
  { id: "action", name: "الفعل والخير" },
];

// ── Pattern Keywords per Zone ──

const ZONE_KEYWORDS: Record<string, string[]> = {
  identity: ["هوية", "ذات", "من أنا", "شخصية", "نفس"],
  relationships: ["علاقة", "تواصل", "قرب", "وحدة", "حب", "ناس"],
  new_experiences: ["جرأة", "تجربة", "مغامرة", "إقدام", "جديد"],
  discipline: ["نظام", "التزام", "تكرار", "روتين", "انضباط"],
  beauty: ["جمال", "متعة", "فرح", "تذوق", "خفة", "سلام"],
  family: ["عائلة", "عطاء", "خدمة", "دعم", "رعاية"],
  reflection: ["تأمل", "وعي", "إدراك", "حقيقة", "معنى", "حكمة", "يقين"],
  power: ["قوة", "مال", "قرار", "تأثير", "حسم"],
  action: ["فعل", "عمل", "أثر", "تغيير", "بناء", "إنجاز"],
};

// ── Energy Calculators ──

function energyFromState(state: ZoneState): number {
  switch (state) { case "weak": return 15; case "growing": return 40; case "stable": return 65; case "thriving": return 90; }
}

function stateFromEnergy(energy: number): ZoneState {
  if (energy >= 75) return "thriving";
  if (energy >= 50) return "stable";
  if (energy >= 25) return "growing";
  return "weak";
}

function patternEnergyForZone(zoneId: string, patterns: Pattern[]): number {
  const keywords = ZONE_KEYWORDS[zoneId] ?? [];
  let energy = 0;
  for (const p of patterns) {
    if (keywords.some((kw) => p.keyword.includes(kw) || kw.includes(p.keyword))) {
      energy += p.weight * 3;
    }
  }
  return Math.min(40, energy); // max 40 from patterns alone
}

// ── Zone Builders ──

function buildIdentityZone(inputs: CityInputs): number {
  let e = 20;
  const { identity } = inputs;
  if (!identity) return e;
  if (identity.trajectory === "improving") e += 25;
  else if (identity.trajectory === "unstable") e += 10;
  if (identity.engagementScore >= 60) e += 15;
  if (identity.transformationSignal === "deepening" || identity.transformationSignal === "integrated") e += 20;
  e += patternEnergyForZone("identity", inputs.patterns);
  return Math.min(100, e);
}

function buildRelationshipsZone(inputs: CityInputs): number {
  let e = 20;
  e += patternEnergyForZone("relationships", inputs.patterns);
  // Emotional patterns related to connection
  const emotionalPatterns = inputs.patterns.filter((p) => p.type === "emotional");
  if (emotionalPatterns.some((p) => p.keyword === "حب" || p.keyword === "سلام")) e += 15;
  if (emotionalPatterns.some((p) => p.keyword === "وحدة")) e -= 10;
  return Math.max(0, Math.min(100, e));
}

function buildNewExperiencesZone(inputs: CityInputs): number {
  let e = 15;
  e += patternEnergyForZone("new_experiences", inputs.patterns);
  // Actions = trying new things
  if (inputs.actionsCompleted > 3) e += 15;
  if (inputs.actionsCompleted > 7) e += 15;
  // Behavioral patterns
  if (inputs.patterns.some((p) => p.keyword === "إقدام")) e += 20;
  if (inputs.patterns.some((p) => p.keyword === "مقاومة" || p.keyword === "تردد")) e -= 10;
  return Math.max(0, Math.min(100, e));
}

function buildDisciplineZone(inputs: CityInputs): number {
  let e = 10;
  const { progress } = inputs;
  e += Math.min(30, progress.streak * 4);
  e += Math.round(progress.completionRate * 25);
  if (progress.momentum >= 5) e += 15;
  else if (progress.momentum >= 0) e += 5;
  e += patternEnergyForZone("discipline", inputs.patterns);
  return Math.min(100, e);
}

function buildBeautyZone(inputs: CityInputs): number {
  let e = 20;
  e += patternEnergyForZone("beauty", inputs.patterns);
  if (inputs.patterns.some((p) => p.keyword === "فرح" || p.keyword === "سلام")) e += 20;
  if (inputs.journey.emotionalState === "engaged") e += 10;
  return Math.min(100, e);
}

function buildFamilyZone(inputs: CityInputs): number {
  let e = 20;
  e += patternEnergyForZone("family", inputs.patterns);
  if (inputs.patterns.some((p) => p.keyword === "عطاء" || p.keyword === "خدمة")) e += 25;
  return Math.min(100, e);
}

function buildReflectionZone(inputs: CityInputs): number {
  let e = 10;
  const { identity, context } = inputs;
  e += patternEnergyForZone("reflection", inputs.patterns);
  if (identity?.reflectionDepth === "deep") e += 30;
  else if (identity?.reflectionDepth === "moderate") e += 15;
  if (context?.awarenessLevel === "deep") e += 20;
  else if (context?.awarenessLevel === "growing") e += 10;
  if (identity && identity.totalReflections > 7) e += 10;
  return Math.min(100, e);
}

function buildPowerZone(inputs: CityInputs): number {
  let e = 15;
  e += patternEnergyForZone("power", inputs.patterns);
  if (inputs.journey.currentMode === "breakthrough") e += 25;
  if (inputs.progress.momentum >= 5) e += 15;
  // Decision-making = power
  if (inputs.actionsCompleted > 5) e += 10;
  return Math.min(100, e);
}

function buildActionZone(inputs: CityInputs): number {
  let e = 10;
  e += patternEnergyForZone("action", inputs.patterns);
  e += Math.min(30, inputs.actionsCompleted * 5);
  if (inputs.actionEffectiveness >= 7) e += 20;
  else if (inputs.actionEffectiveness >= 4) e += 10;
  return Math.min(100, e);
}

// ── Signal Generators ──

const ZONE_SIGNALS: Record<string, Record<ZoneState, string>> = {
  identity: {
    weak: "هويتك لا تزال في مرحلة البحث — وهذا طبيعي في البداية",
    growing: "بدأت تتشكّل ملامح من أنت — استمر في الاكتشاف",
    stable: "عندك وضوح جيد عن نفسك — حان وقت البناء عليه",
    thriving: "هويتك واضحة ومتّسقة — أنت تعرف من أنت",
  },
  relationships: {
    weak: "العلاقات تحتاج انتباه — لاحظ كيف تتواصل",
    growing: "بدأت تلاحظ أنماط علاقاتك — هذا وعي مهم",
    stable: "علاقاتك فيها توازن جيد",
    thriving: "تواصلك مع الآخرين عميق ومؤثر",
  },
  new_experiences: {
    weak: "منطقة الراحة واسعة — جرّب شيء يخرجك منها",
    growing: "بدأت تتحرك — كل خطوة جديدة تبني شجاعة",
    stable: "عندك مرونة جيدة مع التجارب الجديدة",
    thriving: "أنت في حالة استكشاف مستمر — الحياة حية عندك",
  },
  discipline: {
    weak: "النظام يحتاج بناء — ابدأ بخطوة يومية واحدة",
    growing: "بدأت تبني عادة — الاستمرار هو المفتاح",
    stable: "نظامك قوي — وهذا أساس كل تحوّل",
    thriving: "انضباطك استثنائي — أنت تصنع عادات تدوم",
  },
  beauty: {
    weak: "وقت تضيف جمال لحياتك — تذوّق شيء اليوم",
    growing: "بدأت تلاحظ الجمال حولك — وهذا نوع من الوعي",
    stable: "عندك تذوّق جيد للحياة",
    thriving: "الجمال جزء من يومك — أنت تعيش بوعي حسّي",
  },
  family: {
    weak: "العطاء للآخرين يحتاج نيّة — ابدأ بفعل صغير",
    growing: "روابطك العائلية بدأت تتقوى",
    stable: "عندك توازن بين العطاء والاهتمام بنفسك",
    thriving: "قلبك مفتوح — عطاؤك يصل ويؤثر",
  },
  reflection: {
    weak: "التمعّن يحتاج مساحة — خصص دقائق يومية للصمت",
    growing: "تأملاتك بدأت تتعمق — استمر",
    stable: "عندك عادة تأمل قوية",
    thriving: "أنت في حالة وعي عميق — التمعّن صار جزء من تفكيرك",
  },
  power: {
    weak: "القوة تبدأ من القرار — اتخذ قرار صغير اليوم",
    growing: "بدأت تتحرك بحسم — هذه قوة حقيقية",
    stable: "عندك حضور وتأثير واضح",
    thriving: "أنت في مرحلة قوة — قراراتك واثقة ومؤثرة",
  },
  action: {
    weak: "الأثر يبدأ بفعل واحد — نفّذ شيء اليوم",
    growing: "أفعالك بدأت تتراكم — كل فعل يحسب",
    stable: "عندك أثر ملموس من أفعالك",
    thriving: "أنت تصنع أثر حقيقي — أفعالك تغيّر الواقع",
  },
};

function getSignal(zoneId: string, state: ZoneState): string {
  return ZONE_SIGNALS[zoneId]?.[state] ?? "هذه المنطقة تنتظر اهتمامك";
}

// ── Main Builder ──

const ZONE_BUILDERS: Record<string, (inputs: CityInputs) => number> = {
  identity: buildIdentityZone,
  relationships: buildRelationshipsZone,
  new_experiences: buildNewExperiencesZone,
  discipline: buildDisciplineZone,
  beauty: buildBeautyZone,
  family: buildFamilyZone,
  reflection: buildReflectionZone,
  power: buildPowerZone,
  action: buildActionZone,
};

export function buildCityMap(inputs: CityInputs): CityMap {
  const zones: CityZone[] = ZONE_META.map(({ id, name }) => {
    const builder = ZONE_BUILDERS[id];
    const energy = builder ? builder(inputs) : 20;
    const state = stateFromEnergy(energy);
    const signal = getSignal(id, state);
    return { id, name, state, signal, energy };
  });

  const sorted = [...zones].sort((a, b) => b.energy - a.energy);
  const dominantZone = sorted[0]?.energy >= 50 ? sorted[0].id : null;
  const weakestZone = sorted[sorted.length - 1]?.energy < 50 ? sorted[sorted.length - 1].id : null;

  return { zones, dominantZone, weakestZone };
}

// Export for testing
export { stateFromEnergy, patternEnergyForZone, getSignal, ZONE_META };
