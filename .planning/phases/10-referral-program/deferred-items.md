# Phase 10 — Deferred Items

## Discovered during 10.03 execution (2026-04-20)

### Pre-existing ESLint rule-not-found in `src/lib/referral/generate.test.ts` (from Plan 10.02)

`npm run build` reports 3 errors in 10.02's test file:

```
./src/lib/referral/generate.test.ts
130:5  Error: Definition for rule '@typescript-eslint/no-explicit-any' was not found.
142:5  Error: Definition for rule '@typescript-eslint/no-explicit-any' was not found.
155:7  Error: Definition for rule '@typescript-eslint/no-explicit-any' was not found.
```

**Out of scope for 10.03** (plan touches only `src/app/api/referral/create/*`). Same parallel-wave artifact already acknowledged in 10.01-SUMMARY.md deviations.

**Recommended fix (follow-up plan):**
- Either add `@typescript-eslint` plugin to ESLint config so the rule definition loads, or
- Replace the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in `generate.test.ts` with `// eslint-disable-next-line` (untargeted disable).

Running `npx tsc --noEmit` is clean; only `next build`'s ESLint step fails.

### Pre-existing warning in `src/app/guide/page.tsx:258`

`react-hooks/exhaustive-deps` warning on `useCallback` missing `profile` dep. Not in Phase 10 scope.

## Discovered during 10.04 execution (2026-04-20)

Same two issues above still unresolved when 10.04 ran (confirmed via `git stash && npm run build` against HEAD immediately prior to 10.04 edits — errors present without any 10.04 change).

Plan 10.04 verification therefore relied on:
- `npx tsc --noEmit` — clean.
- `npx vitest run src/app/api/activate/route.test.ts` — 8/8 passing.
- `npm run lint:analytics-privacy` — 455 files scanned, passed.
- `next build` — compiles (`✓ Compiled successfully`) but ESLint step fails on 10.02's pre-existing `@typescript-eslint/no-explicit-any` rule-not-found. No regression introduced by 10.04.
