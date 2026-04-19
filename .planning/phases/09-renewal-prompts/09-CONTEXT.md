# Phase 9: Renewal Prompts In-App — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** Milestone research + Phase 6/7/8 foundation.

<domain>
## Phase Boundary

A subscriber whose `profiles.expires_at` is within 7 days sees a **single, dismissible, "واصل"-framed banner** inside `AppChrome.tsx` (never on sacred routes) that deep-links to the gateway they originally paid through — and a user who already auto-renewed never sees it once. Multi-channel dedup: if email sent today + push sent today, banner is suppressed (no triple-nudge fatigue).

Phase deliverables:
- `RenewalBanner.tsx` client component mounted in `AppChrome.tsx`
- Gateway-aware CTA: routes user to Salla / Tap / Stripe depending on `profiles.original_gateway` column
- New column `profiles.original_gateway text` (two-step migration: additive, then backfill, then enforce)
- Dismiss persistence via LocalStorage key `taamun.renewal_dismissed_until.v1` (48h)
- Privacy exclusion: banner NEVER renders on `/day/**`, `/reflection/**`, `/book/**` (flow preservation + PROJECT.md principle #4)
- Nudge orchestrator: reads signals from existing email_queue + push_subscriptions tables; suppresses banner if already nudged today via another channel
- Entitlement refresh helper: cookie-vs-DB reconciliation when user returns after auto-renewal (stale HMAC cookie → re-minted)
- `renewal_prompted` analytics event fires on first render (Phase 6 contract via `emitEvent`)

</domain>

<decisions>
## Implementation Decisions

### Scope (locked in REQUIREMENTS.md)
- All 9 RENEW-* REQs (RENEW-01..09) in scope
- Banner triggers at exactly 7 days before `expires_at` (per REQUIREMENTS RENEW-01)
- Dismiss window: 48 hours (REQUIREMENTS RENEW-04 — via LocalStorage)
- Dedup channels: email + push + in-app banner (REQUIREMENTS RENEW-06)

### Technical approach
- **Gateway detection — the hard part.** The user's original payment gateway isn't persistently stored today. Existing webhook handlers write to separate tables:
    - `salla_integration` → Salla subscribers
    - `tap_customer_subscriptions` → Tap subscribers
    - `customer_subscriptions` → Stripe subscribers
  Phase 9 must introduce `profiles.original_gateway text` (values: `"salla" | "tap" | "stripe" | "eid_code"`) populated by each webhook on first activation + backfilled from existing rows via a one-time migration.
- **Banner UI model:** renders at top of `AppChrome.tsx`'s main content area (below header, above page children). Uses Ta'ammun DS `.theme-taamun` tokens — gold hairline, `bg-[var(--bg-raised)]`, subtle motion. CTA button = `.btn btn-primary` (filled gold).
- **Dismiss logic:** client-side LocalStorage read on mount; if `dismissed_until > Date.now()`, don't render. On dismiss click, set key to `now + 48h`.
- **Dedup channel read:** server-side helper `shouldShowRenewalBanner(userId, expiresAt)` — returns `{show: boolean, reason?: string}`. Reads `email_queue` (sent today?), `push_subscriptions` last activity, and LocalStorage-derived client-pass flag. The banner component hydrates with this flag from a server component / RSC pass.
- **Entitlement refresh:** new helper `refreshEntitlementIfStale(session, profile)` — if cookie's HMAC token expiry < DB's expires_at, re-mint cookie. Runs in a middleware-adjacent spot OR as a server action triggered on dashboard load.
- **Gateway CTA routes:**
    - Salla → `https://{STORE_SLUG}.salla.sa/checkout?product_id={SKU}` (stored in `appConfig.ts`)
    - Tap → Tap-hosted checkout URL (generated via existing `/api/tap/create-subscription`)
    - Stripe → existing Stripe customer portal URL
    - `eid_code` (legacy Eid campaign) → `/pricing` page with `?source=expired` query
- **NO interstitial modal.** Banner ONLY. Dismissible. Never blocking.

### Privacy + analytics
- `renewal_prompted` fires via Phase 6's `emitEvent()` ONCE per session (debounced client-side) with props `{renewal_days_remaining, gateway, tier}`.
- NO pageview tracking on sacred paths — but RenewalBanner isn't rendered there anyway (path check short-circuits before any hook runs).
- Banner text MUST NOT contain reflection content, day numbers, verse text, or any PII. Copy is generic.

### Banned anti-patterns (subset of SUMMARY.md R4)
- Interstitial modal blocking `/day/**` or `/program`
- Countdown timer / fake scarcity ("2 hours left!")
- "Don't lose access" / "لا تفقد" guilt copy
- Auto-redirect to pricing page
- Banner on `/day/**`, `/reflection/**`, `/book/**` — privacy exclusion
- Multiple nudges on same day (email + push + banner all firing = fatigue)
- Non-dismissible banner — user MUST have agency

### Claude's Discretion
- Exact "واصل" CTA copy (planner proposes 2-3 variants; Ziad chooses at merge)
- Banner visual treatment: single-line horizontal vs. card-style (recommend: thin horizontal strip with gold hairline top/bottom — minimal)
- Whether `expires_at` null = "grandfathered" users with unknown expiry are excluded (recommend: YES, never show banner to them)
- Entitlement refresh trigger point — middleware vs. specific page action

</decisions>

<canonical_refs>
## Canonical References

### Milestone research (authoritative)
- `.planning/research/SUMMARY.md` — §"Table-Stakes · Differentiators · Anti-Features" → Renewal Prompts section; §"Research-Phase Flags" (Phase 9 → RUN /gsd:research-phase for Salla/Tap pause-support — deferred; see "Open Research Questions" below)
- `.planning/research/FEATURES.md` — §Renewal Prompts (tone, anti-patterns)
- `.planning/research/ARCHITECTURE.md` — §RenewalBanner integration (AppChrome.tsx mount point)
- `.planning/research/PITFALLS.md` — #22 (notification fatigue), #23 (triggering on auto-renewed users), #26 (dark-pattern territory)

### Phase 6 outputs (direct dependencies)
- `src/lib/analytics/events.ts` — TypedEvent includes `renewal_prompted` variant
- `src/lib/analytics/server.ts` — `emitEvent()` for server emissions
- `src/lib/analytics/excludedPaths.ts` — sacred path list (BANNER must respect same list)

### Project rules
- `CLAUDE.md` — RTL, no new deps, S-rules
- `.planning/REQUIREMENTS.md` — RENEW-01..09
- `.planning/ROADMAP.md` — Phase 9 section
- `docs/analytics-event-catalog.md` — Phase 9 owns `renewal_prompted` event

### Code touchpoints
- `src/components/AppChrome.tsx` — EXISTING; Phase 9 mounts RenewalBanner here
- `src/components/RenewalBanner.tsx` (NEW)
- `src/lib/renewal/shouldShow.ts` (NEW) — server helper
- `src/lib/renewal/refreshEntitlement.ts` (NEW) — entitlement cookie refresh
- `src/app/api/salla/webhook/route.ts` + `src/app/api/tap/webhook/route.ts` + `src/app/api/stripe/webhook/route.ts` — each gets `original_gateway` write
- `src/app/api/activate/route.ts` — writes `original_gateway = 'eid_code'` on activation code path
- `supabase/migrations/{TIMESTAMP}_v1_2_renewal_column.sql` (NEW) — additive column
- `supabase/migrations/{TIMESTAMP}_v1_2_renewal_backfill.sql` (NEW) — backfill from existing gateway tables
- `src/lib/emails/expiry-warning-template.ts` — EXISTING (Phase 1/v1.1); reuse — no modification

</canonical_refs>

<specifics>
## Specific Ideas

- **Dismiss budget philosophy:** one dismiss = 48h silence. If user dismisses 3 times, banner stops appearing this cycle (they've clearly heard us). Track dismiss count in LocalStorage under `taamun.renewal_dismiss_count.v1`. After 3 dismissals, suppress entirely for remainder of current 7-day window.
- **Auto-renewed users (PITFALL #23):** after webhook processes a successful renewal, the new `expires_at` jumps into the future. Banner logic reads `expires_at - now < 7 days` — but if auto-renewal happened TODAY, `expires_at - now` might still be ~90 days (quarterly) or ~365 days (yearly). Banner naturally self-suppresses. No extra logic needed — but verify with a test.
- **Multi-device consistency:** banner dismiss state is LocalStorage (device-local). Same user on phone + laptop sees banner on BOTH until dismissed on BOTH. Acceptable tradeoff (server-side dismiss would cost a DB write per dismiss — unnecessary cost).

</specifics>

<deferred>
## Deferred Ideas

- Subscription pause feature (Stripe supports it, Salla/Tap TBD) — OUT of v1.2 scope, deferred to v1.3
- Renewal A/B copy testing — deferred
- Referrer-based "invite instead of renewing" suggestion — that's Phase 10's territory
- Email → in-app banner deep-link (email button opens banner with preset CTA) — deferred unless trivial

</deferred>

## Open Research Questions (flagged for planner — not blockers)

1. **Salla subscription pause capability:** does Salla API support "pause" (keep expires_at but freeze billing)? If yes, we can offer pause-instead-of-cancel CTA as a retention lever. If no, simply omit. Planner should NOT spike this in Phase 9 — deferral to v1.3 is acceptable.
2. **Tap subscription lifecycle:** confirm Tap webhook fires on auto-renewal success (not just failure). If yes, the backfill migration can populate `original_gateway` for all active Tap subs.
3. **Stripe portal URL generation:** does the existing Stripe integration expose a `createPortalSession()` helper? If yes, gateway CTA routes through it. If no, create `/api/stripe/portal-session` route.

---

*Phase: 09-renewal-prompts*
*Context gathered: 2026-04-19*
