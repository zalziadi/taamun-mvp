import { APP_DOMAIN } from "@/lib/appConfig";

const ENV_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";

const UNSAFE_PATTERNS = ["yourdomain", "localhost"];

function isUnsafe(origin: string): boolean {
  const lower = origin.toLowerCase();
  return UNSAFE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Client-side: use NEXT_PUBLIC_APP_ORIGIN else window.location.origin.
 * Call from "use client" components only.
 */
export function getAppOriginClient(): string {
  if (ENV_ORIGIN) return assertSafeOrigin(ENV_ORIGIN);
  const win =
    typeof window !== "undefined" ? window.location.origin : "";
  return assertSafeOrigin(win || ENV_ORIGIN || "");
}

/**
 * Server-side: use NEXT_PUBLIC_APP_ORIGIN else derive from request headers.
 * Call from Server Components or Route Handlers.
 */
export async function getAppOriginServer(): Promise<string> {
  if (ENV_ORIGIN) return assertSafeOrigin(ENV_ORIGIN);
  const { headers } = await import("next/headers");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host ? `${proto}://${host}` : "";
  if (!origin) {
    if (ENV_ORIGIN) return assertSafeOrigin(ENV_ORIGIN);
    throw new Error(
      "Cannot determine app origin. Set NEXT_PUBLIC_APP_ORIGIN in Vercel."
    );
  }
  return assertSafeOrigin(origin);
}

/**
 * In production, rejects placeholder origins (yourdomain, localhost).
 * Returns safe origin or throws.
 */
export function assertSafeOrigin(origin: string): string {
  if (!origin) return origin;
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return origin;
  if (!isUnsafe(origin)) return origin;
  if (ENV_ORIGIN && !isUnsafe(ENV_ORIGIN)) return ENV_ORIGIN;
  throw new Error(
    `Cannot use placeholder origin in production. Set NEXT_PUBLIC_APP_ORIGIN to your production domain (e.g. ${APP_DOMAIN}).`
  );
}
