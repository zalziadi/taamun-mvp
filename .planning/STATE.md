# Current State

**Last updated:** 2026-04-20 (after v1.4 archive)

---

## Status

- **Last shipped milestone:** v1.4 (tagged)
- **Next milestone:** v1.5 (not yet scoped)
- **Active phase:** none (between milestones)
- **Active plan:** none
- **Git branch:** claude/hopeful-euler (will merge to main)
- **Last commit:** v1.4 all 5 phases batched

---

## Recent context

v1.4 shipped all 5 phases in a single batch on top of v1.3:

### v1.4 accomplishments
- **Phase 1 — Invite reward credit:** `profiles.expires_at` migration + `invite-rewards.applyInviteReward()` + admin endpoint at `/api/invite/apply-reward`
- **Phase 2 — In-app threads:** `threads` + `thread_replies` schema with RLS + moderation; public `/threads/[id]` SSR page + reply form + API
- **Phase 3 — Creator mode MVP:** `creator_journeys` + `days` + `subscriptions` schema; full CRUD API (VIP-gated); `/discover` catalog + `/journey/[slug]` subscribe + `/creator` dashboard + `/creator/[slug]` editor
- **Phase 4 — OG image generation:** `/shared/[slug]/opengraph-image.tsx` via `next/og` ImageResponse with Amiri + Noto Naskh Arabic
- **Phase 5 — Year-end recap cron:** `year-recap` lib (Gregorian + Hijri anchors via Intl) + daily cron route + `vercel.json` entry

---

## Pending activation (operational)

- **Apply 4 new migrations** to Supabase (SQL Editor):
  1. `20260420000000_membership_expiry.sql`
  2. `20260420100000_threads.sql`
  3. `20260420200000_creator_journeys.sql`
- **Wire payment webhooks** (Stripe/Salla/Tap) to call `POST /api/invite/apply-reward` on first successful charge with `ADMIN_MIGRATION_KEY` or `SUPABASE_SERVICE_ROLE_KEY` as `key`
- **Add links:** `/discover` + `/creator` into navbar / account; "ناقش هذه الآية" button on day/book pages pointing to `/threads`
- **Verify:** Gregorian + Hijri cron skipped on non-anchor days — tail Vercel logs around next annual boundary

---

## Next action

1. Apply the 4 pending migrations in Supabase
2. Decide whether to keep building (v1.5 scoping) or freeze for validation.
   Cumulative ship rate: 4 milestones in ~3 days, still zero end-user community/creator data.
3. If v1.5, likely candidates:
   - Thread reply push notifications (wire to existing push infra)
   - Moderation dashboard for flagged threads + creator journeys + shared insights
   - Creator analytics (opens / completions / drop-off per journey)
4. Consider promoting `/creator` + `/discover` in the main nav once ≥ 3 real creator journeys exist.

---

## Active todos

None in session.
