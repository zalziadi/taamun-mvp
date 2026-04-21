# Current State

**Last updated:** 2026-04-20 (after v1.9 archive)

---

## Status

- **Last shipped milestone:** v1.9 (tagged)
- **Next milestone:** v2.0 (not yet scoped)
- **Git branch:** claude/hopeful-euler (auto-pushes to main)

---

## Recent context

v1.9 shipped all 4 phases immediately after v1.8:

- **Phase 1:** `src/app/journey/[slug]/opengraph-image.tsx` — next/og at 1200×630 with Amiri + Noto Naskh Arabic
- **Phase 2:** `src/lib/json-ld.ts` schemas — Organization (global), Course (journey), DiscussionForumPosting (thread), FAQPage (faq); injected via dangerouslySetInnerHTML with escape
- **Phase 3:** `src/app/creator/guide/page.tsx` — 5-step public onboarding
- **Phase 4:** `src/app/faq/page.tsx` — 8 Q&A + FAQPage JSON-LD
- Sitemap + robots updated to include /faq + /creator/guide

---

## Pending activation (operational)

- Outstanding from earlier milestones:
  - `ADMIN_EMAIL` + `RESEND_API_KEY` in Vercel env for mod digest
  - Restore `send-push` to hourly when upgrading Vercel Pro
  - Submit sitemap to Google Search Console
  - Seed first creator journey

---

## Next action

1. Scope v2.0 or pause for validation
2. v2.0 candidates:
   - Family plan (multi-user subscription)
   - Creator revenue share model
   - Bilingual landing (English variant)
   - Mobile native wrapper (Capacitor)

---

## Active todos

None in session.
