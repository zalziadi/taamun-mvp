# SUMMARY.md — v1.3 العمق Research Synthesis

**Project:** Taamun v1.3 — Depth & Personalization
**Synthesized:** 2026-04-21
**Sources:** STACK.md · FEATURES.md · ARCHITECTURE.md · PITFALLS.md (4 parallel researchers)
**Overall confidence:** HIGH (MEDIUM only on Arabic VoiceOver actual-user experience and iOS Safari voice edge cases)
**Verdict:** 🟢 **Ready for Requirements**

---

## Executive Synthesis

v1.3 is **not a greenfield milestone** — it is an integration + tone-correction milestone. Between 70-80% of the technical infrastructure already ships in v1.0-v1.2:

- **Voice journaling backend fully built** (`src/lib/munsit.ts` · `/api/voice/stt` route · `useVoiceSession` hook) — v1.3 only wires `VoiceInput.tsx` into `ReflectionJournal`
- **`guide_memory` table exists** with shape `(user_id, soul_summary TEXT, themes JSONB, updated_at)` · `generateSoulSummary` + `maybeUpdateSoulSummary` already invoked in `/api/guide/chat`
- **pgvector enabled** (used for `book_chunks`) — ready for Memory Path B + Themes embeddings
- **ARIA-live patterns** already in RenewalBanner + BadgeGrid
- **Embedding model** is `text-embedding-3-small` at $0.02/1M tokens → v1.3 total compute cost ~$0.13/month at 1,500 users

The headline insight is **tonal, not technical**: `ذكر` (Quranic remembrance) reframes Long-Term Memory from surveillance to faithful companionship. 1,000 years of Sufi `مقامات/منازل` literature provides the theme dictionary for free — classical station names (`صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة`) replace any ML-generated cluster labels.

**Zero new runtime dependencies** across the entire milestone.

---

## Reconciled Phase Order (Recommended)

5 phases, continuing numbering from v1.2's Phase 11 → **12, 13, 14, 15, 16**.

| Phase | Feature | Why this position |
|---|---|---|
| **12** | **A11Y Audit (cross-cutting)** | Baseline-fix v1.0-v1.2 components FIRST so v1.3 components born-accessible. Fixes iOS Safari `aria-label` on SVG bug that affects BadgeGrid + YIR sparkline + RenewalBanner from v1.2. |
| **13** | **Voice Journaling** | Fully-scaffolded backend; well-bounded wiring. Can parallelize with 14. |
| **14** | **Long-Term Memory (Path A)** | Extends existing `guide_memory` + `soul_summary` pattern. Text-summary approach before vector sibling. |
| **15** | **Themes (Sufi `مقامات`)** | Monthly `رسالة` via new cron; reuses embedding infrastructure. Depends on Memory's foundation. |
| **16** | **Memory Path B + Polish** | Granular delete UI · `خاص` privacy flag · vector column for semantic retrieval · full control surface. Optional — can defer parts to v1.4. |

**Alternative:** Phase 13 (Voice) + Phase 14 (Memory-A) can run parallel if file boundaries cleanly split — `VoiceInput.tsx` inside `ReflectionJournal` vs extended `completeWithContext` pipeline.

---

## Key Reconciliations Between Researchers

### R1: Memory architecture — Path A first, Path B later ✅
- **Conflict:** STACK proposed `embedding VECTOR(1536)` column on reflections + ivfflat index + `match_user_reflections` RPC. ARCHITECTURE found `guide_memory` already exists with TEXT `soul_summary` + JSONB `themes`.
- **Decision:** ARCHITECTURE wins. Path A = deepen existing text-summary (cheap · compounds · ship in Phase 14). Path B = add vector sibling column (Phase 16, optional).

### R2: Theme labels — Sufi tradition, NOT ML-generated ✅
- **Conflict:** STACK recommended k-means → Claude auto-label. FEATURES argued Sufi `مقامات` dictionary gives authority + stability + cultural anchoring for free.
- **Decision:** FEATURES wins. Themes classifier uses **frequency + semantic dedupe (cosine ≥0.85)** against a hand-curated 10-station classical dictionary. No ML auto-labeling. No dynamic theme creation.
- **Dictionary:** `صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة` (10 stations)

### R3: Themes digest surface — Monthly رسالة, NOT sidebar/heatmap ✅
- **Conflict:** STACK suggested insights sidebar or heatmap. FEATURES argued heatmap is Strava-for-dhikr (banned per v1.2 §R4). Sidebar violates Phase 6 §R5 sacred-pages rule.
- **Decision:** Monthly `رسالة` (letter). Epistolary · relational · periodic · opt-out. Delivered in-app primary + Hijri-month email secondary. No push. No compulsive checking surface.

### R4: A11y scope — v1.0-v1.2 all in scope ✅
- **Conflict:** Brief said "audit v1.2 components." PITFALLS found v1.0 components (DayExperience, ReflectionJournal) also use undiacritized Arabic + mixed numerals.
- **Decision:** Audit scope = v1.0-v1.2 all. Why: Phase 12's born-accessible benefit requires baseline quality at the foundation.

### R5: Memory default — ON with first-use disclosure ✅
- **Question:** default on or off at launch?
- **Decision:** ON with a first-use modal explaining the `ذكر` frame. Opt-out available. Retroactive memory from existing reflections is **opt-in only**.

---

## Table-Stakes · Differentiators · Anti-Features

### Voice Journaling
- **Table stakes:** Mic button · real-time transcription · no audio storage · 5-min silent cap
- **Differentiators:** Subtle pill (not megaphone) · `مسودة` framing · `الصوت مؤقت · النص لك` footer · re-record entire (not append)
- **Anti-features:** Always-on listening · voice-to-AI-chat · audio archive · append-segments UI · share recording

### Long-Term Memory
- **Table stakes:** Persistent soul_summary across sessions · per-user isolation · RLS enforced · right-to-forget cascade
- **Differentiators:** `ذكر` language throughout · transparency page (`أذكر` archive) · granular delete · memory decay on inactivity
- **Anti-features:** Invisible infrastructure · surveillance framing (`أستخدم لأفهمك`) · surfacing in analytics events · memory-as-ranking

### Themes (Sufi مقامات)
- **Table stakes:** Monthly cron · Hijri boundaries · 10-station dictionary · no ML labels · ≥7 reflections threshold
- **Differentiators:** Monthly `رسالة` format · tradition-sourced glosses (Qushayri / Ibn al-Qayyim refs) · quiet delivery
- **Anti-features:** Insights sidebar · heatmap · confidence percentages · rarity tiers · public ranking · theme badges

### A11y Audit
- **Table stakes:** Lighthouse ≥98 on new surfaces · semantic HTML · ARIA-live for async state · keyboard navigation complete
- **Differentiators:** Arabic-specific diacritization testing · expert blind Arabic VoiceOver user audit (1 round, <10K SAR) · iOS Safari SVG focusability fix
- **Anti-features:** Third-party a11y overlays · auto-fix tools · over-aggressive live regions · aria-label pollution contradicting visible text

---

## Top 5 Critical Pitfalls (from 31)

1. **Memory poisoning (PITFALL #8)** — user sarcasm stored once surfaces out of context months later. Mitigation: `maybeUpdateSoulSummary` only extracts positive/neutral reflections; explicit user delete; confidence-aware retrieval.

2. **iOS Safari `aria-label` on SVG (PITFALL #19)** — silently dropped on non-focusable SVG. Affects v1.2 BadgeGrid + YIR sparkline + RenewalBanner dismiss. Fix: add `tabindex="-1"` + `role="img"` or convert to accessible `<text>` element.

3. **Theme label drift (PITFALL #3)** — Claude auto-labeling produces "patience" vs "صبر" vs "as-sabr" inconsistency. **Eliminated structurally by R2:** no auto-labeling, dictionary-only.

4. **Memory analytics leak (PITFALL #7)** — memory content surfaces in PostHog event properties, violating NFR-04. Mitigation: Phase 11's 4-layer defense (Data · Type · Import · CI grep) extended to memory module.

5. **Duplicate migration files (PITFALL #30)** — 2 `guide_memory` migrations + 2 `guide_sessions` migrations already exist. Must reconcile before Phase 14 adds columns. Audit SQL before writing new migration.

---

## Stack Verdict

**Zero new dependencies.** All v1.3 infrastructure already in package.json.

**DO NOT install** (STACK.md §STOP list):
- `ml-kmeans` · `density-clustering` — use 40-LOC inline Lloyd's k-means (or skip per R2)
- `@vercel/og` — `next/og` built-in
- `recharts` · `d3` — hand-rolled SVG continues pattern from Phase 11
- `pa11y` · `axe-core` — `eslint-plugin-jsx-a11y` already runs; use manual Lighthouse + browser axe extension
- `posthog-node` — `fetch` continues pattern from Phase 6
- `@ai-sdk/react` — not bootstrapping new AI chat; extending existing Anthropic-direct pattern

**STACK confidence: HIGH.**

---

## Architecture Verdict

**Schema changes (additive, NFR-09 compliant — 3-step for vector columns):**
- `reflection_themes` table (NEW, Phase 15)
- `guide_memory` column additions (Phase 14): `memory_count INT` · `last_extracted_at timestamptz`
- `reflections` column addition (Phase 16, optional): `embedding VECTOR(1536)` with ivfflat index
- Duplicate migration reconciliation commit (Phase 12, pre-flight)

**New routes:**
- `/api/cron/monthly-themes` (Phase 15)
- `/api/memory/forget` (Phase 16) — user-triggered delete

**No middleware changes.**

**Cross-cutting:** Extend Phase 11's 4-layer privacy defense to all new surfaces. `memory/`, `themes/`, `voice/` modules added to CI grep allow/deny lists.

---

## Research-Phase Flags (for `/gsd:plan-phase` routing)

| Phase | Skip `/gsd:research-phase`? | Why |
|---|---|---|
| 12 — A11y Audit | ❌ Run | Needs iOS Safari SVG + Arabic VoiceOver audit-round planning |
| 13 — Voice | ✅ Skip | STACK + ARCHITECTURE covered · integration-only |
| 14 — Memory Path A | ✅ Skip | Extends existing guide_memory · well-understood |
| 15 — Themes | ❌ Run | Needs monthly cron timing + Hijri boundary + رسالة template spike |
| 16 — Memory Path B | ✅ Skip | Vector column + delete UI · patterns from Phase 11 |

---

## Open Questions — Requirements Phase Must Answer

1. **Memory default:** on-with-disclosure vs opt-in. **Recommended: ON with first-use modal.**
2. **Themes dictionary size:** 7 / 10 / 12 stations. **Recommended: 10.**
3. **Themes first appearance:** day 1 of new Hijri month with ≥7 accumulated reflections, or from activation? **Recommended: Hijri month 1 + ≥7 threshold.**
4. **A11y audit = v1.3 ship blocker, or post-ship artifact?** **Recommended: ship blocker — bake in Phase 12 before any v1.3 UI work.**
5. **Voice max session length:** silent 5-min cap? **Recommended: yes, silent auto-stop with gentle UX.**
6. **A11y testing resource:** hire blind Arabic VoiceOver expert for 1 audit round (<10K SAR budget)? **Recommended: yes — an order of magnitude more reliable than self-testing.**
7. **Memory Path B** (vector column + delete UI): v1.3 or v1.4? **Recommended: start in Phase 16; can split if timeline pressure.**

---

## Confidence Assessment

| Area | Level | Basis |
|---|---|---|
| Stack + zero-deps verdict | HIGH | File-verified · package.json + src grep |
| Sufi vocabulary + tone | HIGH | 1,000-year tradition · peer-reviewed sources |
| Memory architecture (Path A) | HIGH | Direct code-reading of guide_memory + generateSoulSummary |
| Arabic screen-reader gotchas | HIGH | Abuali 2022 + vendor bug-tracker evidence |
| Voice UX patterns | MEDIUM-HIGH | Multiple independent Untold/Audionotes reviews |
| iOS Safari voice edge cases | LOW-MEDIUM | Needs staging test |
| Munsit rate limits | LOW | Not publicly documented — email vendor |
| Arabic VoiceOver actual-user UX | LOW-MEDIUM | Recommend hiring expert blind Arabic user |
| **Overall** | **HIGH** | Ready for Requirements → Roadmap |

---

## Traffic-Light Verdict

🟢 **READY FOR REQUIREMENTS.**

All four researchers converge on fundamentals: zero deps · existing infrastructure reused · tone-first approach · clear phase order. The 7 open questions are **product decisions for Requirements to capture**, not research gaps.

**Next step:** Define `REQUIREMENTS.md` with REQ-IDs grouped by category (A11Y-*, VOICE-*, MEMORY-*, THEMES-*), then spawn `gsd-roadmapper` for Phases 12-16.

---

## Estimated Impact

**CX 91/100 → 95-96/100** (+4-5)
- Stage 2 +1 (voice reduces friction)
- Stage 3 +2 (memory = VIP depth compounds)
- Stage 5 +1-2 (monthly رسالة = year-long companionship)
- Cross-cutting +0-1 (a11y sets floor, not ceiling — since baseline already 100/100)

**Timeline estimate:** 1 week (vs original 2-week estimate) given scope reduction from integration discoveries.

**Budget impact:** ~$0.13/month OpenAI embeddings at 1,500 users · Munsit TBD (email vendor for rate limits + cost) · 1 blind Arabic VoiceOver expert audit round <10K SAR budget line.
