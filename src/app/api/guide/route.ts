import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildGuideSystemPrompt, detectConversionStage, type UserMemory } from "@/lib/guide-prompt";

const GUIDE_API_URL = process.env.GUIDE_API_URL ?? "https://api.openai.com/v1/chat/completions";
const GUIDE_API_KEY = process.env.GUIDE_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const GUIDE_MODEL   = process.env.GUIDE_MODEL ?? "gpt-4o-mini";
const RATE_LIMIT    = 20; // messages/day/user

const DEFAULT_MEMORY: UserMemory = {
  patterns: [],
  awareness_level: "surface",
  commitment_score: 0,
  last_topic: null,
  last_action_taken: false,
  current_day: 1,
  conversion_stage: "cold",
  actions_completed: 0,
};

interface GuideRequest {
  message: string;
  context: { verse: string; day: number };
  memory?: UserMemory; // for anonymous users
  history?: Array<{ role: string; content: string }>;
}

interface GuideResponse {
  reply: string;
  stage: "question" | "reflection" | "action" | "growth_trigger";
  memory_update: {
    patterns?: string[];
    awareness_level?: string;
    action_given?: string;
  };
  done: boolean;
}

export async function POST(req: NextRequest) {
  const body: GuideRequest = await req.json();
  const { message, context, history = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Load memory ──
  let memory: UserMemory = body.memory ?? DEFAULT_MEMORY;
  let isAnonymous = !user;

  if (user) {
    const { data: memRow } = await supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (memRow) {
      memory = {
        patterns: memRow.patterns ?? [],
        awareness_level: memRow.awareness_level ?? "surface",
        commitment_score: memRow.commitment_score ?? 0,
        last_topic: memRow.last_topic,
        last_action_taken: memRow.last_action_taken ?? false,
        current_day: memRow.current_day ?? context.day ?? 1,
        conversion_stage: memRow.conversion_stage ?? "cold",
        actions_completed: memRow.actions_completed ?? 0,
      };
    }

    // ── Rate limit ──
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("guide_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`);

    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "وصلت الحد اليومي (20 رسالة). ارجع بكره وأكمل.", limit: true },
        { status: 429 }
      );
    }
  }

  // ── Load pattern context ──
  let patternContext = "";
  if (user) {
    const { data: latestPattern } = await supabase
      .from("pattern_insights")
      .select("district, awareness_state, themes, depth_score, shift_detected")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPattern) {
      const districtNames: Record<number, string> = {
        1: "الهوية", 2: "العلاقات", 3: "التوسّع", 4: "البناء",
        5: "الجمال", 6: "العائلة", 7: "الروح", 8: "المال", 9: "العطاء",
      };
      const stateNames: Record<string, string> = {
        shadow: "الظل (بحث خارجي)", gift: "الهدية (لحظة إدراك)", potential: "أفضل احتمال (حضور)",
      };
      const parts: string[] = [];
      if (latestPattern.district) parts.push(`الحي: ${districtNames[latestPattern.district as number] ?? latestPattern.district}`);
      if (latestPattern.awareness_state) parts.push(`الحالة: ${stateNames[latestPattern.awareness_state as string] ?? latestPattern.awareness_state}`);
      if (latestPattern.themes?.length) parts.push(`المواضيع: ${(latestPattern.themes as string[]).join("، ")}`);
      if (latestPattern.depth_score != null) parts.push(`الحضور: ${latestPattern.depth_score}/100`);
      if (latestPattern.shift_detected) parts.push("تحوّل مُكتشف مؤخرًا");
      if (parts.length > 0) patternContext = `\nسياق المتمعّن: ${parts.join(" | ")}`;
    }
  }

  // ── Build messages ──
  const systemPrompt = buildGuideSystemPrompt(memory);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    // Memory context
    {
      role: "system" as const,
      content: `النص الحالي: "${context.verse}"\nاليوم: ${context.day}/28${patternContext}`,
    },
    // Conversation history
    ...history.slice(-10),
    // New message
    { role: "user" as const, content: message },
  ];

  // ── Call LLM ──
  let guideResponse: GuideResponse;

  try {
    const llmRes = await fetch(GUIDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GUIDE_API_KEY}`,
      },
      body: JSON.stringify({
        model: GUIDE_MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!llmRes.ok) {
      const err = await llmRes.text();
      return NextResponse.json({ error: "LLM error", detail: err }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const raw = llmData.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse JSON from LLM (handle markdown wrapping)
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    guideResponse = JSON.parse(cleaned);
  } catch (e) {
    // Fallback: if LLM fails or returns non-JSON
    guideResponse = {
      reply: "ماذا لو توقفت لحظة وسألت نفسك: ما الذي يمنعني من التمعّن الحقيقي؟",
      stage: "question",
      memory_update: {},
      done: false,
    };
  }

  // ── Update memory ──
  if (user && guideResponse.memory_update) {
    const mu = guideResponse.memory_update;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (mu.patterns?.length) {
      // Merge patterns (keep unique, max 20)
      const merged = [...new Set([...memory.patterns, ...mu.patterns])].slice(-20);
      update.patterns = merged;
    }
    if (mu.awareness_level) {
      update.awareness_level = mu.awareness_level;
    }
    if (mu.action_given) {
      update.last_action_taken = false; // reset — new action given
      update.last_topic = mu.action_given;
    }
    // Track conversion stage from LLM
    const muAny = mu as Record<string, unknown>;
    if (muAny.conversion_stage) {
      update.conversion_stage = muAny.conversion_stage;
    }
    // If action stage → increment actions_completed
    if (guideResponse.stage === "action" && memory.last_action_taken) {
      update.actions_completed = (memory.actions_completed ?? 0) + 1;
    }

    await supabase
      .from("user_memory")
      .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" });
  }

  // ── Save session ──
  if (user) {
    const sessionMessages = [
      ...history.slice(-10),
      { role: "user", content: message },
      { role: "assistant", content: guideResponse.reply },
    ];

    await supabase.from("guide_sessions").insert({
      user_id: user.id,
      day: context.day,
      messages: sessionMessages,
      insight: guideResponse.stage,
      action_given: guideResponse.memory_update?.action_given ?? null,
      action_taken: false,
    });
  }

  // ── Growth trigger: include CTA ──
  const response: Record<string, unknown> = { ...guideResponse };
  if (guideResponse.stage === "growth_trigger") {
    response.upgrade = {
      message: "جاهز تنتقل للمستوى الجاي؟",
      cta: "ترقية للباقة الكاملة",
      url: "/pricing",
      package: "382 ريال — سنة كاملة + مجتمع خاص",
    };
  }

  return NextResponse.json(response);
}
