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

  return NextResponse.json({ ok: true });
}
