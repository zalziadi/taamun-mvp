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

  /* جلب الأكواد المستخدمة + أول 50 كود متاح لكل باقة */
  const { data: usedData } = await auth.admin
    .from("activation_codes")
    .select("*")
    .not("used_by", "is", null)
    .order("id", { ascending: false });

  const { data: availData } = await auth.admin
    .from("activation_codes")
    .select("*")
    .is("used_by", null)
    .order("id", { ascending: false })
    .limit(200);

  const { count: totalCount } = await auth.admin
    .from("activation_codes")
    .select("*", { count: "exact", head: true });

  const { count: availCount } = await auth.admin
    .from("activation_codes")
    .select("*", { count: "exact", head: true })
    .is("used_by", null);

  const data = [...(availData ?? []), ...(usedData ?? [])];

  return NextResponse.json({
    ok: true,
    codes: data,
    totalCount: totalCount ?? 0,
    availCount: availCount ?? 0,
    usedCount: (totalCount ?? 0) - (availCount ?? 0),
  });
}

/**
 * POST /api/admin/activations
 * إنشاء كود تفعيل جديد
 * Body: { tier: "eid" | "monthly" | "yearly" | "vip", note?: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const tier = body.tier || "monthly";

  /* توليد كود عشوائي فريد */
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const code = `TAAMUN-${suffix}`;

  const { data, error } = await auth.admin
    .from("activation_codes")
    .insert({ code, tier, created_by: auth.user?.id ?? null })
    .select()
    .single();

  if (error) {
    console.error("[admin/activations] POST error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: data });
}
