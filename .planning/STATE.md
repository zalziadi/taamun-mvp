# Current State

**Last updated:** 2026-04-20 (after v2.0 archive)

---

## Status

- **Last shipped milestone:** v2.0 (tagged)
- **Next milestone:** v2.1 (not yet scoped)
- **Git branch:** claude/hopeful-euler (auto-pushes to main)

---

## Recent context

v2.0 shipped all 4 phases immediately after v1.9:

- **Phase 1:** `src/app/en/layout.tsx` + `src/app/en/page.tsx` — English marketing landing (LTR, static)
- **Phase 2:** `src/app/en/faq/page.tsx` — 8 Q&A + FAQPage JSON-LD
- **Phase 3:** Root metadata `alternates.languages` + `/faq` alternates + sitemap + robots updates
- **Phase 4:** `src/components/LanguageSwitcher.tsx` — context-aware AR ↔ EN toggle, mounted in AppChrome

---

## Pending activation (operational)

- Outstanding from earlier milestones:
  - `ADMIN_EMAIL` + `RESEND_API_KEY` in Vercel env for mod digest
  - Restore `send-push` to hourly when upgrading Vercel Pro
  - Submit sitemap to Google Search Console
  - Seed first creator journey

---

## Next action

1. Pause for validation — 25 shipped phases, zero end-user creator or thread data yet
2. Or scope v2.1 candidates:
   - Full English translation of authed app (large scope)
   - Family plan (multi-user subscription, DB + payment changes)
   - Creator revenue share model
   - Mobile native wrapper (Capacitor)

---

## Active todos

None in session.
