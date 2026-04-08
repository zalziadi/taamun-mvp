import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import {
  normalizeJourneyState,
  createDefaultState,
  type UserJourneyState,
} from "@/lib/journey/memory";

export const dynamic = "force-dynamic";

/**
 * GET /api/journey/state
 * Returns the stored UserJourneyState from user_memory.identity.journey_state
 * Falls back to defaults if not present.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { data: memRow } = await auth.supabase
      .from("user_memory")
      .select("identity")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const stored = (memRow?.identity as { journey_state?: Partial<UserJourneyState> } | null)
      ?.journey_state;
    const state = normalizeJourneyState(stored, auth.user.id);

    return NextResponse.json({ ok: true, state });
  } catch {
    // Graceful fallback — return defaults so client always gets something
    return NextResponse.json({
      ok: true,
      state: createDefaultState(auth.user.id),
    });
  }
}

/**
 * POST /api/journey/state
 * Persists a UserJourneyState to user_memory.identity.journey_state
 * Body: { state: Partial<UserJourneyState> }
 *
 * Client should normalize before sending. Server re-normalizes for safety.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { state?: Partial<UserJourneyState> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ ok: false, error: "missing_state" }, { status: 400 });
  }

  const normalized = normalizeJourneyState(body.state, auth.user.id);

  try {
    // Load existing identity JSONB to merge
    const { data: existing } = await auth.supabase
      .from("user_memory")
      .select("identity")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const mergedIdentity = {
      ...((existing?.identity as object) ?? {}),
      journey_state: normalized,
    };

    await auth.supabase
      .from("user_memory")
      .upsert(
        {
          user_id: auth.user.id,
          identity: mergedIdentity,
          last_cognitive_update: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return NextResponse.json({ ok: true, state: normalized });
  } catch {
    // Even if DB fails, return the normalized state so client can continue
    return NextResponse.json({
      ok: true,
      state: normalized,
      warning: "server_persist_failed",
    });
  }
}
