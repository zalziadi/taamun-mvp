# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (shipped 2026-04-18)

**Archived:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md)

Email re-engagement automation, web push notifications, AI-generated infinite cycles (hybrid), book highlights + notes (DB-backed), WhatsApp community infrastructure.

> Shipped directly via focused commits same-day — no full GSD discuss→plan→execute cycle was produced. WhatsApp community remains pending operational activation (group admin, moderation policy).

---

## v1.2 — إغلاق الحلقة (Retention Loop) (shipped 2026-04-20)

**Archived:** [v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md) · [v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md) · [v1.2-MILESTONE-AUDIT.md](./v1.2-MILESTONE-AUDIT.md)

6 phases · 44 plans · 70/71 active REQs · 219 integration assertions · 700+ unit tests · zero new deps · Ta'ammun DS site-wide · 2 real bugs caught (Asia/Riyadh timezone fixed, HMAC colon-split documented) · 6 migrations pending apply. Retention gaps closed: Cycle 2 CTA · Milestone badges · Renewal prompts · Referral program · Year-in-Review archive · PostHog analytics foundation.

---

## v1.3 — العمق (Depth & Personalization) (active · started 2026-04-21)

**Milestone goal:** Transform Taamun من "نفس التجربة لكل عميل" إلى "تجربة تفهم العميل وتتذكّره" — عبر long-term memory + voice journaling + Sufi-station themes + full Arabic a11y. `ذكر` (Quranic remembrance) is the tonal frame.

**Artifacts:**
- [REQUIREMENTS.md](./REQUIREMENTS.md) — 56 functional + 10 NFR = 66 REQs
- [research-v1.3/SUMMARY.md](./research-v1.3/SUMMARY.md) · [STACK.md](./research-v1.3/STACK.md) · [FEATURES.md](./research-v1.3/FEATURES.md) · [ARCHITECTURE.md](./research-v1.3/ARCHITECTURE.md) · [PITFALLS.md](./research-v1.3/PITFALLS.md)

**Scale:** 5 phases (12–16; Phase 16 OPTIONAL and splittable to v1.4) · 66 REQs · zero new runtime deps · expected CX 91 → ~96.

**Key context:**
- Phase numbering continues from v1.2's Phase 11 → starts at **Phase 12**.
- **Phase 12 (A11y Audit) is a ship blocker for every other v1.3 UI phase.** It also fixes an inherited v1.2 iOS Safari SVG bug (`aria-label` silently dropped on non-focusable SVG in BadgeGrid / YIR sparkline / RenewalBanner). Phases 13–16 depend on 12 shipping first.
- Pre-flight inside Phase 12: reconcile duplicate `guide_memory` + `guide_sessions` migrations BEFORE Phase 14 adds columns (PITFALL #30).
- 70–80% of v1.3 infrastructure already exists (voice backend, `guide_memory` table, pgvector, embeddings) — v1.3 is integration + tone-correction, not greenfield.
- Cross-cutting NFR-01..10 apply to every phase (performance, A11y ≥98, SEO=100, privacy, cost, RTL, Arabic-first, zero new deps, 3-step vector migrations, pre-merge checks).

### Phases

- [ ] **Phase 12: A11y Audit (cross-cutting foundation)** — Arabic screen-reader audit + iOS Safari SVG fix + migration reconciliation. SHIP BLOCKER for 13/14/15/16.
- [ ] **Phase 13: Voice Journaling** — wire existing `VoiceInput.tsx` into `ReflectionJournal`; `مسودة` framing; no audio storage.
- [ ] **Phase 14: Long-Term Memory (Path A)** — extend existing `guide_memory.soul_summary`; first-use `ذكر` modal; opt-out toggle; right-to-forget cascade.
- [ ] **Phase 15: Monthly رسالة (Themes)** — 10 Sufi stations dictionary · Hijri-month cron · `رسالة` letter surface. NO sidebar, NO heatmap, NO push.
- [ ] **Phase 16 (OPTIONAL): Memory Path B** — `embedding VECTOR(1536)` on reflections · granular delete at `/account/memory` · `خاص` privacy flag. Splittable to v1.4 under timeline pressure.

---

### Phase Details

### Phase 12: A11y Audit (cross-cutting foundation)

**Goal:** Blind Arabic VoiceOver / TalkBack users can complete the full Taamun ritual (enter `/`, open `/day`, save a reflection, dismiss RenewalBanner, view progress) with clarity and dignity. Every v1.0–v1.2 interactive surface meets Lighthouse A11y ≥ 98 and passes a blind-Arabic-expert audit round.

**Depends on:** Nothing — ship blocker for all other v1.3 UI phases.

**Research routing:** ▶️ **RUN `/gsd:research-phase 12`** — needs iOS Safari SVG fix spike + Arabic VoiceOver audit-round planning (<10K SAR expert).

**Requirements:** A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06, A11Y-07, A11Y-08, A11Y-09, A11Y-10, A11Y-11, A11Y-12 · NFR-02 · NFR-06 · NFR-07 · NFR-10

**Pre-flight (inside this phase, before any other v1.3 work):**
- Audit duplicate migrations: `20260323_guide_memory.sql` (user_memory) vs `20260324000000_guide_sessions_memory.sql` (guide_memory + guide_sessions). Confirm authoritative schema. Commit reconciliation before Phase 14 kickoff. (PITFALL #30, ARCHITECTURE R1/R2)

**Success Criteria** (what must be TRUE):
1. Lighthouse Mobile A11y score ≥ 98 on `/`, `/day/*`, `/program`, `/progress`, `/year-in-review`, `/account/referral`, `/pricing` — measured and recorded.
2. A blind Arabic VoiceOver user completes a full day's ritual (enter `/day`, read verse, save reflection, close RenewalBanner) without assistance and confirms the experience feels dignified — findings documented in `docs/a11y-audit-v1.3.md`.
3. Every SVG icon in BadgeGrid, YIR sparkline, and RenewalBanner dismiss announces its purpose on iOS Safari VoiceOver (iOS `aria-label` silently-dropped bug verified fixed via `role="img"` + `tabindex="-1"` + `<text>` child).
4. Reflection save success announces "تم حفظ تأمّلك" via `aria-live="polite"` — never `assertive`; verified not interrupting mid-verse reads on `/day`.
5. `eslint-plugin-jsx-a11y` strict preset passes; CI fails on any violation; `npm run lint` green.
6. Duplicate `guide_memory` / `guide_sessions` migrations reconciled — one authoritative schema committed before Phase 14 opens.

**Plans:** TBD

**UI hint**: yes

**Banned anti-patterns** (enforced by `scripts/guards/phase-12-anti-patterns.sh`):
- Third-party a11y overlays (accessiBe, UserWay, Level Access) — make RTL worse, not better.
- English `aria-label` on Arabic-rendered content (`aria-label="[A-Za-z ]+"` on Arabic page = bug).
- `aria-live="assertive"` on anything except blocking errors (never for badge unlock / save success / banner reveal).
- `letter-spacing` CSS on any element with `lang="ar"` or `dir="rtl"` (breaks Arabic glyph joining).
- Character-splitting Arabic strings into per-letter `<span>`s for animation (breaks screen-reader word boundaries).
- Auto-generated ML `alt` text on SVG charts (generic, misses meaning).
- Hiding `SilenceGate` from VoiceOver via `aria-hidden="true"` (violates equivalent-experience principle).
- `role="dialog"` or focus-trap on RenewalBanner (it is NOT a modal — it's an inline banner; A11Y-07).

**Risks & Mitigations** (top from PITFALLS.md):
- **iOS Safari SVG `aria-label` silently dropped (PITFALL #2, #19 summary)** → Use `<text>` child element inside SVG + wrap in `<button>` or add `tabindex="-1"` + `role="img"`. Verify on real device, not simulator.
- **Eastern Arabic numerals read wrong by mixed-locale screen readers (PITFALL #21)** → Wrap pattern `<span lang="ar" aria-label="{arabic-words}">١٢٣</span>`; number-to-Arabic-words utility (~30 LOC, zero deps).
- **Live-region announcement barrage on badge/progress save (PITFALL #22)** → `polite` default; max 1 announcement / 3s; silence on `/day`, `/reflection`, `/book` sacred surfaces.

---

### Phase 13: Voice Journaling

**Goal:** An Arabic-L1 user opens `/day`, taps the subtle `تأمّل بصوتك` pill inside ReflectionJournal, speaks for up to 5 minutes, edits the `مسودة` transcript, and saves it as their reflection — with zero audio ever persisted.

**Depends on:** Phase 12 (A11y baseline; mic-pill label + `aria-pressed` state + recorder-active live region must be born-accessible).

**Research routing:** ⏭️ **SKIP `/gsd:research-phase`** — STACK + ARCHITECTURE covered; integration-only; `VoiceInput.tsx` + `useVoiceSession` + `/api/voice/stt` already shipped.

**Requirements:** VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, VOICE-06, VOICE-07, VOICE-08, VOICE-09, VOICE-10, VOICE-11, VOICE-12, VOICE-13 · NFR-04 · NFR-06 · NFR-08

**Success Criteria** (what must be TRUE):
1. User taps the voice pill inside `ReflectionJournal` (NOT a modal), speaks, sees real-time transcript, and saves text to `reflections.note` — no audio blob ever touches disk or logs.
2. Session auto-stops silently at 5 minutes with gentle "وصلنا للحد الأقصى — أكمل بالكتابة" message — no alarm, no countdown, no panic.
3. Transcript arrives as an editable `مسودة` with accept / edit / re-record buttons — user can adjust text before saving.
4. Mic permission denial and offline state both surface graceful text-input fallback ("لا يمكن الوصول للميكروفون — اكتب تأمّلك" / "متاح عند الاتصال") — never a hung button.
5. iOS Safari MediaRecorder works end-to-end via MIME fallback cascade (`audio/webm;codecs=opus` → `audio/webm` → `audio/mp4`) — verified on real iPhone + Safari.
6. CI grep on `src/components/VoiceInput.tsx` confirms zero `track()` / `emitEvent()` calls and zero audio persistence patterns; `/api/voice/stt` rate-limit = 60 req/user/day enforced.

**Plans:** TBD

**UI hint**: yes

**Banned anti-patterns** (enforced by `scripts/guards/phase-13-anti-patterns.sh`):
- Big centered hero mic button (Instagram voice-message aesthetic) — use subtle pill only.
- Live transcription overlaid while user is still speaking — transcript revealed only after stop.
- Auto-save on transcription complete — explicit save tap always required.
- Audio persisted to Supabase Storage, Vercel logs, Sentry, or PostHog — `audio_*` column names banned; `Blob` / `MediaRecorder` imports banned outside `src/components/VoiceInput.tsx` + `src/lib/voice/**` + `src/app/api/voice/**`.
- Voice-to-AI-chat ("talk to the guide by voice") — voice is for journaling ONLY.
- Playback UI / saved audio / re-recordable session archive.
- Append-segments pattern — re-record replaces entire transcript.
- Recording timer in large numerals — time-consciousness rushes reflection.
- Silent `track()` of transcript text, duration, or word count in PostHog event properties (`transcript`, `*_snippet`, `utterance` banned as property names).
- Voice available on sacred surfaces outside `ReflectionJournal` (no mic on `/book`, `/program`).

**Risks & Mitigations** (top from PITFALLS.md):
- **iOS Safari MediaRecorder silently fails on non-webm codecs (PITFALL #13)** → Feature-detect `MediaRecorder.isTypeSupported()` cascade; explicit `start(1000)` timeslice; `visibilitychange` listener to auto-stop on backgrounded tab.
- **Audio leaks into Vercel logs / Sentry / PostHog despite "no storage" promise (PITFALL #17)** → Four-layer defense (Data · Type · Import · CI) mirroring Phase 11 pattern; `export const runtime = "nodejs"`; no Sentry in voice route; IndexedDB auto-purge on success/24h; integration harness asserts signature-marker audio never appears in any outbound payload.
- **Accidental 15-minute pocket recordings burn Munsit quota + produce garbage transcripts (PITFALL #19)** → 5-min client cap (REQ VOICE-04); silence detection via Web Audio analyzer; waveform + duration preview + explicit confirm before transcription submit.

---

### Phase 14: Long-Term Memory (Path A)

**Goal:** A returning Day-28 completer opens the guide on cycle 2 and it remembers their journey — referencing prior reflections as `ذكر` (faithful recollection), never as surveillance. Memory is ON by default, transparently disclosed at first use, and easily disabled at `/account`.

**Depends on:** Phase 12 (A11y for first-use modal + `/account` toggle UI + migration reconciliation must have landed so `guide_memory` schema is authoritative).

**Research routing:** ⏭️ **SKIP `/gsd:research-phase`** — extends existing `guide_memory` + `maybeUpdateSoulSummary`; well-understood.

**Requirements:** MEMORY-01, MEMORY-02, MEMORY-03, MEMORY-04, MEMORY-05, MEMORY-06, MEMORY-07, MEMORY-08, MEMORY-09, MEMORY-10, MEMORY-11, MEMORY-12 · NFR-04 · NFR-07 · NFR-08 · NFR-09

**Success Criteria** (what must be TRUE):
1. On every `/api/guide/chat` session start, `guide_memory.soul_summary` + `themes` JSONB are retrieved and injected into the system prompt via `completeWithContext` — verified by prompt-snapshot test.
2. First-time user on v1.3 `/guide` sees a `ذكر` disclosure modal ("أذكر تأمّلاتك معك عبر الجلسات. يمكنك تعطيل هذا في أي وقت من صفحتك.") — dismisses ONCE, never re-shown.
3. Toggling memory OFF at `/account` (`profiles.memory_enabled = false`) clears `soul_summary` to empty string, halts future updates, and the system prompt omits the memory block — observed via DB query + prompt snapshot.
4. Deleting a reflection at `/account` triggers `maybeUpdateSoulSummary` re-run excluding that reflection within the same request transaction — right-to-forget cascade verified.
5. After 60 days without a reflection, `soul_summary` first sentence becomes "آخر ذكر من قبل 60 يوماً — هل تريد تجديد الرحلة؟" — decay behavior confirmed by date-travel test.
6. CI grep confirms `soul_summary` / `guide_memory` / `MemoryContext` identifiers never appear in `src/lib/analytics/**` or inside any `emitEvent(...)` call — four-layer privacy defense green.

**Plans:** TBD

**UI hint**: yes

**Banned anti-patterns** (enforced by `scripts/guards/phase-14-anti-patterns.sh`):
- Arabic or English copy using `surveillance` / `track` / `store` / `monitor` / `تتبّع` / `رصد` / `مراقبة` framing — `ذكر` / `أذكر` only.
- Trait profiling / personality inference ("user is a cautious introvert") — events + user statements only, never synthesized traits.
- Memory surfaced in PostHog event properties (`memory_*` property names banned except `memory_tier` enum and `memory_count` integer).
- Invisible memory with no user-viewable inventory — transparency is mandatory.
- Retroactive memory extraction on existing users without explicit opt-in prompt (MEMORY-10).
- Memory content passed to email templates, OG images, push notifications, or any outbound channel.
- `MemoryContext` type imported outside `src/lib/guide/**` — enforced by import lint.
- Memory referenced without explicit `أذكر أنك...` marker in guide responses (no stealth recall).
- Memory storage from user utterances classified as despair/sarcasm (valence filter).
- Two-tier privacy (VIP gets richer memory pipeline than paid tiers) — invariants are universal.

**Risks & Mitigations** (top from PITFALLS.md):
- **Memory poisoning: sarcastic/despair utterance stored as stable belief, re-surfaced months later (PITFALL #7, #8)** → Three-tier memory (`ephemeral` / `episodic` / `semantic`); promotion requires ≥3 session recurrence; emotional-valence filter (Claude classifier temp=0) blocks `despair/sarcasm` from semantic tier; first 4 weeks post-ship = semantic promotion disabled, manual review queue.
- **Cross-device inconsistency — phone writes memory, laptop reads stale (PITFALL #9)** → Synchronous write for user-explicit preference statements; DB-as-source-of-truth reads on every session start; optimistic UI acknowledgment ("سجّلت أن تركيزك...").
- **Right-to-forget cascade incomplete — reflection deleted but memory retains derived content (PITFALL #10)** → `ON DELETE CASCADE` on embedding tables; memory with `source_reflection_ids[]` is recomputed (≥2 remaining) or deleted (<2); transactional endpoint with user-visible confirmation "تم حذف التأمّل وأي استنتاجات مبنية عليه".

---

### Phase 15: Monthly رسالة (Themes — Sufi 10-Station Dictionary)

**Goal:** On the 1st of each Hijri month, a qualifying user (≥7 reflections in the prior Hijri month) receives a contemplative `رسالة` at `/رسالة/{month_key}` — 2–3 Sufi stations that returned to their heart, with tradition-sourced glosses and their own words quoted back. No dashboard. No heatmap. No push.

**Depends on:** Phase 12 (A11y of the `رسالة` page + Amiri-serif rendering) · Phase 14 (memory + themes JSONB feed retrieval; shared embedding infrastructure lives with memory).

**Research routing:** ▶️ **RUN `/gsd:research-phase 15`** — needs Hijri-boundary cron timing spike + `رسالة` template validation (Qushayri / Ibn al-Qayyim gloss vetting) + 10-station dictionary Arabic-variant normalization validation.

**Requirements:** THEMES-01, THEMES-02, THEMES-03, THEMES-04, THEMES-05, THEMES-06, THEMES-07, THEMES-08, THEMES-09, THEMES-10, THEMES-11, THEMES-12 · NFR-04 · NFR-07 · NFR-08 · NFR-09

**Success Criteria** (what must be TRUE):
1. `/api/cron/monthly-themes` runs on the 1st of each Hijri month at 02:00 Asia/Riyadh, populates `reflection_themes` only for users with ≥7 reflections in the prior Hijri month, and logs `monthly_letter_generated` with prefix-only `month_key`.
2. User with ≥7 reflections visits `/رسالة/{month_key}` and reads a letter opening with Hijri date + month name, 2–3 Sufi-station themes (from the locked 10) with Qushayri / Ibn al-Qayyim gloss, 1–2 of their own reflection excerpts, closing supplication — rendered in Amiri serif with Ta'ammun DS.
4. User with <7 reflections sees NO letter surface (gentle degradation — the feature silently does not exist for them; no "not enough" error).
5. Zero theme labels generated by ML / Claude auto-labeling — every label is one of the 10 locked stations (`صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة`) verified via post-validation regex against the fixed vocabulary.
6. Classifier = frequency + semantic dedupe (cosine ≥ 0.85) — each reflection matched to at most 3 themes; unmatched reflections logged as `misc` (never shown to user).

**Plans:** TBD

**UI hint**: yes

**Banned anti-patterns** (enforced by `scripts/guards/phase-15-anti-patterns.sh`):
- Insights sidebar on `/program`, `/day`, `/progress`, or anywhere else — `رسالة` page only.
- Calendar heatmap of themed days ("your صبر days") — Strava-for-dhikr, permanently banned.
- ML-generated theme labels / Claude open-prompt labeling — classification against fixed 10-station vocabulary only.
- Confidence percentages / match scores in UI ("82% صبر") — binary assignment, no precision theater.
- Rarity tiers / collection UI ("you've explored 7 of 12 stations!") — maqamat are not Pokémon.
- Auto-tag reflections inline while user is writing — tagging is invisible, assignment is post-hoc, surface is monthly only.
- Push notification for monthly letter — delivery is in-app primary + optional email secondary.
- Theme labels in PostHog event properties except the locked `theme_label` from the 10-station enum (`theme_context` / `theme_evidence` / `theme_source_snippet` banned).
- Themes on OG share cards, referral cards, or any cross-user surface — strictly private.
- Phrase-based theme names ("التسليم لأمر الله في المواقف الصعبة") — one-word station + gloss as subtitle.

**Risks & Mitigations** (top from PITFALLS.md):
- **Hijri-boundary cron timezone bug — letter arrives on wrong day (ARCHITECTURE R3, PITFALL #26 analog)** → Use `getHijriDate()` consistently (already in `analyze-patterns`); cron schedules daily at 02:00 Asia/Riyadh, handler checks "is today Hijri day 1?" and exits fast otherwise; integration test asserts Hijri-month boundary behavior.
- **Theme label drift / English contamination / hallucination (PITFALL #3)** → Fixed 10-station vocabulary only; post-validation regex `^[\u0600-\u06FF]{2,8}$`; temperature 0; classification (select) not generation (write); spot-check N=10 per release.
- **Stale/thrashing themes vs rolling-window freshness (PITFALL #4)** → Idempotency table `theme_cluster_runs(user_id, month_key)` with `UNIQUE` constraint; max 2 runs/user/day circuit breaker; `OPENAI_DAILY_BUDGET_USD` global ceiling; `requireCronSecret(req)` guard on the route.

---

### Phase 16 (OPTIONAL): Memory Path B — Vector + Granular Control

**Goal:** A depth-seeking user (VIP or otherwise) visits `/account/memory` and sees their `ذكر` archive as deletable cards, can mark specific reflections as `خاص` (private, excluded from memory/themes/embeddings), and receives semantically-retrieved past reflections from the guide instead of text-summary-only context.

**Depends on:** Phase 12 (A11y) · Phase 14 (Memory Path A — summary-based memory must be shipped and measured first; vector addition is purely additive).

**Research routing:** ⏭️ **SKIP `/gsd:research-phase`** — vector column + delete UI follow Phase 11 + ARCHITECTURE Path B patterns; well-scoped.

**OPTIONAL:** Phase 16 can split under timeline pressure — MEMORY-B-01/02/03 (vector column + retrieval) stay in v1.3, MEMORY-B-04/05/06 (granular delete UI + `خاص` flag) move to v1.4. Decision locked 2026-04-21 (MEMORY-B-07).

**Requirements:** MEMORY-B-01, MEMORY-B-02, MEMORY-B-03, MEMORY-B-04, MEMORY-B-05, MEMORY-B-06, MEMORY-B-07 · NFR-04 · NFR-08 · NFR-09

**Success Criteria** (what must be TRUE):
1. `reflections.embedding VECTOR(1536)` column is populated via 3-step additive migration (extension → nullable column → backfill cron → ivfflat index); deploy causes zero `/api/program/*` latency spike.
2. `maybeUpdateSoulSummary` retrieves top-K reflections via weighted score `0.7 * cosine_similarity + 0.3 * recency_decay`; integration test asserts day-9 patience reflection surfaces for a day-300 user asking about `صبر`.
3. User at `/account/memory` sees their `ذكر` archive — each fact has a `×` button; clicking calls `/api/memory/forget`, removes the fact, re-summarizes memory, and UI confirms "تم حذف هذا الذكر".
4. User marks a reflection as `خاص` (private); that reflection is excluded from memory extraction, theme classification, and embedding generation — verified by DB query + integration assertion.
5. Cross-user isolation verified: vector search integration test impersonating user A returns zero of user B's reflections; RLS + mandatory `WHERE user_id = :current` double-barrier.

**Plans:** TBD

**UI hint**: yes

**Banned anti-patterns** (enforced by `scripts/guards/phase-16-anti-patterns.sh`):
- Vector column `ADD COLUMN embedding vector(1536) NOT NULL` single-step migration — 3-step additive ONLY.
- Embedding backfill without `requireCronSecret(req)` guard — cost/RLS attack vector.
- Duplicate embeddings util (`embedText` duplicated in `themes/` vs `memory/`) — one shared primitive in `src/lib/embeddings/index.ts` only.
- `embedding` column exposed on any user-returning JSON API response (embedding blobs never leave server).
- Memory archive search indexable via global site search — reachable only from `/account/memory`.
- VIP-only embedding pipeline (two-tier privacy model) — universal invariants.
- Granular-delete endpoints without transaction (partial failure = orphan references).
- `خاص` flag on a reflection that doesn't cascade-exclude from existing cached memory (stale inclusion bug).

**Risks & Mitigations** (top from PITFALLS.md):
- **Three-step vector migration breaks live `/api/guide` during deploy (PITFALL #26)** → (1) `CREATE EXTENSION IF NOT EXISTS vector;` + nullable column (instant); (2) backfill cron `/api/cron/backfill-embeddings` processes 100 rows/min, respects `OPENAI_DAILY_BUDGET_USD`; (3) ivfflat index after backfill; app code handles `embedding IS NULL` gracefully.
- **Embeddings infrastructure duplication between Phase 14 themes data path and Phase 16 memory vectors (PITFALL #28)** → Single `src/lib/embeddings/index.ts` with `EMBEDDING_MODEL` + `EMBEDDING_DIM` constants; single `openai_usage_log`; grep guard `scripts/guards/embeddings-discipline.sh` asserts one callsite pattern.
- **Hallucinated recall — guide "remembers" something user never said (PITFALL #12)** → Citation contract in system prompt (verbatim `«...»` only); output validation (regenerate if quoted string not in retrieved memory); cosine ≥ 0.80 threshold; cross-user RLS integration test; user-facing "هذا ليس صحيحاً" flag → `disputed` marker + recall exclusion.

---

### Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 12 · A11y Audit | 0/0 | Not started | - |
| 13 · Voice Journaling | 0/0 | Not started | - |
| 14 · Memory Path A | 0/0 | Not started | - |
| 15 · Monthly رسالة | 0/0 | Not started | - |
| 16 · Memory Path B (optional) | 0/0 | Not started | - |

---

### Execution Order

1. **Phase 12** (A11y Audit + migration pre-flight) — must ship first; blocks 13/14/15/16.
2. **Phase 13** (Voice Journaling) and **Phase 14** (Memory Path A) — can parallelize once 12 lands (clean file boundaries: `VoiceInput.tsx` in `ReflectionJournal` vs extended `completeWithContext` pipeline).
3. **Phase 15** (Monthly رسالة) — after 14 (shared embedding infrastructure lives with memory).
4. **Phase 16** (Memory Path B) — after 15; optional; splittable to v1.4.

### REQ Coverage

| Category | Phase | REQ-IDs | Count |
|---|---|---|---|
| A11Y | 12 | A11Y-01..12 | 12 |
| VOICE | 13 | VOICE-01..13 | 13 |
| MEMORY | 14 | MEMORY-01..12 | 12 |
| THEMES | 15 | THEMES-01..12 | 12 |
| MEMORY-B | 16 | MEMORY-B-01..07 | 7 |
| NFR (cross-cutting) | 12–16 | NFR-01..10 | 10 |
| **Total** | | | **66 / 66** ✓ |

Every v1.3 requirement maps to exactly one phase (NFRs are cross-cutting and apply to all). No orphans. No duplicates.

---

## v1.4+ (backlog)

- YIR Ramadan annual moment (v1.3 backlog carry-over)
- HMAC entitlement colon-split bug fix (v1.2 discovered; v1.4 patch track)
- Phase-07 anti-pattern guard comment-carve-out (1-line patch)
- BaZi VIP integration (needs astrological API design)
- Welcome tutorial / onboarding tour (needs UX research)
- WhatsApp community operational activation (independent track)
- MEMORY-B-04/05/06 (granular delete UI) — if Phase 16 splits
- Subscription pause feature (needs Salla/Tap capability spike)
- Family plan (multi-user)

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Content creators publish their own 28-day journeys
- Embeddable widget for imams/teachers

---

## Principles

1. **No feature ships without real user validation.** The "قلبي يتشرب معاني" feedback is the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile.
3. **Arabic-first:** no English-only flows. RTL throughout. `ذكر` / `رسالة` / `مسودة` / `مقامات` framing where applicable.
4. **Privacy:** no tracking pixels on prayer/reflection pages — enforced by CI grep, not documentation. Extends to memory + voice + themes surfaces.
5. **Tonal guardrails:** every v1.3 phase explicitly bans surveillance framing, Strava-for-dhikr heatmaps, ML-generated theme labels, and "Achievement Unlocked!" gamification. `ذكر` replaces surveillance register entirely.
6. **DB is source of truth:** entitlement HMAC cookie is a cache; renewal/badge/cycle/memory logic always reads the DB.
7. **Two-step migrations** (additive-then-enforce) for text/boolean columns; **three-step migrations** for vector columns (extension → nullable column → backfill cron → index).
8. **Zero new runtime dependencies** (CLAUDE.md rule #6) across v1.3.
