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

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "server_misconfig" }, { status: 500 }),
    };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const userEmail = (authResult.user.email || "").trim().toLowerCase();
  if (adminEmail && userEmail && adminEmail === userEmail) {
    return { ok: true as const, user: authResult.user, admin };
  }
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authResult.user.id)
    .maybeSingle();

  if (!error && profile?.role === "admin") {
    return { ok: true as const, user: authResult.user, admin };
  }

  const { data: adminRow, error: adminRowError } = await admin
    .from("admins")
    .select("role")
    .eq("email", userEmail)
    .maybeSingle();

  if (!adminRowError && adminRow?.role === "admin") {
    return { ok: true as const, user: authResult.user, admin };
  }

  return {
    ok: false as const,
    response: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }),
  };
}
