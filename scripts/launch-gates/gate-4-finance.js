#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 4 — Financial Gate (شاهيم)
// يتحقق من هامش الربح وتغطية تكاليف السيرفر
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const CONFIG_PATH = path.join(root, "launch-config", "finance.json");
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "finance.json");

const GATE = "GATE_4_FINANCE";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);

function writeReport(status, checks, errors, calculations) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    gate: GATE,
    status,
    timestamp: new Date().toISOString(),
    checks,
    errors,
    calculations,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report → launch-reports/finance.json`);
  return report;
}

function main() {
  log("بدء الفحص المالي...");

  const checks = {};
  const errors = [];
  const calculations = {};

  // ── 1. تحقق من وجود الملف ────────────────────────
  if (!fs.existsSync(CONFIG_PATH)) {
    err("launch-config/finance.json غير موجود");
    errors.push("MISSING_FINANCE_CONFIG");
    writeReport("FAIL", checks, errors, calculations);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    err("finance.json غير صالح JSON");
    errors.push("INVALID_JSON");
    writeReport("FAIL", checks, errors, calculations);
    process.exit(1);
  }

  if (config._instructions) {
    err("احذف حقل _instructions من finance.json");
    errors.push("INSTRUCTIONS_NOT_REMOVED");
  }

  // ── 2. التحقق من القيم الأساسية ───────────────────
  const {
    monthly_server_cost_sar,
    price_per_unit_sar,
    variable_cost_per_unit_sar,
    expected_units_first_month,
    competitor_pricing_sar,
  } = config;

  checks.all_fields_present = (
    monthly_server_cost_sar !== null &&
    price_per_unit_sar !== null &&
    variable_cost_per_unit_sar !== null &&
    expected_units_first_month !== null
  );
  if (!checks.all_fields_present) {
    errors.push("MISSING_FINANCIAL_FIELDS");
    err("حقول مالية ناقصة — تحقق من finance.json");
    writeReport("FAIL", checks, errors, calculations);
    process.exit(1);
  }

  // ── 3. حساب هامش الربح ────────────────────────────
  const grossProfitPerUnit = price_per_unit_sar - variable_cost_per_unit_sar;
  const totalRevenue = price_per_unit_sar * expected_units_first_month;
  const totalVariableCost = variable_cost_per_unit_sar * expected_units_first_month;
  const netProfit = totalRevenue - totalVariableCost - monthly_server_cost_sar;
  const profitMarginPercent = ((grossProfitPerUnit / price_per_unit_sar) * 100).toFixed(1);
  const breakevenUnits = Math.ceil(monthly_server_cost_sar / grossProfitPerUnit);

  calculations.price_per_unit = price_per_unit_sar;
  calculations.variable_cost_per_unit = variable_cost_per_unit_sar;
  calculations.gross_profit_per_unit = grossProfitPerUnit;
  calculations.total_revenue_first_month = totalRevenue;
  calculations.server_cost = monthly_server_cost_sar;
  calculations.net_profit_first_month = netProfit;
  calculations.profit_margin_percent = parseFloat(profitMarginPercent);
  calculations.breakeven_units = breakevenUnits;

  log(`الإيراد المتوقع: ${totalRevenue} SAR`);
  log(`صافي الربح: ${netProfit} SAR`);
  log(`هامش الربح: ${profitMarginPercent}%`);
  log(`نقطة التعادل: ${breakevenUnits} وحدة`);

  // ── 4. فحص الهامش الإيجابي ────────────────────────
  checks.positive_gross_margin = grossProfitPerUnit > 0;
  if (!checks.positive_gross_margin) {
    errors.push("NEGATIVE_GROSS_MARGIN");
    err("هامش الربح الإجمالي سلبي — السعر أقل من التكلفة المتغيرة");
  }

  // ── 5. فحص تغطية السيرفر ──────────────────────────
  checks.server_cost_covered = netProfit >= 0;
  if (!checks.server_cost_covered) {
    errors.push("SERVER_COST_NOT_COVERED");
    err(`خسارة متوقعة: ${Math.abs(netProfit)} SAR — تحتاج ${breakevenUnits} وحدة للتعادل`);
  } else {
    ok(`تكلفة السيرفر مغطاة — ربح صافٍ: ${netProfit} SAR`);
  }

  // ── 6. فحص المنافسة ────────────────────────────────
  if (competitor_pricing_sar && competitor_pricing_sar.lowest !== null) {
    const competitorAvg = (competitor_pricing_sar.lowest + competitor_pricing_sar.highest) / 2;
    checks.competitive_pricing = price_per_unit_sar <= competitorAvg * 1.5;
    calculations.competitor_avg = competitorAvg;
    calculations.price_vs_market_percent = (((price_per_unit_sar / competitorAvg) - 1) * 100).toFixed(1);

    if (!checks.competitive_pricing) {
      errors.push("PRICE_TOO_HIGH_VS_MARKET");
      err(`السعر أعلى بـ ${calculations.price_vs_market_percent}% من متوسط السوق — قد يؤثر على المبيعات`);
    } else {
      ok(`التسعير تنافسي (${calculations.price_vs_market_percent}% فوق/تحت المتوسط)`);
    }
  } else {
    checks.competitive_pricing = "SKIPPED";
    log("لا توجد بيانات منافسين — تخطي فحص التسعير التنافسي");
  }

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (passed) {
    ok("الفحص المالي اجتاز — المخاطر في حدود المقبول");
  } else {
    err("فشل Gate 4 — الحالة: BLOCKED_FINANCE");
    errors.forEach((e) => err(`  • ${e}`));
  }

  writeReport(status, checks, errors, calculations);

  if (!passed) process.exit(1);
  log("Gate 4 اجتاز ✅");
}

main();
