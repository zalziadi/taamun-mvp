#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 1 — Strategic Gate (برهان)
// يتحقق من اكتمال الاستراتيجية قبل أي خطوة
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const CONFIG_PATH = path.join(root, "launch-config", "strategy.json");
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "strategy.json");

const GATE = "GATE_1_STRATEGY";
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
  log(`Report → launch-reports/strategy.json`);
  return report;
}

function main() {
  log("بدء الفحص الاستراتيجي...");

  const checks = {};
  const errors = [];

  // ── 1. تحقق من وجود الملف ────────────────────────
  if (!fs.existsSync(CONFIG_PATH)) {
    err("launch-config/strategy.json غير موجود");
    errors.push("MISSING_CONFIG_FILE");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    err("strategy.json غير صالح JSON");
    errors.push("INVALID_JSON");
    writeReport("FAIL", checks, errors);
    process.exit(1);
  }

  // ── 2. تحقق من اسم الباقة ─────────────────────────
  checks.package_name = !!config.package_name && config.package_name.trim() !== "";
  if (!checks.package_name) errors.push("MISSING_PACKAGE_NAME");

  // ── 3. تحقق من التسعير ────────────────────────────
  checks.pricing = (
    config.pricing &&
    config.pricing.amount !== null &&
    config.pricing.amount > 0 &&
    config.pricing.currency &&
    config.pricing.billing_cycle
  );
  if (!checks.pricing) errors.push("MISSING_OR_INVALID_PRICING");

  // ── 4. تحقق من الجمهور المستهدف ───────────────────
  checks.target_audience = !!config.target_audience && config.target_audience.trim() !== "";
  if (!checks.target_audience) errors.push("MISSING_TARGET_AUDIENCE");

  // ── 5. تحقق من KPI ────────────────────────────────
  checks.kpi = (
    config.kpi &&
    config.kpi.metric &&
    config.kpi.metric.trim() !== "" &&
    config.kpi.target_value !== null &&
    config.kpi.target_value > 0 &&
    config.kpi.timeframe_days > 0
  );
  if (!checks.kpi) errors.push("MISSING_OR_INVALID_KPI");

  // ── 6. تحقق من خطة 30 يوم ────────────────────────
  const plan = config.post_launch_plan_30_days || {};
  checks.post_launch_plan = (
    plan.week1 && plan.week1.trim() !== "" &&
    plan.week2 && plan.week2.trim() !== "" &&
    plan.week3 && plan.week3.trim() !== "" &&
    plan.week4 && plan.week4.trim() !== ""
  );
  if (!checks.post_launch_plan) errors.push("INCOMPLETE_30_DAY_PLAN");

  // ── 7. تحقق من عدم وجود تعليمات فارغة ────────────
  if (config._instructions) {
    err("احذف حقل _instructions من strategy.json قبل المتابعة");
    errors.push("INSTRUCTIONS_NOT_REMOVED");
  }

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (passed) {
    ok(`الاستراتيجية مكتملة — الباقة: "${config.package_name}" @ ${config.pricing.amount} ${config.pricing.currency}`);
    ok(`KPI: ${config.kpi.metric} → ${config.kpi.target_value} خلال ${config.kpi.timeframe_days} يوم`);
  } else {
    err(`فشل Gate 1 — الحالة: BLOCKED_STRATEGY`);
    errors.forEach((e) => err(`  • ${e}`));
  }

  const report = writeReport(status, checks, errors);

  if (!passed) process.exit(1);
  log("Gate 1 اجتاز ✅");
}

main();
