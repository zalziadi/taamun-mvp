# Pitfalls Research — v1.2 Retention Loop

**Domain:** spiritual-wellness · Arabic-first Quranic contemplation · subscription retention
**Researched:** 2026-04-18
**Confidence:** HIGH (grounded in existing codebase: `src/lib/entitlement.ts`, `src/app/api/program/*`, `supabase/migrations/*`, `src/lib/analytics.ts`)

Scope: common mistakes when ADDING retention features (Cycle 2 UX, Milestone Badges, Year-in-Review, In-App Renewal Prompts, Referral Program, PostHog Instrumentation) to Taamun's existing stack. Every pitfall below is tied to something that is actually in the repo today.

---

## Critical Pitfalls

### Pitfall 1: Double-archive of Cycle 1 when `start-cycle` is triggered from two devices

**What goes wrong:**
User completes Day 28 with their phone open on two devices (e.g., phone + laptop, both logged in). Both clients POST `/api/program/start-cycle` within milliseconds. Looking at the existing handler (`src/app/api/program/start-cycle/route.ts` lines 28–59), the flow is read-then-write with no transaction and no idempotency key:

1. Both requests read `progress` with `current_cycle=1`, `completed_cycles=[]`
2. Both compute `newArchive = [1]`
3. Both upsert `current_cycle=2, completed_cycles=[1], completed_days=[]`

This is benign today because the second write is identical. But the moment we add `badge_unlocked_cycles` or `cycle_start_count` columns (likely for Year-in-Review analytics), the naive read-modify-write will double-count or clobber state. Worse: if Device A starts cycle 2 while Device B is mid-POST on `/api/program/progress` marking Day 28 complete, we get a race where the `completed_days=[1..28]` write lands AFTER the cycle reset and ghost-completes Day 1 of cycle 2.

**Why it happens:**
`upsert` with `onConflict: user_id` is last-write-wins, not a CAS (compare-and-swap). There's no `WHERE current_cycle = :expected` guard.

**How to avoid:**
- Add an optimistic-concurrency guard: include `.eq("current_cycle", targetCycle - 1)` on the update path and return 409 if rowcount is 0.
- Introduce `cycle_transitions` table with unique constraint `(user_id, from_cycle, to_cycle)` — idempotency by design.
- Client-side: disable the "Start Cycle 2" CTA after first click, show spinner until round-trip completes.
- Server-side: wrap the read + archive + reset in a Postgres function (`rpc('start_next_cycle', {p_user_id})`) so it's atomic.

**Warning signs:**
- Users reporting "my cycle 2 already has days completed when I opened it"
- `completed_cycles` array with duplicate values (`[1, 1]`)
- Day 28 reflection written but `current_day` says 1

**Phase to address:** Phase 6 (Cycle 2 Transition UX) — MUST be handled in the first phase because every subsequent feature (badges, year-in-review, renewal) reads cycle state.

---

### Pitfall 2: Dead-end Day 28 when `start-cycle` fails silently

**What goes wrong:**
Existing `start-cycle` handler has a fallback path (lines 62–78) that retries with a `minimalPayload` stripped of `current_cycle` and `completed_cycles` if the first upsert fails. This was added as a graceful migration path but it creates a silent footgun: if the real error is an RLS violation or FK constraint (not a missing column), the fallback succeeds at resetting `completed_days=[]` but leaves `current_cycle=1`. The user now sees "Day 1" again with no indication they're re-entering cycle 1 instead of starting cycle 2. They lose their sense of progression — the exact emotion v1.2 is supposed to solve.

**Why it happens:**
The fallback catches all errors indiscriminately. No discrimination between "schema not migrated yet" (safe to fall back) and "RLS denied" (should fail loudly).

**How to avoid:**
- Inspect the error code. Only fall back when `error.code === '42703'` (undefined column). For any other error, return 500 and surface it in the client.
- After merging the v1.2 migration, delete the fallback entirely — it's technical debt.
- Add a client-side invariant: after `start-cycle` resolves `ok: true`, refetch `/api/program/progress` and verify `current_cycle === targetCycle`. If not, show a recovery modal with "تواصل معنا" and log to Sentry/server.

**Warning signs:**
- `start-cycle` returns 200 but subsequent `/progress` GET shows `current_cycle: 1`
- User support tickets with screenshots of Day 1 content after completing 28 days

**Phase to address:** Phase 6 (Cycle 2 Transition UX).

---

### Pitfall 3: Timezone drift — Day 28 "completed" but server thinks it's Day 27

**What goes wrong:**
`src/app/api/program/progress/route.ts` (line 180) uses `computeCalendarDay(startDate)`. `startDate` is stored as ISO from the server (line 76 of activate route: `activated_at: now.toISOString()`). A user in Riyadh (UTC+3) who subscribes at 11:00pm local time gets `activated_at = 20:00 UTC`. The next day's "Day 2" eligibility on their phone at 6am local (03:00 UTC, only 7 hours later) will compute to Day 1 if `computeCalendarDay` uses naive UTC-date math. Saudi users specifically browse at night (Instagram engagement peaks 9pm–1am).

For v1.2 this becomes a hard blocker: the Day 28 → Cycle 2 transition trigger fires on "completed all 28 days in the array," not on "calendar day ≥ 28." But the UI CTA ("ابدأ الحلقة الثانية") only appears when `current_day === 28`. A user who binge-does days 27 and 28 after midnight local time may see `current_day: 27` according to calendar math even though they completed Day 28's reflection.

**Why it happens:**
Postgres `timestamptz` is fine, but the JS `Date` math used in `computeCalendarDay` defaults to UTC. No explicit timezone handling for KSA (`Asia/Riyadh`).

**How to avoid:**
- Hardcode `Asia/Riyadh` as the reference timezone for day boundaries (already implied by the audience). Create `src/lib/userTimezone.ts` that returns `'Asia/Riyadh'` and use it in `computeCalendarDay` via `Intl.DateTimeFormat`.
- The Cycle 2 CTA should fire on **either** `completed_days.includes(28)` OR calendarDay >= 28 — whichever happens first. Don't AND them.
- Write a test: user activated 2026-03-15T20:00:00Z, current time 2026-03-16T03:00:00Z → should return calendarDay = 1, NOT 2 (only ~7 hours passed in Riyadh local).

**Warning signs:**
- Users reporting "I finished Day 28 but the button to continue didn't appear"
- Streak counter off-by-one around 3am KSA time (already partially handled by the 3am grace period noted in PROJECT.md)

**Phase to address:** Phase 6 (Cycle 2 Transition UX) + Phase 11 (PostHog) — both need consistent day arithmetic.

---

### Pitfall 4: Retroactive badge awards flood existing users on deploy

**What goes wrong:**
v1.0 already has 1 real customer at Day 9 and an unknown number of early users. When Milestone Badges (Phase 7) ship, existing users who already passed days 1, 3, 7 need the badges retroactively — otherwise a Day 9 user sees zero badges on a feature supposedly about celebrating progress. The naive approach is a migration `INSERT INTO user_badges SELECT ... FROM progress WHERE completed_days @> ARRAY[1,3,7]`. But then on their next visit the client-side badge-unlock animation fires for all three at once, or triggers 3 push notifications, or emits 3 `badge_unlock` PostHog events dated today (breaking cohort analysis).

**Why it happens:**
Backfill migrations conflate "award" with "notify" with "celebrate." These are three separate concerns.

**How to avoid:**
- Backfill sets `awarded_at = completion_date_of_that_day` (reconstructed from `reflections.created_at` where possible) AND `notified = true` so no celebration fires.
- The badge-unlock UI reads `WHERE awarded_at > user.last_seen_at AND notified = false` — the retroactive set is already marked notified.
- Backfill migration runs in a single transaction with `INSERT ... ON CONFLICT DO NOTHING` so it's idempotent if re-run.
- PostHog events for badges are client-driven at unlock time, not from the backfill; backfilled badges never emit `badge_unlock` events.

**Warning signs:**
- Single user seeing 3+ badge-unlock animations on first load after deploy
- PostHog shows a spike of `badge_unlock` events clustered on deploy day
- Day-7 cohort retention metrics suddenly look amazing (because retroactive badges credited)

**Phase to address:** Phase 7 (Milestone Badges).

---

### Pitfall 5: Badge awarded twice (idempotency)

**What goes wrong:**
User completes Day 7 via `POST /api/program/progress`. Handler awards the Day-7 badge. User refreshes the page, client re-POSTs (React double-submit, network retry, or `useEffect` without cleanup). Second call sees `completed_days` already contains 7, no-ops the progress update, but the badge-award code path runs again → two Day-7 badges in `user_badges`, two `badge_unlock` PostHog events, two push notifications.

**Why it happens:**
Badge awarding is a side-effect tacked on to the progress POST instead of being driven by a unique constraint.

**How to avoid:**
- Schema: `user_badges(user_id, badge_code)` with `UNIQUE(user_id, badge_code)` primary key. `INSERT ... ON CONFLICT DO NOTHING`.
- Badge-award code checks `rowCount`. If 0, no notification/event fires. If 1, fire exactly once.
- Never read-then-write for badge logic. Always write-and-check.

**Warning signs:**
- `user_badges` table has duplicate `(user_id, badge_code)` rows
- `badge_unlock` PostHog events with same `$timestamp` and same `distinct_id`
- User reports "I got the badge notification twice"

**Phase to address:** Phase 7 (Milestone Badges).

---

### Pitfall 6: Badge tone gamification — Duolingo-style streaks break the contemplative mood

**What goes wrong:**
Default "badge system" imports visual patterns from fitness/language apps: bursting confetti, numeric XP, streak flames, leaderboards, "Don't break your streak!" loss-aversion copy. These are psychologically incompatible with a product whose core emotion is "قلبي يتشرب معاني" (my heart absorbs meanings). A user in a moment of reflection does NOT want a cartoon flame to jump onto their screen.

This is not a minor stylistic concern — it's a product-identity violation. The entire north star of v1.0 was a minimal flat UI explicitly requested by the user. Gamification drift would undo that work.

**Why it happens:**
- Junior dev reaches for the closest design-system reference (Duolingo, Strava, Peloton)
- Figma templates labeled "achievement badge" are overwhelmingly gamified
- Metrics (DAU, streak %) reward gamification in A/B tests — short-term wins at the cost of brand

**How to avoid:**
- Explicit anti-patterns list in the Phase 7 plan: no flames, no numeric XP, no leaderboards, no "streak broken" warnings, no countdown timers, no percentage-complete bars with red states, no confetti.
- Allowed motifs: calligraphic strokes, Quranic ornaments (already exist in `/public`), muted color palette matching current minimal UI, arabic letter-form glyphs. Static SVG, no particle effects.
- Copy tested against a "would this feel at peace in a mosque at fajr?" rubric. Examples:
  - BAD: "مبروك! أكملت 7 أيام 🔥" → gamified, emoji-led
  - GOOD: "سبعة أيام. شيء ما يتبدّل." → contemplative, understated
- Award happens silently if user is inside a reflection input (detect via IntersectionObserver on the reflection textarea); defer reveal to the Day-complete screen.

**Warning signs:**
- Any PR that imports confetti/animation libs
- Copy that uses ❗ 🔥 ⚡ 🏆 emoji in badge text
- Increased DAU with decreased reflection word-count (gamification driving shallow engagement)

**Phase to address:** Phase 7 (Milestone Badges). Product-identity guardrail lives in the phase plan's "Out of Scope" section.

---

### Pitfall 7: Badge unlock modal interrupts the daily flow

**What goes wrong:**
The DayExperience pipeline (per CLAUDE.md) is:
`SilenceGate → VerseBlock → HiddenLayer → BookQuote → ReflectionJournal → AwarenessMeter → ShareCard → ProgressionBadge`

If Phase 7 shoves a badge-unlock MODAL anywhere in this chain (e.g., immediately after ReflectionJournal auto-save fires), it interrupts the user mid-reflection with a dismiss-me-to-continue dialog. This is the opposite of the ritual. The badge reveal belongs at the *end* of the flow (after ShareCard, where `ProgressionBadge` already lives per CLAUDE.md), or better yet on the *next* visit to `/program`.

**Why it happens:**
Devs instrument at the "event source" (completion POST response), not at the "moment of celebration" (next natural pause).

**How to avoid:**
- Badge-unlock UI is a component mounted on `/program`, not inside `/day`.
- `/day` never shows a modal. Badges reveal via `<ProgressionBadge />` at the documented bottom-of-flow position.
- Flag `pending_badge_reveal` on the profile row; `/program` checks it on mount, reveals, clears flag.

**Warning signs:**
- Any Phase 7 PR that adds a `<Dialog>` or `<Modal>` inside `src/app/day/*` or `src/components/DayExperience.tsx`
- Users skipping reflections (word count drop) coinciding with Phase 7 ship

**Phase to address:** Phase 7 (Milestone Badges).

---

### Pitfall 8: Badge SVG / copy breaks in RTL

**What goes wrong:**
Badge graphics get designed LTR (left-to-right progress bar, arrow-pointing-right accents, number "7" displayed before the Arabic word). On RTL layout, CSS `transform: scaleX(-1)` might mirror the SVG but would also mirror the Arabic glyphs inside it, making "سبعة" read backwards. Or the designer places the badge number in `text-align: left` — works in dev (where they're reading English), breaks in prod for Arabic users.

Additionally: Satori (used for ShareCard and likely Year-in-Review OG images) has well-known issues with Arabic glyph shaping when the font isn't correctly loaded — letters appear disconnected (each glyph in isolated form) instead of properly joined.

**Why it happens:**
- Tailwind `ltr:` and `rtl:` variants are forgotten
- SVGs authored in Figma with LTR assumptions
- Satori defaults don't ship an Arabic font; requires explicit `fonts: [{ name, data, weight }]`

**How to avoid:**
- Badge SVGs contain NO Arabic text inside the graphic. Text is rendered via HTML `<span>` with `dir="rtl"` alongside the SVG, so font-rendering is the browser's responsibility.
- For Satori share-cards: bundle an Arabic font (e.g., the one already in `/public/fonts/` — verify first) and pass it explicitly. Test with letters that require shaping: ش ع ن ت (connected forms differ by position).
- Visual regression test: render each badge at 3 viewport widths with `lang="ar" dir="rtl"` and snapshot.
- Grep guard in CI: no hardcoded `left-*` or `right-*` Tailwind classes in badge components; must use `start-*` / `end-*`.

**Warning signs:**
- Shared badge card on WhatsApp shows letters أ ل ي instead of الي (disconnected)
- Badge mirrored on iOS Safari but not Chrome
- PostHog `share_card_opened` events but low `share_card_shared` — users abandon after seeing broken glyphs

**Phase to address:** Phase 7 (Milestone Badges) + Phase 8 (Year-in-Review, for Satori OG images).

---

### Pitfall 9: Year-in-Review slow first render (365 reflections aggregation)

**What goes wrong:**
Phase 8 Year-in-Review needs to aggregate: 365 reflections (text), 365+ awareness_logs, completed cycles, badges unlocked, streaks. Naive approach: SELECT everything, compute in JS, render server-side.

For an active user this is ~1–5MB of text data, SELECT latency over the internet from Vercel to Supabase (probably same region, but still), and React render of a 365-item timeline. LCP easily goes past the 6s/3G budget (from ROADMAP principle 2). On 3G mobile this is a 15-second page.

**Why it happens:**
"Aggregation on read" is the default in most tutorials. Nobody pre-aggregates until it hurts.

**How to avoid:**
- Materialized view `year_in_review_summary` per user, refreshed by a cron (already have cron infrastructure per PROJECT.md) on the user's annual anniversary, and invalidated on reflection insert.
- Cheaper alternative: a `year_in_review_snapshots` table with one row per (user_id, year_span). Computed once (via `/api/cron/compute-yir` or on first access), cached indefinitely. The "year" is immutable once the year has passed, so caching is free.
- Page renders skeleton + streaming: summary card first, timeline lazy-loaded on scroll.
- Hard limit: if a user has <30 days of data, don't show Year-in-Review at all — show the Cycle summary instead.

**Warning signs:**
- LCP regression on `/year-in-review` exceeds 6s
- Supabase egress bill spikes after Phase 8 ship
- PostHog `$pageleave` before `year_in_review_viewed` event (users bouncing during load)

**Phase to address:** Phase 8 (Year-in-Review).

---

### Pitfall 10: Year-in-Review privacy bleed via shared OG image

**What goes wrong:**
User taps "شارك مراجعتك" on Year-in-Review. Satori renders an OG image containing snippets from their reflections — sacred, private text they wrote thinking no one would read it. The share mechanic publishes this on WhatsApp/Instagram with the raw reflection text embedded. User's family reads it on WhatsApp family group. User deletes account in outrage.

This is a catastrophic privacy breach, AND a violation of ROADMAP principle 4 ("no tracking pixels on prayer/reflection pages") — the same spirit applies to reflection *content* leaking outbound.

**Why it happens:**
Share features default to "show the data" for richness. The distinction "aggregate stats = shareable; content = private" isn't enforced by the type system.

**How to avoid:**
- Strictly separate two types in `src/types/yearInReview.ts`:
  - `type YIRPublicStats` — count of days, count of reflections, top 3 themes (AI-generated abstract labels, not verbatim), awareness average
  - `type YIRPrivateContent` — reflection text, notes, journal entries
- Satori share-card consumes ONLY `YIRPublicStats`. Typescript enforces at call site.
- "Share" button copy explicitly states: "سيُشارك ملخص رحلتك فقط — تأمّلاتك تبقى خاصة."
- Pre-render preview shown to user before upload to clipboard/WhatsApp. User must confirm.
- Audit test: `grep -r "reflection\|note\|journal" src/components/yir/ShareCard.tsx` → must be empty.

**Warning signs:**
- Any component that receives `reflections: string[]` as a prop AND is used in a share flow
- Any API endpoint that returns reflection text when called without auth (pre-signed share URLs are a trap here)
- PR review finds reflection snippets in share-card preview

**Phase to address:** Phase 8 (Year-in-Review).

---

### Pitfall 11: "Year" ambiguity — Gregorian vs Hijri vs activation anniversary

**What goes wrong:**
`src/lib/hijri.ts` already exists in the codebase. A user who activated on 2026-03-01 (Ramadan) has two candidate "year" boundaries: Gregorian (ends 2027-03-01) or Hijri (which has 354/355 days, so shifts ~11 days earlier each solar year). Plus "calendar year" (Jan 1 to Dec 31) and "activation year" (personal anniversary).

Ship one and you'll disappoint users expecting another. Ship both and users get confused. Year-in-Review trigger on Dec 31 is culturally wrong for a product whose audience celebrates Ramadan and Islamic new year, not Jan 1. Trigger on Hijri new year is technically correct but the AI-generated summary might include reflections from two different Ramadans (since Hijri and Gregorian drift).

**Why it happens:**
No explicit decision → devs default to Gregorian because `new Date()` is easy.

**How to avoid:**
- Explicit product decision documented in Phase 8 plan: **activation anniversary** is the year boundary. Simplest, avoids religious-calendar debate, fair to all users regardless of when they joined.
- Secondary surface: "مراجعتك الرمضانية" as a separate product, triggered on Ramadan end (already have `RAMADAN_ENDS_AT_ISO` in `appConfig.ts`). Different feature, different copy, different scope.
- Never say "2026 in review" — say "سنتك الأولى مع تمعّن" (your first year with Taamun). Anchors to user, not calendar.

**Warning signs:**
- PR that hardcodes `.getFullYear()` or `new Date(year, 0, 1)`
- Copy that references a specific year number
- Users asking "where's my Hijri year review" in support

**Phase to address:** Phase 8 (Year-in-Review).

---

### Pitfall 12: Year-in-Review empty state (user only did 40 days)

**What goes wrong:**
Most users will not complete 365 days. A user who did 40 days, paused, returned for Ramadan, did 28 more, and is now at day 65 total, hits their "anniversary" and sees a Year-in-Review page designed for 365. The page either shows 300 empty slots (demoralizing, "you failed") or silently trims (confusing, "where's the data").

**Why it happens:**
Year-in-Review designed for the happy path only.

**How to avoid:**
- Three variants of the page, selected by data density:
  - `<30 active days`: don't show Year-in-Review. Show "رحلتك معنا حتى الآن" — a progress-not-retrospective page.
  - `30–120 active days`: "نصف سنة مع تمعّن" — condensed version.
  - `>120 active days`: full Year-in-Review.
- Never show zero/placeholder states. If a metric would be zero, omit the card entirely.
- Copy for re-activated users acknowledges the gap: "عدتَ. وهذا يهمّ." — don't pretend the gap didn't exist.

**Warning signs:**
- Support tickets: "Year-in-Review is mostly empty"
- PostHog `$pageleave` on YIR within 5s (users bouncing from empty page)

**Phase to address:** Phase 8 (Year-in-Review).

---

### Pitfall 13: Renewal prompt fatigue (email + push + in-app = 3× nudge)

**What goes wrong:**
v1.1 already shipped `expiry-warning-template.ts` (email) and web push. v1.2 adds in-app banner. Without coordination, a user 7 days from expiry gets: email Monday 9am, push Monday 2pm, in-app banner every session. By Wednesday they've seen renewal messaging 12 times. They mark as spam, disable push, uninstall.

**Why it happens:**
Each channel owns its own trigger logic. No central "nudge coordinator."

**How to avoid:**
- Single `renewal_nudges` table with `(user_id, channel, sent_at, response)` rows.
- Central `src/lib/renewalNudgeOrchestrator.ts` decides — given the history — whether to send, suppress, or escalate.
- Rule: maximum 1 nudge per 48 hours across all channels combined. In-app banner does NOT fire if email was sent in last 48h.
- Banner dismissal is persistent (`localStorage` + server copy in `profiles.renewal_banner_dismissed_at`). Re-shown 3 days later, max 3 total dismisses before going silent.

**Warning signs:**
- Push subscription count dropping week-over-week post-Phase 9
- Email unsubscribe rate spike
- PostHog `renewal_prompt_dismissed` vastly outnumbers `renewal_clicked`

**Phase to address:** Phase 9 (In-App Renewal Prompts).

---

### Pitfall 14: Renewal prompt fires for already-renewed users

**What goes wrong:**
User renews via Salla. Salla webhook updates `customer_subscriptions.status` but the user's entitlement cookie is still the old one (since `makeEntitlementToken` is only called at activation, per `src/app/api/activate/route.ts` line 94). Renewal logic reads the cookie, sees old `expires_at`, thinks user is expiring in 7 days, fires the prompt. User sees "اشتراكك ينتهي" 3 days after they just paid. Worst trust-destroying moment in a subscription lifecycle.

**Why it happens:**
Two sources of truth: cookie (client-visible, HMAC-signed, cached) and DB (`profiles.expires_at`, source-of-truth). Renewal logic can read from either.

**How to avoid:**
- Renewal prompt computation ALWAYS reads from DB, never from cookie.
- On successful webhook (Salla/Stripe/Tap), force-reissue the entitlement cookie next time the user hits any authenticated route (middleware or in `requireUser`). A small piece of middleware that detects cookie `exp != db.expires_at` and refreshes.
- Renewal prompt query must join on `customer_subscriptions` to confirm status is still 'active_expiring', not 'active_renewed'.
- Grace window: even if DB says expiring in 7 days, suppress the prompt if `renewed_at > now - 48h` (covers webhook latency).

**Warning signs:**
- User support: "I just paid, why am I getting renewal reminders"
- `renewal_prompt_shown` events for users with recent `subscription_renewed` events in PostHog

**Phase to address:** Phase 9 (In-App Renewal Prompts).

---

### Pitfall 15: Renewal prompt dark patterns / fake scarcity

**What goes wrong:**
Copy like "فقط 3 مقاعد متبقية!" (only 3 seats left) or "ينتهي العرض خلال ساعة!" (offer ends in 1 hour) are dark patterns. For a spiritual product they're fatally off-brand. Gulf audiences are also culturally alert to manipulative sales tactics in religious contexts — the backlash on Twitter/X would be severe, and you can't un-tweet "تمعّن يمارس ضغط نفسي للبيع."

**Why it happens:**
Generic conversion copywriting guides all recommend scarcity. They were not written for contemplative products.

**How to avoid:**
- Anti-patterns banned in Phase 9 plan: no countdown timers on renewal prompts, no "only N left" messaging, no strikethrough pricing suggesting one-time discount when it's standard.
- Honesty-first copy. Example:
  - BAD: "اشترك الآن قبل انتهاء الخصم! ⏰"
  - GOOD: "اشتراكك ينتهي في 7 أيام. إذا كانت الرحلة تنفعك، يمكنك المواصلة." — states fact, defers to user.
- No guilt copy ("لا تترك رحلتك"). The user knows their relationship with the product. Respect that.
- If sale/discount IS active, state the actual expiry (tied to `RAMADAN_ENDS_AT_ISO` for example), not a fake per-user timer.

**Warning signs:**
- Tweet/WhatsApp screenshot of renewal UI tagged negatively
- Copy reviews mention "conversion optimization" as justification

**Phase to address:** Phase 9 (In-App Renewal Prompts).

---

### Pitfall 16: Renewal prompt on expired/cancelled accounts (too late)

**What goes wrong:**
User's subscription lapsed 3 days ago. They revisit for whatever reason. In-app banner triggers "اشتراكك ينتهي في -3 أيام" (yes, negative). Handler didn't filter `expires_at >= now()`.

**Why it happens:**
Renewal logic optimized for the "about to expire" case. Expired case is a separate flow (reactivation), not a renewal prompt.

**How to avoid:**
- Renewal prompt query: `WHERE expires_at BETWEEN now() AND now() + interval '7 days'`. Strict upper and lower.
- Expired users get a different surface: reactivation page (not banner). Different copy, different tone ("مرحباً بعودتك").
- Type the prompt state explicitly: `type RenewalState = 'active' | 'expiring_soon' | 'expired_grace' | 'expired_cold'`. Only `expiring_soon` shows the prompt.

**Warning signs:**
- Any user with `expires_at < now()` seeing "أيام" count as negative in the UI
- Renewal-prompt-shown events for users with `subscription_status='expired'`

**Phase to address:** Phase 9 (In-App Renewal Prompts).

---

### Pitfall 17: Multi-gateway renewal mismatch

**What goes wrong:**
User originally paid via Salla 280 SAR. The renewal prompt sends them to the pricing page which defaults to Stripe (or vice versa). User's original payment method / card is stored in Salla, not Stripe, so the checkout flow either asks them for card details again (friction, churn) or creates a duplicate subscription with a second gateway.

Existing gateway state: Stripe + Salla + Tap webhooks and tables (`customer_subscriptions`, `tap_customer_subscriptions`, `salla_integration`). Three separate worlds.

**Why it happens:**
Pricing page is gateway-agnostic and renders the first one configured; doesn't read "your original gateway."

**How to avoid:**
- `profiles.original_gateway` column: 'stripe' | 'salla' | 'tap' — set at first activation.
- Renewal CTA deep-links to gateway-specific checkout: `/api/checkout?gw=salla&renew=1`.
- Server-side in `/api/checkout/route.ts`: if `renew=1` and DB shows original_gateway != requested, return 409 and route to gateway-switch flow.
- Explicit "change payment method" flow is out-of-scope for Phase 9; defer to v1.3.

**Warning signs:**
- `customer_subscriptions` and `tap_customer_subscriptions` both have active rows for same user
- Two charges in same 30-day window
- Support tickets: "دفعت مرتين"

**Phase to address:** Phase 9 (In-App Renewal Prompts).

---

### Pitfall 18: Referral self-abuse (burner accounts)

**What goes wrong:**
Reward = "ادع صديق، خذ شهر مجاني." User creates 5 gmail addresses, refers themselves 5 times, gets 5 free months. Magic-link auth (per CLAUDE.md) has no phone/KYC friction, so cost-of-abuse is near-zero. If you add referral rewards to 1,500 target customers and 10% abuse, you've given away 150 months = potential 150 × 28 SAR = 4,200 SAR, nontrivial on a <10K SAR budget.

**Why it happens:**
Magic link flow was chosen for UX simplicity; abuse prevention was never a design goal.

**How to avoid:**
- Reward delivery gated on the **referred user** paying (not just signing up). A burner gmail that never pays is free to make but yields no reward.
- Additional signal: IP + User-Agent fingerprint match between referrer and referred → flag for manual review, don't auto-credit.
- Email domain matching (referrer `ziad@gmail.com` refers `ziad2@gmail.com`) is too aggressive — many real families share infrastructure. Don't block; just flag.
- Max rewards per referrer: 3 free months per calendar year. Communicates generosity while capping downside.
- Reward = discount on next renewal (coupon), not cash-equivalent credit. Discount only redeemable if already-paying user.

**Warning signs:**
- Multiple accounts with `referred_by = X` and same payment method / same device fingerprint
- Referral conversion rate > 50% (suspicious; normal is 5–15%)
- Referrer earning new free months but never paying themselves

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 19: Referral reward race — referred user activates before credit is posted

**What goes wrong:**
Alice shares `?ref=ALICE-XYZ`. Bob clicks, signs up, activates with a code — all in 90 seconds. Server flow:
1. Bob hits landing with `?ref=ALICE-XYZ` → attribution cookie set
2. Bob `/auth` → magic link → callback → profile created (attribution cookie still in browser)
3. Bob `/api/activate` → code validated, profile updated to active
4. Referral credit job runs: "find Bob's referrer, credit them"

If step 4 is async (background job) and triggered by webhook, it can fire BEFORE step 3's profile update is committed (webhook delivery race). Credit fires looking for `Bob.subscription_status='active'`, sees 'pending', skips. Alice never gets credit. She complains. You manually grant it. This scales poorly.

**Why it happens:**
Eventual consistency. Webhook ordering not guaranteed.

**How to avoid:**
- Referral credit is NOT async. It's part of the `/api/activate` transaction: after the profile upsert succeeds, in the same request, write to `referral_credits` table.
- If `/api/activate` fails at the credit step but succeeded at activation, log for manual reconciliation — don't rollback the activation (user already paid, don't punish them).
- Attribution cookie TTL: 30 days. Written on landing, read at activation. Both sides handled in request-response cycle.
- Reconciliation script runs nightly: find activations without corresponding referral_credits where referral cookie existed → alert admin.

**Warning signs:**
- `referral_credits` count diverges from `referrals_activated` count
- Users reporting "my friend subscribed but I didn't get credit"

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 20: Referral attribution ambiguity (multiple clicks)

**What goes wrong:**
Bob clicks Alice's link Monday. Clicks Carol's link Wednesday. Signs up Friday. Who gets credit? First-touch (Alice) rewards early introduction but ignores the actual conversion driver. Last-touch (Carol) rewards recency but feels unfair to Alice who first introduced him. Split credit is fair but expensive (both get half-month free) and complex to explain.

**Why it happens:**
Attribution is a hard product decision dressed up as a technical one.

**How to avoid:**
- Document the decision explicitly in Phase 10 plan. Recommended: **last-touch, 30-day window**. Matches user mental model ("the link I clicked and actually signed up through").
- Show the credited referrer's name in Bob's activation confirmation screen: "تمّ الاشتراك بدعوة من Carol. شكراً لكما." — transparent.
- Alice gets a consolation touch: if she referred someone who ultimately converted via Carol, she gets a "مشاركتك ساهمت" acknowledgment but no reward. Don't hide the attribution loss.
- DB: `referral_attribution` table with ALL click events (for audit/future analysis), plus `referral_credits` table with only the last-touch winner.

**Warning signs:**
- Referrers asking "why didn't I get credit" — signal that attribution rules aren't transparent

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 21: WhatsApp deep-link share breaks on iOS/Android

**What goes wrong:**
Sharing "ادع صديق" via WhatsApp is the highest-intent social sharing surface in KSA. Developers reach for `whatsapp://send?text=...` which works on Android but silently fails on iOS (triggers nothing or opens wrong app). The cross-platform URL `https://wa.me/?text=...` works but has URL-encoding traps: Arabic text with emojis + the referral URL + newlines needs careful `encodeURIComponent`. A single unencoded `&` in Alice's name breaks the query string.

Additionally: WhatsApp Business API has format restrictions on the URL shortness; very long referral URLs (with UTM + ref code + user_id) get truncated when shared.

**Why it happens:**
Sharing libraries often assume en-US text; Arabic + emoji + long URL is the stress case.

**How to avoid:**
- Use `https://wa.me/?text=${encodeURIComponent(text)}` — never `whatsapp://`.
- Short referral URLs: `taamun.com/r/XYZ` not `taamun.com/activate?ref=ALICE-XYZ&utm_source=whatsapp&utm_campaign=ref`.
- Server-side redirect `/r/:code` → full URL with attribution cookie set before redirect.
- Test matrix: iOS Safari, iOS WhatsApp in-app browser, Android Chrome, Android WhatsApp. All four must work.
- Fallback: copy-to-clipboard button always available. Don't assume the deep link is the only path.

**Warning signs:**
- iOS users click share, nothing happens (no errors logged)
- Malformed share URLs in WhatsApp preview (truncation, Arabic glyph disconnection)

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 22: Referral code collision with existing `TAAMUN-XXX` activation codes

**What goes wrong:**
`activation_codes` table already holds `TAAMUN-XXXX` codes (`crypto.randomBytes(4).toString("hex")`, 8-char hex, ~4 billion namespace). If referral codes use the same format, a referral link `?ref=TAAMUN-A1B2C3D4` could collide with an unused activation code. Worse, user could paste "TAAMUN-A1B2C3D4" into the activate input, it would be treated as an activation code and consumed, and the referral attribution would be lost.

Even without collision: users WILL paste referral codes into the activation field (same prefix, they assume). UX disaster.

**Why it happens:**
Code format reuse + ambiguous namespace.

**How to avoid:**
- Referral codes use DIFFERENT prefix: `TAREF-` or `FRIEND-` (discussed in Phase 10 plan). Not `TAAMUN-`.
- OR: referral codes are NOT user-typeable at all. They exist only in URL slugs (`/r/:slug`), never shown as a copy-pasteable string.
- If user pastes a `TAREF-` code into `/api/activate`, return `400 invalid_prefix` with helpful copy: "هذا كود دعوة، وليس كود تفعيل."

**Warning signs:**
- Activation failures with codes matching referral pattern
- `activation_codes` insertion collision errors

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 23: Referral reward granted then referred user refunds

**What goes wrong:**
Bob signs up via Alice's referral. Alice gets 1 free month credited. Bob refunds/cancels 2 days later (Salla supports 14-day refund window). Alice keeps the reward. Exploit vector: coordinate with friend to pay, get credit, refund — net cost zero to Bob, Alice pockets free month.

**Why it happens:**
Reward triggered on payment, not on retention. No reversal hook.

**How to avoid:**
- Reward is **pending** until referred user reaches day 14 (past refund window and past initial trial). Shown in UI as "رصيد معلّق — يُحرَّر في يوم 14 من رحلة صديقك."
- Gateway webhook for refund/cancel: set referral_credit.status='revoked' if reward was already delivered (block further redemption but don't claw back already-used benefit).
- Explicit rule communicated in referral terms page.

**Warning signs:**
- Pattern: referred users cancelling in first 14 days at rate >> overall churn
- Manual review flag for referrer-referred pairs with same IP/device

**Phase to address:** Phase 10 (Referral Program).

---

### Pitfall 24: PostHog PII leakage in event properties

**What goes wrong:**
Dev writes `track('day_complete', { user_email: user.email, day: 7 })` because it's "easier to debug in PostHog." Email is PII. PostHog event stream is not GDPR/PDPL-compliant for storing emails as properties (it can be, with right config, but not by default). KSA PDPL (Personal Data Protection Law, in force since 2024) treats email as personal data. Leak = legal exposure + trust breach for a spiritual product.

Existing `src/lib/analytics.ts` is well-designed: `person_profiles: "never"`, anonymous ID, explicit `identify` on auth. But future phases will add events and the default reach is `user.*` from the auth context.

**Why it happens:**
PostHog's flexibility is its weakness; no schema enforcement.

**How to avoid:**
- `track()` signature strict-typed to a whitelist of property names. Anything not whitelisted rejected at compile time.
- Event property naming convention bans `*_email`, `*_phone`, `reflection_text`, `note_content`. Lint rule via regex.
- For any event that needs to correlate with a user, use `distinct_id` (already set via `posthog.identify`), not email.
- Review existing `src/lib/analytics.ts` confirms good defaults. Phase 11 must preserve `person_profiles: "never"`.

**Warning signs:**
- PostHog events panel shows email strings in properties
- Any event capture call with user.email, user.phone as arg

**Phase to address:** Phase 11 (PostHog Instrumentation).

---

### Pitfall 25: PostHog privacy violation — pixel fires on reflection/prayer pages

**What goes wrong:**
ROADMAP principle 4: "no tracking pixels on prayer/reflection pages." PostHog's `capture_pageview: true` (default, disabled in existing code, good) would fire a page-view event on `/day/[n]` pages that contain open Quranic verses + user reflections. Even event-level tracking (`day_opened`, `reflection_start`) creates timestamps that, combined with user identity, constitute tracking of religious practice.

This isn't theoretical — this is the north-star principle distinguishing Taamun from generic SaaS.

**Why it happens:**
PostHog defaults toward maximum observability. Manual opt-out at every event site.

**How to avoid:**
- Existing code already has `capture_pageview: false` — preserve this.
- Define three tracking zones:
  - **Public** (landing, pricing): full PostHog, standard web analytics OK
  - **Onboarding** (auth, activate): events OK, content NOT captured
  - **Sacred** (`/day`, `/reflection`, `/book`, AI guide): ZERO PostHog events. Not even aggregated. Not even day number. Rationale: these pages are between the user and Allah; no third-party observer.
- For sacred pages, retention metrics come from server-side DB aggregation (count of reflections per day, without any external telemetry), not from client events.
- `day_complete` event DOES fire (Phase 11 requires it) — but from the completion POST's success handler on the server side, emitted to a private analytics table, NEVER to PostHog. Route to PostHog only aggregate counts via nightly cron, anonymized.

**Warning signs:**
- Any `track()` call inside `src/app/day/`, `src/app/reflection/`, `src/app/book/`, or `src/components/DayExperience.tsx`
- Any `posthog.capture` inside a prayer-adjacent component
- PostHog event list contains `day_complete`, `reflection_typed`, `verse_viewed`

**Phase to address:** Phase 11 (PostHog Instrumentation). Non-negotiable — this is a product-identity principle.

---

### Pitfall 26: Event schema drift across versions

**What goes wrong:**
Phase 11 emits `day_complete` with `{ day: 7 }`. Three months later, v1.3 renames to `{ day_number: 7, cycle: 1 }`. Cohort analysis joining old + new events breaks silently. Worse, analysts don't notice until Q2 "why is Day-7 completion rate zero in the latest data?"

**Why it happens:**
No event schema registry. No event versioning discipline.

**How to avoid:**
- `src/lib/analytics/eventSchema.ts` — typed enum of event names + property shapes. Compile error if a site emits an event not in registry.
- Property names frozen once shipped. Never rename; add new.
- Explicit versioning if breaking change needed: `day_complete_v2` with new shape. Keep emitting `day_complete_v1` in parallel until dashboards migrate.

**Warning signs:**
- PostHog events panel showing same event with different property sets in different time ranges
- Discussion in PRs about "let's rename this property"

**Phase to address:** Phase 11 (PostHog Instrumentation).

---

### Pitfall 27: Client-side events double-fire on refresh/remount

**What goes wrong:**
`useEffect(() => track('cycle_viewed'), [])` inside a component. User navigates away, comes back — effect re-fires. User refreshes — fires again. Event count inflates. Funnel conversion looks better than reality.

**Why it happens:**
React Strict Mode in dev already fires effects twice; production navigation (Next.js client-side routing) can re-mount components.

**How to avoid:**
- Viewing-type events (page views, component views) go through a dedup key stored in sessionStorage. `trackOnce('cycle_viewed', sessionKey)`.
- Action-type events (user clicked X) don't need dedup (each click is a real event).
- CI test: lint rule flagging `useEffect(() => track(...), [])` without dedup wrapper.

**Warning signs:**
- Funnel conversion rates > 100% (shouldn't be possible)
- Single user_id emitting same event dozens of times per session

**Phase to address:** Phase 11 (PostHog Instrumentation).

---

### Pitfall 28: PostHog free-tier quota exhaustion

**What goes wrong:**
PostHog free: ~1M events/month. Target 1,500 customers × 30 events/day each = 1.35M events/month. Blows quota mid-month. Either: ingestion halts (losing data for second half of month), or auto-upgrade kicks in (unexpected bill — conflict with <10K SAR budget).

**Why it happens:**
Events proliferate. Per-click, per-view, per-keystroke get added "for richness" and volume explodes.

**How to avoid:**
- Event budget explicitly written in Phase 11 plan: target <10 events per user per day.
- Core events only: `day_complete`, `cycle_start`, `cycle_complete`, `badge_unlock`, `renewal_prompted`, `renewal_clicked`, `referral_shared`, `referral_converted`. That's 8. Enough for retention analysis.
- Anything finer-grained goes to server-side DB logging, not PostHog.
- PostHog project alerts configured at 70% / 90% quota usage.

**Warning signs:**
- PostHog dashboard showing quota >50% by mid-month
- Credit-card charge from PostHog (budget breach)

**Phase to address:** Phase 11 (PostHog Instrumentation).

---

### Pitfall 29: Consent banner not shown to KSA users

**What goes wrong:**
Next.js SaaS templates add GDPR cookie banner for EU. KSA is under PDPL, which (as of 2024) also requires explicit consent for tracking — but cultural expectation around consent banners is lower. Two failure modes:
- No banner → PDPL compliance gap
- Generic EU banner → poor UX, off-brand English copy

**Why it happens:**
Consent is an afterthought in analytics rollouts.

**How to avoid:**
- PostHog `persistence: "localStorage"` + `person_profiles: "never"` (already set) dramatically reduces consent burden: no cross-site cookies, no personal profile.
- Minimal Arabic consent notice on first visit: "نستخدم أدوات تحليل مجهولة لتحسين التجربة. [تعرف أكثر]" with Accept/Decline.
- Decline path: call `posthog.opt_out_capturing()`. Respect across sessions (store `consent=declined` in localStorage).
- Don't show banner on sacred pages (per Pitfall 25 — nothing to consent to there anyway).

**Warning signs:**
- Legal review flagging PDPL violation
- Users asking in Arabic what the consent banner is for

**Phase to address:** Phase 11 (PostHog Instrumentation).

---

### Pitfall 30: Migration adding NOT NULL column to `profiles` breaks hot path

**What goes wrong:**
Phase 10 adds `profiles.original_gateway` (per Pitfall 17). Naive migration: `ADD COLUMN original_gateway TEXT NOT NULL DEFAULT 'stripe'`. On a table with 1000+ rows, Postgres rewrites the entire table (pre-PG 11 behavior; PG 11+ handles it instantly IF default is a constant, which it is here). But: any running `/api/activate` or `/api/program/progress` transaction during the migration window queues up, times out, and returns 500 to live users.

Existing code already shows awareness of this risk — `start-cycle/route.ts` has the graceful-fallback pattern (Pitfall 2). Phase-column-adds are the biggest deploy-time risk in v1.2.

**Why it happens:**
`ALTER TABLE ADD COLUMN NOT NULL` locks the table. Fine on empty tables, catastrophic on live ones during a Friday deploy.

**How to avoid:**
- Two-phase migration:
  1. `ADD COLUMN original_gateway TEXT` (nullable, no default) — instant, no lock.
  2. Backfill via cron/script in batches of 100 — reads existing rows, infers gateway from `customer_subscriptions.*`, writes.
  3. Once backfilled, `ALTER COLUMN SET NOT NULL` in a subsequent migration.
- Never `ADD COLUMN ... NOT NULL DEFAULT` without verifying PG version supports instant default (14.x on Supabase does, confirm).
- Deploy migrations in off-peak hours (KSA: 3am–6am local, when usage is lowest — note this is Ramadan-inverted; during Ramadan peak is 3am).
- Every migration script tested locally against a snapshot of prod data.

**Warning signs:**
- Supabase logs showing table locks during deploy
- 500 errors on `/api/*` spike during deploy window

**Phase to address:** Phases 7, 8, 9, 10 (each adds columns). Preflight check in each phase plan.

---

### Pitfall 31: Missing RLS on new tables

**What goes wrong:**
Phase 7 adds `user_badges`. Phase 8 adds `year_in_review_snapshots`. Phase 10 adds `referrals`, `referral_credits`. Without RLS, `anon`-role Supabase client (used in client code) could SELECT all rows, reading every user's badges and reflections. This is a data breach, not a bug.

**Why it happens:**
Supabase creates tables without RLS by default. Easy to forget to enable + write policies for new tables.

**How to avoid:**
- Standard migration template: every `CREATE TABLE` followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and at minimum a `USING (auth.uid() = user_id)` policy for SELECT/INSERT/UPDATE.
- CI check: scan migrations for tables without `ENABLE ROW LEVEL SECURITY` within same file.
- Periodic audit: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;` — should be empty.
- Admin-only tables (referral_credits viewed by admin dashboard) still need RLS; policy allows service-role-key bypass automatically.

**Warning signs:**
- New table with no matching policy in migration file
- Supabase dashboard "unrestricted table" warning

**Phase to address:** Every phase that adds tables (7, 8, 9, 10).

---

### Pitfall 32: Skipping `npx tsc --noEmit && npm run build` after changes

**What goes wrong:**
CLAUDE.md: "**التحقق الإجباري بعد كل تعديل — قبل الإعلان عن الانتهاء:** `npx tsc --noEmit && npm run build`". Phases that span multiple files (badge awarding touches DB + API + UI + events) have high cross-file coupling. Without running the mandatory typecheck+build before commit, type errors ship to Vercel, build fails in CI, preview URL broken, time wasted.

**Why it happens:**
- Pressure to commit/ship fast
- Assumption "my local dev works, so it'll build"
- dev (`npm run dev`) uses different compilation than build (`npm run build`)

**How to avoid:**
- Explicit checklist item in EVERY phase plan: "pre-commit: `npx tsc --noEmit && npm run build` passes."
- For heavy changes, checkpoint commit (S4 rule) BEFORE typecheck attempt, so a broken state isn't lost.
- `guard:release` script (`npm run guard:release` per CLAUDE.md) for final milestone checkpoint.

**Warning signs:**
- Red Vercel deploys after push
- Type errors only surfaced in production build

**Phase to address:** Every phase; enforce at transition time.

---

### Pitfall 33: Localization drift — English leaks into Arabic UI

**What goes wrong:**
Phase 11 adds PostHog events, someone adds a toast message for event-capture failure: `toast.error("Analytics failed to load")`. In English. Ships to prod. Users see jarring English error in an otherwise Arabic interface. Worse: developer-facing strings ("DEBUG:", "ERROR:", raw prop names like `user_id`) leak into UI via unhandled error paths.

CLAUDE.md rule: `html dir="rtl" lang="ar"`. Implies every user-facing string is Arabic.

**Why it happens:**
- No i18n framework (per CLAUDE.md rule 6, no new libs); strings are inline literals.
- Errors from backend returned verbatim.

**How to avoid:**
- Error messages from new features are Arabic-first. English only for logs/console, never for UI.
- Error code → Arabic message mapping in a central file (small, no lib needed — just a const object).
- Code review checklist: "grep for English-only UI strings in PR diff."
- Build-time check (optional): lint rule scanning components for non-Arabic user-facing text.

**Warning signs:**
- PR review catches English strings in components
- User screenshots with English error text

**Phase to address:** Every phase; reinforced in Phase 11 (new events = new error paths).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Graceful-fallback `start-cycle` that retries without cycle columns | Ship cycle feature before all migrations deploy | Silent data inconsistency (Pitfall 2); hides real errors | Only during the single deploy window that introduces cycle columns; remove in next commit |
| Backfill retroactive badges in a migration | Existing users get badges day 1 | Risk of notification spam / event spam (Pitfall 4) | Only with `notified=true` flag and reconstructed `awarded_at` |
| Read-modify-write on `progress.completed_cycles` | Simple code | Race condition on multi-device (Pitfall 1) | Never after Phase 6 — must be RPC/atomic |
| Emitting `day_complete` from client-side `useEffect` | Simple to wire | Double-firing + privacy concern (Pitfalls 25, 27) | Never — always from server-side success handler |
| Sharing Year-in-Review card containing reflection snippets | Richer share content | Privacy breach (Pitfall 10) | Never |
| Using `TAAMUN-` prefix for referral codes | Reuses existing code namespace | Collision with activation codes (Pitfall 22) | Never |
| Asynchronous referral credit via webhook | Decouples activation flow | Race conditions (Pitfall 19) | Never — credit is synchronous with activation |
| Skipping RLS on "internal" tables | Faster migration | Data breach vector (Pitfall 31) | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Salla webhook → renewal state | Assume webhook arrives before user lands on site | DB is source of truth; cookie refreshed lazily in middleware |
| Supabase RLS + service-role | Using service-role client for user-scoped queries | User-scoped queries via `createSupabaseServerClient` (respects RLS); admin client only for webhooks/cron |
| Supabase migrations | `ADD COLUMN NOT NULL` on live table | Two-step: nullable add → backfill → set NOT NULL |
| PostHog identify | Identify with email as distinct_id | Identify with anon UUID; email only as optional trait (and preferably never) |
| Satori + Arabic font | Default font lacks Arabic glyph shaping | Bundle Arabic font; explicit `fonts: [{ name, data }]` in Satori call |
| WhatsApp sharing | `whatsapp://` URL scheme | `https://wa.me/?text=...` with full `encodeURIComponent` |
| Vercel cron | Schedule in UTC, assume it's KSA time | Explicitly convert: KSA day boundary = 21:00 UTC previous day |
| Next.js 14 App Router + cookies | Read cookie from `document.cookie` in Server Component | Use `cookies()` from `next/headers`; entitlement cookie already `httpOnly` so client JS can't read anyway |
| Multiple payment gateways | Single renewal flow assumes one gateway | Route renewal to original gateway via `profiles.original_gateway` |
| Entitlement cookie + DB | Cookie cached but DB state changed | On every authenticated request middleware compares cookie `exp` to DB `expires_at`; reissue if mismatch |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Year-in-Review aggregation on read | LCP > 6s, Supabase egress spike | Pre-computed `year_in_review_snapshots` (Pitfall 9) | ~30 active days of data per user |
| Badge-unlock check on every page load | 2× API call per navigation | Compute on `/program` mount only; cache in-session | Immediately — any v1.2 user |
| Fetching all reflections for YIR in one query | Network + JSON parse blocks render | Paginated + lazy-loaded timeline | >60 days of reflections |
| Referral click-tracking without indexes | Slow queries on referrer dashboard | Index `referrals (code)` and `referrals (referrer_id)` | >1000 referral clicks total |
| PostHog client-side ingestion on every micro-event | Quota exhaustion (Pitfall 28) | Event budget <10/user/day; server-side emission for bulk | ~600 active users × 30 days |
| Renewal-prompt query on every authenticated page load | Extra Supabase round-trip per page | Cache decision in session; recompute on `/program` mount | Immediately |
| Satori render time for complex YIR card | Render timeout on Vercel function | Pre-render at snapshot time, cache image URL in `year_in_review_snapshots` | Any user with rich YIR data |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Year-in-Review share exposes reflection text | Privacy breach; user mistrust (Pitfall 10) | Type-enforced split `YIRPublicStats` / `YIRPrivateContent` |
| Referral code guessable / sequential | Fraud: enumerate codes, self-refer (Pitfall 18) | Random codes via `crypto.randomBytes(6)`, base32 |
| PostHog event containing user email or reflection content | PDPL/GDPR violation (Pitfall 24) | Whitelist-typed `track()`; lint against PII-named props |
| Badge-unlock API accepts arbitrary `badge_code` from client | Client grants themselves badges | Award logic server-only; client never posts which badge to unlock |
| Renewal CTA URL hardcodes user's gateway token | Token leaks in logs/referer | Server-side redirect `/r/checkout` with server-derived gateway |
| Missing RLS on `user_badges`, `referrals`, `year_in_review_snapshots` | Anon user SELECTs all rows (Pitfall 31) | `ENABLE ROW LEVEL SECURITY` + `auth.uid() = user_id` policies |
| Entitlement cookie not refreshed after renewal | Stale state shows renewal prompt to paid user (Pitfall 14) | Middleware reconciles cookie with DB on authenticated requests |
| Sharing YIR card via unsigned URL | Anyone can access another user's YIR by guessing ID | URLs include HMAC signature OR route is strictly user-authenticated |
| Importing new npm lib for badges/referrals | Supply chain + CLAUDE.md rule 6 violation | No new deps without explicit approval; use built-ins |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Badge unlock modal interrupting reflection flow (Pitfall 7) | Breaks the sacred ritual, feels like a game | Badge reveal at end of day flow (ProgressionBadge) or next `/program` visit |
| Duolingo-style gamification (Pitfall 6) | Violates product identity; feels wrong in a contemplative context | Minimal calligraphic motifs; contemplative copy |
| RTL breakage in badge graphics (Pitfall 8) | Letters appear disconnected / mirrored | Badge SVGs contain no Arabic; text via HTML with `dir="rtl"` |
| YIR empty state for partial users (Pitfall 12) | Feels like failure; user leaves demoralized | Three variants: <30d, 30–120d, >120d; never show zero-placeholder |
| Dead-end Day 28 if cycle-start fails silently (Pitfall 2) | User confused why Day 1 shows; loses progress sense | Client-side verification of `current_cycle` post-transition |
| Renewal fatigue across channels (Pitfall 13) | Feels spammed; disables push/unsubscribes | Central nudge orchestrator; max 1/48h across channels |
| Dark-pattern renewal copy (Pitfall 15) | Brand damage in trust-sensitive market | Honest, understated copy; no fake scarcity |
| Referral code confusion with activation (Pitfall 22) | User pastes ref code into activation; confusion | Distinct prefixes; or non-typeable referral URLs only |
| WhatsApp share broken on iOS (Pitfall 21) | Share flow silently fails for half the audience | `wa.me/` URL; cross-platform test matrix |
| English leaking into Arabic UI (Pitfall 33) | Jarring, unprofessional | Arabic-first error messages; code review guard |
| Cycle 2 content feels like "doing the same thing again" | Retention feature fails to retain | Phase 6 plan must differentiate cycle 2 content visually/copywise — this is a content concern, not just infrastructure |
| YIR shows Gregorian year start when user thinks in Hijri/Ramadan (Pitfall 11) | Culturally off; user disengages | Anniversary-based, not calendar-based |

---

## "Looks Done But Isn't" Checklist

Critical verifications before declaring a phase complete.

- [ ] **Cycle 2 transition:** CTA appears when EITHER `completed_days.includes(28)` OR calendarDay >= 28 — verify both paths with a test user in Riyadh timezone.
- [ ] **Cycle 2 transition:** Atomic via RPC or optimistic-concurrency guard — verify double-click from two tabs doesn't produce duplicate archive entries.
- [ ] **Cycle 2 transition:** `start-cycle` fallback removed after migration lands — verify no code path silently falls back to cycle 1.
- [ ] **Milestone badges:** `UNIQUE(user_id, badge_code)` constraint present — verify by attempting duplicate insert.
- [ ] **Milestone badges:** Retroactive backfill marks `notified=true` — verify no unlock animation fires for pre-existing badges on deploy.
- [ ] **Milestone badges:** No modal in `src/app/day/*` or `DayExperience.tsx` — grep for `<Dialog>` / `<Modal>`.
- [ ] **Milestone badges:** SVG mirror test in RTL — open in both Chrome and Safari on iOS.
- [ ] **Milestone badges:** No confetti/emoji-fire copy — grep for 🔥 ⚡ 🏆 ❗ in Phase 7 files.
- [ ] **Year-in-Review:** Three data-density variants implemented — test with 10-day, 60-day, 200-day synthetic users.
- [ ] **Year-in-Review:** Share card type-safe (`YIRPublicStats` only, never reflection text) — grep share component for reflection/note/journal props.
- [ ] **Year-in-Review:** Satori renders Arabic glyphs correctly — snapshot test with ش ع ن ت letters.
- [ ] **Year-in-Review:** Copy says "سنتك الأولى" not "2026 في مراجعة" — grep for year-number hardcoding.
- [ ] **Year-in-Review:** Materialized snapshot exists, no aggregation on first render — verify LCP < 6s via Lighthouse on 3G throttle.
- [ ] **Renewal prompts:** Central orchestrator enforces 48h cooldown across channels — test: force-trigger email, verify in-app banner suppressed.
- [ ] **Renewal prompts:** DB `expires_at` is source of truth, not cookie — test: force-refresh cookie with old expiry, verify prompt suppressed.
- [ ] **Renewal prompts:** No copy with countdown timers / "only X left" — grep Phase 9 copy files.
- [ ] **Renewal prompts:** Expired users routed to reactivation, not renewal — test: user with `expires_at < now()` sees reactivation page, not banner.
- [ ] **Renewal prompts:** Gateway-aware CTA — test: Salla user → Salla checkout URL; Stripe user → Stripe.
- [ ] **Referrals:** Reward conditional on referred user paying AND reaching day 14 — test: unpaid referred user does not credit referrer.
- [ ] **Referrals:** Max 3 rewards/referrer/year enforced — test: 4th referral does not create credit row.
- [ ] **Referrals:** Referral code prefix distinct from `TAAMUN-` — grep activation route handles paste of ref code.
- [ ] **Referrals:** Synchronous credit in activation transaction — test: kill connection mid-activation, verify both or neither persist.
- [ ] **Referrals:** WhatsApp share works on iOS Safari, iOS Chrome, Android Chrome — manual test matrix.
- [ ] **Referrals:** Short redirect URL (`/r/:code`) sets attribution cookie before redirect — test: visit `/r/ABC123` → check cookies → redirect target.
- [ ] **PostHog:** `person_profiles: "never"` preserved — grep `src/lib/analytics.ts`.
- [ ] **PostHog:** Zero capture calls inside `src/app/day/`, `src/app/reflection/`, `src/app/book/`, `DayExperience.tsx` — grep.
- [ ] **PostHog:** Event schema registry exists with typed property whitelist — verify by attempting to emit an unregistered event (compile error).
- [ ] **PostHog:** Arabic consent banner on first visit — test incognito.
- [ ] **PostHog:** Event budget ≤ 10/user/day documented — count events per flow.
- [ ] **General:** Every new table has RLS enabled + policy — `SELECT tablename FROM pg_tables WHERE rowsecurity=false` is empty.
- [ ] **General:** `npx tsc --noEmit && npm run build` passes locally before any push.
- [ ] **General:** No English user-facing strings in new components — grep PR diff.
- [ ] **General:** Migration preserves live `/api/*` availability (two-step for non-null additions).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-archive on cycle transition (Pitfall 1) | LOW | Deduplicate `completed_cycles` array via one-time migration; add RPC for future |
| Dead-end Day 28 (Pitfall 2) | MEDIUM | Support ticket triage; admin-manual `UPDATE progress SET current_cycle=2` per affected user |
| Retroactive badge spam (Pitfall 4) | MEDIUM | Mass-mark existing badges `notified=true`; apologize via in-app note |
| Year-in-Review privacy leak (Pitfall 10) | HIGH | Incident response: disable share endpoint, revoke shared URLs, notify affected users, legal disclosure if material |
| Renewal prompt to already-paid user (Pitfall 14) | LOW | Refresh cookie job; in-app message "شكراً — تمّ التجديد" |
| Referral abuse spike (Pitfall 18) | MEDIUM | Freeze affected accounts; audit referral_credits; tighten rules retroactively with user comms |
| PostHog PII leak (Pitfall 24) | HIGH | PostHog data delete API for affected events; audit retention window; user notification if KSA PDPL triggered |
| Quota exhaustion (Pitfall 28) | LOW | Emergency drop high-volume events; accept gap in data for rest of month; upgrade tier only if sustained |
| NOT NULL migration outage (Pitfall 30) | HIGH | Rollback migration; retry two-step; post-mortem |
| Missing RLS (Pitfall 31) | HIGH | Emergency policy deploy; audit access logs for anon-role reads during window; user notification if data accessed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Double-archive race | Phase 6 | Integration test: two parallel `start-cycle` calls → exactly one archive entry |
| 2. Silent fallback dead-end | Phase 6 | Remove fallback after migration; post-deploy smoke test |
| 3. Timezone drift | Phase 6 | Unit test with Riyadh timezone fixtures |
| 4. Retroactive badge flood | Phase 7 | Backfill migration dry-run; verify `notified=true` on all rows |
| 5. Badge duplicate awards | Phase 7 | DB constraint test; `INSERT ... ON CONFLICT DO NOTHING` verified |
| 6. Gamification tone drift | Phase 7 | Design review against explicit anti-pattern list |
| 7. Modal interrupts flow | Phase 7 | Grep guard: no `<Dialog>` in day flow |
| 8. RTL badge breakage | Phase 7 (+ Phase 8 for Satori) | Visual regression in RTL at 3 viewports |
| 9. YIR slow aggregation | Phase 8 | LCP test on 3G throttle; materialized snapshot verified |
| 10. YIR privacy bleed | Phase 8 | Type-enforcement audit; grep share card for reflection refs |
| 11. Year ambiguity | Phase 8 | Product decision documented; no `.getFullYear()` in YIR code |
| 12. YIR empty state | Phase 8 | Three variants tested with synthetic data densities |
| 13. Notification fatigue | Phase 9 | Integration test: trigger email → banner suppressed 48h |
| 14. Prompt on renewed user | Phase 9 | Test: webhook fires → cookie refreshed → prompt suppressed |
| 15. Dark-pattern copy | Phase 9 | Copy review; grep for countdown/scarcity terms |
| 16. Prompt on expired user | Phase 9 | Query strictly `BETWEEN now() AND now() + 7 days` |
| 17. Multi-gateway mismatch | Phase 9 | Test: Salla user → renewal URL is Salla |
| 18. Referral self-abuse | Phase 10 | Max-3-per-year enforced; device fingerprint flag |
| 19. Referral race condition | Phase 10 | Synchronous credit in activation transaction |
| 20. Attribution ambiguity | Phase 10 | Last-touch 30-day rule documented + tested |
| 21. WhatsApp cross-platform | Phase 10 | 4-device test matrix |
| 22. Referral code collision | Phase 10 | Distinct prefix; test paste of ref code into activate |
| 23. Referral refund abuse | Phase 10 | Reward pending until day 14; refund webhook revokes |
| 24. PostHog PII leak | Phase 11 | Typed event registry; lint against PII-named props |
| 25. Pixels on sacred pages | Phase 11 | Grep `track(` / `posthog.capture` in day/reflection/book |
| 26. Event schema drift | Phase 11 | Typed registry with frozen property names |
| 27. Double-firing events | Phase 11 | `trackOnce` dedup helper; lint rule on bare `useEffect(() => track)` |
| 28. Quota exhaustion | Phase 11 | Event budget doc; PostHog alert at 70%/90% |
| 29. Consent banner | Phase 11 | First-visit test in incognito; opt-out persistence |
| 30. NOT NULL migration | Phases 7/8/9/10 | Two-step migration pattern in every schema PR |
| 31. Missing RLS | Phases 7/8/9/10 | Migration template; `rowsecurity=false` audit after each deploy |
| 32. Skip tsc/build | Every phase | Pre-commit check in phase plan |
| 33. English in Arabic UI | Every phase | Code review; grep for English UI strings |

---

## Sources

- Existing codebase analysis:
  - `src/app/api/program/start-cycle/route.ts` — read-modify-write pattern, graceful fallback
  - `src/app/api/program/progress/route.ts` — calendarDay + completed_days reconciliation
  - `src/app/api/activate/route.ts` — entitlement cookie issuance flow
  - `src/lib/entitlement.ts` — HMAC-SHA256 token + expiry handling
  - `src/lib/analytics.ts` — PostHog config with `person_profiles: "never"`, `capture_pageview: false`
  - `src/app/api/admin/bulk-codes/route.ts` — existing `TAAMUN-XXXX` code namespace
  - `supabase/migrations/20260418000000_add_cycles_support.sql` — cycle columns added
- `CLAUDE.md` — safety rules S1–S5, framework constraints, architecture boundaries
- `.planning/PROJECT.md` — v1.2 scope, budget constraints, principles
- `.planning/ROADMAP.md` — principles 1–4 (real user validation, LCP, Arabic-first, no tracking pixels on prayer pages)
- KSA PDPL (Personal Data Protection Law, in force 2024) — general awareness of regional privacy requirements
- Cross-phase reasoning: every pitfall traced to a file/endpoint/table actually present in the repo

---

*Pitfalls research for: Taamun v1.2 Retention Loop*
*Researched: 2026-04-18*
