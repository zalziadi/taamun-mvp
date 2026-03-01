#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 7 — Launch Approval Logic
// يقرأ جميع التقارير ويقرر: إطلاق أو حجب
// AUTO_DEPLOY = FALSE — يتطلب موافقة يدوية نهائية
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "deployment.json");

const GATE = "GATE_7_LAUNCH";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);

// الملفات الإجبارية قبل الإطلاق
const REQUIRED_REPORTS = [
  { file: "strategy.json",   gate: "Gate 1 — Strategic" },
  { file: "build.json",      gate: "Gate 2 — Build" },
  { file: "quality.json",    gate: "Gate 3 — Quality" },
  { file: "finance.json",    gate: "Gate 4 — Financial" },
  { file: "marketing.json",  gate: "Gate 5 — Marketing" },
  { file: "final-audit.json",gate: "Gate 6 — System Audit" },
];

function writeDeploymentReport(launch_status, gates_summary, blocked_by, message) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const report = {
    gate: GATE,
    launch_status,
    timestamp: new Date().toISOString(),
    auto_deploy: false,
    requires_manual_approval: true,
    approved_by: null,
    gates_summary,
    blocked_by: blocked_by.length > 0 ? blocked_by : null,
    message,
    mode: "STRICT_PRODUCTION",
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report → launch-reports/deployment.json`);
  return report;
}

function printSummaryBox(gatesSummary, launchStatus, blockedBy) {
  const LINE = "═".repeat(60);
  console.log("\n" + LINE);
  console.log("  TAAMUN — LAUNCH GATE SYSTEM");
  console.log("  نتيجة التدقيق النهائي");
  console.log(LINE);

  gatesSummary.forEach(({ gate, file, status }) => {
    const icon = status === "PASS" ? "✅" : status === "MISSING" ? "⬜" : "❌";
    console.log(`  ${icon} ${gate.padEnd(30)} → ${status}`);
  });

  console.log(LINE);

  if (launchStatus === "SUCCESS") {
    console.log("  🟢 LAUNCH_STATUS: SUCCESS");
    console.log("");
    console.log("  جميع البوابات اجتازت.");
    console.log("  ⚠️  AUTO_DEPLOY = FALSE");
    console.log("  يتطلب موافقة نهائية يدوية من مسخر");
    console.log("  قبل تنفيذ: git tag v-launch && deploy");
  } else {
    console.log("  🔴 LAUNCH_STATUS: BLOCKED");
    console.log("");
    console.log("  محجوب بسبب:");
    blockedBy.forEach((b) => console.log(`    • ${b}`));
  }

  console.log(LINE + "\n");
}

function main() {
  log("بدء التحقق النهائي من جميع البوابات...");

  const gatesSummary = [];
  const blockedBy = [];

  // ── قراءة جميع التقارير ──────────────────────────
  for (const { file, gate } of REQUIRED_REPORTS) {
    const reportPath = path.join(REPORT_DIR, file);

    if (!fs.existsSync(reportPath)) {
      err(`تقرير غير موجود: ${file} — ${gate} لم تُشغَّل بعد`);
      gatesSummary.push({ gate, file, status: "MISSING" });
      blockedBy.push(`MISSING_REPORT: ${file}`);
      continue;
    }

    let report;
    try {
      report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    } catch {
      err(`تعذّر قراءة: ${file}`);
      gatesSummary.push({ gate, file, status: "CORRUPT" });
      blockedBy.push(`CORRUPT_REPORT: ${file}`);
      continue;
    }

    const status = report.status || "UNKNOWN";
    gatesSummary.push({ gate, file, status, timestamp: report.timestamp });

    if (status !== "PASS") {
      blockedBy.push(`FAILED: ${gate} (${file})`);
      err(`${gate} — الحالة: ${status}`);
    } else {
      ok(`${gate} — PASS`);
    }
  }

  // ── تحقق من أعمار التقارير (لا تقبل تقارير أكثر من 24 ساعة) ──
  const staleReports = [];
  const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 ساعة
  const now = Date.now();

  for (const { gate, file, timestamp } of gatesSummary) {
    if (!timestamp) continue;
    const reportAge = now - new Date(timestamp).getTime();
    if (reportAge > MAX_AGE_MS) {
      staleReports.push(file);
    }
  }

  if (staleReports.length > 0) {
    staleReports.forEach((f) => {
      console.warn(`[${GATE}] ⚠️  تقرير قديم (أكثر من 24 ساعة): ${f} — يُنصح بإعادة الفحص`);
    });
  }

  // ── القرار النهائي ────────────────────────────────
  const allPassed = blockedBy.length === 0;
  const launchStatus = allPassed ? "SUCCESS" : "BLOCKED";

  let message;
  if (allPassed) {
    message = "جميع البوابات اجتازت. النظام جاهز للإطلاق. يتطلب موافقة يدوية من مسخر.";
    if (staleReports.length > 0) {
      message += ` تحذير: ${staleReports.length} تقرير قديم.`;
    }
  } else {
    message = `الإطلاق محجوب. ${blockedBy.length} مشكلة تحتاج حلّاً.`;
  }

  const report = writeDeploymentReport(launchStatus, gatesSummary, blockedBy, message);

  // ── طباعة الملخص ──────────────────────────────────
  printSummaryBox(gatesSummary, launchStatus, blockedBy);

  if (allPassed) {
    log("✅ Gate 7 — النظام جاهز للإطلاق");
    log("📋 الخطوات التالية (يدوية):");
    log("   1. راجع launch-reports/deployment.json");
    log("   2. احصل على موافقة مسخر");
    log("   3. نفّذ: git tag v-launch");
    log("   4. ادفع للإنتاج");
    process.exit(0);
  } else {
    err(`Gate 7 فشل — LAUNCH_STATUS: BLOCKED (${blockedBy.length} مشكلة)`);
    process.exit(1);
  }
}

main();
