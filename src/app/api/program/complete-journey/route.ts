import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/program/complete-journey
 * Called when user completes day 28. Queues a celebration email.
 * Idempotent — won't queue duplicate emails.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = auth.user.id;
  const email = auth.user.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "no_email" });
  }

  const admin = getSupabaseAdmin();

  // Check if completion email already queued
  const { data: existing } = await admin
    .from("email_queue")
    .select("id")
    .eq("user_id", userId)
    .eq("template", "completion")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already_queued: true });
  }

  // Get user name
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  // Queue the email — send after 5 minutes (let them enjoy the moment)
  const sendAfter = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await admin.from("email_queue").insert({
    user_id: userId,
    email,
    template: "completion",
    payload: {
      userName: profile?.full_name ?? email.split("@")[0],
      completedDays: 28,
    },
    status: "pending",
    send_after: sendAfter,
  });

  return NextResponse.json({ ok: true, queued: true });
}
