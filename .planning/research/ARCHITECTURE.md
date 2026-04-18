# Architecture Research — v1.2 Retention Loop Integration

**Domain:** spiritual-wellness · Quranic contemplation (Taamun)
**Researched:** 2026-04-18
**Confidence:** HIGH (based on direct read of existing codebase — not training-data guesses)
**Scope:** How the 6 v1.2 retention features plug into the existing Next.js 14 + Supabase architecture.

---

## Existing Architecture — Quick Anchor

```
┌─────────────────────────────────────────────────────────────────────┐
│  src/app/*              Routes & pages (RSC + Client pages)          │
│  ├─ /program            /program/page.tsx → redirect based on DB     │
│  ├─ /program/day/[id]   /program/day/[id]/page.tsx → DayExperience   │
│  ├─ /api/program/*      complete-journey · start-cycle · progress    │
│  └─ /api/cron/*         send-emails · send-push · manage-subs · …    │
├─────────────────────────────────────────────────────────────────────┤
│  src/components/*       UI only (no business logic)                  │
│  └─ DayExperience.tsx   SilenceGate→VerseBlock→…→ProgressionBadge    │
├─────────────────────────────────────────────────────────────────────┤
│  src/lib/*              Pure logic (no JSX)                          │
│  ├─ entitlement.ts      HMAC token → cookie `taamun_entitled`        │
│  ├─ supabase/server.ts  createServerClient (cookies-aware)           │
│  ├─ supabaseAdmin.ts    service-role (server-only)                   │
│  ├─ authz.ts            requireUser / requireAdmin                   │
│  ├─ progressStore.ts    readUserProgress · upsertUserProgress        │
│  ├─ journey/serverGuard getServerProgress → ServerProgress           │
│  └─ analytics.ts        PostHog (client) + Meta Pixel — track()      │
├─────────────────────────────────────────────────────────────────────┤
│  Supabase (Postgres + RLS)                                           │
│  profiles · progress · reflections · awareness_logs ·                │
│  pattern_insights · cognitive_actions · activation_codes ·           │
│  customer_subscriptions · email_queue · push_subscriptions · …       │
└─────────────────────────────────────────────────────────────────────┘
```

**Source-of-truth rules (from `CLAUDE.md` + `serverGuard.ts`):**
- **DB is authoritative for routing.** `/program/page.tsx` reads `getServerProgress()` and server-redirects. Never trust localStorage for gatekeeping.
- **LocalStorage key is fixed: `taamun.progress.v1`** — client-only mirror for UX.
- **Layer contract:** `src/lib/*` no JSX · `src/components/*` no business logic · `src/app/*` routes only.

---

## Feature 1 — Cycle 2 Transition UX

### The gap today
`DayExperience.tsx:174–176` already fires `POST /api/program/complete-journey` when **AwarenessMeter** saves on day 28. But **no Day-28 completion screen exists** — the user finishes their reflection and hits a silent wall. `/api/program/start-cycle` exists (and handles cycle archival correctly) but has no UI entry point.

### Integration map

| Concern | Decision | File |
|---|---|---|
| Where does the CTA render? | **New sub-component** `<CycleCompletionCTA>` rendered at the bottom of `DayExperience` when `day === 28 && all28Complete`. NOT a new page — staying inside the day container keeps the narrative arc. | `src/components/CycleCompletionCTA.tsx` (new) |
| What server state triggers it? | `progress.current_day === 28 && progress.completed_days.length === 28`. Check on server via `getServerProgress()` extension that also returns `isLastDayOfCycle: boolean`. | `src/lib/journey/serverGuard.ts` (extend `ServerProgress`) |
| How does "Start Cycle 2" fire? | Button calls existing `POST /api/program/start-cycle` with `{ cycle: progress.current_cycle + 1 }`. After 200, `router.refresh()` → RSC re-read → redirect to day 1 of new cycle. | `src/app/api/program/start-cycle/route.ts` (exists — no changes needed) |
| Does `start-cycle` need a transactional lock? | **YES — MINIMAL RISK TODAY, BUT ADD A GUARD.** Current impl does a read then upsert (lines 28–71) with **no row lock**. A user tapping the button twice from two tabs could cause a double-increment. Recommendation: add `.eq("current_cycle", body.expected_current_cycle)` as an optimistic-concurrency filter inside the upsert — if affected rows = 0, return 409. No Postgres advisory lock needed at current scale (<10K users). | `src/app/api/program/start-cycle/route.ts` (modify) |
| Is there an alternative "rest day" flow? | Yes — CTA should also offer "take a pause" that simply sets a `cycle_paused_at` timestamp on `progress` and lands them on `/program` (grid view). Prevents cycle churn for users who need to breathe. | Adds column `progress.cycle_paused_at TIMESTAMPTZ` |

### New/modified
- **NEW** `src/components/CycleCompletionCTA.tsx` — pure UI, accepts `{ completedCycle, onStartNext, onPause }` props
- **MODIFIED** `src/components/DayExperience.tsx` — append `<CycleCompletionCTA>` after `<ShareCard>` when day 28 + all complete
- **MODIFIED** `src/app/api/program/start-cycle/route.ts` — add optimistic-concurrency guard
- **MIGRATION** `progress.cycle_paused_at TIMESTAMPTZ NULL`
- **RLS** — no new table; existing `progress` RLS policy covers the new column

---

## Feature 2 — Milestone Badges

### The gap today
`ProgressionBadge` (inside `DayExperience.tsx:253–272`) renders an **in-day banner** on days 1/3/7/14/21/28 but it's **ephemeral** (re-reads `PROGRESSION_MILESTONES`, no persistence). There's no unlock-moment UX, no retrieval screen, no cross-cycle badge history.

### Integration map

| Concern | Decision | File |
|---|---|---|
| New table or derive from `pattern_insights`? | **NEW table `badges`** (not `insights`). Insights are AI-generated daily summaries — unrelated semantics. Badges are discrete achievement events. | migration (new) |
| Schema | `badges { id uuid pk, user_id uuid fk auth.users, badge_key text, cycle int, day int, unlocked_at timestamptz default now(), UNIQUE(user_id, badge_key, cycle) }` | migration (new) |
| Trigger evaluation — client or server? | **SERVER.** When a day is marked complete (existing flow writes to `progress.completed_days`), a DB trigger (or — simpler — the RSC that detects completion) inserts into `badges` on transition into milestone day. Client-side trigger is fragile (user can complete offline then sync). Recommendation: do it in the API route that writes completion, not a DB trigger (keeps logic in code). | extend `src/app/api/awareness-log` or `src/app/api/program/complete-journey` |
| How rendered? | **NEW `<BadgeUnlockModal>`** — one-shot modal on first render after unlock. Plus **MODIFY `<ProgressionBadge>`** to pull from `badges` table (not derive) — gives persistence across revisits. Badge history page: **new `/badges` route** (server-rendered list). | `src/components/BadgeUnlockModal.tsx` (new) · `src/app/badges/page.tsx` (new) |
| How does client know to show the modal? | RSC for `/program/day/[id]/page.tsx` fetches "badges unlocked in the last 10s for this user" and passes to a `<BadgeUnlockGate>` Client wrapper that triggers modal once, then marks it seen via localStorage (acceptable — missed modals are not catastrophic). | — |
| Badge-key catalog | Constants in `src/lib/badges.ts`: `DAY_1_STARTER`, `DAY_3_COMMITTED`, `DAY_7_WEEK`, `DAY_14_HALFWAY`, `DAY_21_CRITICAL`, `DAY_28_COMPLETE`, `CYCLE_2_BEGINNER`, `CYCLE_3_DEEP`, `YEAR_1_MEMBER`. | new file |

### New/modified
- **NEW TABLE** `badges` + RLS: `CREATE POLICY "users_own_badges" ON badges FOR ALL USING (auth.uid() = user_id);`
- **NEW** `src/lib/badges.ts` — catalog + unlock-evaluation pure functions
- **NEW** `src/components/BadgeUnlockModal.tsx`
- **NEW** `src/components/BadgeUnlockGate.tsx` (Client wrapper)
- **NEW** `src/app/badges/page.tsx` (Server Component)
- **MODIFIED** `src/components/DayExperience.tsx` — replace inline `ProgressionBadge` rendering with `<BadgeUnlockGate>` wrapping it (or refactor `ProgressionBadge` to read from DB)
- **MODIFIED** existing day-completion API route — call `evaluateAndInsertBadges(userId, day, cycle)` after progress write

---

## Feature 3 — Year-in-Review

### The gap today
User has 365 days of reflections + awareness + insights scattered across 4 tables, with no retrospective surface. This is the highest-leverage emotional artifact in the product.

### Integration map

| Concern | Decision | File |
|---|---|---|
| New route? | **YES — `/year-in-review/[year]`** (e.g., `/year-in-review/2026`). Server Component. Gated by `requireUser()` + entitlement active. Route file: `src/app/year-in-review/[year]/page.tsx`. | new |
| Data sources | Aggregate from: `reflections` (user notes) · `awareness_logs` (level distribution) · `pattern_insights` (themes + shifts) · `cognitive_actions` (decisions logged) · `badges` (achievements) · `progress.completed_cycles`. | read-only SQL |
| Aggregation: on-demand vs pre-computed? | **HYBRID.** On-demand for first render (acceptable — this is a <10-query operation and viewed rarely). Snapshot the result to `year_reviews { user_id, year, payload jsonb, generated_at }` so subsequent visits are instant + the JSON can be fed to the share-card generator without re-querying. Invalidate if the user has added reflections since `generated_at`. | new table `year_reviews` |
| Share card | Use `next/og` (`@vercel/og`) — already on Vercel stack, no new dep. Route: `src/app/year-in-review/[year]/opengraph-image.tsx` (file-based OG image convention). Renders to 1200×630 JPEG automatically per Next.js metadata conventions. Respects the "no tracking pixels on reflection pages" rule — OG images are static edge-rendered. | new file |
| Performance (LCP <6s on 3G) | Aggregation query should be one RPC (`year_in_review(user_id, year)`) returning denormalized JSON. Not 6 separate table reads. | new Postgres RPC function |
| What if the user hasn't finished a year? | Show partial review: "رحلتك حتى اليوم" with completion percentage. Don't gate behind day 365 — solo founder needs to show this to year-1 customers in 2026. | — |

### New/modified
- **NEW TABLE** `year_reviews { user_id uuid, year int, payload jsonb, generated_at timestamptz, PRIMARY KEY (user_id, year) }`
- **NEW RPC** `get_year_in_review(p_user_id uuid, p_year int) RETURNS jsonb` — single-roundtrip aggregation
- **NEW** `src/app/year-in-review/[year]/page.tsx`
- **NEW** `src/app/year-in-review/[year]/opengraph-image.tsx` (Satori-rendered share card)
- **NEW** `src/lib/year-review.ts` — aggregation logic (pure, logic layer)
- **NEW** `src/components/YearReviewSections.tsx` — UI assembly
- **RLS** on `year_reviews`: users can read own; service role writes.
- **CONFIRM** that `@vercel/og` is already transitively present (it's built into Next 14 via `next/og`). Official docs on image generation should be re-checked at implementation time — the APIs change.

---

## Feature 4 — Renewal Prompts In-App

### The gap today
`src/app/api/cron/manage-subscriptions/route.ts` already queues **EMAIL** warnings 7 days before expiry (line 24, 30–77) and sends expired-state emails (line 81–120). But an in-app banner does not exist — users who don't open email see nothing until lockout.

### Integration map

| Concern | Decision | File |
|---|---|---|
| Which table stores `expires_at`? | **`profiles.expires_at`** (confirmed by `manage-subscriptions/route.ts:33` — `subscription_status` + `expires_at` + `subscription_tier` are all on `profiles`). `customer_subscriptions` exists but is historical/audit. Read from `profiles`. | — |
| Where does the banner render? | **Layout-level, but scoped.** Add a new Server Component `<RenewalBanner>` inside `AppChrome` (which wraps `{children}` in `src/app/layout.tsx:132`). Renders only if `expires_at - now() ≤ 7 days AND status = 'active'`. NOT on `/auth`, `/pricing`. Use layout-route-group technique or conditional render inside `AppChrome`. | `src/components/RenewalBanner.tsx` (new) · `src/components/AppChrome.tsx` (modify) |
| Why AppChrome, not `/program/page.tsx`? | Users live on `/program/day/[id]` not `/program`. Banner must follow them. `AppChrome` already wraps all pages, so it's the correct choke point. | — |
| Server read for the banner | Use existing `createSupabaseServerClient()` → select `expires_at, subscription_status` from `profiles`. Cache with `revalidate: 3600` (hour granularity is fine for a 7-day warning). | — |
| Dismissibility | Cookie-based: `taamun_renewal_dismissed_until`. Re-show on next day. Don't persist in DB — low-stakes UX state. | — |
| Interaction with existing email flow | Banner and email are complementary, not redundant. Email gives urgency; banner gives one-tap renewal in context. Both driven by same `expires_at` field. | — |
| Expired users? | Different component: `<RenewalLockoutModal>` blocks `/program` paths when `subscription_status === 'expired'`. Existing `checkAccess` logic in `DayExperience.tsx:305` already handles trial-expired — extend pattern. | `src/lib/subscriptionAccess.ts` (extend) |

### New/modified
- **NEW** `src/components/RenewalBanner.tsx` (Server Component)
- **MODIFIED** `src/components/AppChrome.tsx` — slot the banner above `{children}`
- **EXTENDED** `src/lib/subscriptionAccess.ts` — add `daysUntilExpiry(profile)` helper
- **NEW** `src/app/api/subscription/dismiss-renewal/route.ts` — sets cookie
- **NO new tables** — `profiles.expires_at` is the field

---

## Feature 5 — Referral Program

### The gap today
Zero referral primitives. `activation_codes` table exists (`TAAMUN-XXX` / `TAAMUN-820-XXX` for pre-purchased access per `CLAUDE.md`). No giver-reward mechanism, no referral tracking.

### Integration map

| Concern | Decision | File |
|---|---|---|
| New table OR extend `activation_codes`? | **NEW TABLE `referrals`** — keep `activation_codes` pure (it's for purchase-flow codes). Referrals are a distinct concept: referrer identity + recipient + reward state. Mixing them would couple retention to billing in a confusing way. | migration (new) |
| Schema | `referrals { id uuid pk, referrer_user_id uuid fk auth.users, referral_code text unique, invitee_email text null, invitee_user_id uuid null fk auth.users, status text check (status in ('pending','activated','rewarded','voided')), reward_type text default 'free_month', rewarded_at timestamptz null, created_at timestamptz default now() }` | migration (new) |
| Referral code format | `R-<USERID6>-<RAND4>` — short, pronounceable in voice. Distinguishable from `TAAMUN-XXX` billing codes. | `src/lib/referral.ts` (new) |
| How does the giver get rewarded? | On **invitee activation** (their first paid subscription via Stripe/Salla/Tap webhook), webhook handler calls `creditReferrer(referralId)` which: (1) sets `status='rewarded'`, (2) extends `profiles.expires_at` of referrer by 30 days. Event is **idempotent by `referral.id`** — reruns are safe. | MODIFY `src/app/api/stripe/webhook/route.ts`, `/api/salla/webhook`, `/api/tap/webhook` — all three already exist |
| Abuse prevention | Checklist enforced in `creditReferrer()`: (a) `invitee_user_id != referrer_user_id` (no self-referral), (b) invitee has first subscription (check `customer_subscriptions` count = 1), (c) rate-limit: referrer gets max 12 rewards/year via `count(rewards_at > now() - interval '1 year')`, (d) optional phone-uniqueness if phone is captured at checkout. | `src/lib/referral.ts` |
| Where does the giver GET their link? | `/account` page (live page — confirmed in CLAUDE.md). New component `<MyReferralCard>` fetches/creates the user's personal referral code. | `src/components/MyReferralCard.tsx` + `src/app/api/referral/my-code/route.ts` (new) |
| Where does the invitee ENTER? | `/r/[code]` route → sets cookie → redirects to `/auth?next=/program`. After magic-link, a post-auth hook reads cookie and writes `invitee_user_id` into the pending referral. | `src/app/r/[code]/page.tsx` + auth callback modification |
| Interaction with auth callback | `src/app/auth/callback/route.ts` — after session established, if cookie `taamun_pending_referral` exists, attach it to `referrals.invitee_user_id` and clear cookie. | modify existing |

### New/modified
- **NEW TABLE** `referrals` + RLS (referrer can select their own; service role writes reward state)
- **NEW** `src/lib/referral.ts` — pure logic (code gen + credit rules)
- **NEW** `src/app/api/referral/my-code/route.ts` (GET/POST)
- **NEW** `src/app/r/[code]/page.tsx` — capture → set cookie → redirect
- **NEW** `src/components/MyReferralCard.tsx`
- **MODIFIED** `src/app/auth/callback/route.ts` — post-auth referral attach
- **MODIFIED** 3 webhook routes (`stripe`, `salla`, `tap`) — call `creditReferrer` on first-activation
- **MODIFIED** `src/app/account/*` — surface `<MyReferralCard>`

---

## Feature 6 — PostHog Event Instrumentation

### The gap today
`src/lib/analytics.ts` already has working client-side PostHog init + `track(event, props)` + UTM capture + anon-ID stitching + Meta Pixel. But the actual **events we care about for retention are not emitted**. Server-side PostHog is absent.

### Integration map

| Concern | Decision | File |
|---|---|---|
| Client helper | `track()` in `src/lib/analytics.ts` is sufficient — it already debounces init and handles no-key case. Add a typed wrapper `trackEvent<K extends keyof TaamunEvents>(name: K, props: TaamunEvents[K])` to enforce the catalog. | extend `src/lib/analytics.ts` |
| Server-side events | Critical events (webhook activation, cron-emitted state changes) must emit server-side. Add **NEW** `src/lib/analyticsServer.ts` using `posthog-node` package. **This is a new dep — requires explicit approval per CLAUDE.md rule 6.** Alternative: POST to PostHog `/capture/` HTTP endpoint with fetch (zero deps) — RECOMMEND this to avoid new dep. | `src/lib/analyticsServer.ts` (new) |
| Event catalog (minimum for v1.2) | `day_complete { day, cycle }` · `cycle_start { cycle }` · `cycle_complete { cycle, days_to_complete }` · `badge_unlock { badge_key, cycle, day }` · `renewal_banner_shown { days_left }` · `renewal_banner_clicked { days_left }` · `renewal_completed { tier, amount }` · `referral_link_copied {}` · `referral_activated { referrer_id }` · `year_review_viewed { year }` · `year_review_shared { year, channel }` | `src/lib/analyticsEvents.ts` (new — types only) |
| Emission points | Client: `DayExperience` (day_complete), `CycleCompletionCTA` (cycle_start trigger), `BadgeUnlockModal` (badge_unlock), `RenewalBanner` (shown/clicked). Server: webhooks (renewal_completed, referral_activated). | — |
| Integration with existing `AnalyticsProvider` | `AnalyticsProvider` (rendered in layout.tsx:131) already calls `initAnalytics()`. New events just call `track()`. No provider change needed. | — |
| PII | Taamun reflections are intimate content. Per project rules: **NO reflection text or verse text in event props, ever.** Only numeric day, cycle, enum levels. Enforce by event-catalog typing. | — |
| Person profiles | Currently `person_profiles: "never"` (analytics.ts:87) — good. Keep it off. Retention dashboards should operate on events, not person properties. | — |

### New/modified
- **NEW** `src/lib/analyticsEvents.ts` — typed event catalog
- **NEW** `src/lib/analyticsServer.ts` — fetch-based server-side emitter (no new npm dep)
- **EXTENDED** `src/lib/analytics.ts` — add `trackEvent` typed wrapper
- **MODIFIED** — all 5 new/modified components emit events at key points
- **MODIFIED** — 3 payment webhook routes emit server-side events
- **NO new tables** — PostHog is the store

---

## Build Order (Phase Sequencing)

### Hypothesis A (user's suggestion): Analytics First
**Argument:** Measure before you change. Ship telemetry → ship features → watch the numbers move.

### Hypothesis B: Cycle-2 First
**Argument:** Biggest user wound. One user has already finished day 28 and hit the silent wall.

### Recommended order — a hybrid

1. **Phase 6 — PostHog Event Instrumentation (Analytics first, minimal surface)**
   - Why first: Everything after needs measurement. And the existing `analytics.ts` makes this cheap — 1-2 days of work for the event catalog + typed wrapper + server-side fetch emitter.
   - Risk: LOW — additive only, no behavioral changes.
   - Gate: At least `day_complete`, `cycle_start`, `badge_unlock` wired before Phase 7 merges.

2. **Phase 7 — Cycle 2 Transition UX**
   - Why second: Highest-pain + smallest surface (one component + one modified API). Closes the current silent-wall bug.
   - Depends on Phase 6 to observe the funnel.
   - New surface: `CycleCompletionCTA` · optimistic-concurrency guard in `start-cycle` · `progress.cycle_paused_at` column.

3. **Phase 8 — Milestone Badges**
   - Why third: Depends on having event infrastructure (`badge_unlock` event). Also needs a day-completion API path to hook into. The Cycle-2 phase forces us to touch that path anyway.
   - New surface: `badges` table · `BadgeUnlockModal` · `/badges` page · `src/lib/badges.ts`.

4. **Phase 9 — Renewal Prompts In-App**
   - Why fourth: Independent of above, but behavior is visible across entire app → wants analytics coverage first. Small blast radius (one banner component + one column check).
   - Depends only on existing `profiles.expires_at` + existing cron.

5. **Phase 10 — Referral Program**
   - Why fifth: Highest complexity (table + 3 webhook modifications + auth callback + new route + new component). Benefits most from having stable event telemetry + renewal flow already trusted.
   - Touches billing-critical code paths → ship after lower-risk phases stabilize.

6. **Phase 11 — Year-in-Review**
   - Why last: Needs the most *accumulated* data (reflections + awareness + badges + cycles). Badges (Phase 8) feed its narrative. Analytics (Phase 6) validates it gets viewed. Also the most emotionally sensitive feature — deserves to be built last so we can include the freshest insights.
   - First real audience: the solo founder's earliest customers, who hit Year 1 in late 2026.

### Phase dependencies graph
```
Phase 6 (Analytics)
   ├──► Phase 7 (Cycle 2)
   │       └──► Phase 8 (Badges)
   │               └──► Phase 11 (Year Review)
   ├──► Phase 9 (Renewal Banner)
   │       └──► Phase 10 (Referral, which rewards via expires_at)
   │               └──► Phase 11 (Year Review highlights referrals)
   └──► Phase 11 (Year Review)
```

---

## Cross-Cutting Decisions

### Layer discipline (CLAUDE.md rules)

| New file | Layer | Rule check |
|---|---|---|
| `src/lib/badges.ts` | lib | Pure functions, no JSX — OK |
| `src/lib/referral.ts` | lib | Pure — OK |
| `src/lib/year-review.ts` | lib | Pure aggregation — OK |
| `src/lib/analyticsEvents.ts` | lib | Types only — OK |
| `src/lib/analyticsServer.ts` | lib | Fetch + logic — OK |
| `src/components/CycleCompletionCTA.tsx` | components | UI only, props-driven — OK |
| `src/components/BadgeUnlockModal.tsx` | components | UI only — OK |
| `src/components/BadgeUnlockGate.tsx` | components | Client wrapper — OK |
| `src/components/RenewalBanner.tsx` | components | Server component — OK |
| `src/components/MyReferralCard.tsx` | components | UI — OK |
| `src/components/YearReviewSections.tsx` | components | UI — OK |
| `src/app/badges/page.tsx` | app | Route only — OK |
| `src/app/year-in-review/[year]/page.tsx` | app | Route only — OK |
| `src/app/r/[code]/page.tsx` | app | Route only — OK |
| `src/app/api/referral/my-code/route.ts` | app | Route handler — OK |
| `src/app/api/subscription/dismiss-renewal/route.ts` | app | Route handler — OK |

**Violation to avoid:** Don't put `src/lib/badgesUI.tsx`. Don't put `fetch('/api/...')` in `lib/`.

### RLS posture for new tables

| Table | Select policy | Insert policy | Update policy |
|---|---|---|---|
| `badges` | `auth.uid() = user_id` | service role only | service role only |
| `year_reviews` | `auth.uid() = user_id` | service role only | service role only |
| `referrals` | `auth.uid() = referrer_user_id` | authenticated (self as referrer) | service role only |

**Reasoning:** All reward/state mutations happen via server code (webhooks, APIs) using `supabaseAdmin`. Users only select their own rows. This matches existing pattern in `pattern_insights` (20260401000000_pattern_insights.sql).

### Entitlement + new features

- **Year-in-Review:** gated by entitlement — use existing `verifyEntitlementToken()` inside the RSC. Expired subscribers can still see it (they earned those reflections) — only active + expired, not `null`.
- **Cycle 2 Transition:** gated by active subscription (you can't start a new cycle if your subscription has lapsed — nudges renewal).
- **Badges:** always visible (motivational; show historical).
- **Renewal banner:** universal across entitlement states (expired users see "renew to continue").
- **Referral:** require active subscription (otherwise expired users could farm rewards on lapsed accounts).

### Environment variables to add

| Var | Purpose | Scope |
|---|---|---|
| `POSTHOG_PROJECT_API_KEY` | Server-side PostHog events | server |
| (reuse) `NEXT_PUBLIC_POSTHOG_KEY` | Client — already exists | client |
| (reuse) `NEXT_PUBLIC_POSTHOG_HOST` | Client — already exists | client |

No new third-party secrets for badges, year review, renewal banner, referrals.

### Performance budget (LCP <6s on 3G)

| Feature | Risk | Mitigation |
|---|---|---|
| RenewalBanner on every page | Adds one server DB read | Cache via Next.js `unstable_cache` with 1h TTL + user-keyed |
| Year-in-Review aggregation | 6 tables scanned | Single RPC + snapshot to `year_reviews` JSON |
| BadgeUnlockGate client check | Extra fetch on day view | Piggyback on the existing RSC data for `/program/day/[id]` — pass badges already unlocked this session as a prop |
| PostHog client | Already behind `capture_pageview: false` + autocapture off | Keep it that way |

---

## Existing Patterns That Need Modification

1. **Day-completion API** — currently `POST /api/program/complete-journey` (fires only on day 28) and implicit completion via `awareness_logs` upsert. For Phase 8 badges, we need a canonical "day-complete event" writer that idempotently: (a) upserts to `progress.completed_days`, (b) evaluates badges, (c) emits server event. Recommend: **new `POST /api/program/day-complete`** that all client flows call, replacing the implicit pattern.

2. **Cycle content progression** — `taamun-content.ts` has `DAYS` array (28 items). Post-cycle-1, `/api/ai/generate-cycle` (per v1.1) generates cycles 2+. Year-in-Review must be cycle-aware, not just day-aware.

3. **Auth callback** — `src/app/auth/callback/route.ts` currently redirects to `/program`. Phase 10 (referrals) extends it to check a pending-referral cookie. Must not break existing redirect behavior (magic-link + OAuth both go through here).

4. **AppChrome** — currently renders children. Phase 9 slots a banner above children; must keep the `ramadanClosed` prop semantics intact (layout.tsx:132).

5. **`getServerProgress`** — Returns `{ authenticated, currentDay, completedDays, totalDays }`. Phase 7 extends with `currentCycle` and `isLastDayOfCycle`. Backward-compatible additive change only.

---

## Open Questions for Roadmapper

1. **Badge surface on non-milestone days** — do users want a persistent "badges" icon in chrome, or is `/badges` route enough? (Affects Phase 8 scope.)
2. **Year-in-Review release cadence** — only at year end, or quarterly "seasons"? (Affects whether `year_reviews` key needs `quarter`.)
3. **Referral reward** — fixed 30-day extension, or % discount, or credit-bank? (Affects Phase 10 schema flexibility.)
4. **Analytics PII audit sign-off** — Ziad's explicit approval on the event catalog (no reflection text) must land before Phase 6 merges.

---

## Sources

- Direct code reading (all citations are file:line references above):
  - `/src/components/DayExperience.tsx`
  - `/src/lib/entitlement.ts`
  - `/src/lib/supabase/server.ts`
  - `/src/lib/journey/serverGuard.ts`
  - `/src/lib/progressStore.ts`
  - `/src/lib/analytics.ts`
  - `/src/app/program/page.tsx`
  - `/src/app/layout.tsx`
  - `/src/app/api/program/start-cycle/route.ts`
  - `/src/app/api/cron/manage-subscriptions/route.ts`
  - `/supabase/migrations/20260418000000_add_cycles_support.sql`
  - `/supabase/migrations/20260401000000_pattern_insights.sql`
  - `/supabase/migrations/20260326100000_tasbeeh_access.sql`
  - `/CLAUDE.md` (architectural contract)
  - `/.planning/PROJECT.md` (v1.2 milestone brief)
- Training-data references for Next.js `@vercel/og` / `opengraph-image.tsx` conventions and PostHog fetch-based ingestion — **MEDIUM confidence**; must be re-verified with Context7 at implementation time per CLAUDE.md dependency rules.

---
*Architecture research for: Taamun v1.2 Retention Loop integration*
*Researched: 2026-04-18*
