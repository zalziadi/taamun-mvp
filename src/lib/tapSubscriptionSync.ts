import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TapChargeResponse } from "@/lib/tap";
import { formatTapAmount } from "@/lib/tap";

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function upsertSubscriptionFromTapCharge(
  charge: TapChargeResponse,
  userId: string,
  tier: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  const id = charge.id;
  if (!id) throw new Error("tap charge missing id");

  const amount = charge.amount ?? 0;
  const currency = (charge.currency ?? "SAR").toUpperCase();
  const priceId = `${currency}:${formatTapAmount(amount, currency)}`;

  const periodEnd = addDays(new Date(), 30).toISOString();

  const statusNormalized = charge.status === "CAPTURED" ? "active" : "inactive";

  const { error } = await admin.from("customer_subscriptions").upsert(
    {
      user_id: userId,
      payment_provider: "tap",
      tap_charge_id: id,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      status: statusNormalized,
      price_id: priceId,
      tier,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("tap subscription upsert error", error);
    throw error;
  }
}
