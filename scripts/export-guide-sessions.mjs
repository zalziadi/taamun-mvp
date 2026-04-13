#!/usr/bin/env node
/**
 * export-guide-sessions.mjs
 * ─────────────────────────
 * يجلب محادثات المرشد الذكي من Supabase ويصدّرها كـ JSON + TXT
 *
 * التشغيل من جذر المشروع:
 *   node scripts/export-guide-sessions.mjs
 *
 * المخرجات:
 *   - tamaan_conversations_export.json  (كل المحادثات)
 *   - tamaan_conversations_clean.txt    (رسائل المستخدمين فقط)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/* ── Load .env.local ──────────────────────────────── */
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=["']?(.+?)["']?$/);
      if (match) process.env[match[1]] = match[2];
    }
  } catch {
    console.error("❌ لم أجد .env.local — تأكد إنك تشغّل السكربت من جذر المشروع");
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ متغيرات البيئة ناقصة (SUPABASE_URL / SERVICE_ROLE_KEY)");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

/* ── Main ─────────────────────────────────────────── */
async function main() {
  console.log("⏳ جاري جلب محادثات المرشد الذكي...\n");

  // 1. Get total count
  const { count: totalCount, error: countErr } = await admin
    .from("guide_sessions")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("❌ خطأ في الجلب:", countErr.message);
    process.exit(1);
  }

  console.log(`📊 إجمالي الجلسات في الجدول: ${totalCount}`);

  // 2. Fetch last 100 sessions ordered by most recent
  const { data: sessions, error: fetchErr } = await admin
    .from("guide_sessions")
    .select("id, user_id, messages, message_count, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (fetchErr) {
    console.error("❌ خطأ في جلب الجلسات:", fetchErr.message);
    process.exit(1);
  }

  if (!sessions || sessions.length === 0) {
    console.log("⚠️ لا توجد جلسات محادثة في الجدول.");
    process.exit(0);
  }

  console.log(`✅ تم جلب ${sessions.length} جلسة\n`);

  // 3. Build export JSON — flatten messages with metadata
  const exportData = [];
  const userMessagesOnly = [];
  let totalMessages = 0;
  let userMessages = 0;
  let assistantMessages = 0;

  for (const session of sessions) {
    const msgs = Array.isArray(session.messages) ? session.messages : [];
    totalMessages += msgs.length;

    for (const msg of msgs) {
      const entry = {
        session_id: session.id,
        user_id: session.user_id,
        role: msg.role,
        content: msg.content,
        session_created_at: session.created_at,
        session_updated_at: session.updated_at,
      };
      exportData.push(entry);

      if (msg.role === "user") {
        userMessages++;
        userMessagesOnly.push(msg.content);
      } else {
        assistantMessages++;
      }
    }
  }

  // 4. Write JSON export
  const jsonPath = resolve(ROOT, "tamaan_conversations_export.json");
  writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`📁 JSON: ${jsonPath}`);

  // 5. Write clean TXT (user messages only)
  const txtPath = resolve(ROOT, "tamaan_conversations_clean.txt");
  writeFileSync(txtPath, userMessagesOnly.join("\n"), "utf-8");
  console.log(`📁 TXT:  ${txtPath}`);

  // 6. Summary
  console.log("\n" + "═".repeat(50));
  console.log("📋 ملخص التصدير:");
  console.log("═".repeat(50));
  console.log(`   الجدول: guide_sessions`);
  console.log(`   إجمالي الجلسات في القاعدة: ${totalCount}`);
  console.log(`   الجلسات المصدّرة: ${sessions.length}`);
  console.log(`   إجمالي الرسائل: ${totalMessages}`);
  console.log(`   رسائل المستخدمين: ${userMessages}`);
  console.log(`   ردود المرشد: ${assistantMessages}`);
  console.log(`   جلسات بدون رسائل: ${sessions.filter((s) => !s.messages || s.messages.length === 0).length}`);

  // Date range
  const dates = sessions
    .map((s) => new Date(s.updated_at || s.created_at))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length > 0) {
    const oldest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newest = new Date(Math.max(...dates.map((d) => d.getTime())));
    console.log(`   الفترة: ${oldest.toISOString().split("T")[0]} → ${newest.toISOString().split("T")[0]}`);
  }

  console.log("═".repeat(50));
  console.log("✅ تم التصدير بنجاح!");
}

main().catch((err) => {
  console.error("❌ خطأ غير متوقع:", err);
  process.exit(1);
});
