import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import crypto from "crypto";

/**
 * GET /api/admin/vip-gifts
 * جلب أكواد الهدايا السنوية (product = "vip-gift")
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.admin
    .from("activation_codes")
    .select("*")
    .eq("product", "vip-gift")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, codes: data ?? [] });
}

/**
 * POST /api/admin/vip-gifts
 * إنشاء أكواد هدايا سنوية بالجملة
 * Body: { count: number } — عدد الأكواد المطلوبة (افتراضي 1، أقصى 50)
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { count?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const count = Math.min(Math.max(body.count ?? 1, 1), 50);
  const codes: Array<{ code: string; tier: string; product: string; created_by: string }> = [];

  for (let i = 0; i < count; i++) {
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push({
      code: `TAAMUN-820-${suffix}`,
      tier: "yearly",
      product: "vip-gift",
      created_by: auth.user?.id ?? "admin",
    });
  }

  const { data, error } = await auth.admin
    .from("activation_codes")
    .insert(codes)
    .select();

  if (error) {
    console.error("[admin/vip-gifts] POST error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, codes: data ?? [], created: data?.length ?? 0 });
}
