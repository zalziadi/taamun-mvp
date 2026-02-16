import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) {
    return Response.json({ ok: false, active: false, error: "Server config" }, { status: 500 });
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
    return Response.json({ ok: false, active: false }, { status: 401 });
  }

  const { data: rows } = await getSupabaseAdmin()
    .from("entitlements")
    .select("plan, status, starts_at, ends_at")
    .eq("user_id", user.id)
    .limit(1);

  const row = rows?.[0];
  const now = new Date().toISOString();
  const active =
    !!row &&
    row.status === "active" &&
    (row.ends_at == null || row.ends_at > now) &&
    (row.starts_at == null || row.starts_at <= now);

  return Response.json({
    ok: true,
    active,
    plan: row?.plan ?? null,
    endsAt: row?.ends_at ?? null,
  });
}
