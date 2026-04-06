import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { APP_NAME } from "@/lib/appConfig";
import { readUserProgress } from "@/lib/progressStore";
import { isRamadanProgramClosed } from "@/lib/season";
import { buildCognitiveContext } from "@/lib/cognitiveContext";
import { buildProgressState } from "@/lib/progressEngine";
import { buildJourneyState, classifyDepth } from "@/lib/journeyState";
import { generateGuidance } from "@/lib/guidanceEngine";
import { buildPersonalityProfile, generateMicroReward } from "@/lib/personalityEngine";
import { extractPatterns } from "@/lib/reflectionLinker";
import { loadAndBuildIdentity } from "@/lib/identityTracker";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  if (isRamadanProgramClosed()) {
    return NextResponse.json({ ok: false, error: "season_closed" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id: dayRaw } = await params;
  const day = Number(dayRaw);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const { data: verseMeta, error: verseError } = await auth.supabase
    .from("ramadan_verses")
    .select(
      "day, surah_number, ayah_number, theme_title, prompt_observe, prompt_insight, prompt_contemplate, prompt_rebuild"
    )
    .eq("day", day)
    .maybeSingle();

  if (verseError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  let ayahText = "";
  if (verseMeta) {
    const { data: ayah } = await auth.supabase
      .from("quran_ayahs")
      .select("arabic_text")
      .eq("surah_number", verseMeta.surah_number)
      .eq("ayah_number", verseMeta.ayah_number)
      .maybeSingle();
    ayahText = ayah?.arabic_text ?? "";
  }

  const progress = await readUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // Build cognitive context for this day (with narrative data)
  const missedCount = Math.max(0, progress.currentDay - progress.completedDays.length - 1);
  const drift = Math.max(0, day - (progress.completedDays.length > 0 ? Math.max(...progress.completedDays) : 0));
  const cognitive = await buildCognitiveContext(
    auth.supabase,
    auth.user.id,
    day,
    missedCount,
    { completedCount: progress.completedDays.length, drift }
  );

  // Build guidance + personality + micro-rewards
  let guidance = null;
  let microReward = null;
  try {
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("subscription_start_date")
      .eq("id", auth.user.id)
      .maybeSingle();

    const progressState = buildProgressState(
      progress.currentDay,
      progress.completedDays,
      profile?.subscription_start_date
    );

    // Get reflections for personality + guidance
    const { data: allRefs } = await auth.supabase
      .from("reflections")
      .select("day, note, emotion, awareness_state")
      .eq("user_id", auth.user.id)
      .order("day", { ascending: false })
      .limit(10);

    const recentRefs = allRefs ?? [];
    const lastNote = recentRefs[0]?.note ?? "";
    const lastDay = recentRefs[0]?.day ?? 0;

    // Build identity for personality
    const identity = await loadAndBuildIdentity(
      auth.supabase, auth.user.id, progress.completedDays, progress.currentDay
    );

    // Extract patterns for personality
    const patterns = extractPatterns(recentRefs.map((r: any) => ({
      day: r.day, note: r.note, emotion: r.emotion, awareness_state: r.awareness_state,
    })));

    // Build personality profile
    const personality = buildPersonalityProfile({
      identity,
      progress: progressState,
      patterns,
      recentFeedbackImpacts: [],
    });

    const journeyState = buildJourneyState({
      progress: progressState,
      reflectionCount: cognitive.recentReflections.length,
      lastReflectionDepth: classifyDepth(lastNote.length),
      actionsCompletedRecently: 0,
      daysSinceLastReflection: lastDay > 0 ? progress.currentDay - lastDay : progress.currentDay,
      trajectory: identity.trajectory,
    });

    guidance = generateGuidance({
      progress: progressState,
      journey: journeyState,
      identity,
      context: cognitive,
      narrative: cognitive.narrative,
      personality,
    });

    // Micro-reward check
    microReward = generateMicroReward(progressState, identity);
  } catch {
    // Guidance generation is optional
  }

  return NextResponse.json({
    ok: true,
    day,
    total_days: TOTAL_DAYS,
    is_completed: progress.completedDays.includes(day),
    current_day: progress.currentDay,
    verse: verseMeta
      ? {
          title: verseMeta.theme_title ?? "",
          surah_number: verseMeta.surah_number,
          ayah_number: verseMeta.ayah_number,
          text: ayahText,
          prompts: {
            observe: verseMeta.prompt_observe ?? "ماذا لاحظت اليوم؟",
            insight: verseMeta.prompt_insight ?? "ما الإدراك الذي ظهر لك؟",
            contemplate: verseMeta.prompt_contemplate ?? `كيف ستطبق ${APP_NAME} في هذا المعنى؟`,
            rebuild: verseMeta.prompt_rebuild ?? "ما الذي ستعيد بناءه في نفسك؟",
          },
        }
      : null,
    cognitive: {
      context_summary: cognitive.contextSummary,
      context_interpretation: cognitive.contextInterpretation,
      suggested_question: cognitive.suggestedQuestion,
      connected_days: cognitive.recentReflections.map((r) => r.day),
      awareness_level: cognitive.awarenessLevel,
      context_level: cognitive.contextLevel,
      recurring_themes: cognitive.recurringThemes,
      weighted_themes: cognitive.weightedThemes,
      narrative: cognitive.narrative,
    },
    guidance,
    micro_reward: microReward,
  });
}
