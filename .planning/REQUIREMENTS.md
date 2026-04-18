# Requirements — v1.2 إغلاق الحلقة (Retention Loop)

**Milestone goal:** Transform the 28-day experience from a program that ends into a year-long relationship. Close six retention gaps between Day 28 and Day 365.

**Previous requirements:**
- v1.0 archived at [milestones/v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)
- v1.1 archived at [milestones/v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)

---

## User Personas

1. **Day-28 Completer** — just finished first cycle, at highest drop-off risk
2. **Cycle Repeater** — on cycle 2 or 3, deepening practice
3. **Lapsing Subscriber** — expires in 7 days, needs gentle reminder
4. **Advocate** — "قلبي يتشرب معاني" day-9 user, would recommend to friends
5. **Year-One Subscriber** — crossing 12-month mark, wants reflection on journey
6. **Returning Dormant** — re-activated after 30+ days away

---

## v1.2 Requirements (by category)

### ANALYTICS — PostHog Event Instrumentation (Phase 6)

- [ ] **ANALYTICS-01**: Page views are tracked on all non-sacred paths via App Router navigation hook
- [ ] **ANALYTICS-02**: Pageview tracking is wrapped in `<Suspense>` to avoid React 18 CSR bailout
- [ ] **ANALYTICS-03**: `day_complete` event fires server-side from `/api/program/progress/*` success handlers with props `{day_number, cycle_number, tier}`
- [ ] **ANALYTICS-04**: `cycle_start` event fires from `/api/program/start-cycle` success with props `{new_cycle_number, prior_cycle_days_completed}`
- [ ] **ANALYTICS-05**: `badge_unlock` event fires from `/api/badges/unlock` with props `{badge_code, day_number, cycle_number}`
- [ ] **ANALYTICS-06**: `renewal_prompted` event fires when banner first renders with props `{days_remaining, gateway, tier}`
- [ ] **ANALYTICS-07**: `referral_code_generated` and `referral_code_redeemed` events fire with prefix-only props (never full code)
- [ ] **ANALYTICS-08**: `year_review_opened` and `year_review_shared` events fire with props `{year_key, reflections_count}`
- [ ] **ANALYTICS-09**: Zero `track()` calls exist inside `src/app/day/**`, `src/app/reflection/**`, `src/app/book/**`, `src/app/program/day/**`, `/api/guide/**` (enforced by CI grep)
- [ ] **ANALYTICS-10**: Zero `track()` calls exist inside `DayExperience.tsx`, `ReflectionJournal.tsx`, `AwarenessMeter.tsx`, `BookQuote.tsx`, `VerseBlock.tsx`, `HiddenLayer.tsx`, `SilenceGate.tsx` (enforced by CI grep)
- [ ] **ANALYTICS-11**: `person_profiles: "never"` setting in `src/lib/analytics.ts` is preserved
- [ ] **ANALYTICS-12**: Property name whitelist enforced — banned patterns: `*_email`, `*_phone`, `reflection_*`, `verse_*`, `journal_*`, `message_*`, `prayer_*`

### RETURN — Cycle 2 Transition + Day-28 Badge (Phase 7, merged)

- [ ] **RETURN-01**: User sees in-app CTA on Day 28 completion screen with Arabic-native phrasing "واصل الرحلة" (not "Start Cycle 2")
- [ ] **RETURN-02**: Tapping CTA calls `/api/program/start-cycle` which is idempotent + uses optimistic concurrency guard (`progress.cycle_paused_at` column) against multi-device race
- [ ] **RETURN-03**: Cycle 2 content strategy = **same 28 verses, deeper practice** (Headspace model). Cycle number increments, verse selection unchanged. Decision locked 2026-04-18.
- [ ] **RETURN-04**: Celebration animation uses `framer-motion` (already installed) — no confetti, no fireworks, no "unlocked!" language
- [ ] **RETURN-05**: Day-28 badge unlocks silently as part of cycle transition, not as separate achievement modal
- [ ] **RETURN-06**: Day boundary respects `Asia/Riyadh` timezone — user's "Day 28" is server's same-day
- [ ] **RETURN-07**: Day 28 completion fires exactly one `cycle_start` analytics event even if user reloads or triggers CTA on two devices

### BADGE — Milestone Badges (Phase 8)

- [ ] **BADGE-01**: 7 badges total per cycle: days 1, 3, 7, 14, 21, 28, + 1 cycle-completion badge. Scope cap: up to cycle 3 for v1.2. Decision locked 2026-04-18.
- [ ] **BADGE-02**: Each badge stored in `badges` table with `UNIQUE(user_id, badge_code, cycle_number)` constraint
- [ ] **BADGE-03**: Badges rendered as inline SVG React components (6 variants + cycle-completion), no static PNG, no Lottie
- [ ] **BADGE-04**: Badges are **private by default** — no share button, no `next/og` share route, no social export (Headspace إخلاص model). Decision locked 2026-04-18.
- [ ] **BADGE-05**: Badge unlock trigger evaluates server-side on reflection save (not client-side) — prevents bypass + handles offline catch-up
- [ ] **BADGE-06**: Badge unlock event is idempotent — duplicate saves do not create duplicate rows or duplicate analytics events
- [ ] **BADGE-07**: Existing users are backfilled with historical badges on deploy; backfill sets `notified=true` and reconstructs `unlocked_at` from `reflections.day_number` MIN timestamp — no post-hoc PostHog events fire
- [ ] **BADGE-08**: Badge grid visible on `/progress` page shows unlocked + locked states in same layout
- [ ] **BADGE-09**: No badge modal / toast interrupts the daily flow — unlock is revealed on the completion screen only

### RENEW — Renewal Prompts In-App (Phase 9)

- [ ] **RENEW-01**: In-app banner renders in `AppChrome.tsx` when `profiles.expires_at` is within 7 days
- [ ] **RENEW-02**: Banner copy uses "واصل" framing, not "لا تفقد الوصول" or countdown timers
- [ ] **RENEW-03**: CTA routes user to correct renewal path based on `profiles.original_gateway` (Salla / Tap / Stripe) — new column added
- [ ] **RENEW-04**: Banner is dismissible; dismissal persists in LocalStorage key `taamun.renewal_dismissed_until.v1` for 48 hours
- [ ] **RENEW-05**: Banner NEVER renders on `/day/**`, `/reflection/**`, `/book/**` routes (privacy + flow preservation)
- [ ] **RENEW-06**: Nudge orchestrator deduplicates: if email sent today + push sent today, banner is suppressed (avoid 3-channel fatigue)
- [ ] **RENEW-07**: Banner does not render for users who already auto-renewed (expires_at > now + 7 days after webhook update)
- [ ] **RENEW-08**: Existing `src/lib/emails/expiry-warning-template.ts` is reused — no new email template created
- [ ] **RENEW-09**: Cookie-vs-DB reconciliation helper refreshes stale HMAC entitlement cookie if DB shows renewal

### REFER — Referral Program (Phase 10)

- [ ] **REFER-01**: Each user can generate a referral code via `/account/referral` page; code prefix is distinct from `TAAMUN-*` (use `FRIEND-*`) to avoid namespace collision
- [ ] **REFER-02**: Referral codes stored in **new `referrals` table** (NOT an extension of `activation_codes`). Decision locked 2026-04-18.
- [ ] **REFER-03**: Both-sided reward: invitee gets free month immediately upon code redemption; referrer gets free month **after invitee reaches day 14** of retention. Decision locked 2026-04-18.
- [ ] **REFER-04**: Referrer reward delivered by extending `profiles.expires_at` directly — NEVER by minting fake `activation_codes` rows
- [ ] **REFER-05**: Reward crediting happens synchronously inside `/api/activate` on invitee's day-14 milestone — no async webhook delivery
- [ ] **REFER-06**: Max 3 successful referrals per referrer per calendar year (abuse cap)
- [ ] **REFER-07**: Self-referrals forbidden — `referrals.referrer_id !== invitee_id` enforced by constraint; same-device fingerprint flagged for manual review
- [ ] **REFER-08**: Refund/cancellation of invitee within 14 days voids pending referrer reward
- [ ] **REFER-09**: Share flow prioritizes WhatsApp deep link (Saudi/Gulf audience primary channel), with Instagram story and link-copy fallback
- [ ] **REFER-10**: Copy uses "ادعُ للتمعّن" da'wah framing, not "earn rewards" / "earn points"
- [ ] **REFER-11**: Referrer page shows status: pending / active (day 14+) / rewarded — transparent without gamification UI
- [ ] **REFER-12**: RLS policies: referrer can read own referral rows; redemption uses service-role client (existing pattern in `/api/activate`)

### YIR — Year-in-Review (Phase 11, archive-only)

- [ ] **YIR-01**: `/year-in-review` route accessible to authenticated users with ≥30 days of reflections
- [ ] **YIR-02**: Page aggregates data from `reflections` + `awareness_logs` + `progress` tables via Postgres RPC `get_year_in_review(user_id, year_key)`
- [ ] **YIR-03**: Aggregation results cached in new `year_reviews` table (`user_id`, `year_key`, `payload jsonb`, `generated_at`) with stale-after-24h refresh
- [ ] **YIR-04**: "Year" is anchored to **activation anniversary** (user-specific), with Hijri + Gregorian both displayed
- [ ] **YIR-05**: Numerals displayed in **Eastern Arabic (٠١٢٣)** for the page body; Western Arabic (0123) used in share card for broader readability. Decision locked 2026-04-18.
- [ ] **YIR-06**: Graceful degradation: users with <365 days see range-labeled aggregation ("من 2026-01-15 إلى 2026-11-30") instead of empty year page
- [ ] **YIR-07**: Share card generated by `next/og` `ImageResponse` at `/year-in-review/og/route.tsx` with `export const runtime = 'nodejs'`
- [ ] **YIR-08**: Type-enforced privacy: `YIRPublicStats` type (counts, averages, day numbers) vs `YIRPrivateContent` type (reflection text, emotion labels, guide messages). Share card consumes ONLY `YIRPublicStats`.
- [ ] **YIR-09**: Share card copy uses reflective tone ("سنتي مع القرآن"), never performative achievements or comparison
- [ ] **YIR-10**: Year-in-Review Ramadan moment (scarcity + annual push) **deferred to v1.3** per scope decision. Decision locked 2026-04-18.
- [ ] **YIR-11**: Charts hand-rolled as SVG `<polyline>` sparkline — no chart library installed
- [ ] **YIR-12**: Aggregation query is indexed — `reflections` and `awareness_logs` already have `user_id + created_at` indexes (verify, add if missing)

---

## Non-Functional Requirements (carried forward)

- [ ] **NFR-01**: Performance — LCP < 6s on 3G mobile (Lighthouse mobile)
- [ ] **NFR-02**: Accessibility — Lighthouse A11y ≥ 95 (existing score: 100/100)
- [ ] **NFR-03**: SEO — Lighthouse SEO = 100 (maintained)
- [ ] **NFR-04**: Privacy — zero tracking pixels on prayer/reflection pages (PROJECT.md principle #4)
- [ ] **NFR-05**: Cost — v1.2 feature work < 2000 SAR total (no paid SaaS, no new infrastructure)
- [ ] **NFR-06**: RTL — all new UI renders correctly right-to-left
- [ ] **NFR-07**: Arabic-first — all copy written in Arabic natively, never machine-translated
- [ ] **NFR-08**: No new runtime dependencies added (CLAUDE.md rule #6)
- [ ] **NFR-09**: Every schema migration is two-step (additive, then enforce) to avoid prod outages
- [ ] **NFR-10**: Pre-merge checks: `npx tsc --noEmit && npm run build` must pass (CLAUDE.md mandatory)

---

## Decisions Resolved (2026-04-18)

1. **Cycle 2 content strategy:** ✅ Same 28 verses, deeper practice (Headspace model). AI-generated cycles (v1.1 Phase 3) remain but apply only for cycles 4+.
2. **Referral reward timing:** ✅ Invitee gets free month immediately on redemption; referrer gets reward after invitee's day 14 retention.
3. **Badge scope:** ✅ 7 badges per cycle (6 milestones + 1 cycle-completion), cap at cycle 3 for v1.2.
4. **YIR scope:** ✅ Archive-only in v1.2 (Phase 11). Ramadan annual moment deferred to v1.3.
5. **YIR numerals:** ✅ Eastern Arabic (٠١٢٣) for page; Western (0123) for share card.
6. **Badge sharing:** ✅ Private by default — no share for badges. Share cards only for YIR + Referral.
7. **Referral storage:** ✅ New `referrals` table (not extending `activation_codes`).
8. **PostHog sacred-page exclusions:** ✅ Enforced by CI grep, not documentation-only.

---

## Deferred to v1.3+

- Reflection themes ML clustering (depth — original v1.2 backlog)
- Long-term memory beyond session scope (depth)
- Voice journaling (Munsit integration)
- Arabic screen reader quality audit
- YIR Ramadan annual moment (scarcity + push)
- Subscription pause feature (needs Salla/Tap capability spike)
- Family plan (multi-user)

---

## Out of Scope (Explicit Exclusions)

- ❌ Duolingo-style streak counter UI ("🔥 7 days")
- ❌ Gamification tiers (rare / epic / legendary badges)
- ❌ Badge progress bars ("3 of 6 unlocked — 50%!")
- ❌ Leaderboards of any kind
- ❌ "Lost your streak" guilt emails or copy
- ❌ Countdown timers / fake scarcity on renewal prompts
- ❌ Interstitial renewal modals blocking daily flow
- ❌ Auto-share (every share requires explicit tap)
- ❌ MLM-style multi-level referral rewards
- ❌ Modal interruptions inside `/day/*` flow
- ❌ PostHog session recording / heatmaps on any route
- ❌ WhatsApp community operational activation (v1.1 Phase 5 carry-over, independent track)

---

## Traceability

Phases will be assigned by `gsd-roadmapper`. Target mapping:

| Category | Likely Phase | REQ-IDs |
|---|---|---|
| ANALYTICS | Phase 6 | ANALYTICS-01 → 12 |
| RETURN | Phase 7 (merged w/ Day-28 badge) | RETURN-01 → 07 |
| BADGE | Phase 8 | BADGE-01 → 09 |
| RENEW | Phase 9 | RENEW-01 → 09 |
| REFER | Phase 10 | REFER-01 → 12 |
| YIR | Phase 11 | YIR-01 → 12 |
| NFR | All phases | NFR-01 → 10 (cross-cutting) |

**Total v1.2 REQs:** 71 functional + 10 non-functional = 81.
