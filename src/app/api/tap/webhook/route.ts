import { NextResponse } from "next/server";
import { tapFetch, TapCharge } from "@/lib/tap";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const FAILED_STATUSES = new Set([
  "ABANDONED", "CANCELLED", "FAILED", "EXPIRED", "DECLINED", "VOID",
]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { id?: string } | null;

  if (!body?.id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // التحقق بإعادة جلب الشحنة من Tap مباشرة
  const charge = await tapFetch<TapCharge>(`/charges/${body.id}`).catch(() => null);
  if (!charge) {
    return NextResponse.json({ error: "verify_failed" }, { status: 400 });
  }

  const userId = charge.metadata?.udf2;
  const tier   = charge.metadata?.udf1;
  if (!userId) return NextResponse.json({ ok: true }); // no-op

  const admin = getSupabaseAdmin();

  if (charge.status === "CAPTURED") {
    const months = tier === "basic" ? 3 : 12;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const { error: upsertErr } = await admin.from("customer_subscriptions").upsert(
      {
        user_id:            userId,
        stripe_customer_id: `tap_${userId}`,
        tap_charge_id:      charge.id,
        status:             "active",
        tier,
        current_period_end: periodEnd.toISOString(),
        updated_at:         new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (upsertErr) {
      console.error("[tap/webhook] subscription upsert failed:", upsertErr);
      return NextResponse.json({ error: "db_upsert_failed" }, { status: 500 });
    }
  } else if (FAILED_STATUSES.has(charge.status)) {
    const { error: updateErr } = await admin
      .from("customer_subscriptions")
      .update({ status: "inactive", tap_charge_id: charge.id, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateErr) {
      console.error("[tap/webhook] subscription update failed:", updateErr);
    }
  }

  return NextResponse.json({ received: true });
}
