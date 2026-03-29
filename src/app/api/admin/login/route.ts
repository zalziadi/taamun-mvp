import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_KEY = process.env.ADMIN_KEY;
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

  if (!password || !ADMIN_KEY || password !== ADMIN_KEY) {
    return NextResponse.redirect(new URL(nextPath, req.url));
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set(COOKIE_NAME, ADMIN_KEY, buildCookieOptions());
  return response;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!password || !ADMIN_KEY || password !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, ADMIN_KEY, buildCookieOptions());
  return response;
}
