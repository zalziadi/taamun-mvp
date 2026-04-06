export interface IdentitySnapshot {
  date: string;
  engagementScore: number;
  transformationSignal: string;
  trajectory: string;
}

export interface UserIdentity {
  completionPattern: "consistent" | "bursty" | "declining" | "absent";
  avgDriftFrequency: number;
  reflectionDepth: "surface" | "moderate" | "deep";
  preferredTime: string | null;
  recurringThemes: string[];
  dominantEmotion: string | null;
  awarenessProgression: "growing" | "plateaued" | "fluctuating";
  totalReflections: number;
  avgReflectionLength: number;
  daysWithReflection: number;
  guideSessions: number;
  engagementScore: number;
  transformationSignal: "early" | "emerging" | "deepening" | "integrated";
  trajectory: "improving" | "declining" | "unstable";
  identityTimeline: IdentitySnapshot[];
}

interface IdentityInputs {
  completedDays: number[];
  totalDays: number;
  currentDay: number;
  driftHistory: number[];
  reflections: { day: number; note: string | null; emotion: string | null; awareness_state: string | null }[];
  guideSessionCount: number;
  themes: string[];
  previousTimeline?: IdentitySnapshot[];
}

function classifyCompletionPattern(completedDays: number[], currentDay: number): UserIdentity["completionPattern"] {
  if (completedDays.length === 0) return "absent";
  const rate = completedDays.length / Math.max(1, currentDay);
  if (rate >= 0.8) return "consistent";
  if (rate >= 0.4) return "bursty";
  return "declining";
}

function classifyReflectionDepth(reflections: IdentityInputs["reflections"]): UserIdentity["reflectionDepth"] {
  if (reflections.length === 0) return "surface";
  const avgLen = reflections.reduce((sum, r) => sum + (r.note?.length ?? 0), 0) / reflections.length;
  if (avgLen >= 200) return "deep";
  if (avgLen >= 50) return "moderate";
  return "surface";
}

function classifyAwarenessProgression(reflections: IdentityInputs["reflections"]): UserIdentity["awarenessProgression"] {
  const states = reflections.map((r) => r.awareness_state).filter(Boolean);
  if (states.length < 3) return "growing";

  const recent = states.slice(-3);
  const hasDeep = recent.includes("best_possibility");
  const hasShadow = recent.includes("shadow");

  if (hasDeep && !hasShadow) return "growing";
  if (hasShadow && hasDeep) return "fluctuating";
  return "plateaued";
}

function computeEngagement(inputs: IdentityInputs): number {
  const completionWeight = 40;
  const reflectionWeight = 35;
  const guideWeight = 25;

  const completionRate = inputs.completedDays.length / Math.max(1, inputs.currentDay);
  const reflectionRate = inputs.reflections.length / Math.max(1, inputs.currentDay);
  const guideRate = Math.min(1, inputs.guideSessionCount / Math.max(1, inputs.currentDay));

  return Math.round(
    completionRate * completionWeight +
    reflectionRate * reflectionWeight +
    guideRate * guideWeight
  );
}

function classifyTransformation(engagement: number, depth: UserIdentity["reflectionDepth"], progression: UserIdentity["awarenessProgression"]): UserIdentity["transformationSignal"] {
  if (engagement >= 80 && depth === "deep" && progression === "growing") return "integrated";
  if (engagement >= 60 && depth !== "surface") return "deepening";
  if (engagement >= 30) return "emerging";
  return "early";
}

function classifyTrajectory(driftHistory: number[]): UserIdentity["trajectory"] {
  if (driftHistory.length < 3) return "improving";
  const recent = driftHistory.slice(-3);
  const trend = recent[2] - recent[0];
  if (trend < 0) return "improving";
  if (trend > 2) return "declining";
  return "unstable";
}

function findDominantEmotion(reflections: IdentityInputs["reflections"]): string | null {
  const counts = new Map<string, number>();
  for (const r of reflections) {
    if (r.emotion) {
      counts.set(r.emotion, (counts.get(r.emotion) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function buildIdentity(inputs: IdentityInputs): UserIdentity {
  const completionPattern = classifyCompletionPattern(inputs.completedDays, inputs.currentDay);
  const reflectionDepth = classifyReflectionDepth(inputs.reflections);
  const awarenessProgression = classifyAwarenessProgression(inputs.reflections);
  const engagementScore = computeEngagement(inputs);
  const avgDriftFrequency = inputs.driftHistory.length > 0
    ? inputs.driftHistory.reduce((a, b) => a + b, 0) / inputs.driftHistory.length
    : 0;

  const avgReflectionLength = inputs.reflections.length > 0
    ? Math.round(inputs.reflections.reduce((sum, r) => sum + (r.note?.length ?? 0), 0) / inputs.reflections.length)
    : 0;

  const trajectory = classifyTrajectory(inputs.driftHistory);
  const transformationSignal = classifyTransformation(engagementScore, reflectionDepth, awarenessProgression);

  // Build timeline: keep previous snapshots + add new one
  const previousTimeline = inputs.previousTimeline ?? [];
  const today = new Date().toISOString().split("T")[0];
  // Avoid duplicate snapshots for same day
  const filtered = previousTimeline.filter((s) => s.date !== today);
  const newSnapshot: IdentitySnapshot = { date: today, engagementScore, transformationSignal, trajectory };
  const identityTimeline = [...filtered, newSnapshot].slice(-28); // keep last 28 snapshots

  return {
    completionPattern,
    avgDriftFrequency: Math.round(avgDriftFrequency * 100) / 100,
    reflectionDepth,
    preferredTime: null,
    recurringThemes: inputs.themes,
    dominantEmotion: findDominantEmotion(inputs.reflections),
    awarenessProgression,
    totalReflections: inputs.reflections.length,
    avgReflectionLength,
    daysWithReflection: new Set(inputs.reflections.map((r) => r.day)).size,
    guideSessions: inputs.guideSessionCount,
    engagementScore,
    transformationSignal,
    trajectory,
    identityTimeline,
  };
}

export async function loadAndBuildIdentity(supabase: any, userId: string, completedDays: number[], currentDay: number): Promise<UserIdentity> {
  const [reflectionsRes, memoryRes, sessionsRes] = await Promise.all([
    supabase.from("reflections").select("day, note, emotion, awareness_state").eq("user_id", userId).order("day"),
    supabase.from("user_memory").select("patterns, drift_history, identity").eq("user_id", userId).maybeSingle(),
    supabase.from("guide_sessions").select("id").eq("user_id", userId),
  ]);

  const previousIdentity = memoryRes.data?.identity as UserIdentity | null;

  return buildIdentity({
    completedDays,
    totalDays: 28,
    currentDay,
    driftHistory: memoryRes.data?.drift_history ?? [],
    reflections: reflectionsRes.data ?? [],
    guideSessionCount: sessionsRes.data?.length ?? 0,
    themes: memoryRes.data?.patterns ?? [],
    previousTimeline: previousIdentity?.identityTimeline ?? [],
  });
}
