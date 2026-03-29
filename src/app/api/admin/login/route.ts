import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_KEY = process.env.ADMIN_KEY;

function normalizeKey(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/‏|‎/g, "").trim();
}

function isValidAdminPassword(input: string | null | undefined) {
  const expected = normalizeKey(ADMIN_KEY);
  const candidate = normalizeKey(input);
  if (!expected || !candidate) return false;

  if (candidate === expected) return true;

  // Common user input variance: missing leading @
  if (expected.startsWith("@") && candidate === expected.slice(1)) return true;
  if (candidate.startsWith("@") && candidate.slice(1) === expected) return true;

  return false;
}
const COOKIE_NAME = "taamun_admin";
const MAX_AGE = 60 * 60 * 24; // 24 hours

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

function sanitizeNext(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/admin")) return "/admin";
  return nextPath;
}

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("password");
  const nextPath = sanitizeNext(req.nextUrl.searchParams.get("next"));

  if (!isValidAdminPassword(password)) {
    return NextResponse.redirect(new URL(nextPath, req.url));
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  const expected = normalizeKey(ADMIN_KEY);
  response.cookies.set(COOKIE_NAME, expected, buildCookieOptions());
  return response;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const expected = normalizeKey(ADMIN_KEY);
  response.cookies.set(COOKIE_NAME, expected, buildCookieOptions());
  return response;
}
