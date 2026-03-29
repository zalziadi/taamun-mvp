/**
 * توليد 30 كود عيدية (eid tier) وإدخالها في قاعدة البيانات
 * Usage: npx tsx scripts/generate-eid-codes.ts
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// تحميل المتغيرات من .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const COUNT = 30;
const TIER = "eid";

async function main() {
  console.log(`\n🌙 توليد ${COUNT} كود عيدية تمعّن...\n`);

  const codes = Array.from({ length: COUNT }, () => {
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    return {
      code: `TAAMUN-${suffix}`,
      tier: TIER,
    };
  });

  const { data, error } = await supabase
    .from("activation_codes")
    .insert(codes)
    .select("code");

  if (error) {
    console.error("❌ خطأ:", error.message);
    process.exit(1);
  }

  console.log(`✅ تم إنشاء ${data.length} كود عيدية:\n`);
  data.forEach((row, i) => {
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${row.code}`);
  });

  console.log(`\n🎁 الأكواد جاهزة في /admin/activations\n`);
}

main();
