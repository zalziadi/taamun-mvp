import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAdminValid(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY ?? "";
  const provided =
    request.nextUrl.searchParams.get("key") ??
    request.nextUrl.searchParams.get("admin") ??
    request.headers.get("x-admin-key") ??
    "";
  return adminKey.length > 0 && provided === adminKey;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TAAMUN-${suffix}`;
}

export async function POST(request: NextRequest) {
  if (!isAdminValid(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const count = Number(request.nextUrl.searchParams.get("count") ?? "1");
  const plan = (request.nextUrl.searchParams.get("plan") ?? "base").trim().toLowerCase();

  if (!Number.isInteger(count) || count < 1 || count > 500) {
    return NextResponse.json({ ok: false, error: "invalid_count" }, { status: 400 });
  }

  if (!plan) {
    return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rows = Array.from({ length: count }).map(() => ({
    code: generateCode(),
    plan,
    max_uses: 1,
    uses: 0,
    created_at: now,
  }));

  const { data, error } = await getSupabaseAdmin()
    .from("activation_codes")
    .insert(rows)
    .select("code, plan, max_uses, uses, expires_at, created_at");

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0, codes: data ?? [] });
}
