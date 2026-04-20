# Current State

**Last updated:** 2026-04-20 (after v1.8 archive)

---

## Status

- **Last shipped milestone:** v1.8 (tagged)
- **Next milestone:** v1.9 (not yet scoped)
- **Git branch:** claude/hopeful-euler (auto-pushes to main)

---

## Recent context

v1.8 shipped all 4 phases immediately after v1.7:

- **Phase 1:** `SocialProofRotator` on `/` + `/pricing`, backed by new GET `/api/shared`
- **Phase 2:** `FeaturedJourney` on `/` via new `/api/discover/featured`
- **Phase 3:** `src/app/sitemap.ts` + `src/app/robots.ts` — full public URL map + crawler policy
- **Phase 4:** `/creator/leaderboard` SSR (top 10 by aggregate subscribers)

---

## Pending activation (operational)

- Nothing new — v1.8 adds no migrations
- Outstanding from earlier milestones:
  - `ADMIN_EMAIL` + `RESEND_API_KEY` in Vercel env for mod digest
  - Restore `send-push` to hourly when upgrading Vercel Pro
  - Submit `https://www.taamun.com/sitemap.xml` to Google Search Console once indexing is desired

---

## Next action

1. Scope v1.9 or pause for validation
2. v1.9 candidates:
   - Creator revenue share groundwork (payout_estimate view)
   - Family plan (multi-user subscription)
   - Mobile native wrapper (Capacitor)
   - English surface (bilingual landing)

---

## Active todos

None in session.
