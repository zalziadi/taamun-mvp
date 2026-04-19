# Phase 10: Referral Program — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert the "قلبي يتشرب معاني" advocacy into growth: each subscriber can generate a `FRIEND-*` invite code from `/account/referral`. Both invitee and referrer get a free month — but only after the invitee reaches day-14 of retention (abuse prevention). Copy reads as da'wah, not affiliate marketing.

Phase deliverables:
- NEW `referrals` table (distinct from `activation_codes` — separate billing vs reward concerns)
- `/account/referral` page — user generates/views/shares referral code
- `/api/referral/create` — POST, `requireUser()`, generates unique `FRIEND-XXXX` code
- `/api/activate` extension — on `FRIEND-*` redemption: invitee gets month immediately, create pending `referrals` row
- `/api/cron/credit-referrals` OR edit existing cron — nightly check for invitees crossing day-14, credit referrer, extend `profiles.expires_at` directly (NOT via minting `activation_codes`)
- Max 3 successful referrals per referrer per calendar year (abuse cap)
- Self-referrals forbidden (referrer_id !== invitee_id + same-device fingerprint flag)
- Refund/cancellation within 14 days voids pending reward
- WhatsApp deep-link share primary channel + IG story fallback + copy-link
- `referral_code_generated` + `referral_code_redeemed` events via Phase 6 emitEvent (prefix-only props — never full code)
- `next/og` share card for da'wah-framed invite (reflective tone, not performative)

</domain>

<decisions>
## Implementation Decisions (locked from REQUIREMENTS.md + research SUMMARY §R1)

### Storage
- **NEW `referrals` table** — NOT an extension of `activation_codes`. Schema:
    - `id uuid pk`
    - `code text unique not null` (FRIEND-XXXX)
    - `referrer_id uuid references auth.users(id)`
    - `invitee_id uuid references auth.users(id) null` (null until redeemed)
    - `status text` (pending_invitee · pending_day14 · rewarded · refunded · void)
    - `invitee_redeemed_at timestamptz`
    - `referrer_rewarded_at timestamptz`
    - `created_at timestamptz default now()`
    - UNIQUE (referrer_id, invitee_id) — prevents same pair twice
    - CHECK (referrer_id != invitee_id) — prevents self-referral at DB level

### Reward timing (locked in REQUIREMENTS decision #2)
- Invitee gets free month **immediately** on `FRIEND-*` redemption
- Referrer gets free month **after invitee reaches day-14** (retention-gated)
- Cron job (nightly) scans `referrals` where `status = pending_day14 AND invitee_redeemed_at < now - 14d`, checks invitee's progress has day-14 in `completed_days`, credits referrer

### Reward delivery
- NEVER mint a new `activation_codes` row for referrer reward
- Direct `UPDATE profiles SET expires_at = expires_at + interval '1 month' WHERE id = referrer_id`
- Record in `referrals.referrer_rewarded_at` for audit

### Abuse prevention
- Max 3 successful referrals per referrer per calendar year — enforced at `/api/referral/create` (already has redemption count) + cron credit step (skip if over cap)
- Self-referrals forbidden at DB level (CHECK constraint) + checkout time (reject if auth user == referrer from code lookup)
- Same-device fingerprint: log `{ip, user_agent}` hash on activation; flag pairs with identical fingerprint for manual review (don't auto-block — legitimate families share devices)
- Refund within 14d voids pending reward (set `status = refunded`)

### Copy (tone)
- "ادعُ للتمعّن" NOT "earn rewards" / "earn points"
- "صديقك يبدأ، وأنت تربح شهر تأمّل" (not "cash-back" or "commission")
- Status labels: `pending_invitee` = "بانتظار البدء" · `pending_day14` = "في الطريق" · `rewarded` = "تمّت الهدية"

### Sharing
- WhatsApp deep-link PRIMARY: `https://wa.me/?text={encoded}` (Saudi/Gulf primary channel)
- IG story-ready image fallback (via `next/og` share card)
- Copy-link button for manual paste
- NO auto-share (every share requires explicit tap)
- NO MLM (multi-level rewards banned)

### Analytics (Phase 6 contract)
- `referral_code_generated` event: `{ referral_code_prefix: "FRIEND" }` — NEVER the full code
- `referral_code_redeemed` event: same — prefix-only
- Server-side emission only

### Banned anti-patterns (SUMMARY §R4)
- MLM / multi-level rewards
- Leaderboard of top referrers
- "Earn cash" / affiliate marketing vocabulary
- Auto-share without explicit tap
- Referrer reward before day-14 gate (would invite refund abuse)
- Same-device self-referral without fingerprint flag

### Claude's Discretion
- Exact FRIEND code generation pattern (recommend: `FRIEND-` + 6 base32 chars — 1B combinations)
- Cron timing (recommend: daily 02:00 Asia/Riyadh alongside existing manage-subscriptions cron)
- Share card visual (minimal: verse quote + "دعوة من {name}")

</decisions>

<canonical_refs>
## Canonical References

### Milestone research
- `.planning/research/SUMMARY.md` — §R1 (referrals table decision), §R4 (anti-patterns), §"Referral Program" table-stakes
- `.planning/research/FEATURES.md` — §Referral Program (68% higher both-sided participation, da'wah framing)
- `.planning/research/PITFALLS.md` — #18 self-abuse, #19 async webhook pitfalls, #22 namespace collision, #23 refund abuse

### Phase 6-9 dependencies
- `src/lib/analytics/events.ts` — `referral_code_generated` + `referral_code_redeemed` TypedEvents
- `src/lib/analytics/server.ts` — `emitEvent()`
- `src/lib/entitlement.ts` — token helpers (reuse, don't duplicate)
- `src/app/api/activate/route.ts` — EXISTING; Phase 10 adds FRIEND-* branch
- `src/lib/subscriptionDurations.ts` — for `calcExpiresAt` to extend referrer expiry
- `src/app/api/cron/manage-subscriptions/route.ts` — EXISTING; may extend OR add new cron

### Code touchpoints
- `supabase/migrations/{TIMESTAMP}_v1_2_referrals.sql` (NEW) — table + RLS + CHECK
- `src/lib/referral/generate.ts` (NEW) — FRIEND-XXXX generator
- `src/lib/referral/credit.ts` (NEW) — cron credit logic
- `src/app/api/referral/create/route.ts` (NEW)
- `src/app/account/referral/page.tsx` (NEW)
- `src/app/account/referral/og/route.tsx` (NEW) — share card via next/og
- `src/app/api/activate/route.ts` (EDIT) — FRIEND-* redemption branch
- `src/app/api/cron/credit-referrals/route.ts` (NEW) OR edit manage-subscriptions
- `docs/analytics-event-catalog.md` — Phase 10 owns the 2 referral events

</canonical_refs>

<specifics>
## Specific Ideas

- "قلبي يتشرب معاني" day-9 customer is the reference — her organic advocacy validates that referral framing matters. Copy must feel like extending an invitation to a meaningful practice, not a commission scheme.
- Cron timing sweet spot: daily 02:00 Asia/Riyadh — after most users' day boundary crossed, before morning push notifications.
- Share card shows: anonymous verse of the day (no personal content) + "من صديق يدعوك للتمعّن" framing.
- LocalStorage store of referrer's active code so UI can show "your code: FRIEND-XXXXX" consistently across devices that query server.

</specifics>

<deferred>
## Deferred Ideas

- Referral leaderboards — permanently out (anti-gamification)
- Tiered rewards (more friends = bigger reward) — permanently out (MLM-adjacent)
- Cash-out option — permanently out
- Family-plan carve-out (fingerprint flag + family bypass) — v1.3 if data shows it matters
- Email-based referral reminders ("your friend signed up!") — defer

</deferred>

---

*Phase: 10-referral-program*
*Context gathered: 2026-04-19*
