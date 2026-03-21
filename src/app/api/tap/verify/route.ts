import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { retrieveTapCharge } from "@/lib/tap";
import { upsertSubscriptionFromTapCharge } from "@/lib/tapSubscriptionSync";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { tap_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const tapId = body.tap_id?.trim();
  if (!tapId) {
    return NextResponse.json({ ok: false, error: "missing_tap_id" }, { status: 400 });
  }

  let charge;
  try {
    charge = await retrieveTapCharge(tapId);
  } catch {
    return NextResponse.json({ ok: false, error: "tap_retrieve_failed" }, { status: 502 });
  }

  if (charge.status !== "CAPTURED") {
    return NextResponse.json({ ok: false, error: "not_captured", status: charge.status }, { status: 400 });
  }

  const meta = charge.metadata as Record<string, string> | undefined;
  const userFromCharge = meta?.udf1;
  const tier = meta?.udf2 ?? "full";
  if (!userFromCharge || userFromCharge !== auth.user.id) {
    return NextResponse.json({ ok: false, error: "user_mismatch" }, { status: 403 });
  }

  try {
    await upsertSubscriptionFromTapCharge(charge, auth.user.id, tier);
  } catch {
    return NextResponse.json({ ok: false, error: "upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
