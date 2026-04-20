# Current State

**Last updated:** 2026-04-20 (after v1.6 archive)

---

## Status

- **Last shipped milestone:** v1.6 (tagged)
- **Next milestone:** v1.7 (not yet scoped)
- **Git branch:** claude/hopeful-euler (auto-pushes to main)

---

## Recent context

v1.6 shipped all 3 phases immediately after v1.5:

### v1.6 accomplishments
- **Phase 1 — Invite credits visibility:** `/api/invite/my-rewards` endpoint + InviteShare badge "+N يوم رصيد مكتسب"
- **Phase 2 — Creator follow system:** `creator_follows` table + RLS + follow/unfollow/status API + button on `/journey/[slug]` + publish-transition push fan-out to followers
- **Phase 3 — Daily mod digest:** `/api/cron/mod-digest` runs 08:00 UTC, counts flagged rows, emails summary via Resend to ADMIN_EMAIL (silent on empty queue or missing env)

---

## Pending activation (operational)

- **Apply 1 new migration:** `20260420300000_creator_follows.sql` (done in this session via `supabase db push` in the worktree)
- `ADMIN_EMAIL` + `RESEND_API_KEY` should be set in Vercel for the mod digest to actually send — otherwise it just reports `skipped: email_not_configured` and logs the counts
- Restore `send-push` to hourly when upgrading Vercel Pro (still capped to daily on Hobby)

---

## Next action

1. Scope v1.7 or pause for validation.
2. v1.7 candidates:
   - Inline moderation banner on `/` when admin has items waiting
   - Creator leaderboard on `/discover` (most subscribed / highest completion)
   - Profile pages per creator (`/creator/by/[user_id]` with their full catalog)
   - User "following" tab on `/account` listing creators you follow

---

## Active todos

None in session.
