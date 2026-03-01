#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 2 — Build Gate (CJ)
// يشغّل TypeScript check + Next.js build ويسجّل النتيجة
// ═══════════════════════════════════════════════════════

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "build.json");

const GATE = "GATE_2_BUILD";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);

function writeReport(status, checks, errors, stdout_summary) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    gate: GATE,
    status,
    timestamp: new Date().toISOString(),
    checks,
    errors,
    stdout_summary,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report → launch-reports/build.json`);
  return report;
}

function runCmd(cmd, label) {
  log(`تشغيل: ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    ok(`${label} نجح`);
    return { success: true, output: output.slice(0, 500) };
  } catch (e) {
    err(`${label} فشل`);
    const combinedOutput = ((e.stdout || "") + (e.stderr || "")).slice(0, 1000);
    return { success: false, output: combinedOutput };
  }
}

function main() {
  log("بدء فحص البناء...");

  const checks = {};
  const errors = [];
  const summaries = {};

  // ── 1. TypeScript Check ───────────────────────────
  const tsc = runCmd("npx tsc --noEmit", "TypeScript Check");
  checks.typescript = tsc.success;
  summaries.typescript = tsc.output;
  if (!tsc.success) errors.push("TYPESCRIPT_ERRORS");

  // ── 2. Next.js Build ──────────────────────────────
  const build = runCmd("npm run build 2>&1", "Next.js Build");
  checks.build = build.success;
  summaries.build = build.output;
  if (!build.success) errors.push("BUILD_FAILED");

  // ── 3. فحص Guards الموجودة ───────────────────────
  const brandGuard = runCmd("node scripts/guards/brand.js", "Brand Guard");
  checks.guard_brand = brandGuard.success;
  summaries.guard_brand = brandGuard.output;
  if (!brandGuard.success) errors.push("BRAND_GUARD_FAILED");

  const runtimeGuard = runCmd("node scripts/guards/runtime.js", "Runtime Guard");
  checks.guard_runtime = runtimeGuard.success;
  summaries.guard_runtime = runtimeGuard.output;
  if (!runtimeGuard.success) errors.push("RUNTIME_GUARD_FAILED");

  const metaGuard = runCmd("node scripts/guards/metadata.js", "Metadata Guard");
  checks.guard_metadata = metaGuard.success;
  summaries.guard_metadata = metaGuard.output;
  if (!metaGuard.success) errors.push("METADATA_GUARD_FAILED");

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (passed) {
    ok("البناء نجح — لا أخطاء TypeScript، لا أخطاء Guards");
  } else {
    err("فشل Gate 2 — الحالة: BLOCKED_BUILD");
    errors.forEach((e) => err(`  • ${e}`));
  }

  writeReport(status, checks, errors, summaries);

  if (!passed) process.exit(1);
  log("Gate 2 اجتاز ✅");
}

main();
