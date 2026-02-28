import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ENTITLEMENT_COOKIE_NAME } from "@/lib/entitlement-constants";
import { makeEntitlementToken } from "@/lib/entitlement";

type ConsumeActivationRow = {
  ok: boolean;
  error: string | null;
  plan: string | null;
  ends_at: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ ok: false, error: "missing_code" });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("consume_activation_code", {
    p_code: code,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const row = (data?.[0] as ConsumeActivationRow | undefined) ?? null;
  if (!row || !row.ok || !row.plan || !row.ends_at) {
    return NextResponse.json({ ok: false, error: row?.error ?? "not_found" });
  }

  const startsAtIso = new Date().toISOString();
  const endsAtIso = new Date(row.ends_at).toISOString();

  const { error: upsertError } = await supabase.from("entitlements").upsert(
    {
      activation_code: code,
      plan: row.plan,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      status: "active",
    },
    { onConflict: "activation_code" }
  );

  if (upsertError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const expMs = Date.parse(endsAtIso);
  const maxAge = Math.max(1, Math.floor((expMs - Date.now()) / 1000));
  const token = makeEntitlementToken(row.plan, expMs);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ENTITLEMENT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return res;
}
