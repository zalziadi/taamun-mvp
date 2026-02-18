// scripts/seed-quran.ts
// يرفع النص القرآني من quran_ayahs.json إلى Supabase
//
// تشغيل:
//   node --loader ts-node/esm scripts/seed-quran.ts
//   node --loader ts-node/esm scripts/seed-quran.ts ./data/quran_ayahs.json

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

interface AyahRow {
  surah: number;
  ayah: number;
  text_ar: string;
  page: number | null;
  juz: number | null;
  hizb: number | null;
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseRow(raw: Record<string, unknown>, index: number): AyahRow {
  const surah = toInt(raw.surah);
  const ayah = toInt(raw.ayah);

  if (!surah || surah < 1 || surah > 114)
    throw new Error(`Row ${index}: invalid surah "${String(raw.surah)}"`);
  if (!ayah || ayah < 1) throw new Error(`Row ${index}: invalid ayah "${String(raw.ayah)}"`);

  const textAr = typeof raw.text_ar === "string" ? raw.text_ar.trim() : "";
  if (!textAr) throw new Error(`Row ${index}: missing text_ar`);

  return {
    surah,
    ayah,
    text_ar: textAr,
    page: toInt(raw.page),
    juz: toInt(raw.juz),
    hizb: toInt(raw.hizb),
  };
}

async function upsertChunk(
  supabase: any,
  rows: AyahRow[],
  from: number
): Promise<void> {
  const { error } = await supabase.from("quran_ayahs").upsert(rows, { onConflict: "surah,ayah" });
  if (error) throw new Error(`Upsert error at row ${from}: ${error.message}`);
  console.log(`  ✓ rows ${from + 1}–${from + rows.length}`);
}

async function main() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  const filePath = path.resolve(process.cwd(), process.argv[2] ?? "quran_ayahs.json");
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  console.log(`\n📖 Loading: ${filePath}`);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("quran_ayahs.json must be a JSON array");

  const rows = parsed.map((r, i) => parseRow(r as Record<string, unknown>, i));
  console.log(`   Parsed ${rows.length} rows\n`);

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await upsertChunk(supabase, rows.slice(i, i + CHUNK), i);
  }

  console.log(`\n✅ Seed complete — ${rows.length} ayahs upserted.\n`);
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e?.message ?? e);
  process.exit(1);
});
