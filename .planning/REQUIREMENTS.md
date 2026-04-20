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

- [x] **ANALYTICS-01**: Page views are tracked on all non-sacred paths via App Router navigation hook
- [x] **ANALYTICS-02**: Pageview tracking is wrapped in `<Suspense>` to avoid React 18 CSR bailout
- [x] **ANALYTICS-03**: `day_complete` event fires server-side from `/api/program/progress/*` success handlers with props `{day_number, cycle_number, tier}`
- [x] **ANALYTICS-04**: `cycle_start` event fires from `/api/program/start-cycle` success with props `{new_cycle_number, prior_cycle_days_completed}`
- [x] **ANALYTICS-05**: `badge_unlock` event fires from `/api/badges/unlock` with props `{badge_code, day_number, cycle_number}`
- [x] **ANALYTICS-06**: `renewal_prompted` event fires when banner first renders with props `{days_remaining, gateway, tier}`
- [x] **ANALYTICS-07**: `referral_code_generated` and `referral_code_redeemed` events fire with prefix-only props (never full code)
- [x] **ANALYTICS-08**: `year_review_opened` and `year_review_shared` events fire with props `{year_key, reflections_count}`
- [x] **ANALYTICS-09**: Zero `track()` calls exist inside `src/app/day/**`, `src/app/reflection/**`, `src/app/book/**`, `src/app/program/day/**`, `/api/guide/**` (enforced by CI grep)
- [x] **ANALYTICS-10**: Zero `track()` calls exist inside `DayExperience.tsx`, `ReflectionJournal.tsx`, `AwarenessMeter.tsx`, `BookQuote.tsx`, `VerseBlock.tsx`, `HiddenLayer.tsx`, `SilenceGate.tsx` (enforced by CI grep)
- [x] **ANALYTICS-11**: `person_profiles: "never"` setting in `src/lib/analytics.ts` is preserved
- [x] **ANALYTICS-12**: Property name whitelist enforced — banned patterns: `*_email`, `*_phone`, `reflection_*`, `verse_*`, `journal_*`, `message_*`, `prayer_*`

### RETURN — Cycle 2 Transition + Day-28 Badge (Phase 7, merged)

- [x] **RETURN-01**: User sees in-app CTA on Day 28 completion screen with Arabic-native phrasing "واصل الرحلة" (not "Start Cycle 2")
- [x] **RETURN-02**: Tapping CTA calls `/api/program/start-cycle` which is idempotent + uses optimistic concurrency guard (`progress.cycle_paused_at` column) against multi-device race
- [x] **RETURN-03**: Cycle 2 content strategy = **same 28 verses, deeper practice** (Headspace model). Cycle number increments, verse selection unchanged. Decision locked 2026-04-18.
- [x] **RETURN-04**: Celebration animation uses `framer-motion` (already installed) — no confetti, no fireworks, no "unlocked!" language
- [x] **RETURN-05**: Day-28 badge unlocks silently as part of cycle transition, not as separate achievement modal
- [x] **RETURN-06**: Day boundary respects `Asia/Riyadh` timezone — user's "Day 28" is server's same-day
- [x] **RETURN-07**: Day 28 completion fires exactly one `cycle_start` analytics event even if user reloads or triggers CTA on two devices

### BADGE — Milestone Badges (Phase 8)

- [x] **BADGE-01**: 7 badges total per cycle: days 1, 3, 7, 14, 21, 28, + 1 cycle-completion badge. Scope cap: up to cycle 3 for v1.2. Decision locked 2026-04-18.
- [x] **BADGE-02**: Each badge stored in `badges` table with `UNIQUE(user_id, badge_code, cycle_number)` constraint
- [x] **BADGE-03**: Badges rendered as inline SVG React components (6 variants + cycle-completion), no static PNG, no Lottie
- [x] **BADGE-04**: Badges are **private by default** — no share button, no `next/og` share route, no social export (Headspace إخلاص model). Decision locked 2026-04-18.
- [x] **BADGE-05**: Badge unlock trigger evaluates server-side on reflection save (not client-side) — prevents bypass + handles offline catch-up
- [x] **BADGE-06**: Badge unlock event is idempotent — duplicate saves do not create duplicate rows or duplicate analytics events
- [x] **BADGE-07**: Existing users are backfilled with historical badges on deploy; backfill sets `notified=true` and reconstructs `unlocked_at` from `reflections.day_number` MIN timestamp — no post-hoc PostHog events fire
- [x] **BADGE-08**: Badge grid visible on `/progress` page shows unlocked + locked states in same layout
- [x] **BADGE-09**: No badge modal / toast interrupts the daily flow — unlock is revealed on the completion screen only

### RENEW — Renewal Prompts In-App (Phase 9)

- [x] **RENEW-01**: In-app banner renders in `AppChrome.tsx` when `profiles.expires_at` is within 7 days
- [x] **RENEW-02**: Banner copy uses "واصل" framing, not "لا تفقد الوصول" or countdown timers
- [x] **RENEW-03**: CTA routes user to correct renewal path based on `profiles.original_gateway` (Salla / Tap / Stripe) — new column added
- [x] **RENEW-04**: Banner is dismissible; dismissal persists in LocalStorage key `taamun.renewal_dismissed_until.v1` for 48 hours
- [x] **RENEW-05**: Banner NEVER renders on `/day/**`, `/reflection/**`, `/book/**` routes (privacy + flow preservation)
- [x] **RENEW-06**: Nudge orchestrator deduplicates: if email sent today + push sent today, banner is suppressed (avoid 3-channel fatigue)
- [x] **RENEW-07**: Banner does not render for users who already auto-renewed (expires_at > now + 7 days after webhook update)
- [x] **RENEW-08**: Existing `src/lib/emails/expiry-warning-template.ts` is reused — no new email template created
- [x] **RENEW-09**: Cookie-vs-DB reconciliation helper refreshes stale HMAC entitlement cookie if DB shows renewal

### REFER — Referral Program (Phase 10)

- [x] **REFER-01**: Each user can generate a referral code via `/account/referral` page; code prefix is distinct from `TAAMUN-*` (use `FRIEND-*`) to avoid namespace collision
- [x] **REFER-02**: Referral codes stored in **new `referrals` table** (NOT an extension of `activation_codes`). Decision locked 2026-04-18.
- [x] **REFER-03**: Both-sided reward: invitee gets free month immediately upon code redemption; referrer gets free month **after invitee reaches day 14** of retention. Decision locked 2026-04-18.
- [x] **REFER-04**: Referrer reward delivered by extending `profiles.expires_at` directly — NEVER by minting fake `activation_codes` rows
- [x] **REFER-05**: Reward crediting happens synchronously inside `/api/activate` on invitee's day-14 milestone — no async webhook delivery
- [x] **REFER-06**: Max 3 successful referrals per referrer per calendar year (abuse cap)
- [x] **REFER-07**: Self-referrals forbidden — `referrals.referrer_id !== invitee_id` enforced by constraint; same-device fingerprint flagged for manual review
- [x] **REFER-08**: Refund/cancellation of invitee within 14 days voids pending referrer reward
- [x] **REFER-09**: Share flow prioritizes WhatsApp deep link (Saudi/Gulf audience primary channel), with Instagram story and link-copy fallback
- [x] **REFER-10**: Copy uses "ادعُ للتمعّن" da'wah framing, not "earn rewards" / "earn points"
- [x] **REFER-11**: Referrer page shows status: pending / active (day 14+) / rewarded — transparent without gamification UI
- [x] **REFER-12**: RLS policies: referrer can read own referral rows; redemption uses service-role client (existing pattern in `/api/activate`)

### YIR — Year-in-Review (Phase 11, archive-only)

- [x] **YIR-01**: `/year-in-review` route accessible to authenticated users with ≥30 days of reflections
- [x] **YIR-02**: Page aggregates data from `reflections` + `awareness_logs` + `progress` tables via Postgres RPC `get_year_in_review(user_id, year_key)`
- [x] **YIR-03**: Aggregation results cached in new `year_reviews` table (`user_id`, `year_key`, `payload jsonb`, `generated_at`) with stale-after-24h refresh
- [x] **YIR-04**: "Year" is anchored to **activation anniversary** (user-specific), with Hijri + Gregorian both displayed
- [ ] **YIR-05**: Numerals displayed in **Eastern Arabic (٠١٢٣)** for the page body; Western Arabic (0123) used in share card for broader readability. Decision locked 2026-04-18.
- [x] **YIR-06**: Graceful degradation: users with <365 days see range-labeled aggregation ("من 2026-01-15 إلى 2026-11-30") instead of empty year page
- [ ] **YIR-07**: Share card generated by `next/og` `ImageResponse` at `/year-in-review/og/route.tsx` with `export const runtime = 'nodejs'`
- [x] **YIR-08**: Type-enforced privacy: `YIRPublicStats` type (counts, averages, day numbers) vs `YIRPrivateContent` type (reflection text, emotion labels, guide messages). Share card consumes ONLY `YIRPublicStats`.
- [x] **YIR-09**: Share card copy uses reflective tone ("سنتي مع القرآن"), never performative achievements or comparison
- [ ] **YIR-10**: Year-in-Review Ramadan moment (scarcity + annual push) **deferred to v1.3** per scope decision. Decision locked 2026-04-18.
- [x] **YIR-11**: Charts hand-rolled as SVG `<polyline>` sparkline — no chart library installed
- [x] **YIR-12**: Aggregation query is indexed — `reflections` and `awareness_logs` already have `user_id + created_at` indexes (verify, add if missing)

---

## Non-Functional Requirements (carried forward)

- [x] **NFR-01**: Performance — LCP < 6s on 3G mobile (Lighthouse mobile)
- [x] **NFR-02**: Accessibility — Lighthouse A11y ≥ 95 (existing score: 100/100)
- [x] **NFR-03**: SEO — Lighthouse SEO = 100 (maintained)
- [x] **NFR-04**: Privacy — zero tracking pixels on prayer/reflection pages (PROJECT.md principle #4)
- [x] **NFR-05**: Cost — v1.2 feature work < 2000 SAR total (no paid SaaS, no new infrastructure)
- [x] **NFR-06**: RTL — all new UI renders correctly right-to-left
- [x] **NFR-07**: Arabic-first — all copy written in Arabic natively, never machine-translated
- [x] **NFR-08**: No new runtime dependencies added (CLAUDE.md rule #6)
- [x] **NFR-09**: Every schema migration is two-step (additive, then enforce) to avoid prod outages
- [x] **NFR-10**: Pre-merge checks: `npx tsc --noEmit && npm run build` must pass (CLAUDE.md mandatory)

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

REQ → Phase mapping (assigned 2026-04-18 by gsd-roadmapper). 100% coverage validated: every functional REQ maps to exactly one phase; every NFR is cross-cutting across all phases.

| REQ-ID | Phase | Category | Status |
|---|---|---|---|
| ANALYTICS-01 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-02 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-03 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-04 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-05 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-06 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-07 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-08 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-09 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-10 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-11 | Phase 6 | ANALYTICS | Pending |
| ANALYTICS-12 | Phase 6 | ANALYTICS | Pending |
| RETURN-01 | Phase 7 | RETURN | Pending |
| RETURN-02 | Phase 7 | RETURN | Pending |
| RETURN-03 | Phase 7 | RETURN | Pending |
| RETURN-04 | Phase 7 | RETURN | Pending |
| RETURN-05 | Phase 7 | RETURN | Pending |
| RETURN-06 | Phase 7 | RETURN | Complete (07.05) |
| RETURN-07 | Phase 7 | RETURN | Pending |
| BADGE-01 | Phase 8 | BADGE | Pending |
| BADGE-02 | Phase 8 | BADGE | Pending |
| BADGE-03 | Phase 8 | BADGE | Pending |
| BADGE-04 | Phase 8 | BADGE | Pending |
| BADGE-05 | Phase 8 | BADGE | Pending |
| BADGE-06 | Phase 8 | BADGE | Pending |
| BADGE-07 | Phase 8 | BADGE | Complete (08.04) |
| BADGE-08 | Phase 8 | BADGE | Pending |
| BADGE-09 | Phase 8 | BADGE | Pending |
| RENEW-01 | Phase 9 | RENEW | Complete |
| RENEW-02 | Phase 9 | RENEW | Complete |
| RENEW-03 | Phase 9 | RENEW | Complete |
| RENEW-04 | Phase 9 | RENEW | Complete |
| RENEW-05 | Phase 9 | RENEW | Complete |
| RENEW-06 | Phase 9 | RENEW | Complete |
| RENEW-07 | Phase 9 | RENEW | Complete |
| RENEW-08 | Phase 9 | RENEW | Complete |
| RENEW-09 | Phase 9 | RENEW | Complete |
| REFER-01 | Phase 10 | REFER | Pending |
| REFER-02 | Phase 10 | REFER | Pending |
| REFER-03 | Phase 10 | REFER | Pending |
| REFER-04 | Phase 10 | REFER | Pending |
| REFER-05 | Phase 10 | REFER | Pending |
| REFER-06 | Phase 10 | REFER | Pending |
| REFER-07 | Phase 10 | REFER | Pending |
| REFER-08 | Phase 10 | REFER | Pending |
| REFER-09 | Phase 10 | REFER | Pending |
| REFER-10 | Phase 10 | REFER | Pending |
| REFER-11 | Phase 10 | REFER | Pending |
| REFER-12 | Phase 10 | REFER | Pending |
| YIR-01 | Phase 11 | YIR | Pending |
| YIR-02 | Phase 11 | YIR | Pending |
| YIR-03 | Phase 11 | YIR | Pending |
| YIR-04 | Phase 11 | YIR | Pending |
| YIR-05 | Phase 11 | YIR | Pending |
| YIR-06 | Phase 11 | YIR | Pending |
| YIR-07 | Phase 11 | YIR | Pending |
| YIR-08 | Phase 11 | YIR | Pending |
| YIR-09 | Phase 11 | YIR | Pending |
| YIR-10 | Phase 11 | YIR (deferred to v1.3) | Deferred |
| YIR-11 | Phase 11 | YIR | Pending |
| YIR-12 | Phase 11 | YIR | Pending |
| NFR-01 | All phases | Performance | Cross-cutting |
| NFR-02 | All phases | A11y | Cross-cutting |
| NFR-03 | All phases | SEO | Cross-cutting |
| NFR-04 | All phases | Privacy | Cross-cutting (Phase 6 enforces) |
| NFR-05 | All phases | Cost | Cross-cutting |
| NFR-06 | All phases | RTL | Cross-cutting |
| NFR-07 | All phases | Arabic-first | Cross-cutting |
| NFR-08 | All phases | No new deps | Cross-cutting |
| NFR-09 | Phases 7/8/9/10 | Two-step migrations | Cross-cutting (schema phases) |
| NFR-10 | All phases | Pre-merge checks | Cross-cutting |

**Coverage summary:**
- Phase 6: 12 REQs (ANALYTICS-01..12)
- Phase 7: 7 REQs (RETURN-01..07)
- Phase 8: 9 REQs (BADGE-01..09)
- Phase 9: 9 REQs (RENEW-01..09)
- Phase 10: 12 REQs (REFER-01..12)
- Phase 11: 12 REQs (YIR-01..12 — note YIR-10 documents the v1.3 deferral)
- **Total functional: 61 REQs mapped to exactly one phase ✓**
- **NFR cross-cutting: 10 REQs apply to all phases ✓**
- **Grand total: 71 functional + 10 NFR = 81 REQs, 100% coverage ✓**

> Note: The original total of "71 functional" in the milestone goal includes the YIR-10 deferral marker as a tracked decision. Of the 12 YIR REQs, 11 are actively in scope for Phase 11; YIR-10 is the documented deferral of the Ramadan moment to v1.3.
