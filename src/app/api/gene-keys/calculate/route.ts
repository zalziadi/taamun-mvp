import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateGeneKeysProfile } from "@/lib/gene-keys/calculate";
import geneKeysData from "./gene_keys_data.json";

export const dynamic = "force-dynamic";

type CalcBody = {
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
};

export async function POST(req: Request) {
  // Auth is optional — calculate for anyone, save only if logged in
  const auth = await requireUser();
  const userId = auth.ok ? auth.user.id : null;

  let body: CalcBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { birth_date, birth_time, birth_place } = body;
  if (!birth_date || !birth_time || !birth_place) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", error_ar: "يرجى تعبئة جميع الحقول المطلوبة" },
      { status: 400 }
    );
  }

  try {
    // UTC offset: default to +3 (Saudi Arabia)
    // TODO: derive from birth_place geocoding
    const utcOffset = 3;

    const spheres = calculateGeneKeysProfile(birth_date, birth_time, utcOffset, geneKeysData);

    // Save to DB only if authenticated
    if (userId) {
      const admin = getSupabaseAdmin();

      await admin.from("user_birth_data").upsert(
        { user_id: userId, birth_date, birth_time, birth_place },
        { onConflict: "user_id" }
      );

      for (const s of spheres) {
        await admin.from("user_gene_keys_profile").upsert(
          { user_id: userId, ...s },
          { onConflict: "user_id,sphere" }
        );
      }
    }

    return NextResponse.json({ ok: true, profile: spheres });
  } catch (err) {
    console.error("[gene-keys/calculate] Error:", err);
    return NextResponse.json(
      { ok: false, error: "calculation_failed", error_ar: "خطأ في الحساب — حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
