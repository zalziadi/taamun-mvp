# SUMMARY.md — v1.2 Retention Loop Research Synthesis

**Project:** Taamun v1.2 — إغلاق الحلقة (Retention Loop)
**Synthesized:** 2026-04-18
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall confidence:** HIGH
**Verdict:** 🟢 **Ready for Requirements**

---

## Executive Synthesis

v1.2 closes six retention gaps between Day 28 and Day 365 with **zero new runtime dependencies**. Every feature plugs into the existing stack (Next.js 14.2.18 App Router, Supabase SSR 0.8.0, PostHog 1.278.0, Resend via `fetch`, framer-motion, built-in `next/og`). Code-reading research confirmed all primitives already exist — `src/lib/emails/expiry-warning-template.ts`, `src/lib/analytics.ts` with `person_profiles: "never"`, `activation_codes` table, 3 payment webhooks.

The headline risk is **tonal, not technical**: a Quranic-reflection product cannot import Duolingo/Headspace gamification patterns without destroying the "قلبي يتشرب معاني" identity validated with the first real customer. The 33 pitfalls cluster into four risk areas: multi-device race conditions on cycle transition, retroactive badge event-spam on deploy, privacy leaks in YIR share cards, and referral self-abuse via magic-link burner accounts.

Non-negotiable constraints: Arabic-first copy (written, never translated); zero PostHog `track()` inside `/day`, `/reflection`, `/book`, `DayExperience.tsx`; badges private-by-default (Headspace model); DB is source of truth for entitlement (not the HMAC cookie); two-step migrations for every schema addition.

---

## Reconciled Phase Order (Recommended)

> Roadmapper has final call; these are the synthesizer's strongly-backed recommendations.

| Phase | Feature | Why this position |
|---|---|---|
| **6** | **PostHog Event Instrumentation** | Foundation — every subsequent phase needs measurement. Cross-cutting guardrail phase. |
| **7** | **Cycle 2 Transition + Day-28 Badge (MERGED)** | FEATURES argues for tonal unity on the Day 28 screen. One celebration, one tone, one ship. |
| **8** | **Remaining Milestone Badges** (days 1/3/7/14/21) | Includes retroactive backfill for existing users (mark `notified=true`, reconstruct `unlocked_at`). |
| **9** | **Renewal Prompts In-App** | Needs nudge orchestrator (email + push + banner dedup), gateway-aware CTA, entitlement refresh middleware. |
| **10** | **Referral Program** | Depends on stable analytics (Phase 6) + renewal flow (Phase 9) for reward delivery timing. |
| **11** | **YIR Always-On Archive** | Standalone, permanent value, modest design work. |
| **12** | **YIR Ramadan Moment** | Time-boxed; OK to defer to v1.3 if Ramadan timing slips. |

**Total: 6-7 phases** (12 can defer). Numbering continues from v1.1's Phase 5.

---

## Key Reconciliations Between Researchers

### R1: Referral storage — NEW `referrals` table ✅
- **Conflict:** STACK proposed extending `activation_codes` (+2 columns). ARCHITECTURE proposed new `referrals` table.
- **Decision:** ARCHITECTURE wins. Separate billing concerns (purchase codes) from reward concerns (referrals). Avoids PITFALL #22 namespace collision.
- **Reward delivery:** extend `profiles.expires_at` directly — do NOT mint fake `activation_codes` rows with `tier='referral_month'`.
- **Code prefix:** distinct from `TAAMUN-*` — use `R-*` or `FRIEND-*`.

### R2: Phase order — Analytics first, Cycle2+Day28-Badge merged, YIR split
- **Conflict:** ARCHITECTURE proposed 6 phases sequential. FEATURES proposed merging Cycle2+Badges on Day 28 screen, splitting YIR.
- **Decision:** Synthesize both — see Reconciled Phase Order above.

### R3: Share mechanism — Private badges, public YIR + Referral
- **Conflict:** FEATURES strongly recommends no badge share (Headspace/إخلاص). STACK/ARCHITECTURE assumed shareable via `next/og`.
- **Decision:** Private badges by default (no share button, no OG route for badges).
- **Share cards ONLY for:** YIR (reflective tone: "سنتي مع القرآن") and Referral (da'wah tone: "ادعُ صديقاً للتمعّن"). Different register than achievement gloating.

### R4: Gamification anti-patterns — Explicit banned list
Every phase plan must reference this. Banned across v1.2:
- Streak counter UI ("🔥 7 days")
- Confetti on any page except Day 28/Cycle completion
- "Lost your streak" copy / guilt emails
- Leaderboards of any kind
- Rare/legendary tier badges ("common / epic / mythic")
- Badge progress bars ("3 of 6 unlocked — 50%!")
- Countdown timers / fake scarcity
- Interstitial renewal modals on `/program` or `/day`
- Auto-share (every share must require explicit tap)
- MLM-style multi-level referral rewards
- Any modal inside `/day/*` flow (breaks silence-verse-reflection ritual)

### R5: PostHog privacy exclusions — Concrete list
**Excluded PATHS** (zero `track()` calls):
- `src/app/day/**`
- `src/app/reflection/**`
- `src/app/book/**`
- `src/app/program/day/**`
- AI guide routes (`/api/guide/*`, `/guide/*`)

**Excluded COMPONENTS:**
- `DayExperience.tsx`
- `ReflectionJournal.tsx`
- `AwarenessMeter.tsx`
- `BookQuote.tsx`
- `VerseBlock.tsx`
- `HiddenLayer.tsx`
- `SilenceGate.tsx`

**Emission model:** Events fire **server-side** from `/api/program/*` success handlers only — never from client inside excluded components.

**Property whitelist + lint:** CI grep bans property names matching `*_email`, `*_phone`, `reflection_*`, `verse_*`, `journal_*`, `message_*`, `prayer_*`. Allowed: `day_number`, `cycle_number`, `milestone_code`, `badge_code`, `referral_code_prefix`, `renewal_days_remaining`, `gateway`, `tier`.

---

## Table-Stakes · Differentiators · Anti-Features

### Cycle 2 Transition
- **Table stakes:** In-app CTA on Day 28 success · `/api/program/start-cycle` with optimistic concurrency lock · celebration animation (framer-motion, no confetti) · timezone-safe boundary (Asia/Riyadh)
- **Differentiators:** "واصل الرحلة" phrasing (not "Start Cycle 2") · prayer-toned reset copy · one-tap transition with server-authoritative state
- **Anti-features:** Multi-step wizard · "unlock cycle 2" framing · streak continuation UI · blocking modal

### Milestone Badges
- **Table stakes:** 6 badges (days 1/3/7/14/21/28) · SVG art · persistent `badges` table · idempotent (UNIQUE `user_id`+`badge_code`) · retroactive backfill for existing users
- **Differentiators:** Written-by-hand Arabic names (not "Day 7 Achievement") · awarded silently with subtle badge-grid reveal on `/progress` · linked to verse from that day
- **Anti-features:** Share button · rarity tiers · progress bar · animated lottie · "notifications" toast interrupting daily flow

### Year-in-Review
- **Table stakes:** `/year-in-review` page · aggregates `reflections` + `awareness_logs` + `progress` · graceful degradation (<365 days → label by earliest-to-latest range) · `year_reviews` snapshot cache
- **Differentiators:** Hijri-anchored (not Gregorian) · Ramadan-themed annual moment · `next/og` share card with reflective copy · permanent archive ("سنتي مع القرآن" always-accessible)
- **Anti-features:** Spotify-Wrapped copycat · Wrapped-style "ranked" insights · public-by-default · aggregates private reflection content into share card (privacy bleed)

### Renewal Prompts In-App
- **Table stakes:** 7-day banner · gateway-aware CTA (Salla/Tap/Stripe) · dismiss persistence (LS) · dedup with existing email cron
- **Differentiators:** "واصل" phrasing (not "Renew" / "Don't lose access") · single nudge orchestrator (email + push + banner budget together)
- **Anti-features:** Interstitial modal blocking daily flow · countdown timer · "losing access in X hours" urgency copy · fake-scarcity

### Referral Program
- **Table stakes:** Invite link with distinct prefix · both-sided reward (referrer + invitee each get free month) · `referrals` table · abuse prevention (max 3/year, day-14 gating)
- **Differentiators:** "ادعُ للتمعّن" da'wah framing (not "earn rewards") · WhatsApp-first share · reward delivery via direct `expires_at` extension
- **Anti-features:** MLM tiers · gamification (leaderboard of top referrers) · auto-share · rewards shown as "points"

### PostHog Event Instrumentation
- **Table stakes:** Pageview wiring (App Router, Suspense-wrapped `useSearchParams`) · 8 core server-side events · property whitelist · privacy exclusions enforced by CI lint
- **Differentiators:** `person_profiles: "never"` preserved · zero tracking on sacred pages · server-side emission from API success handlers · Arabic event descriptions in registry doc
- **Anti-features:** Session recording · heatmaps · feature flags on sacred routes · autocapture on intimate components · client-side PII

---

## Top 5 Critical Pitfalls (from 33)

1. **Gamification drift (PITFALL #6)** — Product-identity violation. Every phase plan's "Out of Scope" section must enumerate banned patterns (see R4 list).

2. **PostHog pixel on sacred pages (PITFALL #25)** — Non-negotiable per PROJECT.md principle #4. Enforced via CI grep rule banning `track()` in excluded paths/components.

3. **YIR privacy bleed through share card (PITFALL #10)** — Type-split at compile time: `YIRPublicStats` (counts, averages, day numbers) vs `YIRPrivateContent` (reflection text, emotion labels, guide messages). Share card consumes only `YIRPublicStats`.

4. **Multi-device cycle race (PITFALL #1) + retroactive badge flood (PITFALL #4)** — Optimistic-concurrency guard on `start-cycle` (version column). Badge backfill for existing users must set `notified=true` + reconstructed `unlocked_at` from `reflections.day_number` MIN timestamp — never fire post-hoc events.

5. **Referral self-abuse (PITFALL #18) + refund abuse (PITFALL #23)** — Reward pending until invitee's day 14. Max 3 rewards per referrer per year. Distinct code prefix (PITFALL #22). Synchronous credit inside `/api/activate` (never async webhook — PITFALL #19).

---

## Stack Verdict

**Zero new dependencies.** All 6 features ship on installed packages.

**DO NOT install** (full STOP list of 40+ packages in STACK.md). Highlights:
- `resend` SDK (fetch works)
- `@vercel/og` (replaced by built-in `next/og`)
- `recharts` / `chart.js` / `visx` (hand-rolled SVG for YIR sparkline)
- `canvas-confetti` / `lottie-react` (framer-motion suffices)
- `nanoid` (native `crypto.randomUUID()`)
- `@tanstack/react-query` / `swr` (Server Components fetch directly)
- `posthog-node` (server-side via `fetch`)

---

## Architecture Verdict

**3 new tables** (all RLS-enabled, two-step migrations):
- `badges(user_id, badge_code, unlocked_at, notified)` — UNIQUE `(user_id, badge_code)`
- `referrals(referrer_id, code, invitee_id, status, created_at, rewarded_at)`
- `year_reviews(user_id, year_key, payload jsonb, generated_at)`

**2 new columns:**
- `progress.cycle_paused_at timestamptz` — for Phase 7 race-condition guard
- `profiles.original_gateway text` — for Phase 9 gateway-aware CTA

**1 new Postgres RPC:** `get_year_in_review(user_id, year_key)` — aggregation.

**No middleware changes** except a small cookie-vs-DB reconciliation helper in Phase 9.

---

## Research-Phase Flags (for `/gsd:plan-phase` routing)

| Phase | Skip `/gsd:research-phase`? | Why |
|---|---|---|
| 6 — PostHog | ✅ Skip | STACK + PITFALLS cover everything |
| 7 — Cycle 2 + Day-28 Badge | ❌ Run | Need cycle-2 content strategy + timezone testing |
| 8 — Remaining Badges | ✅ Skip | Covered by research |
| 9 — Renewal | ❌ Run | Salla/Tap pause-support spike needed (Stripe supports it, others unknown) |
| 10 — Referral | ❌ Run | Fraud/attribution policy needs product decisions |
| 11 — YIR Archive | ✅ Skip | Covered |
| 12 — YIR Ramadan (deferrable) | ❌ Run | Satori Arabic font spike |

---

## Open Questions — Requirements Phase Must Answer

1. **Cycle-2 content strategy:** Same 28 verses deeper (FEATURES recommends) or v1.1 AI-generated cycles take over? Reshapes `CycleCompletionCTA` copy and Phase 7 scope.

2. **Referral reward rule:** Credit referrer on code redemption · on invitee's first payment · on invitee's day 14 retention? PITFALLS argues day-14 for abuse prevention; FEATURES wants earlier visibility. Recommended: **day-14**, with invitee getting immediate free month.

3. **YIR launch timing:** Before or after Ramadan 2027-02-17 (Hijri start)? If before, archive-only in v1.2 (Phase 12 defers to v1.3).

4. **Fraud tolerance:** Self-referrals allowed? Recommended: **forbidden** — max 3 referrals/referrer/year + day-14 gating + fingerprint flag on same-device activation.

5. **Badge count scope:** 6 total (milestone days × 1 cycle) or 18 (milestone days × 3 cycles) or open-ended per cycle? Recommended: **6 per cycle** tied to cycle number, cap at cycle 3 for v1.2.

6. **Eastern vs Western Arabic numerals** in YIR ("٣٦٥ يوم" vs "365 يوم")? Recommended: **Eastern** for immersion, Western for share card (broader readability).

---

## Confidence Assessment

| Area | Level | Basis |
|---|---|---|
| Stack verdict | HIGH | File-verified — package.json + direct code reads |
| Feature patterns | MEDIUM-HIGH | Meta-analyses + public benchmarks; Saudi/Gulf spiritual-app specifics thin |
| Architecture integration | HIGH | Direct code-reading of 12 files + schema inspection |
| Pitfalls specificity | HIGH | Each traced to real repo file/table |
| Phase-order rationale | HIGH | Dependencies derived from actual code paths |
| **Overall** | **HIGH** | Ready for Requirements → Roadmap |

---

## Traffic-Light Verdict

🟢 **READY FOR REQUIREMENTS.**

All four researchers agree on fundamentals: zero deps, 3 new tables, cross-cutting privacy + tone guardrails, analytics-first phase ordering. The 6 open questions are **product decisions for Requirements to capture**, not research gaps.

**Next step:** Define `REQUIREMENTS.md` with REQ-IDs grouped by category (ANALYTICS-*, RETURN-*, BADGE-*, RENEW-*, REFER-*, YIR-*), then spawn `gsd-roadmapper` for the phased plan.
