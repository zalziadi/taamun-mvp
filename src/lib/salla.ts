import crypto from "crypto";
import type { PlanKey } from "@/lib/plans";

type SallaStatePayload = {
  userId: string;
  iat: number;
  nonce: string;
};

const SALLA_DEFAULT_AUTH_URL = "https://accounts.salla.sa/oauth2/auth";
const SALLA_DEFAULT_TOKEN_URL = "https://accounts.salla.sa/oauth2/token";

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function sign(value: string, secret: string): string {
  return toBase64Url(crypto.createHmac("sha256", secret).update(value).digest());
}

export function getSallaOAuthConfig() {
  const clientId = process.env.SALLA_CLIENT_ID ?? "";
  const clientSecret = process.env.SALLA_CLIENT_SECRET ?? "";
  const redirectUri = process.env.SALLA_REDIRECT_URI ?? "";
  const stateSecret = process.env.SALLA_STATE_SECRET ?? process.env.ENTITLEMENT_SECRET ?? "";

  if (!clientId || !clientSecret || !redirectUri || !stateSecret) {
    throw new Error(
      "Missing Salla env: SALLA_CLIENT_ID, SALLA_CLIENT_SECRET, SALLA_REDIRECT_URI, SALLA_STATE_SECRET (or ENTITLEMENT_SECRET)"
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    stateSecret,
    authUrl: process.env.SALLA_OAUTH_AUTH_URL ?? SALLA_DEFAULT_AUTH_URL,
    tokenUrl: process.env.SALLA_OAUTH_TOKEN_URL ?? SALLA_DEFAULT_TOKEN_URL,
  };
}

export function createSallaOAuthState(userId: string): string {
  const { stateSecret } = getSallaOAuthConfig();
  const payload: SallaStatePayload = {
    userId,
    iat: Date.now(),
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded, stateSecret);
  return `${encoded}.${signature}`;
}

export function verifySallaOAuthState(state: string): SallaStatePayload {
  const { stateSecret } = getSallaOAuthConfig();
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) throw new Error("Invalid Salla state format");

  const expected = sign(encoded, stateSecret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid Salla state signature");
  }

  const parsed = JSON.parse(fromBase64Url(encoded).toString("utf8")) as SallaStatePayload;
  if (!parsed.userId || !parsed.iat) throw new Error("Invalid Salla state payload");

  const ageMs = Date.now() - parsed.iat;
  if (ageMs < 0 || ageMs > 15 * 60 * 1000) {
    throw new Error("Expired Salla state");
  }

  return parsed;
}

export function verifySallaWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.SALLA_WEBHOOK_SECRET ?? "";
  if (!secret) return false;

  const digestHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestB64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  const candidates = [signature.trim(), signature.replace(/^sha256=/i, "").trim()];
  return candidates.includes(digestHex) || candidates.includes(digestB64);
}

export function inferPlanFromSallaPayload(payload: unknown): PlanKey {
  const data = (payload as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const metadata = data?.metadata as Record<string, unknown> | undefined;
  const rawPlan =
    (typeof metadata?.plan_key === "string" && metadata.plan_key) ||
    (typeof metadata?.plan === "string" && metadata.plan) ||
    "";

  if (rawPlan === "trial24h" || rawPlan === "yearly" || rawPlan === "plan820") {
    return rawPlan;
  }
  return "ramadan_28";
}

export function resolveEndsAtForPlan(plan: PlanKey, now = new Date()): string {
  if (plan === "trial24h") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  if (plan === "yearly" || plan === "plan820") {
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return process.env.RAMADAN_ENDS_AT_ISO ?? "2026-03-29T23:59:59+03:00";
}
