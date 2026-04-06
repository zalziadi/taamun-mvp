import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { readUserProgress } from "@/lib/progressStore";
import { loadAndBuildIdentity } from "@/lib/identityTracker";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const progress = await readUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const identity = await loadAndBuildIdentity(
    auth.supabase,
    auth.user.id,
    progress.completedDays,
    progress.currentDay
  );

  // Persist identity snapshot
  try {
    await auth.supabase
      .from("user_memory")
      .upsert(
        {
          user_id: auth.user.id,
          identity,
          last_cognitive_update: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  } catch {}

  return NextResponse.json({ ok: true, identity });
}
