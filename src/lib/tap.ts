import type { CheckoutTier } from "@/lib/stripe";

const TAP_API = "https://api.tap.company/v2/charges/";

export type TapChargeResponse = {
  id?: string;
  status?: string;
  object?: string;
  amount?: number;
  currency?: string;
  transaction?: { url?: string; created?: string };
  metadata?: Record<string, string>;
  reference?: { gateway?: string; payment?: string };
  response?: { code?: string; message?: string };
};

function getSecret(): string {
  const k = process.env.TAP_SECRET_KEY;
  if (!k) throw new Error("Missing TAP_SECRET_KEY");
  return k;
}

const TAP_AMOUNT_MAP: Record<Exclude<CheckoutTier, "support">, string> = {
  eid: "TAP_AMOUNT_EID",
  monthly: "TAP_AMOUNT_MONTHLY",
  yearly: "TAP_AMOUNT_YEARLY",
  vip: "TAP_AMOUNT_VIP",
};

export function tapAmountForTier(tier: Exclude<CheckoutTier, "support">): number {
  const envKey = TAP_AMOUNT_MAP[tier];
  const raw = process.env[envKey];
  if (!raw) throw new Error(`Missing ${envKey}`);
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid ${envKey}`);
  }
  return n;
}

export function formatTapAmount(amount: number, currency: string): string {
  const c = currency.toUpperCase();
  const decimals = ["BHD", "KWD", "OMR", "JOD"].includes(c) ? 3 : 2;
  return amount.toFixed(decimals);
}

function splitName(email: string, fullName?: string | null): { first: string; last: string } {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0]!, last: parts[0]! };
    return { first: parts[0]!, last: parts.slice(1).join(" ") };
  }
  const local = email.split("@")[0] ?? "user";
  return { first: local.slice(0, 40), last: "—" };
}

function parseTapPhone(): { country_code: string; number: string } {
  const raw = process.env.TAP_CUSTOMER_PHONE ?? "966500000000";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("966")) {
    return { country_code: "966", number: digits.slice(3) };
  }
  if (digits.length === 9) {
    return { country_code: "966", number: digits };
  }
  return { country_code: "966", number: "500000000" };
}

export async function createTapCharge(params: {
  tier: Exclude<CheckoutTier, "support">;
  userId: string;
  email: string;
  userName?: string | null;
  origin: string;
}): Promise<{ url: string; chargeId: string }> {
  const secret = getSecret();
  const amount = tapAmountForTier(params.tier);
  const currency = (process.env.TAP_CURRENCY ?? "SAR").toUpperCase();
  const sourceId = process.env.TAP_SOURCE_ID ?? "src_card";
  const { first, last } = splitName(params.email, params.userName);
  const phone = parseTapPhone();

  const postUrl = `${params.origin.replace(/\/$/, "")}/api/tap/webhook`;
  const redirectUrl = `${params.origin.replace(/\/$/, "")}/pricing/success`;

  const body: Record<string, unknown> = {
    amount,
    currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: false,
    description: `تمَعُّن — اشتراك ${params.tier}`,
    metadata: {
      udf1: params.userId,
      udf2: params.tier,
    },
    reference: {
      transaction: `txn_${params.userId.slice(0, 8)}_${Date.now()}`,
      order: `ord_${params.tier}_${Date.now()}`,
    },
    receipt: { email: true, sms: false },
    customer: {
      first_name: first.slice(0, 40),
      last_name: last.slice(0, 40),
      email: params.email,
      phone: {
        country_code: phone.country_code,
        number: phone.number,
      },
    },
    source: { id: sourceId },
    post: { url: postUrl },
    redirect: { url: redirectUrl },
  };

  const mid = process.env.TAP_MERCHANT_ID;
  if (mid) {
    body.merchant = { id: mid };
  }

  const res = await fetch(TAP_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TapChargeResponse;
  if (!res.ok) {
    console.error("Tap create charge failed", res.status, JSON.stringify(data));
    throw new Error(`tap_charge_failed:${res.status}`);
  }

  const url = data.transaction?.url;
  const chargeId = data.id;
  if (!url || !chargeId) {
    console.error("Tap charge missing url or id", data);
    throw new Error("tap_charge_invalid_response");
  }

  return { url, chargeId };
}

export async function retrieveTapCharge(chargeId: string): Promise<TapChargeResponse> {
  const secret = getSecret();
  const res = await fetch(`${TAP_API}${chargeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });
  const data = (await res.json()) as TapChargeResponse;
  if (!res.ok) {
    console.error("Tap retrieve charge failed", res.status, data);
    throw new Error(`tap_retrieve_failed:${res.status}`);
  }
  return data;
}
