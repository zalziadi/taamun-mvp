import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  currentYearLabel,
  isGregorianYearEnd,
  isHijriNewYear,
} from "@/lib/year-recap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/year-recap
 *
 * Runs daily. Fires the year-end recap email ONLY when today matches one
 * of the two configured anchors:
 *   - Gregorian: Dec 31 (Asia/Riyadh)
 *   - Hijri:     Muharram 1 (Umm al-Qura)
 *
 * Audience: users with ≥ 90 days since started_at on user_progress.
 * Side effect: queue one email per eligible user per year per variant.
 *
 * Idempotency: templates include the year label (e.g. "year_recap_2026",
 * "year_recap_1447ah"), and we skip any user that already has that template
 * queued in the last 350 days.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const variants: { kind: "gregorian" | "hijri"; fire: boolean }[] = [
    { kind: "gregorian", fire: isGregorianYearEnd(now) },
    { kind: "hijri", fire: isHijriNewYear(now) },
  ];

  const active = variants.filter((v) => v.fire);
  if (active.length === 0) {
    return NextResponse.json({ ok: true, skipped: "not_an_anchor_day" });
  }

  const admin = getSupabaseAdmin();
  const summary: Record<string, { queued: number; skipped: number }> = {};

  // Eligible audience: 90+ days since started
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const threeHundredFiftyDaysAgo = new Date(Date.now() - 350 * 86400000).toISOString();

  // Pull active, long-tenure users with an email on auth.users
  // user_progress.started_at is the canonical "began the journey" timestamp.
  const { data: candidates, error } = await admin
    .from("user_progress")
    .select("user_id, started_at")
    .lt("started_at", ninetyDaysAgo)
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, eligible: 0 });
  }

  for (const variant of active) {
    const label = currentYearLabel(variant.kind, now).replace(/\s+/g, "").toLowerCase();
    const template = `year_recap_${label}`;
    summary[template] = { queued: 0, skipped: 0 };

    for (const row of candidates) {
      const userId = row.user_id as string;

      // Idempotency: skip if we already queued this exact template within 350 days
      const { data: existing } = await admin
        .from("email_queue")
        .select("id")
        .eq("user_id", userId)
        .eq("template", template)
        .gte("created_at", threeHundredFiftyDaysAgo)
        .limit(1)
        .maybeSingle();

      if (existing) {
        summary[template].skipped++;
        continue;
      }

      // Fetch email from auth.users via admin
      const { data: userRes } = await admin.auth.admin.getUserById(userId);
      const email = userRes?.user?.email;
      if (!email) {
        summary[template].skipped++;
        continue;
      }

      const { error: insertErr } = await admin.from("email_queue").insert({
        user_id: userId,
        email,
        template,
        payload: {
          variant: variant.kind,
          year_label: currentYearLabel(variant.kind, now),
          recap_url: "/recap",
        },
        send_after: now.toISOString(),
      });

      if (insertErr) {
        summary[template].skipped++;
        continue;
      }
      summary[template].queued++;
    }
  }

  return NextResponse.json({ ok: true, summary });
}
