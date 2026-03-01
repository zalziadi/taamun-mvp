#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// GATE 6 — Final System Audit
// فحص أمان + بيئة + مفاتيح مكشوفة + تدقيق شامل
// ═══════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const REPORT_DIR = path.join(root, "launch-reports");
const REPORT_PATH = path.join(REPORT_DIR, "final-audit.json");

const GATE = "GATE_6_AUDIT";
const log = (msg) => console.log(`[${GATE}] ${msg}`);
const err = (msg) => console.error(`[${GATE}] ❌ ${msg}`);
const ok  = (msg) => console.log(`[${GATE}] ✅ ${msg}`);
const warn = (msg) => console.warn(`[${GATE}] ⚠️  ${msg}`);

const EXCLUDED_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build",
  "coverage", "launch-reports", "launch-config",
]);

// أنماط تكشف مفاتيح حقيقية — تُطبَّق على ملفات source فقط
const SECRET_PATTERNS = [
  { name: "Hardcoded Supabase Anon Key", pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{40,}\.[a-zA-Z0-9_-]+/ },
  { name: "Hardcoded Service Role Key", pattern: /service_role[^=\n]*=[^=\n]*eyJ/ },
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Stripe Secret Key", pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: "Private Key Block", pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "Generic password= assignment", pattern: /password\s*=\s*["'][^"']{8,}["']/ },
];

// env vars الإجبارية (يجب أن تكون موجودة لكن ليس بقيم hardcoded)
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

function writeReport(status, checks, errors, warnings) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    gate: GATE,
    status,
    timestamp: new Date().toISOString(),
    checks,
    errors,
    warnings,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report → launch-reports/final-audit.json`);
  return report;
}

function main() {
  log("بدء التدقيق الشامل للنظام...");

  const checks = {};
  const errors = [];
  const warnings = [];

  // ── 1. فحص .env.local موجود ──────────────────────
  const envLocalExists = fs.existsSync(path.join(root, ".env.local"));
  checks.env_local_exists = envLocalExists;
  if (envLocalExists) {
    ok(".env.local موجود");
  } else {
    warn(".env.local غير موجود — تأكد أن المتغيرات محددة في بيئة النشر");
    warnings.push("NO_ENV_LOCAL_FILE");
  }

  // ── 2. تحقق من .env.local غير موجود في Git ────────
  const gitignorePath = path.join(root, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf8");
    checks.env_in_gitignore = gitignore.includes(".env.local") || gitignore.includes("*.env");
    if (!checks.env_in_gitignore) {
      errors.push("ENV_NOT_IN_GITIGNORE");
      err(".env.local أو *.env غير مدرج في .gitignore — خطر كشف المفاتيح!");
    } else {
      ok(".env محمي في .gitignore");
    }
  } else {
    warn(".gitignore غير موجود");
    warnings.push("NO_GITIGNORE");
    checks.env_in_gitignore = false;
  }

  // ── 3. فحص المتغيرات الإجبارية ────────────────────
  const envContent = envLocalExists
    ? fs.readFileSync(path.join(root, ".env.local"), "utf8")
    : "";

  const envLines = envContent.split("\n").reduce((acc, line) => {
    const [key, ...rest] = line.split("=");
    if (key && key.trim()) acc[key.trim()] = rest.join("=").trim();
    return acc;
  }, {});

  const missingEnv = [];
  for (const varName of REQUIRED_ENV_VARS) {
    const val = envLines[varName] || process.env[varName] || "";
    if (!val) missingEnv.push(varName);
  }
  checks.required_env_vars = missingEnv.length === 0;
  if (!checks.required_env_vars) {
    errors.push("MISSING_REQUIRED_ENV_VARS");
    err(`متغيرات بيئة ناقصة: ${missingEnv.join(", ")}`);
  } else {
    ok("جميع المتغيرات الإجبارية موجودة");
  }

  // ── 4. فحص المفاتيح المكشوفة في الكود ────────────
  log("فحص المفاتيح المكشوفة في الكود...");
  const allFiles = walk(root);
  const sourceFiles = allFiles.filter((f) =>
    /\.(ts|tsx|js|jsx|json|env|md)$/.test(f) &&
    !f.includes(".env.local") &&
    !f.includes("launch-config") &&
    !f.includes("launch-reports")
  );

  const secretFindings = [];
  for (const file of sourceFiles) {
    let content;
    try { content = fs.readFileSync(file, "utf8"); }
    catch { continue; }

    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        const rel = path.relative(root, file).split(path.sep).join("/");
        secretFindings.push({ file: rel, type: name });
      }
    }
  }

  checks.no_exposed_secrets = secretFindings.length === 0;
  if (!checks.no_exposed_secrets) {
    errors.push("EXPOSED_SECRETS_FOUND");
    err(`مفاتيح مكشوفة في الكود (${secretFindings.length} موقع):`);
    secretFindings.forEach((f) => err(`  • [${f.type}] في ${f.file}`));
  } else {
    ok("لا توجد مفاتيح مكشوفة في الكود");
  }

  // ── 5. تحقق من next.config لا يكشف secrets ────────
  const nextConfigPath = path.join(root, "next.config.ts") || path.join(root, "next.config.mjs");
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, "utf8");
    // تحقق من عدم كتابة secrets مباشرة في env داخل next.config
    const hasBundledSecrets = /env\s*:\s*\{[^}]*SERVICE_ROLE/i.test(nextConfig);
    checks.next_config_safe = !hasBundledSecrets;
    if (!checks.next_config_safe) {
      errors.push("SERVICE_ROLE_KEY_IN_NEXT_CONFIG");
      err("Service Role Key مكشوف في next.config — هذا خطير!");
    } else {
      ok("next.config آمن");
    }
  }

  // ── 6. تحقق من حجم .next (build موجود) ────────────
  const nextBuildDir = path.join(root, ".next");
  checks.build_exists = fs.existsSync(nextBuildDir);
  if (!checks.build_exists) {
    errors.push("BUILD_NOT_FOUND");
    err(".next غير موجود — شغّل Gate 2 أولاً أو npm run build");
  } else {
    ok(".next build موجود");
  }

  // ── 7. تحقق من TypeScript config صارم ────────────
  const tsconfigPath = path.join(root, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
      const co = tsconfig.compilerOptions || {};
      checks.strict_typescript = co.strict === true;
      if (!checks.strict_typescript) {
        warn("TypeScript strict mode غير مفعّل — يُنصح بتفعيله");
        warnings.push("TYPESCRIPT_STRICT_DISABLED");
      } else {
        ok("TypeScript strict mode مفعّل");
      }
    } catch {
      warn("تعذّر قراءة tsconfig.json");
    }
  }

  // ── 8. فحص console.log في production code ──────────
  const productionFiles = allFiles.filter((f) =>
    /\.(ts|tsx)$/.test(f) &&
    f.includes("/src/") &&
    !f.includes(".test.") &&
    !f.includes(".spec.")
  );
  const consoleLogs = [];
  for (const file of productionFiles) {
    try {
      const content = fs.readFileSync(file, "utf8");
      if (/console\.log\(/.test(content)) {
        const rel = path.relative(root, file).split(path.sep).join("/");
        consoleLogs.push(rel);
      }
    } catch { continue; }
  }
  checks.no_console_logs = consoleLogs.length === 0;
  if (!checks.no_console_logs) {
    warn(`console.log موجود في ${consoleLogs.length} ملف (يُنصح بالإزالة):`);
    consoleLogs.slice(0, 5).forEach((f) => warn(`  • ${f}`));
    warnings.push(`CONSOLE_LOGS_IN_${consoleLogs.length}_FILES`);
  } else {
    ok("لا توجد console.log في كود الإنتاج");
  }

  // ── النتيجة ───────────────────────────────────────
  const passed = errors.length === 0;
  const status = passed ? "PASS" : "FAIL";

  if (warnings.length > 0) {
    warn(`${warnings.length} تحذير — لا تمنع الإطلاق لكن يُنصح بمعالجتها`);
  }

  if (passed) {
    ok("التدقيق الشامل اجتاز — النظام آمن وجاهز");
  } else {
    err("فشل Gate 6 — الحالة: BLOCKED_AUDIT");
    errors.forEach((e) => err(`  • ${e}`));
  }

  writeReport(status, checks, errors, warnings);

  if (!passed) process.exit(1);
  log("Gate 6 اجتاز ✅");
}

main();
