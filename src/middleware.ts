import { NextRequest, NextResponse } from "next/server";
import { ENTITLEMENT_COOKIE_NAME } from "@/lib/entitlement-constants";

const PROTECTED_PREFIXES = ["/day", "/progress"];

function base64urlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return bytesToBase64url(new Uint8Array(sig));
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyEntitlementTokenEdge(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  const expected = await signPayload(payloadB64, secret);
  if (!timingSafeEqualStr(sig, expected)) return false;

  let payload: { exp?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  } catch {
    return false;
  }

  if (!payload?.exp || typeof payload.exp !== "number") return false;
  if (Date.now() > payload.exp) return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret) {
    const url = req.nextUrl.clone();
    url.pathname = "/activate";
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(ENTITLEMENT_COOKIE_NAME)?.value;
  const ok = await verifyEntitlementTokenEdge(token, secret);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/activate";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/day/:path*", "/progress"],
};
