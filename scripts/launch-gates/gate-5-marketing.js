#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 5 — Marketing Gate (الذئب الشمال)
// يتحقق من اكتمال المواد التسويقية قبل الإطلاق
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const CONFIG_PATH = path.join(root, "launch-config", "marketing.json");
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "marketing.json");

const GATE = "GATE_5_MARKETING";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);

const MIN_DESCRIPTION_LENGTH = 50;
const MIN_CTA_LENGTH = 5;
const MIN_LAUNCH_MESSAGE_LENGTH = 100;

function writeReport(status, checks, errors) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    gate: GATE,
    status,
    timestamp: new Date().toISOString(),
    checks,
    errors,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report → launch-reports/marketing.json`);
  return report;
}

function main() {
  log("بدء فحص التسويق...");

  const checks = {};
  const errors = [];

  // ── 1. تحقق من وجود الملف ────────────────────────
  if (!fs.existsSync(CONFIG_PATH)) {
    err("launch-config/marketing.json غير موجود");
    errors.push("MISSING_MARKETING_CONFIG");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    err("marketing.json غير صالح JSON");
    errors.push("INVALID_JSON");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  if (config._instructions) {
    err("احذف حقل _instructions من marketing.json");
    errors.push("INSTRUCTIONS_NOT_REMOVED");
  }

  // ── 2. وصف احترافي للباقة ─────────────────────────
  const desc = config.package_description_professional || "";
  checks.professional_description = desc.trim().length >= MIN_DESCRIPTION_LENGTH;
  if (!checks.professional_description) {
    errors.push("DESCRIPTION_TOO_SHORT_OR_MISSING");
    err(`الوصف قصير أو غير موجود (الحد الأدنى: ${MIN_DESCRIPTION_LENGTH} حرف)`);
  } else {
    ok(`وصف الباقة موجود (${desc.trim().length} حرف)`);
  }

  // ── 3. CTA واضح ───────────────────────────────────
  const cta = config.cta_text || "";
  checks.cta_text = cta.trim().length >= MIN_CTA_LENGTH;
  if (!checks.cta_text) {
    errors.push("CTA_MISSING_OR_TOO_SHORT");
    err("CTA غير موجود أو قصير جداً");
  } else {
    ok(`CTA: "${cta.trim()}"`);
  }

  // ── 4. صفحة العرض ─────────────────────────────────
  const landing = config.landing_page_url || "";
  checks.landing_page_url = landing.trim() !== "" && (
    landing.startsWith("http://") ||
    landing.startsWith("https://") ||
    landing.startsWith("/")
  );
  if (!checks.landing_page_url) {
    errors.push("LANDING_PAGE_URL_MISSING_OR_INVALID");
    err("رابط صفحة العرض غير موجود أو غير صالح");
  } else {
    ok(`Landing page: ${landing}`);
  }

  // ── 5. رسالة الإطلاق ──────────────────────────────
  const msg = config.launch_message || "";
  checks.launch_message = msg.trim().length >= MIN_LAUNCH_MESSAGE_LENGTH;
  if (!checks.launch_message) {
    errors.push("LAUNCH_MESSAGE_TOO_SHORT_OR_MISSING");
    err(`رسالة الإطلاق قصيرة جداً (الحد الأدنى: ${MIN_LAUNCH_MESSAGE_LENGTH} حرف، الحالية: ${msg.trim().length})`);
  } else {
    ok(`رسالة الإطلاق موجودة (${msg.trim().length} حرف)`);
  }

  // ── 6. خطة الإعلان الأسبوع الأول ─────────────────
  const ad = config.week1_ad_plan || {};
  checks.week1_ad_plan = (
    ad.platform && ad.platform.trim() !== "" &&
    ad.budget_sar !== null && ad.budget_sar > 0 &&
    ad.target_segment && ad.target_segment.trim() !== ""
  );
  if (!checks.week1_ad_plan) {
    errors.push("WEEK1_AD_PLAN_INCOMPLETE");
    err("خطة إعلان الأسبوع الأول غير مكتملة (platform, budget_sar, target_segment)");
  } else {
    ok(`خطة الإعلان: ${ad.platform} — ميزانية ${ad.budget_sar} SAR — ${ad.target_segment}`);
  }

  // ── 7. Quality Checklist التسويقية ────────────────
  const qc = config.quality_checklist || {};
  const marketingChecks = [
    "landing_page_complete",
    "cta_visible_above_fold",
    "mobile_responsive",
    "rtl_correct",
  ];
  const failedQC = marketingChecks.filter((c) => !qc[c]);
  checks.marketing_quality_checklist = failedQC.length === 0;
  if (!checks.marketing_quality_checklist) {
    errors.push("MARKETING_CHECKLIST_INCOMPLETE");
    err("فحوصات تسويقية لم تكتمل:");
    failedQC.forEach((c) => err(`  • ${c}`));
  } else {
    ok("الـ checklist التسويقي مكتمل");
  }

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (passed) {
    ok("فحص التسويق اجتاز — جميع المواد جاهزة");
  } else {
    err("فشل Gate 5 — المواد التسويقية غير مكتملة");
    errors.forEach((e) => err(`  • ${e}`));
  }

  writeReport(status, checks, errors);

  if (!passed) process.exit(1);
  log("Gate 5 اجتاز ✅");
}

main();
