const TAP_API = "https://api.tap.company/v2";

export const TAP_AMOUNTS = {
  basic: Number(process.env.TAP_AMOUNT_BASIC ?? 82),
  full:  Number(process.env.TAP_AMOUNT_FULL  ?? 820),
} as const;

export type TapTier = keyof typeof TAP_AMOUNTS;

export async function tapFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${TAP_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.TAP_SECRET_KEY ?? ""}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tap API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface TapCharge {
  id: string;
  status: string;
  amount: number;
  currency: string;
  transaction?: { url?: string };
  metadata?: { udf1?: string; udf2?: string };
}

/** Alias used by tapSubscriptionSync */
export type TapChargeResponse = TapCharge;

/** Retrieve a single charge from Tap by its ID */
export async function retrieveTapCharge(chargeId: string): Promise<TapCharge> {
  return tapFetch<TapCharge>(`/charges/${chargeId}`);
}

/** Format amount for price_id storage (e.g. "82.00") */
export function formatTapAmount(amount: number, _currency?: string): string {
  return amount.toFixed(2);
}
