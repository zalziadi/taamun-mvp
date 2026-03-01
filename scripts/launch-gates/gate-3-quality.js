#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 3 — Quality Gate (شام)
// يتحقق من الـ checklist اليدوي + يشغّل smoke tests
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();
const CONFIG_PATH = path.join(root, "launch-config", "quality.json");
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "quality.json");

const GATE = "GATE_3_QUALITY";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);

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
  log(`Report → launch-reports/quality.json`);
  return report;
}

function main() {
  log("بدء فحص الجودة...");

  const checks = {};
  const errors = [];

  // ── 1. تحقق من وجود الملف ────────────────────────
  if (!fs.existsSync(CONFIG_PATH)) {
    err("launch-config/quality.json غير موجود");
    errors.push("MISSING_QUALITY_CONFIG");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    err("quality.json غير صالح JSON");
    errors.push("INVALID_JSON");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  if (config._instructions) {
    err("احذف حقل _instructions من quality.json");
    errors.push("INSTRUCTIONS_NOT_REMOVED");
  }

  // ── 2. فحص الـ Checklist اليدوي ──────────────────
  const checklist = config.manual_checklist || {};
  const REQUIRED_CHECKS = [
    "registration_works",
    "login_works",
    "data_save_works",
    "crud_complete",
    "permissions_correct",
    "no_500_errors",
    "no_404_errors",
    "mobile_tested",
    "browser_chrome",
    "browser_safari",
    "browser_firefox",
    "rtl_correct",
    "localstorage_persists",
  ];

  const failedChecks = [];
  for (const check of REQUIRED_CHECKS) {
    checks[check] = !!checklist[check];
    if (!checklist[check]) failedChecks.push(check);
  }

  if (failedChecks.length > 0) {
    errors.push("MANUAL_CHECKLIST_INCOMPLETE");
    err(`فحوصات لم تُكتمل يدويًا (${failedChecks.length}):`);
    failedChecks.forEach((c) => err(`  • ${c}`));
  } else {
    ok("جميع الفحوصات اليدوية مكتملة");
  }

  // ── 3. Smoke Tests إن وُجدت ───────────────────────
  const smokeDir = path.join(root, "scripts", "smoke");
  if (fs.existsSync(smokeDir)) {
    const smokeFiles = fs.readdirSync(smokeDir).filter((f) => f.endsWith(".js"));
    let smokePass = true;
    for (const file of smokeFiles) {
      const filePath = path.join(smokeDir, file);
      try {
        execSync(`node "${filePath}"`, { cwd: root, stdio: "inherit" });
        ok(`Smoke test نجح: ${file}`);
        checks[`smoke_${file}`] = true;
      } catch (e) {
        err(`Smoke test فشل: ${file}`);
        checks[`smoke_${file}`] = false;
        errors.push(`SMOKE_TEST_FAILED_${file.toUpperCase().replace(/\./g, "_")}`);
        smokePass = false;
      }
    }
    if (smokePass) ok("جميع Smoke Tests نجحت");
  } else {
    log("لا يوجد smoke tests — تخطي");
    checks.smoke_tests = "SKIPPED";
  }

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (passed) {
    ok("فحص الجودة اجتاز بنجاح");
  } else {
    err("فشل Gate 3 — الحالة: BLOCKED_QUALITY");
    errors.forEach((e) => err(`  • ${e}`));
    err("أعِد الفحص اليدوي وحدّث launch-config/quality.json ثم أعِد تشغيل الـ Gate");
  }

  writeReport(status, checks, errors);

  if (!passed) process.exit(1);
  log("Gate 3 اجتاز ✅");
}

main();
