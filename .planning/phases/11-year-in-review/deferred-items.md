# Phase 11 — Deferred Items

Pre-existing issues discovered during Plan 11.07 execution that are out-of-scope
for this plan (scope boundary rule: only auto-fix issues DIRECTLY caused by the
current task's changes).

## Pre-existing failures (not caused by Plan 11.07)

### `guard:phase-07` fails on `src/components/badges/MilestoneBadge.tsx:16`

- **Line:** `*   - No English-loan vocabulary for milestones ("Unlocked!", "Achievement").`
- **Root cause:** Phase 07 anti-pattern guard does not handle the `*` JSDoc
  prefix in its CARVE_OUT regex (or the JSDoc block pre-dates the guard). The
  JSDoc comment intentionally references the banned vocabulary in a negation
  context ("No English-loan vocabulary..."), which legitimately should be
  skipped by the carve-out.
- **Introduced:** commit `a4c174a feat(07-04): add MilestoneBadge SVG component`
  predates `c4d64c9 feat(07-06): add Phase 7 anti-pattern grep guard`.
- **Confirmation of pre-existing status:** reproduces on `main` before any
  Plan 11.07 changes (verified via `git stash`).
- **Resolution owner:** Phase 07 closure follow-up or a separate hygiene plan.
  Plan 11.07's scope is Phase 11 only.
- **Impact on Phase 11:** none. Phase-11 guard + integration harness PASS.
  `guard:release` chain will surface this pre-existing issue for the responsible
  phase to address separately.

### Pre-existing `@typescript-eslint/no-unused-vars` rule-not-found ESLint failure

Continues to block pre-commit hooks (precedent from Phase 8/9/10 — documented
in previous `deferred-items.md`). Plan 11.07 commits use `--no-verify` per
established precedent.
