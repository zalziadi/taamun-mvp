# Production Freeze Report — Taamun MVP

**Date:** 2026-02-16  
**Status:** ✅ RELEASE READY

---

## Changes Made (file list)

| File | Change |
|------|--------|
| `src/lib/appConfig.ts` | **NEW** — RAMADAN_ENDS_AT_ISO, RAMADAN_ENDS_AT_LABEL (single source) |
| `src/lib/plans.ts` | Import RAMADAN_ENDS_AT_ISO from appConfig; remove local definition |
| `scripts/guards/guard-plans.js` | **NEW** — Blocks legacy plan names outside allowed files |
| `scripts/guards/guard-ramadan.js` | **NEW** — Enforces Ramadan date only in appConfig |
| `scripts/smoke/activate-smoke.ts` | **NEW** — 6 runtime checks for plans |
| `package.json` | Added guard:plans, guard:ramadan, guard:release, smoke:activate |

---

## Guards Added/Updated

| Guard | Purpose |
|-------|---------|
| `guard:plans` | Legacy names (plan820, base, plan_280) only in plans.ts, activation.ts, scanStorage, scan route |
| `guard:ramadan` | RAMADAN_ENDS_AT_ISO defined only in appConfig.ts; plans.ts imports it |
| `guard:release` | Runs guard:plans + guard:ramadan |

---

## Smoke Result

```
[smoke:activate] OK — 6 cases passed
```

| Case | Result |
|------|--------|
| base → plan_280_monthly | ✅ |
| plan_280 → plan_280_monthly | ✅ |
| plan820 → plan_820_full | ✅ |
| ramadan_28 endsAt | ✅ |
| unknown → null | ✅ |
| trial_24h ≈ +24h | ✅ |

---

## Remaining Risks (one line each)

- **tsx**: Smoke uses `npx tsx`; first run fetches it if not installed.
- **activation.ts**: Still uses CodeKind "base"|"plan820" for legacy code lists — allowed by guard.

---

## Verification Commands

```bash
npm run guard:release
npm run smoke:activate
npm run build
```
