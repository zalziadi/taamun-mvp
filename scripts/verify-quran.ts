// scripts/verify-quran.ts
// يتحقق من اكتمال النص في DB بعد الـ Seed
// تشغيل: node --loader ts-node/esm scripts/verify-quran.ts

import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const REQUIRED = [
  { surah: 96, ayah: 1 },
  { surah: 2, ayah: 286 },
  { surah: 94, ayah: 5 },
  { surah: 14, ayah: 7 },
  { surah: 39, ayah: 53 },
  { surah: 13, ayah: 11 },
  { surah: 20, ayah: 46 },
  { surah: 51, ayah: 56 },
  { surah: 67, ayah: 2 },
  { surah: 57, ayah: 22 },
  { surah: 42, ayah: 30 },
  { surah: 8, ayah: 24 },
  { surah: 53, ayah: 39 },
  { surah: 9, ayah: 51 },
  { surah: 57, ayah: 20 },
  { surah: 29, ayah: 2 },
  { surah: 50, ayah: 16 },
  { surah: 2, ayah: 216 },
  { surah: 89, ayah: 15 },
  { surah: 89, ayah: 16 },
  { surah: 12, ayah: 87 },
  { surah: 55, ayah: 13 },
  { surah: 59, ayah: 18 },
  { surah: 75, ayah: 14 },
  { surah: 24, ayah: 35 },
  { surah: 3, ayah: 191 },
  { surah: 17, ayah: 84 },
  { surah: 34, ayah: 39 },
  { surah: 89, ayah: 27 },
  { surah: 89, ayah: 28 },
  { surah: 89, ayah: 29 },
  { surah: 89, ayah: 30 },
];

async function main() {
  const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const { count } = await supabase.from("quran_ayahs").select("*", { count: "exact", head: true });
  console.log(`Total ayahs in DB: ${count}`);
  if (!count || count < 6000) {
    console.warn("⚠️  Expected ~6236 ayahs. Table may be incomplete.");
  }

  let missing = 0;
  for (const { surah, ayah } of REQUIRED) {
    const { data } = await supabase
      .from("quran_ayahs")
      .select("text_ar")
      .eq("surah", surah)
      .eq("ayah", ayah)
      .maybeSingle();
    if (!data?.text_ar) {
      missing++;
      console.error(`Missing: surah ${surah}, ayah ${ayah}`);
    }
  }

  if (missing === 0) {
    console.log("✅ Verification passed — ready to run.");
  } else {
    console.error(`❌ ${missing} ayah(s) missing. Re-run seed.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Verify failed:", e?.message ?? e);
  process.exit(1);
});
