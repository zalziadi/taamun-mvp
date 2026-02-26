import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  inferPlanFromSallaPayload,
  resolveEndsAtForPlan,
  verifySallaWebhookSignature,
} from "@/lib/salla";

export const dynamic = "force-dynamic";

function getHeader(request: NextRequest, key: string): string {
  return request.headers.get(key) ?? "";
}

function extractEventName(request: NextRequest, payload: Record<string, unknown>): string {
  return (
    getHeader(request, "x-salla-event") ||
    getHeader(request, "x-salla-topic") ||
    (typeof payload.event === "string" ? payload.event : "") ||
    ""
  );
}

function extractPaymentStatus(payload: Record<string, unknown>): string {
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};
  const order = (data.order as Record<string, unknown> | undefined) ?? {};
  const payment = (data.payment as Record<string, unknown> | undefined) ?? {};

  return (
    (typeof data.status === "string" && data.status) ||
    (typeof order.status === "string" && order.status) ||
    (typeof payment.status === "string" && payment.status) ||
    ""
  ).toLowerCase();
}

function isPaidWebhook(eventName: string, paymentStatus: string): boolean {
  const paidEvents = ["order.paid", "order.payment.paid", "order.updated"];
  const paidStatuses = ["paid", "completed", "captured"];
  return paidEvents.includes(eventName.toLowerCase()) || paidStatuses.includes(paymentStatus);
}

function extractCustomerEmail(payload: Record<string, unknown>): string | null {
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};
  const customer = (data.customer as Record<string, unknown> | undefined) ?? {};
  const order = (data.order as Record<string, unknown> | undefined) ?? {};

  const emailCandidates = [
    data.customer_email,
    customer.email,
    order.customer_email,
    (order.customer as Record<string, unknown> | undefined)?.email,
  ];

  for (const value of emailCandidates) {
    if (typeof value === "string" && value.includes("@")) {
      return value.trim().toLowerCase();
    }
  }
  return null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) break;

    const user = data?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (user) return user.id;
    if (!data?.users?.length) break;

    page += 1;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const signature =
    getHeader(request, "x-salla-signature") || getHeader(request, "x-salla-webhook-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySallaWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventName = extractEventName(request, payload);
  const paymentStatus = extractPaymentStatus(payload);
  if (!isPaidWebhook(eventName, paymentStatus)) {
    return NextResponse.json({ ok: true, ignored: true, reason: "event_not_paid" });
  }

  const customerEmail = extractCustomerEmail(payload);
  if (!customerEmail) {
    return NextResponse.json({ ok: true, ignored: true, reason: "missing_customer_email" });
  }

  const userId = await findUserIdByEmail(customerEmail);
  if (!userId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "user_not_found" });
  }

  const plan = inferPlanFromSallaPayload(payload);
  const now = new Date();
  const endsAt = resolveEndsAtForPlan(plan, now);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("entitlements").upsert(
    {
      user_id: userId,
      plan,
      status: "active",
      starts_at: now.toISOString(),
      ends_at: endsAt,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "entitlement_upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, plan, endsAt });
}
