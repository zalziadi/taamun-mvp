import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_KEY = process.env.ADMIN_KEY;
const COOKIE_NAME = "taamun_admin";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!password || !ADMIN_KEY || password !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, ADMIN_KEY, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
