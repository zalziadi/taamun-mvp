# STACK.md — v1.2 Retention Loop (Stack Additions)

**Project:** Taamun v1.2 — إغلاق الحلقة (Retention Loop)
**Researched:** 2026-04-18
**Verdict:** **ZERO new runtime dependencies required.** All 6 features ship on the existing stack.
**Overall confidence:** HIGH

## Headline Recommendation

> **Do not add any new npm packages for v1.2.** The existing stack (Next.js 14.2.18, React 18.3.1, Supabase SSR 0.8.0, posthog-js 1.278.0, framer-motion 12.38.0, lucide-react 1.7.0, Resend via `fetch`, Tailwind 3.4.15, zod 4.3.6) covers every retention requirement. Adding libraries would violate **CLAUDE.md rule #6** without delivering capability the app doesn't already have.

File-verified findings (not training-data assumption):
- Resend is already integrated via `fetch("https://api.resend.com/emails")` in `src/app/api/cron/send-emails/route.ts` — no SDK needed.
- `src/lib/emails/expiry-warning-template.ts` **already exists** — the renewal email is a template, not a library question.
- PostHog is already initialized in `src/lib/analytics.ts` with `track()`, `identifyUser()`, `getStoredUtm()`. What's missing is **instrumentation calls**, not a new SDK. Pageview is disabled (`capture_pageview: false`) and needs App Router wiring.
- `activation_codes` table schema (`code`, `tier`, `used_by`, `used_at`, `used_email`) is a perfect fit for referral with `tier='referral_month'` and an added `referred_by` column.

---

## Feature-by-Feature Mapping

### 1. Cycle 2 Transition UX (Day 28 celebration CTA)

| Need | Existing asset | Action |
|---|---|---|
| Animation / celebration | `framer-motion@12.38.0` | Use existing — already powers `DayExperience` transitions |
| Icons | `lucide-react@1.7.0` | Use existing |
| State persistence | Supabase `progress` table + `taamun.progress.v1` LS | Use existing |
| Routing | Next.js 14 App Router | Use existing |

**Integration:** New component `src/components/Cycle2Celebration.tsx` mounted inside `DayExperience.tsx` when `day === 28 && completed`. Reuse `ProgressionBadge` pattern.
**New deps:** none.

### 2. Milestone Badges (days 1, 3, 7, 14, 21, 28)

| Need | Recommendation | Why |
|---|---|---|
| Badge artwork | **Inline SVG React components** (not static PNG, not Satori) | Zero-dep, scales, RTL-safe, Framer-animatable, respects LCP < 6s budget |
| Trigger logic | Server-side in an existing API route when `reflection.day_number` hits a milestone | Reads `PROGRESSION_MILESTONES` from `src/lib/taamun-content.ts` |
| Storage | New small table `user_badges(user_id, badge_key, unlocked_at)` | Reuses Supabase + RLS |

**Integration:**
- Component: `src/components/badges/MilestoneBadge.tsx` (pure SVG, 6 variants keyed by day).
- Trigger: `DayExperience.tsx`'s day-complete handler → POST `/api/badges/unlock` guarded by `requireUser()`.
- Render: Existing `ProgressionBadge` slot in `DayExperience`, plus `/progress` page.

**New deps:** none. **DO NOT install:** `react-confetti`, `canvas-confetti`, `lottie-react`, any icon library beyond lucide.

### 3. Year-in-Review (365-day retrospective)

| Need | Recommendation | Why |
|---|---|---|
| Data aggregation | Supabase query against `reflections` + `awareness_logs` + `progress` | All three tables already exist |
| Page rendering | Server Component with client islands | Standard Next.js 14 App Router pattern |
| Charts | **Pure SVG + Tailwind** (hand-rolled `<polyline>` sparkline) | CLAUDE.md rule #3. Chart libs would be the single largest bundle addition |
| Shareable image | **`next/og` (built into Next.js 14)** via `ImageResponse` in a route handler | Built-in, uses Satori+resvg transitively, works on Node runtime. No install. |

**Confirmed:** `ImageResponse` is exported from `next/og` in Next 14 — `https://nextjs.org/docs/app/api-reference/functions/image-response`.

**Integration:**
- Page: `src/app/year-in-review/page.tsx` (Server Component, guarded by `requireUser()`).
- Share image: `src/app/year-in-review/og/route.tsx` with `export const runtime = 'nodejs'`.
- Aggregation helper: `src/lib/yearInReview.ts` (logic-only per CLAUDE.md layering).

**New deps:** none. **DO NOT install:** `recharts`, `chart.js`, `visx`, `@vercel/og` (built-in now), `html-to-image`, `html2canvas`, `satori` direct.

### 4. Renewal Prompts In-App

| Need | Recommendation | Why |
|---|---|---|
| Expiry source | `profiles.expires_at` (already computed by `calcExpiresAt` in `/api/activate/route.ts`) | Source of truth |
| Banner UI | New `RenewalBanner.tsx` mounted in `AppChrome.tsx` | Single mount point covers all protected pages |
| Dismiss persistence | LocalStorage key `taamun.renewal_dismissed_until.v1` | Follows CLAUDE.md rule #5 pattern |
| Renewal email | **Already exists:** `src/lib/emails/expiry-warning-template.ts` + cron/send-emails route | Nothing to add |

**New deps:** none. Resend via `fetch` is sufficient — SDK install would be a downgrade.

### 5. Referral Program

| Need | Recommendation | Why |
|---|---|---|
| Storage | **Reuse `activation_codes` + add columns**: `referred_by uuid references auth.users(id)`, `source text default 'purchase'` (values: `'purchase' \| 'referral'`) | Avoids new infra. Entitlement flow unchanged — referral is a code with `tier='referral_month'` and non-null `referred_by` |
| Code generation | Extend `/api/admin/bulk-codes/route.ts` pattern → `/api/referral/create` | Prefix `TAAMUN-REF-XXXX`. Uniform namespace |
| RLS | Referrer reads own rows; redemption uses service-role (today's pattern) | No policy complexity |
| Attribution | In `/api/activate`, when `codeRow.source === 'referral'`, credit the referrer (`calcExpiresAt` extend) | All functions exist |

**Integration:**
- Migration: one file adding two columns to `activation_codes`.
- New page: `src/app/account/referral/page.tsx` with share link (`NEXT_PUBLIC_APP_ORIGIN` + code).
- New routes: `/api/referral/create` (POST, `requireUser`) + edits to `/api/activate`.

**New deps:** none. **DO NOT install:** `nanoid` (use `crypto.randomUUID()`), Rewardful/Tolt SDKs.

### 6. PostHog Event Instrumentation

Already installed + wrapped (`src/lib/analytics.ts`). Missing pieces:

| Piece | Action |
|---|---|
| Pageview tracking | Currently disabled (`capture_pageview: false`). Add App Router wiring: client component using `usePathname()` + `useSearchParams()` wrapped in `<Suspense>` (React 18 CSR bailout constraint). |
| Privacy exclusions | Add `EXCLUDED_PATHS = ['/day/*', '/program', '/book/*']` guard per PROJECT.md principle #4 |
| Event calls | `day_complete` in `DayExperience.tsx`; `cycle_start` in `Cycle2Celebration.tsx` mount; `badge_unlock` in `/api/badges/unlock` client handler; `renewal_prompted` in `RenewalBanner.tsx` first-render |

**New deps:** none. **DO NOT install:** `@vercel/analytics`, `mixpanel-browser`, `segment`, `amplitude`, `posthog-node`.

---

## Confirmed Environment / Runtime Decisions

| Concern | Decision | Source |
|---|---|---|
| Runtime for `ImageResponse` | `export const runtime = 'nodejs'` — Fluid Compute, **not Edge** | Vercel 2026-02-27 knowledge update |
| Runtime for cron email | Node (already) | Current code |
| Middleware | **No middleware changes needed** | None of 6 features require request-path interception |
| Async `params`/`searchParams` | Sync — Taamun on 14.2.18 | package.json |
| RTL | Maintained via Tailwind RTL utilities | CLAUDE.md rule #4 |

---

## Versions Table (installed — no changes)

| Package | Version | Role in v1.2 |
|---|---|---|
| next | 14.2.18 | App Router, `next/og`, route handlers |
| react / react-dom | 18.3.1 | Components, Suspense |
| tailwindcss | 3.4.15 | All new UI |
| @supabase/ssr | 0.8.0 | Server + browser clients |
| @supabase/supabase-js | 2.95.3 | — |
| posthog-js | 1.278.0 | Event instrumentation |
| framer-motion | 12.38.0 | Celebration + badge unlock motion |
| lucide-react | 1.7.0 | Icons (share, sparkle, check) |
| zod | 4.3.6 | Validate referral API bodies |
| web-push | 3.6.7 | Renewal push (optional) |
| Resend via `fetch` | n/a | Renewal email — template already present |

---

## STOP — Do Not Add

| Package | Why not |
|---|---|
| `resend` SDK | `fetch` works — SDK adds drift |
| `@vercel/og` | Replaced by `next/og` built-in |
| `satori` / `@resvg/resvg-js` | Transitively included via `next/og` |
| `recharts` / `chart.js` / `visx` | Year-in-Review is one sparkline — SVG is cheaper |
| `canvas-confetti` / `react-confetti` | Framer Motion suffices |
| `lottie-react` | Same reason |
| `prisma` / `drizzle-orm` | Supabase client is the chosen data layer |
| `@clerk/*` / `next-auth` / `@auth0/*` | Supabase Auth magic link is non-negotiable (CLAUDE.md) |
| `shadcn/ui` / `@radix-ui/*` / `@headlessui/react` / `mantine` / `chakra-ui` | Rule #3: Tailwind only |
| `nanoid` / `uuid` | `crypto.randomUUID()` is native |
| `date-fns` / `dayjs` / `luxon` / `moment` | Existing `hijri.ts`, `calendarDay.ts`, `subscriptionDurations.ts` cover everything |
| `@vercel/analytics` / `mixpanel` / `segment` / `amplitude` | PostHog is the chosen analytics |
| `posthog-node` | Not needed — events are client-triggered |
| `nodemailer` / `sendgrid` / `postmark` | Resend is wired |
| `bull` / `bullmq` / `agenda` / `pg-boss` | Existing `email_queue` + cron handles this |
| `rewardful` / `tolt` / SaaS referral | Referral is DB + route handler |
| `html2canvas` / `html-to-image` / `dom-to-image` | `next/og` server-side (smaller, cacheable) |
| `tailwind-merge` / `clsx` / `cva` | Not installed; current codebase uses template strings |
| `react-hook-form` / `formik` | v1.2 forms are 1–2 inputs; native state is enough |
| `@tanstack/react-query` / `swr` | Server Components fetch directly |

---

## Integration Diagram

```
src/lib/*  (logic only)
├─ yearInReview.ts                    NEW   aggregates reflections/awareness/progress
├─ badges.ts                          NEW   PROGRESSION_MILESTONES → unlock rules
├─ referral.ts                        NEW   code generation + referrer credit
├─ analytics.ts                       EDIT  add pageview helper
└─ taamun-content.ts                  reuse PROGRESSION_MILESTONES

src/components/*  (UI only)
├─ badges/MilestoneBadge.tsx          NEW   pure SVG, 6 variants
├─ Cycle2Celebration.tsx              NEW   framer-motion
├─ RenewalBanner.tsx                  NEW   mounted in AppChrome
├─ YearInReview/*                     NEW   server + client islands
├─ PageviewTracker.tsx                NEW   Suspense-wrapped
└─ AnalyticsProvider.tsx              EDIT  mount PageviewTracker

src/app/*  (routing only)
├─ year-in-review/page.tsx            NEW   Server Component, requireUser
├─ year-in-review/og/route.tsx        NEW   runtime='nodejs', next/og
├─ account/referral/page.tsx          NEW
├─ api/badges/unlock/route.ts         NEW   POST, requireUser
├─ api/referral/create/route.ts       NEW   POST, requireUser
├─ api/activate/route.ts              EDIT  credit referrer on redemption
└─ api/cron/send-emails/route.ts      reuse expiry-warning-template.ts

supabase/migrations/*
└─ 20260419_v1_2_retention.sql        NEW   user_badges + activation_codes.referred_by + source
```

---

## Open Questions (for Requirements)

1. **Badge persistence scope** — LS-only vs Supabase (recommended: Supabase, mirrored into LS).
2. **Referral reward rule** — credit referrer on code redemption, on invitee purchase, or only on active-subscriber invitee? Confirm before migration.
3. **Year-in-Review min data threshold** — graceful degradation for users with <365 reflections; label range by earliest-to-latest.
4. **Pageview privacy exclusions** — confirm exact path list (likely `/day/*`, `/program`, `/book/*`).

---

## RESEARCH COMPLETE

### Key Findings
- Zero new runtime dependencies for all 6 features.
- `next/og` (built-in) covers Year-in-Review share cards.
- Resend via `fetch`; renewal template already exists on disk.
- Referral reuses `activation_codes` + 2 columns; no new auth/infra.
- PostHog SDK + helper already present — only instrumentation + pageview tracker missing.
- All new route handlers run on `runtime='nodejs'` (Fluid Compute).

### Roadmap Implications
- Phase breakdown can be small and parallelizable.
- The single cross-cutting migration (user_badges + activation_codes columns) should land in the first DB phase.
- Instrumentation phase can ship first and independently, giving all later phases free data.
