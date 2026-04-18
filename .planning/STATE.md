# Current State

**Last updated:** 2026-04-18 (after v1.2 archive)

---

## Status

- **Last shipped milestone:** v1.2 (tagged)
- **Next milestone:** v1.3 (planning — fresh requirements, 5 open questions)
- **Active phase:** none (between milestones)
- **Active plan:** none
- **Git branch:** main
- **Last commit:** v1.2 Phase 3 + 4 (commit 0df7238) + archive commit pending

---

## Recent context

v1.2 shipped 5 phases in one intensive session immediately after v1.1:

### v1.2 accomplishments
- Guide long-term memory: `soul_summary` auto-refreshed weekly + milestone-triggered
- Reflection theme clustering: OpenAI embeddings + Claude labeling, monthly
- `/insights` page + home widget surfacing themes and narrative summary
- Voice journaling component (drop-in ready, 90s limit, Munsit-backed)
- Accessibility CI audit gating A11y ≥ 0.95 on every push to main

### Pending activation
- DB migrations ×2 in Supabase (soul_summary_themes extension + reflection_themes table)
- All required env vars already set (OPENAI, ANTHROPIC, MUNSIT from v1.0/v1.1)
- Integration decision: where to place `VoiceReflection` component (DayExperience, /reflection, or /journal)

---

## Next action

1. Apply pending migrations to Supabase
2. Decide where `VoiceReflection` integrates (product UX call)
3. Answer open questions in REQUIREMENTS.md (5 decisions needed for v1.3)
4. Run `/gsd:new-milestone` to scope v1.3 formally
5. OR pick a single phase and start directly (PWA polish is lowest-risk start)

---

## Active todos

None in session.

---

## Blockers

### Technical
- None — v1.2 code complete and pushed.

### Operational / product
- v1.3 open questions (5): invite reward type, recap trigger, PWA prompt timing, share moderation, voice tasbeeh tech.
- Carried from v1.1: WhatsApp group creation + co-admin structure.
- Carried from v1.0: book highlights text extraction (not practical with PDF iframe).

---

## Key metrics snapshot

- Total git commits: ~385
- Total shipped milestones: 3 (v1.0, v1.1, v1.2)
- v1.2 added: 8 files, 2 migrations, 3 API endpoints, 2 crons, 1 CI workflow
- Production Lighthouse: A11y 100, SEO 100, Perf ~75-79 (now CI-gated)
- First real customer validation: day 9 — "قلبي يتشرب معاني"

---

## Cost model (post-v1.2 operational, per 1000 users)

| Service | Monthly cost |
|---------|--------------|
| Claude (soul_summary + themes labeling) | ~$10 |
| OpenAI embeddings (clustering) | ~$5 |
| Resend (emails) | Free tier |
| Vercel (hosting + crons) | Free (Hobby) |
| Supabase (DB + auth) | Free tier |
| Munsit (voice STT) | Usage-based, minimal |
| **Total** | **< $20/month for first 1000 users** |
