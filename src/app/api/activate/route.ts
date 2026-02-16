import { NextResponse } from "next/server";

const ACTIVATION_CODES = [
  "TAAMUN-DEMO",
  "TAAMUN-1234",
  "TAAMUN-0001",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ ok: false, error: "missing_code" });
  }

  const isValid = ACTIVATION_CODES.includes(code.trim());

  if (!isValid) {
    return NextResponse.json({ ok: false, error: "not_found" });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "TAAMUN_ENTITLEMENT",
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
