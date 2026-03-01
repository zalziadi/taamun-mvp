#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// TAAMUN — Master Launch Gate Orchestrator
// MODE = STRICT_PRODUCTION | AUTO_DEPLOY = FALSE
//
// الاستخدام:
//   npm run launch:all          — شغّل جميع البوابات
//   npm run launch:gate1        — Gate 1 فقط
//   npm run launch:status       — اعرض الحالة الحالية
// ═══════════════════════════════════════════════════════

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const REPORT_DIR = path.join(root, "launch-reports");

const args = process.argv.slice(2);
const MODE = args[0] || "all";

const BANNER = `
╔══════════════════════════════════════════════════════╗
║         TAAMUN — LAUNCH GATE SYSTEM                  ║
║         MODE: STRICT_PRODUCTION                      ║
║         AUTO_DEPLOY: FALSE                           ║
╚══════════════════════════════════════════════════════╝
`;

const GATES = [
  { id: 1, name: "Strategic Gate (برهان)",      script: "gate-1-strategy.js",  report: "strategy.json" },
  { id: 2, name: "Build Gate (CJ)",              script: "gate-2-build.js",     report: "build.json" },
  { id: 3, name: "Quality Gate (شام)",           script: "gate-3-quality.js",   report: "quality.json" },
  { id: 4, name: "Financial Gate (شاهيم)",       script: "gate-4-finance.js",   report: "finance.json" },
  { id: 5, name: "Marketing Gate (الذئب الشمال)",script: "gate-5-marketing.js", report: "marketing.json" },
  { id: 6, name: "Final System Audit",           script: "gate-6-audit.js",     report: "final-audit.json" },
  { id: 7, name: "Launch Approval",              script: "gate-7-launch.js",    report: "deployment.json" },
];

const GATES_DIR = path.join(root, "scripts", "launch-gates");

function runGate(gate) {
  const scriptPath = path.join(GATES_DIR, gate.script);
  console.log(`\n${"─".repeat(56)}`);
  console.log(`  GATE ${gate.id}: ${gate.name}`);
  console.log(`${"─".repeat(56)}`);

  if (!fs.existsSync(scriptPath)) {
    console.error(`[ORCHESTRATOR] ❌ Script not found: ${gate.script}`);
    return false;
  }

  const result = spawnSync("node", [scriptPath], {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8",
  });

  return result.status === 0;
}

function getReportStatus(report) {
  const reportPath = path.join(REPORT_DIR, report);
  if (!fs.existsSync(reportPath)) return "NOT_RUN";
  try {
    const data = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    return data.status || data.launch_status || "UNKNOWN";
  } catch {
    return "CORRUPT";
  }
}

function printStatus() {
  console.log(BANNER);
  console.log("  الحالة الحالية لجميع البوابات:");
  console.log("  " + "─".repeat(52));

  let allPass = true;
  GATES.forEach((gate) => {
    const status = getReportStatus(gate.report);
    const icon =
      status === "PASS" || status === "SUCCESS" ? "✅" :
      status === "NOT_RUN" ? "⬜" :
      status === "FAIL" || status === "BLOCKED" ? "❌" : "⚠️";

    if (status !== "PASS" && status !== "SUCCESS") allPass = false;

    console.log(`  ${icon} Gate ${gate.id}: ${gate.name.padEnd(35)} [${status}]`);
  });

  console.log("  " + "─".repeat(52));
  const overall = allPass ? "🟢 READY TO LAUNCH" : "🔴 NOT READY";
  console.log(`  الحالة الإجمالية: ${overall}`);
  console.log("");
}

function runAll() {
  console.log(BANNER);
  console.log(`  بدء تشغيل جميع البوابات — ${new Date().toLocaleString("ar-SA")}`);

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  let totalPass = 0;
  let blockedAt = null;

  for (const gate of GATES) {
    const passed = runGate(gate);
    if (passed) {
      totalPass++;
    } else {
      blockedAt = gate;
      break; // إيقاف فوري عند أول فشل
    }
  }

  console.log(`\n${"═".repeat(56)}`);
  console.log("  FINAL RESULT");
  console.log(`${"═".repeat(56)}`);

  if (!blockedAt) {
    console.log("  🟢 جميع البوابات اجتازت");
    console.log("  ⚠️  يتطلب موافقة يدوية نهائية من مسخر قبل النشر");
    console.log(`${"═".repeat(56)}\n`);
    process.exit(0);
  } else {
    console.log(`  🔴 محجوب عند: Gate ${blockedAt.id} — ${blockedAt.name}`);
    console.log(`  ${totalPass}/${GATES.length - 1} بوابات اجتازت`);
    console.log("  عالج الأخطاء ثم أعِد تشغيل البوابة المعنية");
    console.log(`${"═".repeat(56)}\n`);
    process.exit(1);
  }
}

function runSingleGate(gateId) {
  const gate = GATES.find((g) => g.id === gateId);
  if (!gate) {
    console.error(`[ORCHESTRATOR] بوابة غير موجودة: ${gateId}`);
    process.exit(1);
  }
  console.log(BANNER);
  const passed = runGate(gate);
  process.exit(passed ? 0 : 1);
}

// ── الأوامر ───────────────────────────────────────────
switch (MODE) {
  case "all":
    runAll();
    break;
  case "status":
    printStatus();
    break;
  case "gate1":
    runSingleGate(1);
    break;
  case "gate2":
    runSingleGate(2);
    break;
  case "gate3":
    runSingleGate(3);
    break;
  case "gate4":
    runSingleGate(4);
    break;
  case "gate5":
    runSingleGate(5);
    break;
  case "gate6":
    runSingleGate(6);
    break;
  case "gate7":
    runSingleGate(7);
    break;
  default:
    console.error(`[ORCHESTRATOR] أمر غير معروف: ${MODE}`);
    console.log("الأوامر المتاحة: all | status | gate1..gate7");
    process.exit(1);
}
