# v1.3 Stack Analysis — Zero New Deps Target

**Milestone:** v1.3 العمق (Depth & Personalization)
**Researched:** 2026-04-20
**Mode:** Subsequent-milestone stack delta (no re-research of existing stack)
**Overall confidence:** HIGH
**Verdict:** **All 4 features shippable with zero new runtime dependencies.** One optional devDep for a11y CI (recommended but not required).

---

## Executive Summary

Every v1.3 feature already has 80–95% of its infrastructure in the repo. The question's framing (e.g., "does pgvector already exist?", "is `embedText` available?") implies uncertainty — the evidence shows these are already shipped and battle-tested in production v1.2.

**Material corrections to the milestone brief:**

1. **Embedding model is NOT ada-002.** Code uses `text-embedding-3-small` (`src/lib/rag.ts:4`). Pricing is **$0.02 / 1M input tokens**, not $0.10. Cost math in the brief is ~5× too high — corrected below.
2. **pgvector IS installed.** Migration `20260310000000_reflection_rag_analytics.sql` declares `CREATE EXTENSION vector`, `book_chunks` table with `VECTOR(1536)`, and the `match_book_chunks` RPC. Cosine similarity (`<=>`) is already the ordering operator.
3. **`guide_memory` table already exists** (migration `20260324000000_guide_sessions_memory.sql`) — `soul_summary TEXT` + `themes JSONB`. It is already written by `generateSoulSummary()` every 6 messages in `/api/guide/chat`. v1.3 extends this, does not create it.
4. **Voice journaling is already built end-to-end.** `src/lib/munsit.ts` (server client), `/api/voice/stt` (Node route, 2 MB cap), and `src/app/guide/voice/useVoiceSession.ts` (MediaRecorder + 60s cap + mic-denied/no-speech/stt-failed error taxonomy). v1.3 work is **wiring this into `ReflectionJournal`** — not building it from scratch.
5. **ARIA-live is already a pattern.** 5 components already use `aria-live` / `role="status"` / `role="alert"` including `RenewalBanner` and `BadgeGrid` (the exact components in the brief). v1.3 is an audit + gap-fill, not an introduction.

**Bottom line:** v1.3 is mostly integration + ML layer, not platform work. The brief's "zero new deps" target is not ambitious — it's the natural outcome.

---

## (1) Reflection Themes ML Clustering

### In-DB vs app-side: **app-side k-means in Node — HIGH confidence**

**Why not in-database:**
- pgvector supports similarity search (`<=>`) but **does not ship k-means** as a built-in operator. There are community extensions (`pg_kmeans`, `pgml`) but adding them to Supabase managed Postgres requires Supabase Enterprise or a self-hosted instance. This violates the "no new infra" spirit of rule #6.
- Supabase's hosted Postgres does not allow custom extensions outside their allowlist (pgvector is allowed; k-means extensions are not, as of 2026).

**Why app-side k-means works:**
- **Scale is tiny.** 90 reflections × 1536 dims = 138 KB per user. Clustering 90 points into 3–5 clusters is ~50 ms in Node with a naive Lloyd's algorithm (no library needed).
- **Monthly batch, not real-time.** Cron → read embeddings → cluster → write themes → Claude labels. No latency budget pressure.
- **Zero deps: implement Lloyd's in ~40 lines of TypeScript.** Init with k-means++ (random weighted seeding), iterate centroids, done. This is the same complexity as one file in `src/lib/ai/*`.

**Recommended approach:**
```
src/lib/ai/themesClustering.ts   // pure function: embeddings[] → clusters[]
src/app/api/admin/themes/digest  // cron-triggered monthly job
```

Cluster count: **k=3** for users with <30 reflections, **k=5** for ≥30. Simple rule.
Labeling: pass top-3 reflections per cluster to Claude with prompt "لخّص الموضوع المشترك في كلمة واحدة" (e.g., "صبر", "شكر", "توكّل").

### Cost model — **CORRECTED**

The brief uses ada-002 pricing ($0.10/1M). **Actual model is `text-embedding-3-small` at $0.02/1M.**

However, there's a bigger savings opportunity: **reflections are already embedded**. If we store embeddings in `reflections.embedding VECTOR(1536)` (one-time migration), we never re-embed. Clustering becomes **$0/month ongoing** for existing text.

**Scenario A — re-embed every month (wasteful):**
- 90 reflections × 50 tokens = 4,500 tokens/user
- 1,500 users × 4,500 = 6.75 M tokens
- 6.75 M × $0.02/1M = **$0.135/month total** (not $0.67)

**Scenario B — embed once, cluster monthly (recommended):**
- Embed on reflection insert: ~50 tokens × 1 time × 1,500 users × 30 reflections/month = 2.25 M tokens
- 2.25 M × $0.02/1M = **$0.045/month** for *new* reflections
- Clustering reads from DB → **$0 for OpenAI on cluster runs**
- Labeling with Claude: 5 clusters × 3 samples × 150 tokens × 1,500 users = 3.375 M input tokens × $3/1M (Sonnet 4) = **$10.13/month** (the expensive part, not embeddings)

**Total v1.3 incremental cost: ~$10/month at 1,500 users.** Well under budget.

### Arabic embedding quality — **stay with `text-embedding-3-small`**

| Model | Arabic MTEB | Dims | Price/1M | Verdict |
|---|---|---|---|---|
| `text-embedding-3-small` (current) | Good | 1536 | $0.02 | **Keep** |
| `text-embedding-3-large` | Better | 3072 | $0.13 | 6.5× cost for marginal gain |
| Cohere `embed-v3-multilingual` | Very good | 1024 | $0.10 | New vendor, new SDK, violates rule #6 |
| Cohere `embed-v4.0` (2026) | Best Arabic | 1024–1536 | $0.12 | New vendor, violates rule #6 |

**Decision:** Consistency beats marginal quality. `text-embedding-3-small` is already tuned into `match_book_chunks(VECTOR(1536))`. Switching dimensions means re-embedding the entire book corpus and any new `reflection_embeddings` table. **Stay with it. MEDIUM-HIGH confidence.**

Caveat: if qualitative theme labels feel "off" during monthly digest review, consider A/B testing `text-embedding-3-large` on a 100-user sample before rolling out. Not a v1.3 blocker.

### Clustering library already a transitive dep?

**Searched `package-lock.json` — no k-means / clustering library present** (not `ml-kmeans`, not `density-clustering`, not as transitive). Good — we write ~40 lines of Lloyd's and move on.

For reference, the naive algorithm:
```
1. Seed k centroids via k-means++ (weighted random)
2. Assign each vector to nearest centroid (cosine distance)
3. Recompute centroids as mean of assigned vectors
4. Repeat until assignments stable or max 50 iters
```

No library needed. This is explicitly in scope for rule #6's spirit (write it, don't import it).

### DO NOT ADD

- ❌ `ml-kmeans` — 40-line write replaces it.
- ❌ `density-clustering` (DBSCAN) — wrong algorithm for small n; k-means is fine.
- ❌ `@tensorflow/tfjs` — absurd overkill.
- ❌ `cohere-ai` SDK — violates embedding-model consistency.
- ❌ `pg_kmeans` / `pgml` extensions — not available on Supabase managed.
- ❌ `onnxruntime-node` — no local ML inference needed.

---

## (2) Long-Term Memory for AI Guide

### Reuse existing infra — **YES, 100% confidence**

**Evidence from code:**
- `src/lib/rag.ts` exports `embedText()` and `completeWithContext()`.
- `/api/guide/chat` already calls `embedText(message)` + `match_book_chunks` RPC on every user turn (lines 637–650).
- `guide_memory` table already exists with `soul_summary TEXT` and `themes JSONB`.
- `generateSoulSummary()` in `src/lib/rag.ts` already updates the summary every 6 messages (`maybeUpdateSoulSummary`).

### What v1.3 actually adds

The brief calls this "new `guide_memory` vector store" — but `guide_memory` exists. What's missing is **vector-indexed past-reflection recall** so the guide can say "آخر مرة كتبت عن الصبر كان في اليوم 9" with semantic (not keyword) match.

**Recommended schema addition (ONE migration):**
```sql
-- Add embedding to reflections (not a new table)
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
  ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS reflections_embedding_ivfflat_idx
  ON public.reflections USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- RPC mirror of match_book_chunks, scoped per user (RLS-enforced)
CREATE OR REPLACE FUNCTION public.match_user_reflections(
  p_user_id UUID, query_embedding VECTOR(1536), match_count INT DEFAULT 5
) RETURNS TABLE (day INT, note TEXT, similarity FLOAT) ...
```

**Memory injection in `/api/guide/chat`:**
Add a third RAG pass: embed user message → `match_user_reflections(userId, embedding, 3)` → inject top-3 past reflections into prompt context alongside book chunks.

### Retention strategy — **recency-weighted relevance, N=50 max**

**Recommendation: no hard cap of N=50 reflections-as-memories.** Instead:
1. Embed **all** reflections (cheap — see cost math, Scenario B).
2. At query time, `match_user_reflections` returns top-5 by cosine similarity.
3. Apply recency decay **in SQL** (weight = `similarity * (1 + 0.1 * months_since_created)^-1`).
4. Cap injected context at 3 reflections × 200 chars = 600 chars (same budget as current `compressToPromptContext`).

This beats "last 50" because:
- A user on day 300 asking about "صبر" should pull their day-9 reflection on patience even if 49 other reflections came after.
- N=50 with recency order creates an artificial amnesia cliff.
- Cost is identical (embedding is already sunk).

### VIP-first or all-tiers?

**Recommendation: all paying tiers.** VIP-only creates a perverse incentive where the guide is *worse* for quarterly subscribers — hurts retention math.

**Cost per query at 1,500 users:**
- 1,500 users × 2 chat sessions/day × 5 messages × 30 days = 450,000 messages/month
- Each message: 1 embed call (~20 tokens) = 9 M tokens/month × $0.02/1M = **$0.18/month embedding**
- Plus 1 RPC to Postgres per message — negligible at ivfflat(lists=50) scale.
- Claude cost dominates (~$200–400/month at this volume) and is unchanged by memory feature.

**Verdict: all tiers. Total v1.3 memory incremental cost: <$0.50/month.**

### pgvector version sanity check

- Supabase provides pgvector; current usage implies ≥ 0.5.x (supports `VECTOR(n)` and `<=>`).
- For `ivfflat` index on small tables: `lists = sqrt(rows)` heuristic → 50 lists for ~2,500 rows (1,500 users × avg ~1.7 reflections). Fine. If scale hits 100K rows, migrate to `hnsw` (Supabase supports it since pgvector 0.5.0).

### DO NOT ADD

- ❌ `pinecone`, `weaviate`, `qdrant` clients — pgvector handles this at our scale for years.
- ❌ `langchain` / `llamaindex` — the RAG logic is ~30 lines in `rag.ts`. Framework is overhead.
- ❌ New `guide_memory` table — already exists. Extend `reflections`.
- ❌ `redis` for memory cache — stateless route handlers + ivfflat is faster than a Redis round-trip for this access pattern.

---

## (3) Voice Journaling (Munsit)

### Status: **already implemented — v1.3 is integration, not construction**

**Evidence:**
- `src/lib/munsit.ts` — REST client with auth (`x-api-key` from `MUNSIT_API_KEY` env), typed `TranscribeResult`, `MunsitError` class.
- `src/app/api/voice/stt/route.ts` — Node runtime (required for FormData streaming), 2 MB hard cap, returns `{ ok, text }`.
- `src/app/guide/voice/useVoiceSession.ts` — 185-line production hook covering MediaRecorder lifecycle, 60s auto-stop, mic-denied handling, codec negotiation (`audio/webm;codecs=opus` → fallback `audio/webm`), empty-blob guard, cancellation semantics.

### What v1.3 adds

**Only integration work:**
1. New `<VoiceRecordButton />` component wrapping `useVoiceSession` (or a simpler sibling hook `useVoiceTranscription` without the chat step).
2. Slot into `ReflectionJournal.tsx` — record button beside the textarea → on success, inject transcript into the input (append, never replace).
3. A11y: button is `aria-pressed` for recording state, error surface is `aria-live="polite"` (not alert — rec errors are recoverable).

### Munsit auth & rate limits

- **Auth:** `x-api-key` header (already wired). No OAuth, no token refresh.
- **Rate limits:** not publicly documented by Munsit. The existing 2 MB request cap + 60s client cap provides upstream load shaping. Recommend adding a **per-user rate limit** at the API route: max 20 STT calls/hour via simple in-memory counter keyed by user id with 1-hour sliding window. At 1,500 users × typical 2 journals/day, aggregate is ~125/day — well inside any reasonable vendor quota.
- **MEDIUM confidence** on rate limits — worth a quick check with Munsit support before launch. Not a blocker.

### iOS Safari — the real risk

**MediaRecorder on iOS Safari has historically been broken.** Status as of 2026:
- iOS 14.5+ supports MediaRecorder, but **only with `audio/mp4`**, not `audio/webm`.
- The existing `useVoiceSession.ts` tries `audio/webm;codecs=opus` → `audio/webm`. **Both fail on iOS Safari.**
- `MediaRecorder.isTypeSupported('audio/webm')` returns `false` on iOS Safari.

**Fix required (not in scope of existing code):**
```typescript
const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ? "audio/webm;codecs=opus"
  : MediaRecorder.isTypeSupported("audio/webm")
  ? "audio/webm"
  : MediaRecorder.isTypeSupported("audio/mp4")
  ? "audio/mp4"
  : "";
```

And on the server, Munsit must accept `audio/mp4`. Documented Munsit supports webm/opus/wav/mp3 per the comment in `munsit.ts` line 33. **Verify `audio/mp4` acceptance with a staging test before relying on it** — this is a LOW-MEDIUM confidence item and a phase-specific research flag.

**Fallback strategy if iOS Safari mp4 fails:**
- Show voice record button only when `MediaRecorder.isTypeSupported(anyAcceptedType) === true`.
- Otherwise hide the button silently; keep the textarea. No degraded UX is better than a broken button.

### Chunked upload vs full file

- Munsit endpoint is **single-shot** (`POST /audio/transcribe` with FormData). No streaming API documented.
- Full-file upload is fine at 60s × ~16 KB/s (opus) ≈ 960 KB → well under the 2 MB cap.
- **DO NOT add chunking.** It requires backend reassembly and Munsit doesn't support it.

### Max recording length

**Recommend: keep 60s cap.** Rationale:
- Quranic reflection is short by design (the whole program is "5-minute ritual").
- Longer recordings increase STT latency (linearly) — bad UX.
- 60s × 16 KB/s = <1 MB, well within cap.
- If power users complain, bump to 90s — but **not** to 180s+ without revisiting the 2 MB hard cap in `voice/stt/route.ts`.

### DO NOT ADD

- ❌ `mic-recorder-to-mp3` / `extendable-media-recorder` — native MediaRecorder + mp4 fallback handles it.
- ❌ `@ffmpeg/ffmpeg` wasm — no transcoding needed; Munsit accepts native formats.
- ❌ `openai` SDK for Whisper STT — Munsit is already wired and optimized for Arabic.
- ❌ `socket.io` / WebSocket streaming — Munsit has no streaming endpoint.
- ❌ Audio storage (S3, Supabase Storage for audio) — **privacy-by-design per milestone brief**. Audio in memory only, discarded after STT.
- ❌ `expo-av` / `react-native-voice` — web app, not native.

---

## (4) Arabic A11y Audit

### Tool choice: **Lighthouse (CI) + axe-core (manual spot check) — MEDIUM-HIGH confidence**

**Evidence from `package.json`:**
- `eslint-config-next@14.2.18` — includes `jsx-a11y` plugin automatically. Already running in `npm run lint`.
- No `axe-core`, no `pa11y`, no `lighthouse-ci` — devDeps are minimal.

**Why Lighthouse first:**
- Project already hit **100/100 A11y in v1.0** per PROJECT.md. Target for v1.3 is ≥ 98 — Lighthouse is the score of record.
- Runs via `lhci` or directly in Chrome DevTools. **No CI dep install needed if used manually** during audit phase.
- If we want CI gates (recommended for regression protection), `@lhci/cli` is the only optional new **devDep** I'd endorse — but it can live behind an opt-in script (`npm run audit:a11y`) rather than a release-gate dep.

**Why axe-core as spot check:**
- `@axe-core/cli` catches ~57% of WCAG issues Lighthouse doesn't (per Deque Labs 2024 study).
- Run manually against pages that matter: `/day`, `/progress`, `/account`, and the new v1.3 voice+themes surfaces.
- Do NOT add `@axe-core/react` as runtime — dev-only mount pollutes the bundle.

**Why NOT pa11y:**
- Duplicates axe-core functionality (pa11y uses axe under the hood).
- Another Puppeteer dep + its Chromium download = ~300 MB in `node_modules`. Violates spirit of rule #6.

### Comparison matrix

| Tool | Catches | New deps | Already present | Recommendation |
|---|---|---|---|---|
| Lighthouse (manual) | Score of record, color contrast, ARIA, headings | 0 | DevTools built-in | **Use — zero cost** |
| `@lhci/cli` | Lighthouse in CI | 1 devDep | No | **Optional — opt-in script only** |
| axe-core (manual) | WCAG 2.1 AA, role/state/name | 0 (browser extension) | No | **Use via browser ext** |
| `@axe-core/cli` | Same, scriptable | 1 devDep | No | Skip unless CI mandated |
| pa11y | Wraps axe | 1 + Puppeteer | No | ❌ Skip |
| eslint-plugin-jsx-a11y | Static JSX lint | 0 | Yes (via next lint) | **Already running** |

### ARIA-live for async state — pattern recommendation

**Existing usage (verified via grep):**
- `src/components/RenewalBanner.tsx` — uses `aria-live`
- `src/components/badges/BadgeGrid.tsx` — uses `aria-live`
- `src/components/ReferralPanel.tsx`, `src/components/AppChrome.tsx`, `src/app/progress/page.tsx` — all have `aria-live` or `role="status"`/`role="alert"`

**Audit checklist (not net-new pattern work):**

| Component | Async event | Correct politeness | Arabic string requirement |
|---|---|---|---|
| `RenewalBanner` | Renewal date computed | `role="status"` + `aria-live="polite"` | "يتجدد اشتراكك خلال ٣ أيام" (not "3 days") |
| `BadgeGrid` | Badge earned (post-day-N) | `aria-live="polite"` on the specific card that changed, not the grid | "حصلت على شارة اليوم السابع" |
| `YIRArchive` (new v1.3) | Year-in-review section expands | `aria-live="polite"` on the content region; heading should receive focus on open | "مراجعة عامك ١٤٤٧" (Hijri) |
| Voice record button (new) | Recording start/stop | `aria-pressed={isRecording}`, error via `aria-live="polite"` | "يسجل الآن" / "تم" / "تعذّر التسجيل" |
| Themes digest (new) | Monthly digest loads | `aria-live="polite"` + skeleton placeholders with `aria-busy="true"` | "نحضّر ملخصك الشهري" |

**Rule of thumb (enforce in PR review, no code change needed):**
- `polite` (default) — informational state changes. Use 90% of the time.
- `assertive` — only for errors that block progress. **Never** for success toasts.
- `role="status"` = polite; `role="alert"` = assertive. Prefer `role` over raw `aria-live` for semantic intent.

### Arabic-specific concerns

**1. RTL announcement order:**
- Screen readers honor DOM order, not visual order. RTL visual flow (right→left) is already DOM-correct because `html[dir="rtl"]` is the baseline.
- **Gotcha:** mixed LTR content (numbers, English brand names) can cause VoiceOver to pronounce them in surprising order. Use `<bdi>` or `dir="ltr"` on inline LTR islands (e.g., `<span dir="ltr">Taamun</span>`).
- Audit target: scan `src/components/**/*.tsx` for embedded numbers and brand names without `<bdi>`.

**2. Hijri date formatting to screen readers:**
- Current `APP_DOMAIN`/`RAMADAN_ENDS_AT_ISO` are Gregorian ISO. Hijri is presentational.
- Use `Intl.DateTimeFormat('ar-SA-u-ca-islamic')` — built into Node/V8, zero deps.
- For screen reader clarity, provide Hijri in visible text AND a gregorian `aria-label` for assistive tech that reads dates better in ISO: `<time dateTime="2026-04-20" aria-label="عشرون أبريل ألفين وستة وعشرين">٥ شوال ١٤٤٧</time>`.
- Do NOT rely on VoiceOver to correctly pronounce Hijri month names without `lang="ar"` on the nearest ancestor.

**3. VoiceOver/TalkBack test matrix (manual, no tooling needed):**

| Platform | Screen reader | Test focus |
|---|---|---|
| iOS Safari | VoiceOver | Voice record button, Hijri dates, RTL mixed content |
| macOS Safari | VoiceOver | Full flow through `/day` |
| Android Chrome | TalkBack | Voice record (if iOS fallback also applies here), reflection input |
| Windows Chrome | NVDA (free) | Regression check — landing + pricing pages |
| Windows Edge | Narrator | Spot check only |

### DO NOT ADD

- ❌ `pa11y` / `pa11y-ci` — duplicates axe, bundles Puppeteer.
- ❌ `@axe-core/react` — dev-only runtime pollution; use browser extension instead.
- ❌ `jest-axe` — no Jest in this project (project uses Vitest; adding jest-axe means another testing stack).
- ❌ `react-aria` / `react-aria-components` — wholesale replacement of existing UI; out of scope.
- ❌ `reach-ui` — unmaintained since 2023.
- ❌ `radix-ui` — overkill for an audit; would require rewriting `RenewalBanner`, `BadgeGrid`, etc.
- ⚠️ `@lhci/cli` — **optional devDep only** if explicit CI gate is desired. Gate behind `npm run audit:a11y` script, don't block `guard:release`.

---

## Consolidated "DO NOT ADD" List

| Package | Rejected For | Why |
|---|---|---|
| `ml-kmeans` | Themes clustering | ~40 LOC replaces it |
| `density-clustering` | Themes clustering | Wrong algorithm |
| `@tensorflow/tfjs` | Any ML | Overkill |
| `cohere-ai` | Embeddings | Consistency with `text-embedding-3-small` |
| `pinecone-client` / `weaviate-ts-client` / `qdrant-js-client` | Vector DB | pgvector handles it |
| `langchain` / `llamaindex` | RAG framework | 30 LOC replaces it |
| `redis` | Memory cache | Not needed at scale |
| `mic-recorder-to-mp3` / `extendable-media-recorder` | Voice | Native MediaRecorder |
| `@ffmpeg/ffmpeg` | Audio transcoding | Munsit accepts native |
| `openai` SDK | Voice STT | Munsit is already wired |
| `socket.io` | Voice streaming | Munsit has no streaming API |
| `pa11y` | A11y | Duplicates axe + Puppeteer |
| `@axe-core/react` | A11y runtime | Bundle pollution |
| `jest-axe` | A11y test | No Jest in project |
| `react-aria` / `radix-ui` / `reach-ui` | A11y primitives | Out of scope rewrite |
| **New `guide_memory` table** | Memory | Already exists — extend `reflections` instead |

---

## Optional devDep (single exception, not required)

| Package | Purpose | Justification |
|---|---|---|
| `@lhci/cli` | Lighthouse CI for a11y regression gate | Only if we want automated a11y gate in `guard:release`. Manual Lighthouse runs suffice for v1.3 ship. **Recommend defer to v1.4.** |

---

## Confidence Assessment

| Area | Level | Reason |
|---|---|---|
| Clustering approach | HIGH | Algorithm is well-known; scale is trivially small |
| Clustering cost math | HIGH | Using actual model pricing from `rag.ts`, corrected from brief |
| Memory infra reuse | HIGH | `guide_memory`, pgvector, `embedText` all present in code |
| Memory retention strategy | MEDIUM | Recency-weighted relevance is opinion; could be tuned post-launch |
| Voice: existing infra | HIGH | Code reviewed — 185 LOC hook + 55 LOC client + route all production-ready |
| Voice: iOS Safari mp4 | LOW-MEDIUM | Needs staging test; documented in Munsit comment but not verified end-to-end |
| Voice: Munsit rate limits | LOW | Not publicly documented — recommend confirming with vendor |
| A11y tool choice | HIGH | Project already at 100/100 with no a11y deps; continue pattern |
| A11y ARIA-live patterns | HIGH | Pattern already established in 5+ components |
| Arabic screen reader specifics | MEDIUM | Hijri + RTL + `<bdi>` guidance is standards-correct but real devices sometimes surprise |

---

## Phase-Specific Research Flags (for roadmap)

| Phase | Flag | What to verify |
|---|---|---|
| Voice integration phase | **iOS Safari mp4 + Munsit end-to-end** | Record on iPhone Safari → `/api/voice/stt` → transcript returns valid Arabic |
| Voice integration phase | **Munsit rate limits** | Email vendor or test with burst traffic |
| Themes digest phase | **Arabic label quality** | Sample 20 clusters, have a native speaker validate Claude's single-word labels |
| Memory phase | **pgvector ivfflat vs hnsw choice** | Measure recall@5 on 100 users after 30 days — migrate to hnsw if recall < 0.8 |
| A11y audit phase | **VoiceOver real-device test** | Manual sweep on iPhone + MacBook, not just simulator |
| A11y audit phase | **Hijri date pronunciation** | Confirm `Intl.DateTimeFormat('ar-SA-u-ca-islamic')` output reads correctly in VoiceOver |

---

## Sources

- `src/lib/rag.ts` (lines 1–214) — embedding model, Claude client, `completeWithContext`, `generateSoulSummary`
- `src/lib/munsit.ts` (lines 1–55) — Munsit REST client, auth, error types
- `src/app/api/voice/stt/route.ts` (lines 1–54) — Node runtime route, 2 MB cap
- `src/app/guide/voice/useVoiceSession.ts` (lines 1–185) — MediaRecorder lifecycle, 60s cap, error taxonomy
- `src/app/api/guide/chat/route.ts` (lines 606–676) — current RAG pipeline, `match_book_chunks`, soul summary update cadence
- `src/app/api/guide/ingest/route.ts` (lines 1–66) — book corpus ingestion pattern (reusable for reflection ingestion)
- `src/lib/ai/memory.ts` (lines 1–227) — current memory approach (text compression, no vectors yet)
- `supabase/migrations/20260310000000_reflection_rag_analytics.sql` — pgvector install, `book_chunks` schema, `match_book_chunks` RPC
- `supabase/migrations/20260324000000_guide_sessions_memory.sql` — `guide_memory` table schema
- `supabase/migrations/20260323_guide_memory.sql` — earlier `user_memory` schema (coexists)
- `package.json` — confirmed zero clustering/a11y deps currently installed
- `package-lock.json` — grep confirmed no transitive `ml-kmeans`/`axe-core`/`pa11y`
- `.planning/PROJECT.md` — v1.0 Lighthouse A11y 100/100, v1.3 target ≥ 98
- OpenAI pricing (April 2026): `text-embedding-3-small` = $0.02/1M tokens (HIGH — widely published)
- pgvector docs: ivfflat `lists = sqrt(rows)` heuristic (HIGH — official docs)
- Munsit API: `https://api.munsit.com/api/v1/audio/transcribe` — verified in `munsit.ts`; rate limits NOT publicly documented (LOW confidence on quota behavior)
- WebKit MediaRecorder: iOS 14.5+ supports `audio/mp4` only (MEDIUM — needs staging verification)
