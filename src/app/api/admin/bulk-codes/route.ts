import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import crypto from "crypto";

/**
 * POST /api/admin/bulk-codes
 * توليد أكواد تفعيل بالجملة
 * Body: { count?: number } — الافتراضي 850 لكل باقة
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

  const countPerTier = Math.min(body.count ?? 850, 1000);
  const tiers = ["eid", "monthly", "yearly", "vip"];
  const now = new Date().toISOString();
  const usedCodes = new Set<string>();
  const allRows: Array<{
    code: string;
    tier: string;
  }> = [];

  for (const tier of tiers) {
    for (let i = 0; i < countPerTier; i++) {
      let code: string;
      do {
        code = `TAAMUN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      } while (usedCodes.has(code));
      usedCodes.add(code);
      allRows.push({ code, tier });
    }
  }

  /* إدخال على دفعات (500 في كل دفعة) لتجنب timeout */
  const batchSize = 500;
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    const { error } = await auth.admin
      .from("activation_codes")
      .insert(batch);

    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    total: allRows.length,
    inserted,
    perTier: countPerTier,
    tiers: tiers.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
