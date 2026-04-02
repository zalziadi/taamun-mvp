import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_MEMORY = {
  patterns: [],
  awareness_level: "surface",
  commitment_score: 0,
  last_topic: null,
  last_action_taken: false,
  current_day: 1,
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ...DEFAULT_MEMORY, anonymous: true });
  }

  const { data, error } = await supabase
    .from("user_memory")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    // Create default memory for new user
    const { data: created } = await supabase
      .from("user_memory")
      .insert({ user_id: user.id, ...DEFAULT_MEMORY })
      .select()
      .single();

    return NextResponse.json(created ?? DEFAULT_MEMORY);
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Anonymous: client stores in localStorage
    return NextResponse.json({ stored: "client", ...body });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.patterns !== undefined) update.patterns = body.patterns;
  if (body.awareness_level !== undefined) update.awareness_level = body.awareness_level;
  if (body.commitment_score !== undefined) update.commitment_score = body.commitment_score;
  if (body.last_topic !== undefined) update.last_topic = body.last_topic;
  if (body.last_action_taken !== undefined) update.last_action_taken = body.last_action_taken;
  if (body.current_day !== undefined) update.current_day = body.current_day;

  const { data, error } = await supabase
    .from("user_memory")
    .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
