import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectConversionStage, type UserMemory } from "@/lib/guide-prompt";

const OFFERS = {
  micro: {
    type: "micro_commitment" as const,
    message: "جرب 3 أيام من رحلة تمعّن الكاملة — بدون التزام",
    cta: "ابدأ التجربة",
    url: "/pricing",
    framing: "identity",
  },
  standard: {
    type: "subscription" as const,
    message: "واضح أنك تبحث عن عمق… مو مجرد قراءة. في رحلة مصممة لك.",
    cta: "أكمل الرحلة — 82 ريال",
    url: "/pricing",
    framing: "continuation",
  },
  loss: {
    type: "subscription" as const,
    message: "لا ترجع لنفس النقطة كل يوم. هذي فرصتك تكمل بشكل مختلف.",
    cta: "ابدأ الآن",
    url: "/pricing",
    framing: "loss",
  },
  upgrade: {
    type: "upgrade" as const,
    message: "لاحظنا تطور حقيقي عندك. الباقة الكاملة تناسب مستواك.",
    cta: "الباقة الكاملة — 382 ريال",
    url: "/pricing?plan=full",
    framing: "growth",
  },
};

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ show_offer: false, reason: "anonymous" });
  }

  const { data: memRow } = await supabase
    .from("user_memory")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!memRow) {
    return NextResponse.json({ show_offer: false, reason: "no_memory" });
  }

  const memory: UserMemory = {
    patterns: memRow.patterns ?? [],
    awareness_level: memRow.awareness_level ?? "surface",
    commitment_score: memRow.commitment_score ?? 0,
    last_topic: memRow.last_topic,
    last_action_taken: memRow.last_action_taken ?? false,
    current_day: memRow.current_day ?? 1,
    conversion_stage: memRow.conversion_stage ?? "cold",
    actions_completed: memRow.actions_completed ?? 0,
  };

  const stage = detectConversionStage(memory);

  // Update stage in DB if changed
  if (stage !== memory.conversion_stage) {
    await supabase
      .from("user_memory")
      .update({ conversion_stage: stage, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  // Already converted — no offer
  if (stage === "converted") {
    return NextResponse.json({ show_offer: false, stage, reason: "already_converted" });
  }

  // Not ready — no offer
  if (stage === "cold" || stage === "aware") {
    return NextResponse.json({ show_offer: false, stage, reason: "not_ready" });
  }

  // Engaged — micro commitment only
  if (stage === "engaged") {
    return NextResponse.json({ show_offer: true, stage, ...OFFERS.micro });
  }

  // Ready — pick best offer based on signals
  if (memory.last_action_taken && memory.awareness_level === "deep") {
    return NextResponse.json({ show_offer: true, stage, ...OFFERS.upgrade });
  }

  if (memory.patterns.length >= 3 && !memory.last_action_taken) {
    // Repeating patterns without action — loss framing
    return NextResponse.json({ show_offer: true, stage, ...OFFERS.loss });
  }

  // Default: standard offer
  return NextResponse.json({ show_offer: true, stage, ...OFFERS.standard });
}
