import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BASE_CODES, PLAN_820_CODES, validateCode } from "@/lib/activation";
import { ENTITLEMENT_COOKIE_NAME, makeEntitlementToken } from "@/lib/entitlement";
import { LEGACY_ENTITLEMENT_COOKIE, RAMADAN_ENDS_AT_ISO } from "@/lib/appConfig";
import { DAY1_ROUTE } from "@/lib/routes";
import type { PlanKey } from "@/lib/plans";

type ActivateBody = {
  code?: string;
};

type PlanType = PlanKey;

function normalizeCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function resolvePlan(code: string): { plan: PlanType; days: number } {
  if (PLAN_820_CODES.includes(code)) return { plan: "plan820", days: 28 };
  if (code.includes("TRIAL")) return { plan: "trial24h", days: 1 };
  if (code.includes("YEAR")) return { plan: "yearly", days: 365 };
  if (BASE_CODES.includes(code)) return { plan: "ramadan_28", days: 28 };
  return { plan: "ramadan_28", days: 28 };
}

async function activateForRequest(codeRaw: unknown) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const code = normalizeCode(codeRaw);
  if (!code) {
    return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
  }

  const result = validateCode(code);
  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 400 });
    }
    if (result.error === "invalid_format") {
      return NextResponse.json({ ok: false, error: "invalid_format" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const { user } = auth;
  let supabaseWriter: ReturnType<typeof getSupabaseAdmin> | typeof auth.supabase;
  let usingAdminClient = false;
  try {
    supabaseWriter = getSupabaseAdmin();
    usingAdminClient = true;
  } catch {
    // Fallback to authenticated user client when service-role env is unavailable.
    supabaseWriter = auth.supabase;
  }
  const now = new Date();
  const { plan, days } = resolvePlan(code);
  const startsAt = now.toISOString();
  let endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  if (plan === "ramadan_28") {
    const ramadanEndsAt = new Date(RAMADAN_ENDS_AT_ISO);
    if (now.getTime() > ramadanEndsAt.getTime()) {
      return NextResponse.json({ ok: false, error: "ramadan_ended" }, { status: 400 });
    }
    endsAt = ramadanEndsAt.toISOString();
  }

  let { error } = await supabaseWriter.from("entitlements").upsert(
    {
      user_id: user.id,
      plan,
      status: "active",
      starts_at: startsAt,
      ends_at: endsAt,
    },
    { onConflict: "user_id" }
  );

  if (error && usingAdminClient) {
    // If admin credentials are misconfigured, retry with the authenticated user client.
    const retry = await auth.supabase.from("entitlements").upsert(
      {
        user_id: user.id,
        plan,
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      },
      { onConflict: "user_id" }
    );
    error = retry.error;
  }

  const dbPersisted = !error;

  let token: string | null = null;
  try {
    token = makeEntitlementToken(days);
  } catch {
    token = null;
  }
  const maxAge =
    plan === "ramadan_28"
      ? Math.max(60, Math.floor((new Date(endsAt).getTime() - now.getTime()) / 1000))
      : days * 24 * 60 * 60;
  const res = NextResponse.json({
    ok: true,
    plan,
    endsAt,
    redirectTo: DAY1_ROUTE,
    persistence: dbPersisted ? "database" : "cookie",
  });

  // Keep backward compatibility while moving to signed entitlement token.
  res.cookies.set({
    name: LEGACY_ENTITLEMENT_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  if (token) {
    res.cookies.set({
      name: ENTITLEMENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
  }

  return res;
}

export async function POST(req: Request) {
  let body: ActivateBody = {};
  try {
    body = (await req.json()) as ActivateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  return activateForRequest(body.code);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return activateForRequest(searchParams.get("code"));
}
