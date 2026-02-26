import { requireUser } from "@/lib/authz";
import { cookies } from "next/headers";
import { ENTITLEMENT_COOKIE_NAME, verifyEntitlementToken } from "@/lib/entitlement";
import { LEGACY_ENTITLEMENT_COOKIE } from "@/lib/appConfig";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = auth.user.email;
  if (userEmail && adminEmail && userEmail === adminEmail) {
    return Response.json({
      ok: true,
      active: true,
      plan: "ramadan_28",
      status: "active",
      startsAt: null,
      endsAt: null,
      source: "admin_email_fallback",
    });
  }

  const cookieStore = await cookies();
  const entitlementToken = cookieStore.get(ENTITLEMENT_COOKIE_NAME)?.value;
  const legacyEntitled = cookieStore.get(LEGACY_ENTITLEMENT_COOKIE)?.value === "1";
  const tokenCheck = verifyEntitlementToken(entitlementToken);

  const { supabase, user } = auth;
  let reader: typeof supabase | ReturnType<typeof getSupabaseAdmin> = supabase;
  try {
    reader = getSupabaseAdmin();
  } catch {
    // Fallback to authenticated user client when service-role env is unavailable.
    reader = supabase;
  }

  const { data: rows, error } = await reader
    .from("entitlements")
    .select("plan, status, starts_at, ends_at")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    const cookieActive = tokenCheck.ok || legacyEntitled;
    return Response.json({
      ok: true,
      active: cookieActive,
      plan: cookieActive ? "ramadan_28" : null,
      status: cookieActive ? "active" : null,
      startsAt: null,
      endsAt: null,
      source: cookieActive ? "cookie" : "none",
    });
  }

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
    status: row?.status ?? null,
    startsAt: row?.starts_at ?? null,
    endsAt: row?.ends_at ?? null,
    source: "database",
  });
}
