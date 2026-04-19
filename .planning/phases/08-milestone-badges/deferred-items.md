# Phase 8 — Deferred items

Items discovered during Phase 8 execution that are out of scope and NOT caused by Phase 8 changes. Per `<deviation_rules>` SCOPE BOUNDARY: only auto-fix issues DIRECTLY caused by the current task's changes. These are logged here for future phases.

## Pre-existing `guard:brand` failure (detected during 08.06 guard:release verification)

**Discovered:** 2026-04-19 during `npm run guard:release` chain in Plan 08.06 Task 2 verification.

**Symptom:** `scripts/guards/brand.js` reports "Found hardcoded brand tokens outside src/lib/appConfig.ts" across ~40 files spanning:

- `src/components/taamun/*.jsx` — legacy stitch-output components
- `src/lib/ai/*.ts`, `src/lib/emails/*.ts`, `src/lib/guide-prompt*.ts` — AI prompts that embed the brand name in Arabic prose intentionally (required for the model to use the brand in its responses)
- `src/lib/brand.ts`, `src/lib/design-tokens.ts` — internal brand constants
- `src/styles/taamun-ds/tokens.css`, `stitch-output/design-tokens.ts` — design-system tokens
- `stories-launch-day.html`, `tamaan_conversations_export.json`, `tasbeeh.html` — marketing/export artifacts

**Root cause:** The guard was written to enforce CLAUDE.md's rule that brand tokens live in `src/lib/appConfig.ts`. Since then, many legitimate locations now embed the brand name: AI prompts (Arabic prose that references "تمعّن"), email templates, design-system CSS tokens, static marketing HTML. The guard's whitelist has not been updated to match.

**Verified pre-existing:** Ran `guard:brand` at commit `6ac844d` (last commit before 08.06 touched anything) — same failure. Phase 8.06 did not modify `scripts/guards/brand.js`, `src/lib/appConfig.ts`, or any of the flagged files.

**Impact on Phase 8:** None for the Phase 8 deliverables themselves. The 08.06 automated verification stack is:
- `scripts/verify/phase-08-integration.mjs` → 40/40 checks PASS
- `scripts/guards/phase-08-anti-patterns.sh` → PASS
- `scripts/guards/analytics-privacy.js` → PASS (442 files)
- `scripts/guards/phase-07-anti-patterns.sh` → PASS
- `npx tsc --noEmit` → PASS (clean)
- `npm run build` → PASS (all routes emit)

The `guard:brand` step is positioned BEFORE these in the `guard:release` chain, so the full chain short-circuits. When `guard:brand` is fixed (out-of-scope future work), the full chain will flow through all Phase 8 guards.

**Recommended resolution (future phase):** Either
1. Widen `scripts/guards/brand.js` whitelist to cover AI prompts + email templates + design tokens + legacy stitch-output files, OR
2. Refactor those files to import brand tokens from `src/lib/appConfig.ts` (larger, cross-cutting change).

Neither fits inside a Phase 8 plan — this is infrastructure maintenance, not a milestone-badge deliverable.

---

*Logged by Plan 08.06 executor, 2026-04-19.*
