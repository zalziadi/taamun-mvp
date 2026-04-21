# Requirements — v1.3 العمق (Depth & Personalization)

**Milestone goal:** Transform Taamun from "same experience for every user" into "experience that understands and remembers the user" via 4 depth features + a11y audit. `ذكر` (Quranic remembrance) is the tonal frame.

**Previous requirements:**
- v1.0 archived at [milestones/v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)
- v1.1 archived at [milestones/v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)
- v1.2 archived at [milestones/v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md)

---

## User Personas

1. **Returning Day-28 Completer** — finished one cycle, now in cycle 2+; memory should feel like continuity
2. **VIP Depth-Seeker** — invested in Gene Keys + BaZi; expects v1.3 memory as part of premium
3. **Voice-First User** — types Arabic slowly; voice drops friction dramatically
4. **Screen-Reader User** — VoiceOver/TalkBack Arabic user (currently under-served in the codebase)
5. **Monthly Reflector** — reads monthly `رسالة` like a spiritual letter, not a dashboard

---

## v1.3 Requirements (by category)

### A11Y — Arabic Screen Reader Audit (Phase 12, cross-cutting foundation)

- [ ] **A11Y-01**: Lighthouse Mobile A11y score ≥ 98 on `/`, `/day/*`, `/program`, `/progress`, `/year-in-review`, `/account/referral`, `/pricing`
- [ ] **A11Y-02**: All SVG icons in BadgeGrid + YIR sparkline + RenewalBanner dismiss have `role="img"` + `aria-label` + `tabindex="-1"` (iOS Safari `aria-label` silently-dropped bug fix — PITFALL #19)
- [ ] **A11Y-03**: Arabic text with Eastern numerals (`٠١٢٣`) uses `lang="ar"` + `dir="rtl"` attributes on nearest wrapper
- [ ] **A11Y-04**: Latin text islands inside Arabic flow use `dir="ltr"` + `unicode-bidi: isolate` (extends v1.2 Ta'ammun DS pattern)
- [ ] **A11Y-05**: Async state changes (badge unlock · cycle transition · renewal banner reveal) use `aria-live="polite"` — NEVER `aria-live="assertive"`
- [ ] **A11Y-06**: Keyboard-only navigation complete: Tab traversal, Enter/Space activation on all interactive elements, focus-visible rings
- [ ] **A11Y-07**: Focus management on RenewalBanner dismiss — focus returns to previously-focused element (NOT focus-trap — banner is not a modal)
- [ ] **A11Y-08**: `DayExperience.tsx` reflection save success announced via polite live region with text "تم حفظ تأمّلك"
- [ ] **A11Y-09**: YIR sparkline renders a `<text>` accessible description child (alternative to aria-label on SVG — iOS Safari robust)
- [ ] **A11Y-10**: Blind Arabic VoiceOver expert audit round conducted (1 session, <10K SAR budget line); findings documented in `docs/a11y-audit-v1.3.md`
- [ ] **A11Y-11**: `eslint-plugin-jsx-a11y` rules updated to strict preset (from recommended) — all violations fixed
- [ ] **A11Y-12**: Diacritized Arabic (for reflection prompts that are pre-authored in `taamun-content.ts`) — verify rendering via VoiceOver simulator; undiacritized user-typed content accepted as-is

### VOICE — Voice Journaling Integration (Phase 13)

- [ ] **VOICE-01**: `VoiceInput.tsx` component mounted inline in `ReflectionJournal` (inside `DayExperience`) — NOT inside a modal
- [ ] **VOICE-02**: Record button is a subtle pill with mic icon + "تأمّل بصوتك" label — NOT a megaphone / giant mic
- [ ] **VOICE-03**: Tapping pill starts Munsit STT session via existing `useVoiceSession` hook; real-time transcript shown below pill
- [ ] **VOICE-04**: Session auto-stops silently at 5-min cap with gentle UX (`"وصلنا للحد الأقصى — أكمل بالكتابة"`) — no alarm, no countdown
- [ ] **VOICE-05**: Post-stop: transcript framed as `مسودة` with edit/accept/re-record buttons; user can adjust before saving to reflection input
- [ ] **VOICE-06**: Re-record replaces entire transcript (NOT append); prompt confirms if current transcript has been edited
- [ ] **VOICE-07**: NO audio blob persists — `/api/voice/stt` route pipes audio to Munsit and discards immediately (existing behavior preserved + CI grep enforces)
- [ ] **VOICE-08**: Footer microcopy: "`الصوت مؤقت · النص لك`" — visible whenever recorder is active
- [ ] **VOICE-09**: Mic permission denial shows graceful text fallback: "`لا يمكن الوصول للميكروفون — اكتب تأمّلك`"
- [ ] **VOICE-10**: iOS Safari MediaRecorder fallback cascade: `audio/webm` → `audio/mp4` → `audio/wav` (PITFALL #14 fix)
- [ ] **VOICE-11**: Offline capture: if network unavailable, button disables with tooltip `"متاح عند الاتصال"`
- [ ] **VOICE-12**: `/api/voice/stt` route gains `CRON_SECRET`-style rate limit at app-level (60 req/user/day) — not v1.3 blocker, but hardening
- [ ] **VOICE-13**: Zero `track()` calls inside `VoiceInput.tsx` (component joins the sacred list — PostHog CI grep extended)

### MEMORY — Long-Term Memory Path A (Phase 14)

- [ ] **MEMORY-01**: `guide_memory.soul_summary` is retrieved on every `/api/guide/chat` session start and included in system prompt via `completeWithContext`
- [ ] **MEMORY-02**: `maybeUpdateSoulSummary` continues to run every 6 messages (existing behavior preserved)
- [ ] **MEMORY-03**: First-use modal on /guide shows `ذكر` disclosure: "أذكر تأمّلاتك معك عبر الجلسات. يمكنك تعطيل هذا في أي وقت من صفحتك."
- [ ] **MEMORY-04**: Memory is ON by default at launch. Decision locked 2026-04-21.
- [ ] **MEMORY-05**: User can toggle memory OFF in `/account` — new toggle `profiles.memory_enabled boolean default true`
- [ ] **MEMORY-06**: Memory OFF clears `guide_memory.soul_summary` to empty string + skips future updates; system prompt omits memory block
- [ ] **MEMORY-07**: Memory language in UI uses `ذكر` / `أذكر` framing — NEVER `surveillance` / `track` / `store` in Arabic or English copy
- [ ] **MEMORY-08**: `/api/guide/chat` memory block includes themes JSONB alongside soul_summary — enables theme-aware responses
- [ ] **MEMORY-09**: Right-to-forget cascade: deleting a reflection triggers `maybeUpdateSoulSummary` re-run excluding that reflection
- [ ] **MEMORY-10**: Retroactive memory extraction for existing users is **opt-in only** — one-time prompt on first v1.3 /guide visit asking permission to summarize historical reflections
- [ ] **MEMORY-11**: Memory content NEVER surfaces in PostHog event properties — extends Phase 11 4-layer defense. CI grep bans `soul_summary` / `guide_memory` inside `src/lib/analytics/**` and any `emitEvent(...)` call
- [ ] **MEMORY-12**: Memory staleness: if no reflection in 60 days, soul_summary decays (server-side), first sentence becomes `"آخر ذكر من قبل 60 يوماً — هل تريد تجديد الرحلة؟"`

### THEMES — Monthly رسالة (Phase 15)

- [ ] **THEMES-01**: New `reflection_themes` table — `(user_id, month_key, theme_code, reflection_ids uuid[], confidence, generated_at)`
- [ ] **THEMES-02**: Theme dictionary = **10 Sufi stations** (locked): `صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة`. Decision locked 2026-04-21.
- [ ] **THEMES-03**: Monthly cron `/api/cron/monthly-themes` runs 1st of Hijri month at 02:00 Asia/Riyadh
- [ ] **THEMES-04**: Cron processes users with ≥7 reflections in prior Hijri month; users below threshold produce NO theme row (gentle degradation)
- [ ] **THEMES-05**: Classifier = frequency + semantic dedupe (cosine ≥0.85) — NOT ML-generated labels. NO Claude auto-labeling.
- [ ] **THEMES-06**: Each reflection matched to at most 3 themes (top-3 by similarity); unmatched reflections logged as `misc` (not shown to user)
- [ ] **THEMES-07**: Monthly `رسالة` rendered at `/رسالة/{month_key}` — Amiri serif · ink-900 bg · gold accents · Ta'ammun DS compliant
- [ ] **THEMES-08**: Letter structure: opening greeting (date + month name Hijri) + 2-3 themes with tradition-sourced glosses (Qushayri / Ibn al-Qayyim attributed quotes) + 1-2 user reflection excerpts + closing supplication
- [ ] **THEMES-09**: Delivery: in-app at `/letter` (primary) + optional monthly email to opted-in users (secondary). NO push notification.
- [ ] **THEMES-10**: NO insights sidebar. NO heatmap. NO confidence percentages in UI. NO theme badges. (§R4 anti-patterns extended)
- [ ] **THEMES-11**: Theme surfaces are privacy-split: labels public (10 stations), reflection excerpts privacy-respecting (user-visible only)
- [ ] **THEMES-12**: PostHog events: `monthly_letter_generated` (server, prefix-only: `month_key`) + `monthly_letter_opened` (user-initiated, no content)

### MEMORY-B — Vector Column + Granular Control (Phase 16, optional)

- [ ] **MEMORY-B-01**: `reflections` table gains `embedding VECTOR(1536)` column with ivfflat index (Phase 14 migration extended)
- [ ] **MEMORY-B-02**: `maybeUpdateSoulSummary` enhanced with semantic retrieval: top-K most-similar reflections (not just last N=50)
- [ ] **MEMORY-B-03**: Retrieval weighted: `0.7 * cosine_similarity + 0.3 * recency_decay`
- [ ] **MEMORY-B-04**: User-facing `ذكر` archive at `/account/memory` — lists stored memory facts (derived from soul_summary chunks)
- [ ] **MEMORY-B-05**: Granular delete: each memory fact has `×` button → `/api/memory/forget` route removes + triggers re-summarization
- [ ] **MEMORY-B-06**: `خاص` (private) flag: user marks a reflection as private — excluded from memory + themes + embeddings
- [ ] **MEMORY-B-07**: Phase 16 is **OPTIONAL**. If timeline pressure, split MEMORY-B-01/02/03 into v1.3 + MEMORY-B-04/05/06 into v1.4. Decision locked 2026-04-21.

---

## Non-Functional Requirements (carry forward + update)

- [ ] **NFR-01**: Performance — LCP < 6s on 3G mobile (maintained from v1.2)
- [ ] **NFR-02**: **Accessibility — Lighthouse A11y ≥ 98** (raised from 95 in v1.2 per v1.3 depth audit)
- [ ] **NFR-03**: SEO — Lighthouse SEO = 100 (maintained)
- [ ] **NFR-04**: Privacy — zero tracking pixels on prayer/reflection pages (PROJECT.md principle #4 — extends to memory + voice + themes)
- [ ] **NFR-05**: Cost — v1.3 feature work < 2000 SAR total + 1 blind Arabic VoiceOver expert audit round < 5000 SAR
- [ ] **NFR-06**: RTL — all new UI renders correctly right-to-left
- [ ] **NFR-07**: Arabic-first — all copy Arabic-native; `ذكر` / `رسالة` / `مسودة` / `مقامات` framing throughout
- [ ] **NFR-08**: No new runtime dependencies added (CLAUDE.md rule #6) — zero new npm packages
- [ ] **NFR-09**: Every schema migration is two-step additive; vector columns are 3-step (extend existing PITFALL #26 guard)
- [ ] **NFR-10**: Pre-merge checks: `npx tsc --noEmit && npm run build && npm run lint:analytics-privacy` + `guard:phase-07/08/09/10/11/12/13/14/15/16` all pass

---

## Decisions Resolved (2026-04-21)

1. **Memory default at launch:** ✅ ON with first-use `ذكر` disclosure modal. Opt-out in /account.
2. **Themes dictionary size:** ✅ 10 Sufi stations (`صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة`).
3. **Themes first appearance:** ✅ 1st of Hijri month + ≥7 reflections threshold.
4. **A11y audit scope:** ✅ Ship blocker — Phase 12 must land before any other v1.3 UI work.
5. **Voice max session:** ✅ 5-min silent cap with gentle UX.
6. **A11y expert audit:** ✅ Hire 1 blind Arabic VoiceOver expert (<10K SAR).
7. **Memory Path B scope:** ✅ Start in Phase 16 (optional); can split to v1.4 under timeline pressure.
8. **Theme labels:** ✅ Tradition-sourced dictionary, NOT ML auto-generation.
9. **Themes surface:** ✅ Monthly `رسالة` only — NO sidebar, NO heatmap, NO push.
10. **Retroactive memory:** ✅ Opt-in only for existing users.

---

## Deferred to v1.4+

- YIR Ramadan annual moment (v1.3 backlog carry-over)
- HMAC entitlement colon-split bug fix (v1.2 discovered; v1.4 patch track)
- Phase-07 anti-pattern guard comment-carve-out (1-line patch)
- BaZi VIP integration (needs astrological API design)
- Welcome tutorial / onboarding tour (needs UX research)
- WhatsApp community operational activation (independent track)
- MEMORY-B-04/05/06 (granular delete UI) — if Phase 16 splits

---

## Out of Scope (Explicit Exclusions)

- ❌ Streak counter — permanently banned (tonal)
- ❌ Insights sidebar on dashboard — violates §R5
- ❌ Theme heatmap — Strava-for-dhikr feel
- ❌ Confidence percentages on themes in UI
- ❌ Rarity tiers for themes or stations
- ❌ Theme badges alongside milestone badges
- ❌ Voice-to-AI-chat (talking to guide by voice) — voice is for journaling ONLY
- ❌ Always-on listening
- ❌ Audio archive / re-playable recordings
- ❌ ML-generated theme labels
- ❌ Dynamic theme creation beyond the 10-station dictionary
- ❌ Third-party a11y overlays (accessiBe, UserWay, etc.)
- ❌ Push notification for monthly letter
- ❌ "surveillance" or "analytics" framing of memory
- ❌ Memory surfacing in PostHog event properties

---

## Traceability (authoritative — set by gsd-roadmapper 2026-04-21)

Every v1.3 functional REQ maps to exactly one phase. NFRs are cross-cutting and apply to every phase.

| REQ-ID | Phase | Status |
|---|---|---|
| A11Y-01 | Phase 12 | Pending |
| A11Y-02 | Phase 12 | Pending |
| A11Y-03 | Phase 12 | Pending |
| A11Y-04 | Phase 12 | Pending |
| A11Y-05 | Phase 12 | Pending |
| A11Y-06 | Phase 12 | Pending |
| A11Y-07 | Phase 12 | Pending |
| A11Y-08 | Phase 12 | Pending |
| A11Y-09 | Phase 12 | Pending |
| A11Y-10 | Phase 12 | Pending |
| A11Y-11 | Phase 12 | Pending |
| A11Y-12 | Phase 12 | Pending |
| VOICE-01 | Phase 13 | Pending |
| VOICE-02 | Phase 13 | Pending |
| VOICE-03 | Phase 13 | Pending |
| VOICE-04 | Phase 13 | Pending |
| VOICE-05 | Phase 13 | Pending |
| VOICE-06 | Phase 13 | Pending |
| VOICE-07 | Phase 13 | Pending |
| VOICE-08 | Phase 13 | Pending |
| VOICE-09 | Phase 13 | Pending |
| VOICE-10 | Phase 13 | Pending |
| VOICE-11 | Phase 13 | Pending |
| VOICE-12 | Phase 13 | Pending |
| VOICE-13 | Phase 13 | Pending |
| MEMORY-01 | Phase 14 | Pending |
| MEMORY-02 | Phase 14 | Pending |
| MEMORY-03 | Phase 14 | Pending |
| MEMORY-04 | Phase 14 | Pending |
| MEMORY-05 | Phase 14 | Pending |
| MEMORY-06 | Phase 14 | Pending |
| MEMORY-07 | Phase 14 | Pending |
| MEMORY-08 | Phase 14 | Pending |
| MEMORY-09 | Phase 14 | Pending |
| MEMORY-10 | Phase 14 | Pending |
| MEMORY-11 | Phase 14 | Pending |
| MEMORY-12 | Phase 14 | Pending |
| THEMES-01 | Phase 15 | Pending |
| THEMES-02 | Phase 15 | Pending |
| THEMES-03 | Phase 15 | Pending |
| THEMES-04 | Phase 15 | Pending |
| THEMES-05 | Phase 15 | Pending |
| THEMES-06 | Phase 15 | Pending |
| THEMES-07 | Phase 15 | Pending |
| THEMES-08 | Phase 15 | Pending |
| THEMES-09 | Phase 15 | Pending |
| THEMES-10 | Phase 15 | Pending |
| THEMES-11 | Phase 15 | Pending |
| THEMES-12 | Phase 15 | Pending |
| MEMORY-B-01 | Phase 16 (optional) | Pending |
| MEMORY-B-02 | Phase 16 (optional) | Pending |
| MEMORY-B-03 | Phase 16 (optional) | Pending |
| MEMORY-B-04 | Phase 16 (optional, splittable v1.4) | Pending |
| MEMORY-B-05 | Phase 16 (optional, splittable v1.4) | Pending |
| MEMORY-B-06 | Phase 16 (optional, splittable v1.4) | Pending |
| MEMORY-B-07 | Phase 16 (meta) | Pending |
| NFR-01 | All phases | Pending |
| NFR-02 | All phases | Pending |
| NFR-03 | All phases | Pending |
| NFR-04 | All phases | Pending |
| NFR-05 | All phases | Pending |
| NFR-06 | All phases | Pending |
| NFR-07 | All phases | Pending |
| NFR-08 | All phases | Pending |
| NFR-09 | Phases 14, 15, 16 (schema) | Pending |
| NFR-10 | All phases | Pending |

**Coverage summary:** 56 functional REQs mapped (12 A11Y + 13 VOICE + 12 MEMORY + 12 THEMES + 7 MEMORY-B) + 10 NFR cross-cutting = **66 / 66 REQs · zero orphans · zero duplicates**.

| Category | Phase | REQ-IDs |
|---|---|---|
| A11Y | Phase 12 (foundation · ship blocker) | A11Y-01..12 |
| VOICE | Phase 13 | VOICE-01..13 |
| MEMORY | Phase 14 | MEMORY-01..12 |
| THEMES | Phase 15 | THEMES-01..12 |
| MEMORY-B | Phase 16 (optional) | MEMORY-B-01..07 |
| NFR | All phases | NFR-01..10 (cross-cutting) |

---

## Cross-Phase Integration Checks (locked)

- Phase 6's `emitEvent()` is the ONLY analytics entry point — v1.3 extends, never replaces
- Phase 11's 4-layer privacy defense (Data · Type · Import · CI) applied to Memory + Themes + Voice
- Phase 7's race-safe pattern applied to Memory updates (multi-device reflection save)
- Ta'ammun DS compliance on every new UI (A11Y · Voice pill · رسالة page)
- Existing v1.2 CI guards all pass: analytics-privacy + phase-07/08/09/10/11 anti-patterns
- New v1.3 CI guards: phase-12-a11y + phase-13-voice + phase-14-memory + phase-15-themes + phase-16-memory-b
- Phase 12 pre-flight: reconcile duplicate `guide_memory` / `guide_sessions` migrations BEFORE Phase 14 opens (PITFALL #30)
