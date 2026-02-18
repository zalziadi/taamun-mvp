import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error } = await supabase.auth.getUser();
  const user = auth?.user;

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, supabase, user };
}

export async function requireAdmin() {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authResult.user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user: authResult.user, admin };
}
