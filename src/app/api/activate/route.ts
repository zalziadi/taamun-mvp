import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Server config" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore
        }
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const code = String(body?.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: activation, error } = await supabaseAdmin
    .from("activation_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !activation) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  if (!activation.is_active) {
    return NextResponse.json({ ok: false, error: "inactive" }, { status: 400 });
  }

  if (activation.used_count >= activation.max_uses) {
    return NextResponse.json({ ok: false, error: "max_uses" }, { status: 400 });
  }

  if (activation.expires_at && new Date(activation.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 400 });
  }

  const now = new Date();
  const endsAt = new Date();
  endsAt.setDate(now.getDate() + 28);

  const { error: upsertErr } = await supabaseAdmin.from("entitlements").upsert(
    {
      user_id: user.id,
      plan: activation.plan ?? "ramadan_28",
      status: "active",
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 500 });
  }

  await supabaseAdmin
    .from("activation_codes")
    .update({ used_count: activation.used_count + 1 })
    .eq("id", activation.id);

  return NextResponse.json({ success: true, ok: true });
}
