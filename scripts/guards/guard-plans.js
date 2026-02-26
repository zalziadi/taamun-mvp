#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * guard:plans — Ensures legacy plan names (plan820, base, plan_280) appear ONLY in plans.ts normalizePlan/isPlan820Alias.
 * Allowed: plans.ts (in switch/case or isPlan820Alias), activation.ts (CodeKind for legacy code lists).
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../../src");
const ALLOWED = [
  "lib/plans.ts", // normalizePlan, isPlan820Alias
  "lib/activation.ts", // CodeKind base|plan820 for TAAMUN-001 style codes
  "features/scan/scanStorage.ts", // PLAN_820_KEY constant name
  "app/api/scan/route.ts", // plan820 variable (header check)
];

function findAllTs(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(SRC, full);
    if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") {
      findAllTs(full, list);
    } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
      list.push(rel.replace(/\\/g, "/"));
    }
  }
  return list;
}

const legacyPatterns = [
  { pattern: /"plan820"|'plan820'/, name: "plan820" },
  { pattern: /"base"(?!\s*:)/, name: "base (plan)" }, // exclude "base": in object
  { pattern: /"plan_280"|'plan_280'/, name: "plan_280" },
];

const files = findAllTs(SRC);
let failed = false;

for (const file of files) {
  const allowed = ALLOWED.some((a) => file === a || file.endsWith("/" + a));
  if (allowed) continue;

  const content = fs.readFileSync(path.join(SRC, file), "utf8");
  for (const { pattern, name } of legacyPatterns) {
    if (pattern.test(content)) {
      console.error(`[guard:plans] FORBIDDEN: ${name} in ${file} (allowed only in plans.ts)`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log("[guard:plans] OK — legacy plan names only in allowed files");
process.exit(0);
