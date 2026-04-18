# Feature Research — Taamun v1.2 Retention Loop

**Domain:** spiritual-wellness · Quranic contemplation · Arabic-first habit app
**Researched:** 2026-04-18
**Mode:** Ecosystem (feature patterns for subsequent-milestone retention features)
**Overall confidence:** MEDIUM-HIGH
**Tone-fit filter applied:** Every recommendation tested against "would a Taamun user find this shallow?" The north-star phrase "قلبي يتشرب معاني" is the taste-lock — anything that triggers Duolingo-style guilt, leaderboard envy, or upsell pressure is filtered out.

---

## Executive Summary

Six retention features were researched against real products in adjacent spaces: **Headspace** (badges without sharing), **Calm** (streaks with personalized milestones), **Insight Timer** ("low-friction" completion without streak anxiety), **Muslim Pro / Ayah** (widgets, last-read, gentle daily prompts), **Down Dog** (flexible weekly goals → 20% retention lift), **Spotify Wrapped** (annual narrative, hyper-personalized), **Reflection.app** (guided annual review pulling past entries), **Duolingo** (what NOT to do — guilt-based retention), **Substack** (slow-burn loyal-base retention, annual highlight reel to deepen reader relationship), **Trello / Jobber** (free-month referrals).

Four cross-cutting findings shape the recommendations:

1. **Gamification in wellness apps is a two-edged sword.** A 2021 meta-analysis of 27 gamified mental health apps found *no statistically significant improvement* in depressive symptoms vs non-gamified apps — engagement without clinical grounding is "a mirage." Taamun must borrow the *shape* of badges/streaks (visible progress, landmark moments) but reject the *incentive model* (fear of loss, public comparison).
2. **Flexibility beats daily-pressure.** Down Dog's "Practice Frequency" weekly-goals model lifted 90-day retention by ~20%. Taamun's existing 3 AM grace period is already in this spirit — v1.2 should extend it, not contradict it.
3. **"No share function" can be a feature.** Headspace deliberately omits share-my-badge UX to avoid social comparison damaging self-esteem. For a Quranic-reflection product, private-by-default is more consistent with intent (إخلاص) than public streak-flexing.
4. **Referred users retain 37% better and churn 18% less** (SaaS averages). Referral is the single highest-LTV lever available. For Taamun the trick is making the ask feel like *da'wah* (invitation to benefit), not affiliate marketing.

Confidence is MEDIUM-HIGH because (a) meditation-app pattern data is strong, (b) Arabic/Gulf-specific referral benchmarks are weaker — I found Saudi Meem Digital Banking as a local comp but no spiritual-app referral benchmarks in the region, (c) PostHog event schemas are well-documented but choice of "which events matter" is product-specific judgment.

---

## The Six Features — Table Stakes / Differentiators / Anti-Features

Every feature below uses the structure the downstream Requirements phase expects: **table stakes** (minimum viable), **differentiators** (what makes it Taamun-shaped), **anti-features** (explicit don't-build list).

---

### 1. Cycle 2 Transition UX — `RETURN-*`

**Problem it solves:** Today, Day 28 ends in silence. User either reopens the app and finds "post-28 rotation" with no narrative, or drifts away. CX audit called this the single biggest wound.

#### Table Stakes (users expect these on Day 28)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Day 28 completion screen with explicit "what's next" CTA | Standard "finish flow" UX — apps that just dump you back to home feel broken. Digia/Appcues research: completion ≠ activation; need loop back to next habit cycle. | LOW | Render on `/day/28` when reflection saved |
| In-app reminder that cycle 2 exists (not only email) | Email open-rate is ~30% at best; need in-product surface. Muslim Pro uses widgets, last-read, and daily verse for the same purpose. | LOW | Banner / card on `/program` for post-28 users |
| Re-entry state preserved (reflections from cycle 1 still visible) | Users expect their journal to be durable across cycles — losing entries would break trust. | LOW | DB already persists; just ensure UI exposes cycle-1 archive |
| Clear framing: "cycle 2 is الشكل الثاني of the same verses, not a new program" | Avoids the "I already finished it" dismissal. Insight-Timer-style reframing: same object, different depth. | MEDIUM | Copy + one-screen explainer |

#### Differentiators (what makes it Taamun-shaped)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Ritual transition page** — not a CTA button but a scene | Taamun is paced product. Transition should feel like a breath, not a conversion funnel. One verse + one sentence + one soft action (think `SilenceGate` pattern already in the app). | MEDIUM | Reuse `SilenceGate` component; new copy |
| **Reflection callback** — quote user's own Day-1 reflection on Day-28 completion page | Self-determination theory (Spotify Wrapped pattern, scaled down): "this is what YOU wrote 28 days ago." Makes cycle 2 feel earned by personal journey, not imposed. | MEDIUM | Requires reading `reflections` table — depends on ANALYTICS-* foundation being in place for day_complete events, but reflection pull is a simpler DB query |
| **"المعنى يتعمّق" framing** — cycle 2 promises *deeper understanding of same verses*, not more content | Directly ties to "قلبي يتشرب معاني." Differentiates from content-treadmill meditation apps that push new courses to keep you paying. | LOW | Copy |
| **Opt-in, not auto-advance** — user chooses to begin cycle 2, with a pause option | Respects Down-Dog flexibility finding; avoids the "you must continue" pressure Duolingo uses. | LOW | State machine: `completed_c1` → user taps → `active_c2` |

#### Anti-Features (do NOT build)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-start cycle 2 the moment Day 28 is marked complete | "Keeps users engaged" | Violates the intentionality users signed up for; feels like Netflix auto-play. Users who were *ready to finish* feel coerced. | Require an explicit "أريد أن أتعمق" (I want to go deeper) tap |
| Confetti / celebration animation on Day 28 | Industry default | Headspace-level gamification in a Quranic context is tonally wrong. Insight-Timer criticism: "a 90-second breath check counts the same as a 20-min Vipassana sit — distorts internal metric of progress." | Quiet visual signal (verse bloom, color shift) — subtraction, not addition |
| "You're in the top 5% of users" comparison | Social-proof trope | Public comparison in a practice of إخلاص damages the intent of the practice itself. | Personal progress only — "أنت في يومك 28 من 28" |
| Post-28 paywall gate for cycle 2 | Revenue uplift temptation | Paid subscribers who *already paid* for 28-day access feel betrayed. | Cycle 2 included in existing subscription; renewal prompt (separate feature) handles monetization |

**Complexity verdict:** 1-phase feature. Low-medium tech risk; all data already in DB. Critical path: copy + `DayExperience` Day-28 branch.

**Dependencies:** None hard. Nice-to-have: `day_complete` event instrumentation (ANALYTICS-*) firing before this ships, so the transition success rate is measurable from day 1.

---

### 2. Milestone Badges — `BADGE-*`

**Problem it solves:** No in-product signal that Day 3 / Day 7 / Day 14 / Day 21 / Day 28 are meaningful waypoints. Users can't feel their own progress. The ROADMAP calls for days 1, 3, 7, 14, 21, 28.

**Core tension:** Headspace and Calm both use badges; both get criticism. The critique (Decision Lab, Zenful Spirit, Metafilter) is that badges create "hollow engagement" and distort the metric of progress from *quality of attention* to *consistency of initiation*. The design goal is: **badges that mark significance without becoming the goal.**

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visible marker on the milestone day (3/7/14/21/28) | Users expect something to happen when they cross a threshold, or the threshold doesn't exist to them. | LOW | Render inline in `DayExperience` on milestone day |
| Persistent badge record in user profile / progress page | Without persistence, the badge is just a notification — invisible retention value. | LOW | Existing `ProgressionBadge` component + DB table |
| Idempotent unlock (safe if day is re-opened) | Basic correctness; no duplicate "you unlocked X" spam. | LOW | Unique constraint `(user_id, badge_id)` |
| Arabic-native copy (not translated English) | RTL translation rot is the #1 Arabic-app failure mode. Copy must feel written, not translated. | LOW | Part of each badge definition |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Badges as thresholds of meaning, not "achievements"** — naming pattern `عتبة الـ X` (threshold of X), `حلقة الـ Y` (circle of Y), not "Day 7 Unlocked!" | Signals seriousness. "Achievement" is video-game vocabulary; "عتبة / حلقة / منزلة" is classical Arabic vocabulary for spiritual stations (منازل السائرين tradition). | LOW | Copy + naming convention |
| **Private-by-default, share-optional** — Headspace model, not Strava model | Preserves إخلاص of the practice. User who wants to share can; app never pushes it. | LOW | No share button on badge detail by default; separate explicit "شارك" action |
| **Badge reveals a verse or meaning, not a score** — the "reward" is content, not a number | Inverts gamification: unlocking a badge *gives* the user something reflective (a verse, a quote from the book, a short sentence), rather than adding a number to a collection. | MEDIUM | Each badge ships with paired content; depends on content curation |
| **Milestone awareness trajectory** — at 14 and 28, badge page shows user's `awareness_logs` trend | Connects the abstract milestone to the user's lived data ("انتبهت 19 مرة في 14 يوم"). Muslim-Pro-style last-read-personalization, applied to reflection. | MEDIUM | Read from `awareness_logs` table |
| **No streaks counter UI** — streak exists in grace-period logic only, never shown as a big number | Duolingo-streak-trap avoidance. The existing 3 AM grace period logic stays; it just doesn't become the user-facing currency. | LOW | Deliberate omission |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Streak counter ("7-day streak!" badge with flame emoji) | Industry standard; "proven retention" | Proven *hollow* retention. Decision Lab "streak creep" paper: streak becomes the goal, practice becomes performative. Users with 400-day streaks open app, tap, bounce — zero actual reflection. | Milestone days only (3/7/14/21/28); no running count |
| Leaderboards / percentile rank | "Social proof" | Against إخلاص. Comparison is the thief of reflection. Headspace deliberately avoids this. | Personal history only |
| "You lost your streak!" loss-aversion notifications | "Most-clicked email per Duolingo research" | Duolingo-style guilt. The Sylvi / BridgeCalm critique: guilt-based retention is extractive, not formative. The "You made Duo sad 😢" pattern is a dark pattern. | Re-engagement is positive ("verse waiting for you"), never shame-based |
| Rare / legendary / gold-tier badge hierarchies | "Collectible value" | Childish. Collector-game vocabulary in a Quranic product is cringe. Spiritual products rarely survive a "legendary tier." | Flat badges — each is its own meaning, not a rung on a ladder |
| Auto-share to Instagram Story on unlock | "Viral growth" | Performative piety is a well-known failure mode in religious products. User loses trust instantly. | Share exists only on explicit user action (separate REFER-* feature handles viral) |
| Badge progress bars ("3 days until Day 14!") | "Drives anticipation" | Converts reflection into a countdown. Practice becomes instrumental ("I'm doing this to get the badge"). | No forward-looking badge UI; badges only appear once crossed |

**Complexity verdict:** 1-phase feature, but content-heavy. Tech is simple; badge *copy and content-pairing* is the work. Copy review by Ziad is gating.

**Dependencies:**
- **Hard:** `day_complete` + `milestone_reached` events (ANALYTICS-*). Without the event stream, you can't measure unlock rate or tune the triggers — but the trigger logic itself runs off the existing `reflections` + `awareness_logs` tables, so badges can technically ship without PostHog.
- **Soft:** Cycle 2 Transition should ship first or together, since Day 28 milestone badge and Cycle 2 Transition share the same moment.

---

### 3. Year-in-Review — `YIR-*`

**Problem it solves:** Currently nothing binds the year together. After Day 28 + a few cycles, the journey is disconnected memories. Goal: transform *365 reflections + awareness logs + badges* into a retrospective that makes the user feel "this year changed me."

**Critical question from the brief:** one-shot annual page or continuously-visible journey timeline? **Evidence points to BOTH, layered.**

- **Spotify Wrapped model = one-shot annual event.** Sources (Growth.Design, Irrational Labs): Wrapped works *because* it's scarce, dated, and culturally anticipated. If it were always-on, it would lose its punch. ~60% of viral moments are in the Dec 1–7 window.
- **Reflection.app model = always-accessible archive** with a guided annual review that pulls past entries. Lower virality, higher intrinsic value.
- **Apple / Instagram "On This Day" = continuous memory surfaces** — small daily callbacks.

**Recommendation:** **Dual-layer**. (1) A timeline / archive that's always accessible (low marketing value, high personal value). (2) An annual "Year in Review" moment that generates shareable output (marketing value + self-identity moment). Ramadan-anchored rather than Gregorian-anchored is the Taamun-shaped move — `RAMADAN_ENDS_AT_ISO` is already in `appConfig.ts`.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All-time reflections archive (searchable / filterable by cycle) | If you wrote 200 reflections and can't find them, the product betrayed the effort. | MEDIUM | Paginated view of `reflections` table |
| Per-cycle summary page (cycles 1, 2, 3 etc.) | Users expect their past cycles to be browsable, not deleted. | LOW | Filter by `cycle_number` |
| Export reflections as text/PDF | Ownership. Users writing personal material demand export. Substack "owned audience" principle applied to user-generated journal. | MEDIUM | Server-side PDF generation OR client-side text export |
| Stats summary: days completed, cycles finished, reflections written, awareness logs | Baseline "year in numbers" that every retrospective does. | LOW | Simple aggregates |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Ramadan-anchored annual review** — "مراجعة عام" published yearly on 1 Ramadan, not 1 January | Culturally-native framing. Taamun is Quranic; aligning with the Islamic year is more authentic than aping Spotify Wrapped's Dec calendar. | MEDIUM | Scheduled content — once-per-year release |
| **Auto-surfaced meaningful quotes** — the YIR pulls 3–5 of the user's *own* reflections that are long / emotionally-weighted | Spotify Wrapped's self-determination pattern applied to journaling. "This is what *you* wrote on Day 7 of cycle 2" is uniquely meaningful. Simple heuristic: longest reflections + reflections where `awareness_log.emotion_score` spiked. | MEDIUM | Scoring heuristic on reflections; no ML needed for v1 |
| **Silent mode on share image** — share card has verse + user's own short line, no Taamun logo dominance | Preserves dignity of the content. Contrast: Spotify Wrapped shares are obviously Spotify ads; YIR shares should look like the user's own output, with Taamun as a small footer. | LOW | Design constraint for the share card |
| **Awareness trajectory chart** — simple sparkline of `awareness_logs` over the year | Differentiator over generic "X posts written" summaries. Shows *inner* data, not activity data. | MEDIUM | Simple SVG chart, RTL-correct axis |
| **Always-on archive AS WELL** — `/journey` page as the continuous companion | Covers the 51 weeks of the year that aren't YIR launch week. Reflection.app model. | MEDIUM | Separate route; reuses same data |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Public profile / shareable URL of entire year | "Instagram growth" | User reflections are intimate. Public exposure is a privacy bomb and against إخلاص. Users who opt-in today regret it when they revisit old reflections. | Share card = curated snippet only; full year private |
| "Your personality type based on reflections" / MBTI-style result | "Fun Wrapped moment" | Reductive pseudo-psychology tacked onto Quranic content is shallow. Headspace / Calm rightly avoid this. | Raw text + user's own quotes; let user draw their own meaning |
| Competitive rankings ("you wrote more than 80% of users") | "Social proof" | Comparison. Again. Against إخلاص. | Personal-only stats |
| Auto-posting to social media on YIR launch day | "Viral blitz" | Breach of trust on private content. Consent matters. | Share button = user-initiated only |
| Full video-style Wrapped experience with music and transitions | "Spotify-level polish" | Scope trap — months of design work for one-week annual impact. Performance budget (LCP < 6s on 3G) won't survive heavy animation. | Static page + 5-8 scroll sections; one good share image |
| Requiring a full year before anything shows | "Keep the moment rare" | New users (90% of users at any moment) see nothing. Permanent hidden feature. | YIR unlocks at 100+ reflections OR 1 full Ramadan-to-Ramadan cycle, whichever comes first. The always-on archive is available from Day 7. |

**Complexity verdict:** 2-phase feature. Phase A = always-on archive + per-cycle summary (simpler). Phase B = Ramadan-anchored YIR moment with share card (more design-heavy, needs content curation heuristics).

**Dependencies:**
- **Hard:** Full reflections history is already stored — no new capture needed.
- **Soft:** `cycle_complete` event is useful for the cycle-summary page; `reflection_saved` event is useful for the "longest reflection" heuristic but a DB query can do it without PostHog.

---

### 4. Renewal Prompts In-App — `RENEW-*`

**Problem it solves:** Subscription renewals today happen via email only (if at all) and silently. User gets charged (or not) without a conversation. Opportunity: surface renewal *before* charge date in a way that reinforces value, not pressure.

**Key finding from research:** renewal prompts work best when framed as **continuity of practice**, not as a transaction. Apps365 and BluBolt both emphasize: showcase achievements + feature utilization in the prompt, so subscriber sees what they'd lose (not what they'd pay).

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 7-day-before-expiry in-app banner | Standard SaaS pattern; users feel blindsided if their access changes without warning. | LOW | Conditional render on any page when `subscription_ends_at - 7 days <= now` |
| Clear billing date + amount + cancel path | Regulatory (PCI/consumer-protection) basics + trust. Saudi / Gulf consumers strongly dislike hidden auto-renewal. | LOW | Exists in existing `/account` — just surface it in the banner |
| One-click manage-subscription link | Users abandon renewal intent if the path is hidden. | LOW | Links to existing billing portal |
| Respect user's "don't remind me" dismissal | Nagging kills trust — especially in a contemplative product. | LOW | `renewal_prompt_dismissed_at` in DB; respect for 72 hours |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"قلبك تشرّب المعنى" — prompt references the user's own Day-28 / milestone reflections, not generic pitch** | BluBolt pattern: dashboard showing subscriber's benefits. Makes renewal about *what you've done*, not *what we sell*. | MEDIUM | Pull 1-2 reflections + streak / awareness stat into the prompt |
| **Pre-expiry verse, not pre-expiry CTA** — the banner itself carries a verse + a soft "تابع الرحلة" | Fits the product's voice. A renewal prompt that looks like a Stripe upsell modal breaks the meditative frame. | LOW | Design constraint on the banner component |
| **Offer renewal AT the natural milestone, not at expiry** — surface the prompt after cycle completion, not on a billing-calendar trigger | Ties renewal to an intrinsic moment (I finished cycle 2) rather than an extrinsic one (my card is about to run). | MEDIUM | State machine: after `cycle_complete` *and* within 14 days of expiry, show cycle-completion-flavored renewal |
| **Grace period** — 3-day soft-access after expiry before full lock-out | Aligns with the existing 3 AM grace-period philosophy (Down Dog flexibility finding). Prevents "card failed → locked out → cancel" spiral. | MEDIUM | Requires subscription gate to check `subscription_ends_at + 3 days` |
| **Clear downgrade path** — "not ready to renew yet? pause for 30 days, keep your reflections" | Many wellness-app subscribers are "not NO, just not NOW." Pause = retained LTV; hard-cancel = lost forever. | HIGH | Requires a pause-state in subscription logic; interacts with payment gateways (Stripe/Salla/Tap) |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Interstitial modal blocking app access until user sees renewal | "Higher view rate" | Coercive; users associate the app with transaction. Trust damage > LTV lift. | Dismissable banner only |
| Countdown timer "3 days, 14 hours to renew!" | "Urgency drives conversion" | Manipulative in a spiritual product. Mirror-image of the "streak about to break" dark pattern. | Static date + amount |
| "Lose your reflections if you don't renew" | "Loss aversion" | Reflections are user property and must remain accessible even post-cancellation (per app's own values + likely KSA PDPL implications). Also, threatening = abusive. | Reflections always available (read-only post-cancel); only *new content* is gated |
| Auto-upgrade to higher tier ("we made you Yearly!") | "Revenue lift" | Illegal in many jurisdictions + breaks trust permanently. | Always user-initiated tier change |
| Multiple prompts per week until renewal | "More surface = more conversion" | Nag fatigue; spiritual product can't survive it. | Max 1 prompt per 72 hours, max 3 total across the 7-day window |
| Hiding cancel button | "Reduce churn" | Consumer-protection regulators increasingly penalize this (FTC Click-to-Cancel; similar GCC-region norms). | Cancel = equally prominent as Renew |

**Complexity verdict:** 1 or 2 phases depending on scope. Core banner + prompt logic = 1 phase. Pause-state and grace-period = a separate phase (touches payment gateway integrations).

**Dependencies:**
- **Hard:** `renewal_prompted` and `renewal_clicked` events (ANALYTICS-*) to measure conversion lift — but banner can ship without these and have PostHog added later.
- **Soft:** Cycle 2 Transition (`RETURN-*`) — the "renew at cycle completion" flavor shares the Day 28 moment.

---

### 5. Referral Program — `REFER-*`

**Problem it solves:** Converting the strongest validation signal ("قلبي يتشرب معاني") into growth. Zero paid-acquisition budget, but organic advocacy is already happening — just not captured.

**Key findings:**
- SaaS referral benchmarks: average referral share rate 4.75%; high-growth startups hit 15-25% (Prefinery, ReferralCandy). *Referred users retain 37% better and have 18% lower churn* — highest-LTV acquisition channel available.
- Double-sided rewards (both referrer and referee) get 68% higher participation than one-sided (Cello, SaaSquatch).
- Trello / Jobber / Evernote all use "free month" as the primary mechanic — it's the proven pattern for subscription products where cash isn't culturally comfortable as a reward.
- **Saudi / Gulf-specific signals:** Meem Digital Banking (Saudi, 2025) uses SAR cash rewards; no strong spiritual-app comp in region. WhatsApp share is the dominant social-share primitive in Saudi (higher than IG Story for 1:1 invitations); Instagram Story is dominant for public advocacy. LOW confidence on exact share-channel conversion rates for this audience — would need validation.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unique invite code or link per user | Basic attribution. Without this, a referral program isn't a program. | LOW | One row per user; `referral_code VARCHAR UNIQUE` on profile |
| Both-sides reward (referrer + referee both get value) | 68% higher participation vs one-sided. Fairness matters in Gulf culture especially. | LOW | Copy the Trello / Jobber "free month both sides" pattern |
| Visible progress tracking ("3 friends joined") | Users want to know their share worked. Invisible → they stop sharing. | LOW | Simple count from `referrals` table |
| Clear T&Cs — what counts as "successful referral" | Meem model: referral counts when referee completes signup. Ambiguity kills trust. | LOW | Arabic T&Cs page |
| WhatsApp share deep link | Dominant Saudi share channel. `whatsapp://send?text=...` pre-fills message. | LOW | Primary share button |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"ادع صديقًا" framing, not "Refer a Friend"** — invitation / da'wah language, not affiliate-marketing language | The Arabic verb `ادع` carries religious weight (invitation to benefit). Distinguishes from salesy referral mechanics. | LOW | Copy + iconography choice |
| **Both reward = free month** — not cash, not discount | Cash rewards feel mercenary in a spiritual product; discount feels transactional. Free month extends the practice for both parties — symmetric with the product's value. | LOW | Subscription-extension logic in billing |
| **Share card with verse + personal reflection line (opt-in)** — not a generic "I love Taamun!" referral image | Referrer's personal voice > generic share copy. Mirrors YIR share-card philosophy. | MEDIUM | Share card generator (`next/og` fits here) |
| **No public leaderboard of top referrers** | Performative piety trap. Being "top referrer" in a spiritual product reveals bad intent. Private counter only. | LOW | Deliberate omission |
| **Unlimited free months** stackable (unlike "first 3 referrals only") | Rewards true advocates without ceiling. Keeps the few deeply-committed users compounding. | LOW | No cap in the reward logic |
| **Ramadan seasonality** — optional "double reward" Ramadan window | Aligns cultural moment with share behavior. Most share-worthy moment of the year for a Quranic product. | LOW | Toggle in admin panel; run once yearly |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-level marketing / tier-on-tier (my friend's friend pays me) | "Viral loop" | Pyramid-adjacent; unethical and brand-destroying for a religious product. | Single-hop only |
| Automatic share prompt on every completed day | "More surface = more shares" | Spam; user feels they're a marketing funnel. | Share prompt only in 2-3 specific moments: YIR, Day 28, cycle 2 completion |
| Cash withdrawal / PayPal payout | "Aligns with affiliate norms" | Attracts gaming behavior; shifts the motive from genuine recommendation to mercenary. | Free-month credit only, non-monetizable |
| "You earned a free month!" popup mid-reflection | "Celebrate the moment" | Transactional intrusion on intimate practice page. | Notification waits until user leaves the reflection flow |
| Leaderboard / "top inviters this month" | "Social proof + competition" | Performative da'wah is worse than no da'wah. | Private-only |
| Requiring the referee to be paying before reward unlocks | "Anti-fraud" (but really anti-fun) | Long feedback loop kills share momentum. If the referee churns in trial, both-side reward feels unjust anyway. | Reward when referee signs up + completes Day 1; if they cancel within 7 days, reverse the reward silently. |
| Tracking which channel (WA / IG / link) each share went to | "Optimization data" | Privacy-adjacent; slippery slope. The referral code itself is enough attribution. | Code-level attribution only; don't fingerprint the share channel |

**Complexity verdict:** 2 phases. Phase A = codes, attribution, reward grant (simple). Phase B = share cards + WhatsApp/IG deep links + Ramadan-double-reward (design-heavy).

**Dependencies:**
- **Hard:** `referral_sent`, `referral_signup`, `referral_activated` events (ANALYTICS-*) are critical — without funnel visibility, the program can't be tuned. Strongly recommend analytics shipping first or together.
- **Soft:** YIR share card (YIR-*) — if YIR ships first, the share-card generator can be reused for referrals.

---

### 6. PostHog Event Instrumentation — `ANALYTICS-*`

**Problem it solves:** Without events, every other v1.2 feature is blind. Can't measure renewal conversion, badge unlock rate, Day-28 → Cycle-2 transition drop-off, referral funnel. v1.3 data-driven decisions need v1.2 to generate the data.

**Key findings:**
- PostHog recommends `[object] [verb]` event-name convention (`reflection saved`, `cycle started`, `day completed`) — verb-last, space-separated.
- 5-10 "growth events" are enough; instrumenting 100+ events is noise.
- Critical state-change events should fire **server-side** (signup, subscription change, payment), not client — client-side can be blocked by ad-blockers and is unreliable for money-moving events.
- Stickiness (DAU/WAU ratio) is the core habit-app metric; daily is wrong for a 5-minute-practice product — weekly is the right denominator.

#### Table Stakes

| Event | Why It Matters | Fire From | Notes |
|-------|----------------|-----------|-------|
| `day completed` | Core retention signal — the single most important event in the product. | Server (on reflection save) | Properties: `day_number`, `cycle_number`, `seconds_on_page` |
| `cycle started` | Measures Cycle-2-Transition success. | Server | Properties: `cycle_number`, `from_day`, `transition_source` (auto vs prompted) |
| `cycle completed` | Lifecycle milestone. | Server | Properties: `cycle_number`, `days_to_complete` |
| `reflection saved` | Engagement depth signal. | Server | Properties: `day_number`, `char_count` (not content — privacy) |
| `badge unlocked` | Measures milestone-badge unlock rate. | Server | Properties: `badge_id`, `day_number` |
| `subscription started` / `subscription renewed` / `subscription cancelled` | Revenue + churn. | Server (webhook from payment gateways) | Properties: `plan`, `gateway`, `amount` |
| `renewal prompted` / `renewal clicked` / `renewal converted` | Renewal-prompt conversion funnel. | Server + client | Separate events for prompt-shown vs clicked vs resulted-in-renewal |
| `referral code generated` / `referral shared` / `referral signup` / `referral activated` | Referral funnel. | Mixed | `referral shared` is client-side (no PII); others server-side |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **No instrumentation on reflection or prayer pages** — existing CLAUDE.md privacy rule holds | Per project rule: "no tracking pixels on prayer/reflection pages." Trust is a differentiator; breaking this rule kills it. Events fire from *save* endpoints (server-side), never from page views on those routes. | LOW | Architectural constraint |
| **User-facing data export** — let any user download their own PostHog events | Unusual: most products hide this. A spiritual product offering "here's everything we tracked about you" builds trust. Substack-style "owned audience" applied to owned data. | MEDIUM | Low priority for v1.2 itself; nice to ship later |
| **Stickiness over DAU** — product dashboard uses WAU/MAU as headline | Correct denominator for a 5-minute-daily-practice app; DAU is the wrong frame (Down Dog weekly-goal finding). | LOW | Dashboard configuration only, not code |
| **Server-side fire for all revenue events** | Ad-blocker resilience; accuracy on money-moving events. PostHog best-practice. | LOW | Webhook handlers already exist for Stripe/Salla/Tap — hook in here |
| **Event schema frozen in types file** — `src/lib/analytics/events.ts` with typed interfaces | Prevents event-naming drift over time. Makes v1.3 data work tractable. | LOW | TypeScript types for each event's properties |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Session recording on reflection pages | "Debug UX issues" | Direct violation of the privacy principle; reflections are private. | Session recording disabled globally, or allow-listed to marketing / auth pages only |
| Heatmaps of reflection journal | Same as above | Same as above | Same as above |
| Tracking the *content* of reflections (NLP / sentiment) | "Understand users better" | Betrayal of trust. Content is user property and intimate. Breaks "قلبي يتشرب معاني" relationship instantly. | Track `char_count`, `word_count`, `time_spent` only — metadata, not content |
| Per-user "most-viewed feature" dashboards exposed to user | "Transparency!" | Risks making users self-conscious about their own behavior — anxiety of being watched. | Aggregate-only for the founder; user sees their own reflections / awareness logs, not their click paths |
| 50+ events capturing every interaction | "Maybe we'll need it later" | Noise; obscures signal; inflates PostHog bill; creates maintenance burden. | 10-15 well-chosen events; add more only when a specific question requires them |
| Third-party analytics concurrent with PostHog (Segment, Mixpanel, GA4) | "More data is better" | Privacy sprawl + performance cost (LCP < 6s at risk on 3G). Each extra script is a cost. | PostHog only (existing Meta Pixel excluded from reflection pages per current rule) |
| Client-side event for subscription purchase | Default Stripe / Salla SDK behavior | Ad-blocker kills accuracy; can't measure revenue properly. | Server-side webhook |

**Complexity verdict:** 1 phase, must ship early. It's plumbing; infrastructure for the other 5 features. Low tech risk; mostly additive.

**Dependencies:**
- **None.** This is a foundation. Other features *depend on it* (renewal funnel, referral funnel, badge unlock rate measurement). Recommend Phase 6 (first v1.2 phase) OR shipped in parallel with the first feature.

---

## Feature Dependencies

```
ANALYTICS-* (PostHog instrumentation)
    └──enables measurement of──> all 5 others

RETURN-* (Cycle 2 Transition)
    └──shares Day 28 moment with──> BADGE-* (Day 28 badge)
    └──feeds into──> RENEW-* ("renew at cycle completion" variant)

BADGE-* (Milestone Badges)
    └──content-pairs with──> YIR-* (Year in Review references unlocked badges)

YIR-* (Year in Review)
    └──share-card infra enables──> REFER-* (reuses share-card generator)
    └──depends on data accumulated from──> ANALYTICS-* events + existing reflections table
    └──always-on archive is independent of──> annual YIR moment

RENEW-* (Renewal Prompts)
    └──best-variant ties to──> RETURN-* (cycle completion = best renewal moment)

REFER-* (Referral Program)
    └──share-card reuses──> YIR-* infrastructure if YIR ships first
    └──funnel requires──> ANALYTICS-* events
```

### Dependency Notes

- **ANALYTICS-* enables everything:** the 4 event families (`day/cycle/reflection/badge`, `subscription`, `renewal`, `referral`) are foundation for measuring the other features. Recommend it ships in the first v1.2 phase.
- **RETURN-* and BADGE-* naturally pair:** both own the Day 28 moment. Ship together to avoid tonal mismatch (one is ritual, one is milestone — same screen should feel unified).
- **YIR-* has two layers with different dependency shapes:** always-on archive needs only existing DB state and can ship standalone. Annual Ramadan YIR moment depends on share-card infra + content-curation heuristics and is heavier.
- **REFER-* share card is a cheaper version of YIR share card:** if scheduling is tight, YIR share-card work can be scoped to make REFER-* cheaper later.
- **RENEW-*'s cycle-completion variant depends on RETURN-*:** generic expiry-date banner can ship without it.

---

## Phase Implications (input for Roadmap phase)

The 6 features are not equal-sized; they naturally group into 5-7 phases. This is the feature researcher's view — the Roadmapper will make the final call.

| Suggested phase scope | Why this grouping |
|-----------------------|-------------------|
| **Phase 6: ANALYTICS-*** (PostHog foundation) | Foundation. Unlocks measurement for every later phase. Low risk, highest leverage. |
| **Phase 7: RETURN-* + BADGE-*** (Day 28 moment) | They share the same screen and tone. Splitting them creates dissonance. Content-heavy but tech-light. |
| **Phase 8: RENEW-*** (Renewal prompts) | Revenue-touching; standalone enough to ship independently. Interacts with payment gateways which is its own risk surface. |
| **Phase 9: YIR-* always-on archive** | Depends only on existing data. Modest design work; big user-value. |
| **Phase 10: REFER-*** (Referral program) | Needs share-card infra (can reuse from YIR-* archive if built there). Benefits from analytics being proven by this point. |
| **Phase 11: YIR-* Ramadan annual moment** | Final polish; time-boxed to a specific launch window (Ramadan). Optional for v1.2 if timing misses. |

Alternative phasing: RENEW-* could precede RETURN-*/BADGE-* if expiry risk is acute (users about to churn *now*). Roadmapper decides based on actual expiry dates of the current cohort.

---

## LTV Lift — Which Features Move the Needle Most

Evidence-based ranking for a low-frequency, daily-habit Arabic spiritual app (HIGH confidence on direction, MEDIUM on magnitude — numbers are industry benchmarks, not Taamun-measured):

1. **REFER-* (Referral)** — *highest LTV lift per shekel spent.* Referred users retain 37% better + 18% lower churn (SaaS average). Zero CAC. Compounds. **Risk:** requires social-share moment to be culturally calibrated; Saudi/Gulf share benchmarks are thin in the public literature.
2. **RETURN-* + BADGE-* (Day 28 bridge)** — closes the single biggest churn gap in the product today (CX audit: 60/100, collapses after Day 28). Direct retention lift on the existing cohort. **Risk:** tonal — badges done wrong are worse than no badges.
3. **ANALYTICS-*** — no direct LTV lift, but *enables* measurement-driven tuning of every other feature. Multiplier, not generator.
4. **RENEW-*** — captures value already created; doesn't grow the funnel but plugs leaks. Especially important for quarterly subscribers (199 SAR × 4/year) where renewal cadence is tight.
5. **YIR-* (annual)** — high marketing / word-of-mouth moment once per year, but most users haven't accumulated a year of data yet (v1.0 shipped 2 months ago). Real LTV impact shows 12+ months out.
6. **YIR-* (always-on archive)** — modest retention contribution; primarily a *trust* feature (user owns their history). Underrated over the long term.

---

## Tone-Fit Check — Would a Taamun User Find This Shallow?

| Feature | Shallow if... | Deep if... |
|---------|---------------|------------|
| RETURN-* | Auto-starts cycle 2, confetti animation, "streak saved!" | Quiet transition, user's Day-1 reflection quoted back to them, opt-in "أريد أن أتعمق" |
| BADGE-* | "Day 7 Achievement Unlocked! 🔥", gold tiers, share prompt | `عتبة السابع` unlocks with a verse, private by default |
| YIR-* | Spotify-clone with music/transitions, public leaderboards, MBTI result | Ramadan-anchored, user's own words surfaced, silent share card |
| RENEW-* | Interstitial modal, countdown timer, "lose your reflections!" | Banner with verse, references the user's own Day 28, pause option |
| REFER-* | "Earn cash!", leaderboard, MLM tiers | "ادع صديقًا", both sides free month, private counter |
| ANALYTICS-* | Session recording on reflection pages, sentiment analysis of content | Server-side event fire only, no pixels on prayer pages, user can export their own data |

---

## Arabic / RTL Considerations

- **Copy:** every badge / CTA / banner must be *written in Arabic* natively, never translated. Ziad's review is gating. Duolingo translations into Arabic famously rot; avoid that.
- **Verbs chosen carefully:** `ادع` (invite, religious weight) > `شارك` (share, neutral) for referral. `عتبة / حلقة / منزلة` > `إنجاز` (achievement) for badges. `مراجعة عام` > `ملخص سنوي` for YIR.
- **Hijri / Islamic calendar** as optional/primary date in YIR. At minimum, surface both.
- **RTL share cards:** text flow RTL, punctuation handling (Arabic comma `،` and question mark `؟`), WhatsApp / IG preview must render correctly. Test on actual iOS WhatsApp (RTL bugs are most common there).
- **Font:** existing Tailwind stack; no new fonts. Ensure Arabic weight hierarchy holds on share-image rendering (server-side `next/og` Arabic font inclusion is a known gotcha — test early).
- **No English fallbacks visible:** every user-facing string has an Arabic primary. `dir="rtl"` root is already set.
- **Number formatting:** Eastern Arabic numerals (٠-٩) vs Western (0-9) — pick one and commit. Current app uses Western; YIR stats likely want Eastern for gravitas. Ziad's call.

---

## Competitor Feature Analysis

| Feature | Calm | Headspace | Insight Timer | Muslim Pro | Our Approach |
|---------|------|-----------|---------------|------------|--------------|
| Milestone badges | Streaks + personalized messages | Badges, no share | Streaks + low-friction completion | Minimal | `عتبة` language, no streak counter, private, content-paired |
| Year in review | Annual wellness report (subscriber) | Limited | Yearly recap of minutes | None | Ramadan-anchored, user-quote-centered |
| Renewal prompts | Pre-renewal email + in-app banner | Standard SaaS | Generous free tier softens renewal | Purchase-based (one-time) | Verse-led banner + pause option |
| Referral | None prominent | Family plan | None prominent | None prominent | ادع صديق, both-sides free month |
| Cycle transition | Auto-next-course | Auto-next-course | User-driven | N/A | Opt-in "أريد أن أتعمق" |
| Analytics privacy | Standard | Standard | Standard | Weak history (controversial) | No events on prayer/reflection routes |

---

## Open Questions (for Requirements phase)

1. **Cycle-2 content strategy:** does cycle 2 = same 28 verses with deeper layer, or v1.1's AI-generated cycles take over post-cycle-1? The RETURN-* copy depends on this.
2. **Badge count:** 6 milestone days (1/3/7/14/21/28) = 6 badges, or does each cycle unlock its own set (18 total for 3 cycles)? Impacts content workload.
3. **YIR launch timing:** v1.2 ships before or after the next Ramadan? If after, always-on archive is enough; annual moment waits for v1.3.
4. **Renewal-pause mechanism:** Stripe supports subscription pause; Salla and Tap are unclear. Needs technical spike.
5. **Referral fraud tolerance:** do we accept self-referrals (user creates 2 accounts)? Policy question, not tech.
6. **Eastern vs Western numerals** in YIR stats — aesthetic call.

---

## Sources

**Meditation / wellness apps:**
- [Headspace gamification — StriveCloud](https://www.strivecloud.io/blog/headspace-gamification-features)
- [Headspace case study — Trophy](https://trophy.so/blog/headspace-gamification-case-study)
- [Calm & Headspace mindfulness app boom — Brand Hopper](https://thebrandhopper.com/2025/07/14/calm-headspace-driving-the-mindfulness-app-boom/)
- [Insight Timer streaks — Manas Saloi](https://manassaloi.com/2020/05/15/meditation-app-streak.html)
- [Gamification critique — Zenful Spirit](https://zenfulspirit.com/2025/01/23/gamification-meditation/)
- [Meditation app that's not gamified — Ask MetaFilter](https://ask.metafilter.com/386087/Meditation-app-thats-not-gamified)
- [Streak creep — The Decision Lab](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)

**Duolingo criticism / dark patterns:**
- [Duolingo streak trap — Trophy / Sylvi](https://trophy.so/blog/the-psychology-of-streaks-how-sylvi-weaponized-duolingos-best-feature-against-them)
- [Duolingo psychology — Just Another PM](https://www.justanotherpm.com/blog/the-psychology-behind-duolingos-streak-feature)
- [Duolingo for mental health — BridgeCalm](https://www.bridgecalm.com/blog/how-the-duolingo-model-applies-to-mental-health)
- [Got out of Duolingo trap — Dev.to](https://dev.to/nuzairnuwais/how-i-got-out-of-the-duolingo-streaks-trap-by-building-my-own-app-eg1)

**Year in Review design:**
- [Spotify Wrapped psychology — Growth.Design](https://growth.design/case-studies/spotify-wrapped-psychology)
- [Spotify Wrapped behavioral science — Irrational Labs](https://irrationallabs.com/blog/spotify-wrapped-behavioral-science/)
- [Wrapped surprises — Spotify Design](https://spotify.design/article/wrapped-surprises)
- [Annual review — Reflection.app](https://www.reflection.app/journaling-prompts-guides/annual-review)
- [Spiritual year in review — BuildFaith](https://buildfaith.org/your-spiritual-year-in-review/)

**Referral mechanics:**
- [SaaS referral benchmarks 2025 — ReferralCandy](https://www.referralcandy.com/blog/referral-program-benchmarks-whats-a-good-conversion-rate-in-2025)
- [Referral program metrics 2025 — Prefinery](https://www.prefinery.com/blog/10-key-referral-program-metrics-to-track-2025/)
- [SaaS referral strategies 2025 — Dan Siepen](https://www.dansiepen.io/growth-checklists/saas-referral-program-strategies-optimisations)
- [Top SaaS referral examples — SaaSquatch](https://www.saasquatch.com/blog/rs-saas-referral-marketing-examples)
- [Meem referral program — Saudi Arabia](https://meem.com.sa/referral-program/)

**Renewal / retention UX:**
- [Subscription renewal best practices — Apps365](https://www.apps365.com/blog/subscription-renewal-best-practices/)
- [Subscription UX best practices — BluBolt](https://blubolt.com/insights/11-best-practices-for-subscriptions-ux-design)
- [Mobile app retention — Business of Apps](https://www.businessofapps.com/guide/mobile-app-retention/)
- [Mobile design patterns that boost retention — Procreator](https://procreator.design/blog/mobile-app-design-patterns-boost-retention/)

**PostHog instrumentation:**
- [Event tracking guide — PostHog](https://posthog.com/tutorials/event-tracking-guide)
- [Product analytics best practices — PostHog](https://posthog.com/docs/product-analytics/best-practices)
- [Retention with PostHog — PostHog Docs](https://posthog.com/docs/new-to-posthog/retention)
- [5 events all teams should track — PostHog](https://posthog.com/blog/events-you-should-track-with-posthog)

**Quran apps / Islamic product context:**
- [Build daily Quran reading habit — GTAF](https://gtaf.org/blog/build-a-daily-quran-reading-habit/)
- [Best Quran apps 2025 — Dr Ali Rajabi](https://dralirajabi.com/best-quran-apps-2025/)
- [Muslim Pro widget](https://support.muslimpro.com/hc/en-us/articles/32272726823961-Homescreen-Updated-Widget-iOS)

**Arabic / RTL design:**
- [Mobile RTL design — Kristina Volchek](https://kristi.digital/shots/mobile-app-design-for-right-to-left-languages-arabic-language)
- [RTL Arabic app design — Purrweb](https://www.purrweb.com/blog/halal-design-how-to-make-an-app-in-arabic/)
- [Instagram Arabic RTL — MENAbytes](https://www.menabytes.com/instagram-arabic/)

---
*Feature research for: Taamun v1.2 Retention Loop*
*Researched: 2026-04-18*
*Confidence: MEDIUM-HIGH (strong on meditation-app patterns, strong on referral benchmarks, medium on Saudi/Gulf-specific share-channel conversion, medium on annual-review depth given Taamun's young data)*
