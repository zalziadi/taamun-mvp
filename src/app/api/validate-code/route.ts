import { NextResponse } from "next/server";
import { validateCode } from "@/lib/activation";
import {
  ENTITLEMENT_COOKIE_NAME,
  makeEntitlementTokenForDays,
} from "@/lib/entitlement";

export async function POST(req: Request) {
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_format" },
      { status: 400 }
    );
  }

  const result = validateCode(body.code);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }

  const token = makeEntitlementTokenForDays("base", 45);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ENTITLEMENT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 45 * 24 * 60 * 60,
  });

  return res;
}
