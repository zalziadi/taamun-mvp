#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * guard:ramadan — RAMADAN_ENDS_AT_ISO must exist ONLY in appConfig.ts.
 * plans.ts must import it, not define it.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../../src");

function check() {
  const appConfigPath = path.join(SRC, "lib/appConfig.ts");
  const plansPath = path.join(SRC, "lib/plans.ts");

  if (!fs.existsSync(appConfigPath)) {
    console.error("[guard:ramadan] MISSING: src/lib/appConfig.ts");
    return false;
  }

  const appConfig = fs.readFileSync(appConfigPath, "utf8");
  if (!appConfig.includes("RAMADAN_ENDS_AT_ISO")) {
    console.error("[guard:ramadan] appConfig.ts must define RAMADAN_ENDS_AT_ISO");
    return false;
  }

  const plans = fs.readFileSync(plansPath, "utf8");
  // plans.ts must import, not define (no "= ..." assignment for RAMADAN_ENDS_AT_ISO except re-export)
  if (plans.includes("RAMADAN_START_DATE_UTC") && plans.includes("setDate") && plans.includes("ramadanEnd")) {
    console.error("[guard:ramadan] plans.ts must NOT derive RAMADAN_ENDS_AT_ISO — import from appConfig");
    return false;
  }

  if (!plans.includes("from \"./appConfig\"") && !plans.includes('from "./appConfig"')) {
    console.error("[guard:ramadan] plans.ts must import RAMADAN_ENDS_AT_ISO from appConfig");
    return false;
  }

  return true;
}

if (!check()) {
  process.exit(1);
}
console.log("[guard:ramadan] OK — RAMADAN_ENDS_AT_ISO in appConfig.ts only");
process.exit(0);
