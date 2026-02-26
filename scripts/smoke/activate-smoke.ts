/**
 * Runtime smoke: normalizePlan, getEndsAtForPlan, RAMADAN_ENDS_AT_ISO
 * Run: npx tsx scripts/smoke/activate-smoke.ts
 */
import {
  normalizePlan,
  getEndsAtForPlan,
  RAMADAN_ENDS_AT_ISO,
} from "../../src/lib/plans";

const EXPECTED_ISO = "2026-03-29T23:59:59+03:00";
let ok = true;

// 1) base → plan_280_monthly
if (normalizePlan("base") !== "plan_280_monthly") {
  console.error("FAIL: normalizePlan('base') expected plan_280_monthly");
  ok = false;
}

// 2) plan_280 → plan_280_monthly
if (normalizePlan("plan_280") !== "plan_280_monthly") {
  console.error("FAIL: normalizePlan('plan_280') expected plan_280_monthly");
  ok = false;
}

// 3) plan820 → plan_820_full
if (normalizePlan("plan820") !== "plan_820_full") {
  console.error("FAIL: normalizePlan('plan820') expected plan_820_full");
  ok = false;
}

// 4) ramadan_28 endsAt === RAMADAN_ENDS_AT_ISO
const r4 = getEndsAtForPlan("ramadan_28", new Date("2026-02-01"));
if ("error" in r4) {
  console.error("FAIL: ramadan_28 returned error:", r4.error);
  ok = false;
} else if (r4.endsAt !== EXPECTED_ISO && r4.endsAt !== RAMADAN_ENDS_AT_ISO) {
  console.error("FAIL: ramadan_28 endsAt expected", EXPECTED_ISO);
  ok = false;
}

// 5) unknown → null
if (normalizePlan("unknown_xyz") !== null) {
  console.error("FAIL: normalizePlan('unknown_xyz') expected null");
  ok = false;
}

// 6) trial_24h endsAt ≈ now + 24h
const now = new Date();
const r6 = getEndsAtForPlan("trial_24h", now);
if ("error" in r6) {
  console.error("FAIL: trial_24h returned error:", r6.error);
  ok = false;
} else {
  const diffHours = (new Date(r6.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 23.5 || diffHours > 24.5) {
    console.error("FAIL: trial_24h diff hours =", diffHours, "expected ~24");
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("[smoke:activate] OK — 6 cases passed");
