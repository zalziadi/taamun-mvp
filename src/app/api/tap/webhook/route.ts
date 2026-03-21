import { NextResponse } from "next/server";
import type { TapChargeResponse } from "@/lib/tap";
import { verifyTapChargeWebhookHash } from "@/lib/tapWebhookVerify";
import { upsertSubscriptionFromTapCharge } from "@/lib/tapSubscriptionSync";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.TAP_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "tap_not_configured" }, { status: 500 });
  }

  const raw = await req.text();
  const receivedHash = req.headers.get("hashstring");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!verifyTapChargeWebhookHash(body, secret, receivedHash)) {
    console.warn("Tap webhook: invalid hashstring");
    return NextResponse.json({ ok: false, error: "invalid_hash" }, { status: 401 });
  }

  const obj = String(body.object ?? "");
  if (obj !== "charge") {
    return NextResponse.json({ received: true });
  }

  const status = String(body.status ?? "");
  if (status !== "CAPTURED") {
    return NextResponse.json({ received: true });
  }

  const meta = body.metadata as Record<string, string> | undefined;
  const userId = meta?.udf1;
  const tier = meta?.udf2 ?? "full";
  if (!userId) {
    console.error("Tap webhook: missing metadata udf1 (user id)");
    return NextResponse.json({ received: true });
  }

  try {
    await upsertSubscriptionFromTapCharge(body as TapChargeResponse, userId, tier);
  } catch (e) {
    console.error("Tap webhook upsert failed", e);
    return NextResponse.json({ ok: false, error: "upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
