import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import crypto from "crypto";

/**
 * GET /api/admin/activations
 * جلب جميع أكواد التفعيل
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.admin
    .from("activation_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/activations] GET error:", error.message);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, codes: data ?? [] });
}

/**
 * POST /api/admin/activations
 * إنشاء كود تفعيل جديد
 * Body: { tier: "eid" | "monthly" | "yearly" | "vip", note?: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { tier?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const tier = body.tier || "monthly";
  const note = body.note?.trim() || null;

  /* توليد كود عشوائي فريد */
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const code = `TAAMUN-${suffix}`;

  const { data, error } = await auth.admin
    .from("activation_codes")
    .insert({
      code,
      tier,
      note,
      created_by: auth.user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/activations] POST error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: data });
}
