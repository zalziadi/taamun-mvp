# Current State

**Last updated:** 2026-04-20 (after v2.3 archive)

---

## Status

- **Last shipped milestone:** v2.3 (tagged)
- **Next milestone:** v2.4 (not yet scoped)
- **Git branch:** claude/hopeful-euler (auto-pushes to main)

---

## Recent context

v2.3 shipped 3 phases on top of v2.2:

- **Phase 1:** `ops_alerts` migration with 3 seeded defaults (threads_flagged, journeys_flagged, thread_replies_flagged all > 0) + CRUD API
- **Phase 2:** `/api/cron/check-alerts` daily 00:05 UTC after the snapshot cron, with 12h per-rule debounce, Resend email digest
- **Phase 3:** `/admin/ops/alerts` CRUD UI (16-metric dropdown × 5 operators × threshold + optional label)

---

## Pending activation (operational)

- Apply migration `20260421100000_ops_alerts.sql` to Supabase
- `ADMIN_EMAIL` + `RESEND_API_KEY` in Vercel env (NOW critical — alerts need email to work)
- Restore `send-push` to hourly when upgrading Vercel Pro
- Submit sitemap to Google Search Console
- Seed first creator journey

---

## Next action

1. **Observability loop complete:** v2.1 live counts + v2.2 trends + v2.3 alerts. The founder now has continuous passive monitoring.
2. **Strongest pause signal yet:** 34 phases shipped with no real user data. The three default alert rules will fire immediately if any flagged content appears — which means we'll know the moment real traffic hits.

---

## Active todos

None in session.
