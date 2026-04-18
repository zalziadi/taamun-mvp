# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (shipped 2026-04-18)

**Archived:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md)

Email re-engagement automation, web push notifications, AI-generated infinite cycles (hybrid), book highlights + notes (DB-backed), WhatsApp community infrastructure.

> Shipped directly via focused commits same-day — no full GSD discuss→plan→execute cycle was produced. WhatsApp community remains pending operational activation (group admin, moderation policy).

---

## v1.2 — إغلاق الحلقة (Retention Loop) (in progress)

**Goal:** Transform the 28-day experience from a program that ends into a year-long relationship by closing six retention gaps between Day 28 and Day 365.

**Numbering:** Continues from v1.1 — starts at Phase 6, ends at Phase 11. Phase 12 (YIR Ramadan moment) deferred to v1.3 per REQUIREMENTS.md decision #4.

**Total REQs:** 71 functional + 10 non-functional (NFRs cross-cutting).

### Phases

- [ ] **Phase 6: PostHog Event Instrumentation** — Foundation for measurement; enforces sacred-page privacy guardrails
- [ ] **Phase 7: Cycle 2 Transition + Day-28 Badge (merged)** — Replace silent Day-28 wall with "واصل الرحلة" CTA
- [ ] **Phase 8: Milestone Badges (days 1/3/7/14/21 + cycle-completion)** — Private, content-paired, retroactively backfilled
- [ ] **Phase 9: Renewal Prompts In-App** — 7-day banner, gateway-aware CTA, dedup with email/push channels
- [ ] **Phase 10: Referral Program** — "ادع للتمعّن" da'wah-framed, both-sided reward, day-14 gating
- [ ] **Phase 11: Year-in-Review Archive** — Always-on retrospective; Ramadan moment deferred to v1.3

### Phase Details

#### Phase 6: PostHog Event Instrumentation
**Goal:** Wire the 8 core retention events server-side and harden the sacred-page exclusion list so every subsequent phase has measurable funnels without a single tracking pixel touching a reflection page.
**Depends on:** Nothing (foundation phase)
**Requirements:** ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04, ANALYTICS-05, ANALYTICS-06, ANALYTICS-07, ANALYTICS-08, ANALYTICS-09, ANALYTICS-10, ANALYTICS-11, ANALYTICS-12 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. A user completing Day 7 produces exactly one `day_complete` event in PostHog with props `{day_number: 7, cycle_number: 1, tier}` — fired server-side from `/api/program/progress/*` success handler
  2. Page views fire on `/`, `/pricing`, `/account`, `/program` after client-side navigation (no Suspense bailout warning in console)
  3. Opening DevTools Network tab on `/day/7`, `/reflection/*`, `/book/*` shows ZERO requests to `posthog.com` or `app.posthog.com` — even on long sessions
  4. CI pipeline fails the build if a developer adds `track()` or `posthog.capture(` inside `src/app/day/**`, `src/app/reflection/**`, `src/app/book/**`, `src/app/program/day/**`, `/api/guide/**`, or any of the 7 banned components
  5. Property whitelist enforced: a PR that adds an event with prop name `user_email` or `reflection_text` fails CI grep
**Plans**: TBD
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 25 — Pixels on sacred pages:** Enforced via CI grep, not documentation. `capture_pageview: false` already set; preserve it.
  - **Pitfall 24 — PII leakage in event properties:** Strict-typed `track()` wrapper + property-name lint; emails/reflection text never reach PostHog.
  - **Pitfall 28 — Quota exhaustion:** Cap at <10 events/user/day; PostHog alerts at 70%/90% quota.
**Banned anti-patterns** (subset of SUMMARY.md §R4): PostHog session recording on any route · heatmaps on reflection pages · feature flags on sacred routes · autocapture on intimate components · client-side PII in event props · third-party analytics concurrent with PostHog (Segment/Mixpanel/GA4) · client-side fire for subscription/payment events.
**Research-phase routing**: ⏭️ **SKIP** `/gsd:research-phase` — STACK + PITFALLS already cover everything.

#### Phase 7: Cycle 2 Transition + Day-28 Badge (merged)
**Goal:** A user who saves the Day-28 reflection sees an Arabic-native "واصل الرحلة" CTA inside the same flow, can advance to cycle 2 with one tap, and the Day-28 badge unlocks silently as part of the moment — no separate achievement modal, no tonal mismatch on the most emotionally weighted screen in the product.
**Depends on:** Phase 6 (analytics emit `cycle_start` event from this phase)
**Requirements:** RETURN-01, RETURN-02, RETURN-03, RETURN-04, RETURN-05, RETURN-06, RETURN-07 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. After saving the Day-28 reflection, the user sees a "واصل الرحلة" CTA within the same `/day/28` view (no navigation away, no modal interrupting reflection input)
  2. Tapping "واصل الرحلة" advances the user to Day 1 of cycle 2 with the SAME 28 verses (Headspace deeper-practice model — verse selection unchanged, cycle number incremented)
  3. A user who taps the CTA on phone AND laptop within 5 seconds ends up with `current_cycle = 2` and exactly one `cycle_start` PostHog event — never duplicates, never a "Day 1 of cycle 2 already partly complete" artifact
  4. The Day-28 badge appears on `/progress` after the transition with no separate "🏆 Achievement Unlocked!" modal having interrupted the user
  5. A user activated at 23:00 Asia/Riyadh on day 27 who returns at 06:00 the next morning correctly sees Day 28 (not Day 27 stuck due to UTC drift)
**Plans**: TBD
**UI hint**: yes
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 1 — Multi-device cycle race:** Optimistic-concurrency guard (`progress.cycle_paused_at` column + `.eq("current_cycle", expected)` in update) returns 409 on race; client disables CTA after first tap.
  - **Pitfall 2 — Silent fallback dead-end:** Remove the existing graceful fallback in `start-cycle/route.ts` once the v1.2 migration lands; only fall back on error code `42703` (undefined column).
  - **Pitfall 3 — Timezone drift:** Hardcode `Asia/Riyadh` for day boundaries via `Intl.DateTimeFormat`; CTA fires on EITHER `completed_days.includes(28)` OR `calendarDay >= 28`.
**Banned anti-patterns** (subset of SUMMARY.md §R4): Confetti/fireworks on Day 28 · "unlocked!" / "achievement" English-loan vocabulary · multi-step cycle-2 wizard · auto-advance to cycle 2 the moment Day 28 saves · streak continuation UI · "you're in the top X% of users" comparison · separate badge modal on Day 28 (must be silent inside the cycle transition).
**Research-phase routing**: ▶️ **RUN** `/gsd:research-phase` — needs phase-specific cycle-2 timezone testing + verification of `start-cycle` race-condition fix.

#### Phase 8: Milestone Badges (days 1/3/7/14/21 + cycle-completion)
**Goal:** Five private milestone badges (days 1, 3, 7, 14, 21) plus one cycle-completion badge per cycle become visible on `/progress` as the user crosses each threshold — and existing customers (e.g., the day-9 advocate) see their already-earned badges retroactively without 5 push notifications firing on deploy day.
**Depends on:** Phase 6 (analytics) + Phase 7 (Day-28 badge already in place; this phase adds the other 5 milestones + cycle-completion)
**Requirements:** BADGE-01, BADGE-02, BADGE-03, BADGE-04, BADGE-05, BADGE-06, BADGE-07, BADGE-08, BADGE-09 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. A user reaching Day 7 sees the Day-7 badge appear on `/progress` after saving their reflection — no toast, no modal, no notification interrupted the flow
  2. Existing day-9 customer opens app on deploy day and sees Day-1, Day-3, Day-7 badges already unlocked on `/progress` with NO unlock animations firing and ZERO retroactive `badge_unlock` events in PostHog
  3. A user saving the same reflection twice (network retry, double-tap) ends up with exactly one row per `(user_id, badge_code, cycle_number)` in the `badges` table
  4. Inspecting any badge on `/progress` reveals NO share button, NO `next/og` route, NO social export action — badges are private by definition
  5. Badge SVGs render correctly RTL on iOS Safari + Android Chrome (no Arabic glyph disconnection, no mirrored numerals — text rendered via HTML `<span dir="rtl">`, not embedded in SVG)
**Plans**: TBD
**UI hint**: yes
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 4 — Retroactive badge flood:** Backfill migration sets `notified=true` and reconstructs `unlocked_at` from `MIN(reflections.created_at)` per day; no client animation fires for backfilled rows; backfill never emits PostHog events.
  - **Pitfall 5 — Duplicate badge awards:** `UNIQUE(user_id, badge_code, cycle_number)` constraint + `INSERT ... ON CONFLICT DO NOTHING`; rowcount=0 → no event, no notification.
  - **Pitfall 6 — Gamification tone drift:** Explicit anti-pattern list enforced in PR review; badges named with classical Arabic vocabulary (`عتبة` / `حلقة` / `منزلة`), never "achievement"/"unlocked".
  - **Pitfall 8 — RTL badge breakage:** Badge SVGs contain ZERO Arabic text; numerals + names rendered via HTML siblings.
**Banned anti-patterns** (subset of SUMMARY.md §R4): Streak counter UI ("🔥 7 days") · rare/legendary tier badges · badge progress bars ("3 of 6 — 50%!") · share buttons on badges · auto-share to Instagram Story · "you lost your streak!" copy · forward-looking countdown ("3 days until Day 14!") · `<Dialog>` or `<Modal>` anywhere inside `src/app/day/*` or `DayExperience.tsx` · Lottie/canvas-confetti for unlock animations.
**Research-phase routing**: ⏭️ **SKIP** `/gsd:research-phase` — covered by SUMMARY.md + PITFALLS.md.

#### Phase 9: Renewal Prompts In-App
**Goal:** A subscriber whose `expires_at` is within 7 days sees a single, dismissible, "واصل" — framed banner inside `AppChrome.tsx` (never on sacred routes) that deep-links to the gateway they originally paid through — and a user who already auto-renewed never sees it once.
**Depends on:** Phase 6 (analytics emits `renewal_prompted`)
**Requirements:** RENEW-01, RENEW-02, RENEW-03, RENEW-04, RENEW-05, RENEW-06, RENEW-07, RENEW-08, RENEW-09 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. A subscriber 6 days from expiry sees the renewal banner above page content on `/`, `/program`, `/account` — and sees NOTHING on `/day/*`, `/reflection/*`, `/book/*`
  2. A Salla-paying user tapping the banner CTA lands on Salla's renewal flow (NOT Stripe checkout); a Tap user lands on Tap; a Stripe user lands on Stripe
  3. A user who dismisses the banner does not see it again for 48 hours, even after page reloads or new sessions, until the `taamun.renewal_dismissed_until.v1` LocalStorage key expires
  4. A user who just renewed (webhook fired, `expires_at` extended past 7 days) does NOT see the banner on their next page load — even if their HMAC entitlement cookie is still stale
  5. A user who already received the expiry-warning email today sees NO banner on the same day (3-channel-fatigue dedup working: email + push + banner combined budget = 1 nudge per 48h)
**Plans**: TBD
**UI hint**: yes
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 13 — 3-channel notification fatigue:** Central nudge orchestrator with `(user_id, channel, sent_at)` table; banner suppressed if email/push fired in last 48h.
  - **Pitfall 14 — Prompt on already-renewed user:** Renewal logic ALWAYS reads `profiles.expires_at` from DB, never from cookie; cookie-vs-DB reconciliation helper in middleware refreshes stale HMAC token.
  - **Pitfall 15 — Dark-pattern copy:** No countdown timers, no "only X seats left", no "lose your reflections!"; banner uses "واصل" framing that defers to user.
  - **Pitfall 17 — Multi-gateway mismatch:** New `profiles.original_gateway` column captured at first activation; renewal CTA URL is gateway-derived server-side.
**Banned anti-patterns** (subset of SUMMARY.md §R4): Interstitial modal blocking `/program` or `/day` · countdown timers / fake scarcity · "losing access in X hours" urgency copy · "lose your reflections" loss-aversion copy · auto-upgrade to higher tier · hiding the cancel button · multiple prompts per day · banner rendering on `/day/**`, `/reflection/**`, or `/book/**` routes.
**Research-phase routing**: ▶️ **RUN** `/gsd:research-phase` — Salla/Tap subscription-pause capability spike needed (Stripe supports it; Salla/Tap unknown).

#### Phase 10: Referral Program
**Goal:** Convert the "قلبي يتشرب معاني" advocacy into growth: each user can generate a `FRIEND-*` invite code, both invitee and referrer get a free month, abuse vectors (self-referral, refund-then-keep-reward, MLM tiers) are closed by design — with copy that reads as da'wah, not affiliate marketing.
**Depends on:** Phase 6 (analytics) + Phase 9 (renewal flow trusted; reward delivered by extending `expires_at`)
**Requirements:** REFER-01, REFER-02, REFER-03, REFER-04, REFER-05, REFER-06, REFER-07, REFER-08, REFER-09, REFER-10, REFER-11, REFER-12 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. A user visiting `/account/referral` for the first time generates a unique `FRIEND-XXXX` code that is visible, copyable, and shareable via WhatsApp (primary), Instagram Story (secondary), or link copy (fallback)
  2. An invitee redeeming a `FRIEND-*` code via `/api/activate` gets a free month immediately; the referrer's `profiles.expires_at` is extended by 30 days ONLY when the invitee reaches Day 14 of their journey
  3. A user attempting to refer themselves (same `auth.uid()` as referrer and invitee) is blocked at the DB constraint level — no row created, no reward delivered
  4. A referrer who has already had 3 successful referrals in the current calendar year sees their referral page status reflect the cap; the 4th invitee gets their free month but the referrer reward is denied with a transparent message
  5. An invitee who refunds within 14 days causes the pending referrer reward to be voided automatically (no manual admin action needed)
**Plans**: TBD
**UI hint**: yes
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 18 — Self-referral / burner-account abuse:** Day-14 retention gating + max 3/year cap + same-device fingerprint flag for manual review; magic-link alone doesn't grant reward.
  - **Pitfall 19 — Reward race condition:** Synchronous credit inside `/api/activate` transaction (NOT async webhook); idempotent by `referrals.id`.
  - **Pitfall 22 — Code-namespace collision:** Distinct `FRIEND-*` prefix (NOT `TAAMUN-*`); pasting a `FRIEND-*` code into the activation field returns a helpful 400 with redirect to referral flow.
  - **Pitfall 23 — Refund abuse:** Reward `pending` until day 14; refund webhook sets `status='voided'` if reward already delivered; reward type is direct `expires_at` extension (NEVER mint fake `activation_codes` rows).
**Banned anti-patterns** (subset of SUMMARY.md §R4): MLM-style multi-level referral rewards · cash withdrawal / PayPal payout · public leaderboard of top referrers · "earn rewards" / "earn points" framing · auto-share on every completion · gamification UI (badges for referrers) · "referral X out of 3" progress bars · tracking which channel each share went to.
**Research-phase routing**: ▶️ **RUN** `/gsd:research-phase` — fraud/attribution policy needs explicit product decisions (last-touch window, fingerprint thresholds).

#### Phase 11: Year-in-Review Archive
**Goal:** A user with at least 30 days of reflections can visit `/year-in-review` and see a calm, archive-style retrospective anchored to their activation anniversary — with Eastern Arabic numerals on the page, type-enforced privacy on the share card, and zero reflection text leaking outbound. The Ramadan annual moment is explicitly OUT of scope (deferred to v1.3 per REQUIREMENTS.md decision #4).
**Depends on:** Phase 6 (analytics emits `year_review_opened` / `year_review_shared`)
**Requirements:** YIR-01, YIR-02, YIR-03, YIR-04, YIR-05, YIR-06, YIR-07, YIR-08, YIR-09, YIR-10, YIR-11, YIR-12 · cross-cutting: NFR-01..10
**Success Criteria** (what must be TRUE):
  1. A user with 200 days of reflections opens `/year-in-review` and sees their aggregated journey rendering in under 3 seconds (single Postgres RPC, snapshot cached in `year_reviews` table)
  2. A user with only 50 days sees a graceful range-labeled summary ("من 2026-01-15 إلى 2026-03-05") — never a 365-empty-slot demoralizing page
  3. The page displays "٣٦٥ يوم" (Eastern Arabic numerals) in the body; the OG share card displays "365 days" (Western numerals) for cross-platform readability
  4. Tapping "شارك" generates a share card via `next/og` containing ONLY public stats (counts, averages, day numbers) — manually inspecting the rendered image confirms ZERO reflection text, ZERO emotion labels, ZERO guide messages leak through (enforced by `YIRPublicStats` vs `YIRPrivateContent` TypeScript split)
  5. A user activated on 2026-03-01 who visits one year later sees their year boundary anchored to 2027-03-01 (their personal anniversary) with Hijri + Gregorian both displayed — never the Gregorian "2026 in review" framing
**Plans**: TBD
**UI hint**: yes
**Risks & Mitigations** (from PITFALLS.md):
  - **Pitfall 9 — Slow first render:** Single `get_year_in_review(user_id, year_key)` RPC + snapshot to `year_reviews` JSON; subsequent visits read from cache.
  - **Pitfall 10 — Privacy bleed via share card:** Compile-time type split (`YIRPublicStats` vs `YIRPrivateContent`); share card constructor accepts only the public type; pre-render preview shown to user before share.
  - **Pitfall 11 — Year ambiguity:** Activation anniversary is the boundary (not Gregorian, not Hijri new year); never `.getFullYear()`.
  - **Pitfall 12 — Empty state:** Three data-density variants (<30d → no YIR; 30–120d → range-label; >120d → full).
**Banned anti-patterns** (subset of SUMMARY.md §R4): Spotify-Wrapped copycat (music, transitions, "ranked" insights) · MBTI-style personality results from reflection content · public leaderboard / "you wrote more than 80% of users" · auto-posting to social on YIR launch day · share-card containing reflection snippets · charts via library (must be hand-rolled SVG `<polyline>`) · Ramadan-moment scarcity push (deferred to v1.3).
**Research-phase routing**: ⏭️ **SKIP** `/gsd:research-phase` — covered by existing research; Phase 12 (Ramadan moment) deferred to v1.3.

### Cross-cutting NFR Application

NFRs apply to ALL phases (Phase 6 through Phase 11):

| NFR | Applied via |
|---|---|
| NFR-01 (LCP < 6s on 3G) | Phase 9 banner cached, Phase 11 snapshot table, no chart libs anywhere |
| NFR-02 (A11y ≥ 95) | Lighthouse mobile run before each phase merge |
| NFR-03 (SEO = 100) | No noindex on new public routes; metadata preserved |
| NFR-04 (No tracking pixels on prayer/reflection pages) | Phase 6 enforces via CI grep; all subsequent phases respect the exclusion list |
| NFR-05 (Cost < 2000 SAR total) | Zero new SaaS, zero new infra; all phases use existing PostHog/Supabase/Vercel |
| NFR-06 (RTL correctness) | Every new UI component verified in `dir="rtl"` at 3 viewports |
| NFR-07 (Arabic-first copy) | Every Arabic string written natively; no machine translation; Ziad reviews |
| NFR-08 (No new runtime deps) | All 6 phases ship on installed packages (framer-motion, next/og, posthog-js); fetch-based PostHog server emission |
| NFR-09 (Two-step migrations) | Phases 7/8/9/10 each add columns/tables; every schema change is additive-then-enforce |
| NFR-10 (Pre-merge tsc + build) | Mandatory in every phase plan checklist |

### Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. PostHog Event Instrumentation | 0/0 | Not started | - |
| 7. Cycle 2 Transition + Day-28 Badge | 0/0 | Not started | - |
| 8. Milestone Badges | 0/0 | Not started | - |
| 9. Renewal Prompts In-App | 0/0 | Not started | - |
| 10. Referral Program | 0/0 | Not started | - |
| 11. Year-in-Review Archive | 0/0 | Not started | - |

---

## v1.3 — Depth & Personalization (backlog)

Originally planned as v1.2 backlog; pushed to v1.3 once v1.2 reframed around the Retention Loop.

- Reflection themes ML clustering (semantic search over user reflections)
- Long-term guide memory beyond session scope
- Voice journaling (Munsit STT integration for dhikr/reflection)
- Arabic screen reader quality audit
- **Year-in-Review Ramadan annual moment** (deferred from v1.2 Phase 12 — scarcity + annual push, Satori Arabic-font spike required)
- **Subscription pause feature** (deferred — needs Salla/Tap capability spike)
- **Family plan** (multi-user)

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Content creators publish their own 28-day journeys
- Embeddable widget for imams/teachers

---

## Principles

1. **No feature ships without real user validation.** The "قلبي يتشرب معاني" feedback is the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile.
3. **Arabic-first:** no English-only flows. RTL throughout.
4. **Privacy:** no tracking pixels on prayer/reflection pages — enforced by CI grep, not documentation.
5. **Tonal guardrails:** every v1.2 phase explicitly bans Duolingo/Headspace/Strava gamification patterns. Badges are private by default. Renewal copy never uses scarcity.
6. **DB is source of truth:** entitlement HMAC cookie is a cache; renewal/badge/cycle logic always reads the DB.
7. **Two-step migrations:** every schema addition is additive-then-enforce to avoid prod outages.
