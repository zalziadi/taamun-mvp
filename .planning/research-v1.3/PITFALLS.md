# Pitfalls Research — v1.3 العمق (Depth & Personalization)

**Domain:** spiritual-wellness · Arabic-first Quranic contemplation · ML + voice + memory + a11y
**Researched:** 2026-04-21
**Confidence:** HIGH (grounded in v1.2 codebase + v1.2 pitfalls inventory + Phase 11 four-layer privacy model)

Scope: pitfalls SPECIFIC to adding ML clustering, long-term memory, voice journaling, and Arabic a11y to THIS product. Every pitfall is tied to a file/table/invariant actually present in the repo today or explicitly being added in v1.3.

**Carry-over invariants from v1.2 that v1.3 must not erode:**
- NFR-04: zero tracking pixels on sacred pages (`/day`, `/reflection`, `/book`, AI guide)
- NFR-08: zero new runtime dependencies preferred
- NFR-09: two-step migrations for non-null columns
- PostHog config: `person_profiles: "never"`, `capture_pageview: false`
- Phase 11 four-layer privacy defense: **Data → Type → Import → CI** (applied recursively to every new privacy surface in v1.3)
- CLAUDE.md S1–S5 safety rules + mandatory `npx tsc --noEmit && npm run build`

---

## Critical Pitfalls — Themes ML Clustering

### Pitfall 1: Clustering noise at small-N (the "30-reflection user gets random themes" trap)

**What goes wrong:**
User with 30 reflections has ~30 embedding vectors. k-means with k=3 on 30 points in 1536-dim space (OpenAI `text-embedding-3-small`) is dominated by noise — the "curse of dimensionality" means euclidean distances between any two random points are approximately equal. Clusters will be unstable (re-running the same data produces different clusters) and the auto-labeled themes ("صبر", "شكر") will be noise labels assigned to noise clusters. User sees "هذا الشهر ركّزت على الشكر" when they never wrote about gratitude — trust destroyed in one release.

**Why it happens:**
k-means assumes dense clusters in euclidean space. High-dim embeddings on small samples produce spherical-uniform distributions where cluster boundaries are arbitrary.

**How to avoid:**
- **Minimum-N gate:** no clustering below 60 reflections within the analysis window. Below this, surface "أيامك لا تزال قليلة لرسم نمط واضح — تابع التأمّل" (same pattern as YIR <30 gate at `aggregate.ts:80-82`).
- **Stability check:** run k-means 5× with different seeds; if Rand index between runs < 0.7, mark result as `unstable` and do NOT surface. Store stability score in `theme_clusters.stability` column for debugging.
- **Silhouette threshold:** drop any cluster with silhouette score < 0.15. Surface only the top 2–3 stable clusters, never force k=3.
- **Dimensionality reduction first:** run UMAP (→ 10 dims) before k-means; this drastically improves noise separation at small-N. UMAP is pure-Python / pure-numpy in embedding space; no runtime JS dep needed (runs server-side in Vercel Node function).
- **Alternative path — no clustering at all at small-N:** use simple TF-IDF keyword extraction on Arabic stems for users with 30–60 reflections. Reserve clustering for users with ≥60.

**Warning signs:**
- A/B test: same user's themes change wildly between two monthly runs with only 2 new reflections added
- User support: "مراجعتي تقول إنّي ركّزت على شيء لم أكتب عنه"
- Cluster labels that are semantic opposites appearing in the same user's digest (e.g., "يأس" + "أمل" in same run on 30 reflections) — sign of noise

**Phase to address:** Phase 12 (Themes ML Clustering) — threshold + stability check BEFORE label generation.

---

### Pitfall 2: Arabic root-form variation breaks embedding clustering (صبر/صابر/يصبر)

**What goes wrong:**
OpenAI `text-embedding-3-small` is multilingual but Arabic morphology creates surface-form explosion: the root ص-ب-ر appears as صبر (patience/noun), صابر (patient/adj), يصبر (he endures), اصبر (endure!/imp), صبرت (I endured), الصبر (the patience, with definite article), وصبرت (and I endured). Embeddings partially handle this (contextual models do recognize stem similarity) but NOT perfectly — at small N, two reflections both about patience might cluster into separate clusters because one used صبر and the other used يصبر.

More subtle: Arabic definite article ال fuses with the word. "الصبر" and "صبر" look similar to humans but produce different tokenizations. Prefix و (and), ف (then), ب (in/with) similarly concatenate.

**Why it happens:**
Tokenizers (tiktoken cl100k) tokenize Arabic morphology sub-optimally — Arabic subwords are longer, less semantically aligned than English subwords. Embeddings inherit this.

**How to avoid:**
- **Light pre-processing before embedding:** strip prefixes `ال`, `و`, `ف`, `ب`, `ك`, `ل` + normalize `أإآا → ا`, `ى → ي`, `ة → ه`. Pure regex, zero deps. Document this as `src/lib/arabic/normalize.ts`.
- **Do NOT stem aggressively** (root reduction): changes meaning too much — صابر (patient person) vs صبر (abstract patience) ARE semantically distinct for theme labeling. Light normalization only.
- **Verify empirically:** build a fixture of 20 Arabic reflection pairs that humans mark as same-theme; measure cosine similarity BEFORE and AFTER normalization. Keep normalization only if it improves avg similarity on same-theme pairs.
- **Alternative:** use OpenAI `text-embedding-3-large` (3072 dims, ~3× cost) — better multilingual handling per OpenAI announcements, but MEDIUM confidence this helps Arabic specifically. Budget concern: 3× embedding cost for 1,500 users × monthly re-embed.
- **DO NOT reach for Farasa / MADAMIRA / Stanza** (Arabic NLP libs) — all are Python, violate NFR-08, and add deployment complexity.

**Warning signs:**
- Same root appearing in two different cluster labels in the same digest
- Pre/post normalization cosine similarity test: <5% improvement means normalization is wasted effort; >20% means pipeline is over-aggressive
- Sudden cluster re-shuffling after a user writes reflections with heavy prefix usage (Classical Arabic style vs colloquial)

**Phase to address:** Phase 12 (Themes ML Clustering) — normalization layer before `openai.embeddings.create` call.

---

### Pitfall 3: Auto-label hallucination and English drift (Claude labels "صبر" as "Patience")

**What goes wrong:**
Prompt Claude with "generate a 1-word Arabic theme label for these reflection snippets." Output variance:
- **English drift:** "Patience (صبر)" or just "Patience" — Claude trained predominantly on English, slips into English even when asked for Arabic
- **Hallucination:** cluster contains reflections about loneliness, but Claude labels it "الأمل" (hope) because it pattern-matches to "spiritual reflection → positive theme"
- **Multi-word drift:** "الصبر في الابتلاء" (patience in trial) — fine semantically but breaks UI that expects 1-word chip
- **Capitalization-style Latin inclusion:** "Ṣabr" or "Sabr" transliterations — jarring in Arabic UI
- **Christian/general religious terms:** Claude outputs "الإيمان" (faith, neutral) when reflections are Islamic-specific — less bad but feels generic

**Why it happens:**
LLMs optimize for fluency, not constraint adherence. "1 word in Arabic" is a soft constraint; without post-validation it gets violated ~5–15% of the time.

**How to avoid:**
- **Fixed vocabulary:** predefine ~40 allowed theme labels drawn from the book's actual conceptual dictionary (`public/book/City_of_Meaning_Quran_AR_EN_v0.pdf`). Examples: صبر، شكر، توكّل، خشوع، تدبّر، ذكر، يقين، رحمة، تقوى، إخلاص، توبة. Claude's job is to SELECT (classification), not GENERATE (open text). Prompt: "Given these snippets, choose the SINGLE best match from this exact list: [...]. Return only the Arabic word, nothing else."
- **Post-validation regex:** label must match `^[\u0600-\u06FF]{2,8}$` (Arabic-only, 2–8 chars). If not, fall back to "تأمّل" (reflection, generic) and log the failure for manual review.
- **Temperature 0:** deterministic output reduces drift.
- **Spot-check N=10 per release:** human reviews 10 random label assignments before surfacing to users. If >1 wrong, halt release.
- **Grounding context:** include 2–3 book quotes defining each allowed theme in the system prompt. Claude is more accurate when the vocabulary has embedded definitions.

**Warning signs:**
- Any label containing a Latin character → automatic rejection
- Label = "تأمّل" (generic fallback) for >30% of clusters → vocabulary too narrow, expand
- User support: "هذه الكلمة لا تعبّر عن ما كتبتُه"

**Phase to address:** Phase 12 (Themes ML Clustering) — fixed vocabulary + post-validation.

---

### Pitfall 4: Stale themes — user's focus shifted last week, digest shows last month's themes

**What goes wrong:**
Monthly cron regenerates themes on day 1 of each Gregorian month. User had a profound shift in week 3 (life event, deeper phase of journey) — but because regen is monthly, they see "old self" themes for 2–4 weeks. Worse: if the digest is surfaced via email/push, the delay between "user's current inner state" and "themes shown to them" can feel impersonal, the exact opposite of the v1.3 goal.

Opposite failure: regenerate on EVERY new reflection → cost explosion (Pitfall 6) + theme thrash (every day's digest is different).

**Why it happens:**
Naive cron schedules. No event-driven invalidation.

**How to avoid:**
- **Dual trigger:** (a) background cron every 7 days (not 30) for fresh users, AND (b) event-driven invalidation: when reflection count since last clustering run >= 10 OR when `reflection_count_delta >= 25%` of prior total.
- **Rolling window, not calendar-month:** cluster reflections from last 60 days (rolling) anchored to user's activation anniversary day-of-week, not Jan 1. Matches Phase 11 anniversary-anchor precedent.
- **Throttle minimum:** no regen within 3 days of previous regen regardless of triggers. Prevents thrash.
- **Show freshness in UI:** "المواضيع المستخلصة — 12 يوم مضى" — user sees when themes were computed. If stale > 30 days, show "قد تكون قديمة" hint.

**Warning signs:**
- PostHog `themes_viewed` events with `days_since_generation > 45`
- User support: "لماذا مواضيعي لم تتغيّر منذ شهرين"
- Opposite: themes change every time user opens digest → thrash, over-eager regen

**Phase to address:** Phase 12 (Themes ML Clustering) — scheduling logic in cron handler.

---

### Pitfall 5: Theme labels ARE derived reflection content — sacred-page privacy boundary question

**What goes wrong:**
Per Pitfall 25 in v1.2 research: "no tracking pixels on prayer/reflection pages" — the spirit is "reflection content stays private." Theme labels are DERIVED from reflection content via embeddings + clustering + Claude-labeling. Question: are theme labels "content" (subject to the rule) or "aggregate stats" (free to expose)?

**Ambiguous cases:**
- Theme = "صبر" — generic word, could appear in any Quran study app. Feels safe.
- Theme = "فقدان" (loss) — highly personal; implies user wrote about loss repeatedly. Could leak to analytics, push notification preview, OG share card.
- Theme = "علاقتي بأمي" (my relationship with my mother) — explicit, if the fixed vocabulary is too permissive.

If a theme label gets included in:
- PostHog event properties → analytics breach (Pitfall 24 from v1.2 recurs)
- Push notification preview on lock screen → family member sees "تمعّن: موضوعك هذا الشهر: فقدان"
- OG share card → Phase 11 four-layer defense breach
- Email digest body → email provider sees it

**Why it happens:**
Derived data feels less sensitive than raw data, so developers skip the privacy review.

**How to avoid — apply Phase 11 four-layer defense to themes:**
- **Layer 1 (Data):** fixed vocabulary (Pitfall 3) ensures theme labels are generic Quranic concepts only — no personal-pronoun forms, no relationship nouns. Review vocabulary list with privacy lens; delete any term that implies personal event (no "فقدان", "طلاق", "مرض").
- **Layer 2 (Type):** separate `ThemeLabel` (public — in vocabulary) from `ThemeEvidence` (private — the reflection snippets that produced the cluster). Same pattern as `YIRPublicStats` vs `YIRPrivateContent` at `src/lib/yearInReview/types.ts:41-76`. Evidence never leaves Server Component scope.
- **Layer 3 (Import):** any route that emits analytics/notifications/OG imports only `ThemeLabel`, never `ThemeEvidence`. Enforce via dedicated `src/lib/themes/types.ts` with disjoint keys.
- **Layer 4 (CI):** grep guard `scripts/guards/phase-12-anti-patterns.sh` — `ThemeEvidence` must not appear in `src/app/api/analytics/`, `src/lib/email/`, `src/app/*/og/`, `src/lib/push/`. Mirrors `scripts/guards/phase-11-anti-patterns.sh:111-116`.
- **Event names:** if theme label emitted in PostHog, property name is `theme_label` (from vocabulary, safe) — NEVER `theme_context` / `theme_evidence` / `theme_source_snippet`.

**Warning signs:**
- Vocabulary review PR proposes any term naming a personal event, relationship, or health condition
- `ThemeEvidence` referenced outside `src/lib/themes/` or Server Components
- PostHog event property named anything other than `theme_label`

**Phase to address:** Phase 12 (Themes ML Clustering) — privacy classification + four-layer defense.

---

### Pitfall 6: Cost explosion — infinite re-clustering loop from broken cron logic

**What goes wrong:**
Cron handler logic bug: "regenerate when stability < 0.7" intended as "retry once if unstable" becomes "retry forever if unstable." Small-N user with inherently unstable clusters triggers regen every cron tick → OpenAI embeddings re-computed × Claude labeling × 24 ticks/day × 1,500 users. Embeddings cost ~$0.02 per 1M tokens for `text-embedding-3-small` — 30 reflections × 150 tokens = 4,500 tokens/user, trivial per-run. But ×1,500 users ×24 ticks = 162M tokens/day = $3.24/day = $100/month FOR EMBEDDINGS ALONE. Claude labeling at ~$3/M input tokens is worse — could hit $500/month in a runaway.

Also: cron invoking cron (fan-out bug) can DDOS OpenAI's rate limits, getting Taamun's API key throttled → all guide conversations also degrade.

**Why it happens:**
No idempotency key. No cost circuit breaker. No max-invocations-per-user-per-day guard.

**How to avoid:**
- **Idempotency table:** `theme_cluster_runs(user_id, run_id uuid, started_at, finished_at, status)`. Before starting a run: `INSERT ... ON CONFLICT (user_id, date_trunc('day', now())) DO NOTHING`. Zero rows inserted → skip (already ran today).
- **Max-N-per-day circuit breaker:** hard-coded `MAX_CLUSTERING_RUNS_PER_USER_PER_DAY = 2`. Enforced at cron entry.
- **Global daily cost ceiling:** env var `OPENAI_DAILY_BUDGET_USD = 10`. Nightly cron queries `openai_usage_log` (new table), halts all clustering if breached. Alert to admin.
- **Reuse existing embeddings:** cache at `reflection_embeddings(reflection_id, vector)` — only embed NEW reflections since last run. Re-clustering re-runs k-means on cached vectors (cheap), not the embed step (expensive).
- **Cron secret verification:** every cron route calls `requireCronSecret(req)` that checks `CRON_SECRET` env var + `Authorization: Bearer ...` header. Same pattern as any other Vercel cron route.

**Warning signs:**
- OpenAI usage dashboard: token consumption >2× previous day with no feature change
- `theme_cluster_runs` table row count per user per day > 2
- Vercel function invocation count spike on cron routes

**Phase to address:** Phase 12 (Themes ML Clustering) — idempotency + circuit breakers MUST land before first live cron tick.

---

## Critical Pitfalls — Long-Term Memory for AI Guide

### Pitfall 7: Memory poisoning — sarcastic/edgelord utterance stored as "user belief"

**What goes wrong:**
User types in a low moment: "الله نسيني" (God has forgotten me) — a raw, sarcastic, or despairing one-off. Memory extractor treats it as a stable user belief and writes to `guide_memory`: `{ type: "belief", content: "user feels God has forgotten them" }`. Three months later, user returns in a good mood to discuss شكر. Guide opens with "آخر مرة تحدّثنا قلت إن الله نسيك. هل ما زلت تشعر بذلك؟" — re-traumatizing the user at a moment they were moving past it.

Worse: the user's family might see the guide's Arabic message on the phone screen and worry or intervene unnecessarily.

**Why it happens:**
Memory extractors (LLM summarizing user turns into durable facts) can't distinguish "momentary venting" from "stable belief." LLMs err on the side of "capture it, it might matter."

**How to avoid:**
- **Three memory tiers:**
  - `ephemeral` — single-session context, deleted at session end. Most utterances land here.
  - `episodic` — event-scoped ("user mentioned their father's death"). Surfaced ONLY if user re-initiates that topic.
  - `semantic` — stable preferences/beliefs ("user prefers morning reflection", "user is on Day 17 of cycle 2"). High bar to promote.
- **Promotion requires repetition:** utterance is only promoted to `semantic` if the same theme recurs across ≥3 separate sessions. One-off statements stay ephemeral.
- **Emotional valence filter:** utterances classified as `despair` / `anger` / `sarcasm` (Claude classifier, temperature 0) are NEVER promoted to semantic — only episodic, and surfaced only with user's explicit re-invocation.
- **User-editable memory:** `/account/memory` page shows all `semantic` entries; user can delete any. Mirror of GDPR right-to-be-forgotten but for UX, not just legal.
- **Guide prompt constraint:** "NEVER quote a user's negative past utterance back to them unless they explicitly re-raise it in the current session."
- **Bootstrapped safety:** first 4 weeks after feature ship, `semantic` promotion is disabled; all memory is ephemeral + episodic. Observe what would have been promoted, review manually.

**Warning signs:**
- Any `guide_memory` row with `valence=negative` AND `tier=semantic`
- User support: "الدليل ذكر لي شيئاً لم أقصد قوله بهذه الجدّية"
- Churn spike after memory feature ships — silent signal users are feeling over-tracked

**Phase to address:** Phase 13 (Long-Term Memory) — tiering + promotion rules + valence filter.

---

### Pitfall 8: Memory leaks into analytics event properties (NFR-04 violation)

**What goes wrong:**
Guide turn generates response using memory context. Developer adds PostHog event `guide_turn_generated` with `{ memory_used: "user prefers short reflections, is on day 17" }` to debug the memory feature. Now PostHog has stored user-derived reflection content in event properties. Violates:
- NFR-04 (no tracking on sacred pages — AI guide is sacred)
- Pitfall 24 from v1.2 (PostHog PII leakage)
- The whole point of `person_profiles: "never"` config

**Why it happens:**
Developers instrument what they're debugging. Memory feature is new → memory context leaks into telemetry. Precedent: "ok, I'll take it out later" — but "later" never arrives.

**How to avoid:**
- **Four-layer defense (Phase 11 model):**
  - **L1 Data:** `guide_memory` table never JOIN-able with any analytics table. Different schema prefix (`private_*`).
  - **L2 Type:** `MemoryContext` interface marked `@private` — import linter rejects it outside `src/lib/guide/`.
  - **L3 Import:** grep guard `scripts/guards/phase-13-anti-patterns.sh` — `MemoryContext` must not appear in `src/lib/analytics.ts`, `src/app/api/events/`, `src/lib/email/`, `src/lib/push/`.
  - **L4 CI:** integration harness test (mirror of Phase 11 Scenario F) — monitor all outbound network calls during a guide turn, assert none contain reflection text, memory content, or user utterances.
- **Event property whitelist (strengthen Pitfall 24 from v1.2):** any event emitted during guide interaction uses only `turn_number`, `response_latency_ms`, `memory_tier_used` (enum: `ephemeral`/`episodic`/`semantic`), `memory_count` (integer). NEVER memory content itself.
- **Never log memory content to stdout/stderr** (goes to Vercel logs, retained ~30 days, searchable).
- **Regression-insurance self-test** in harness (mirror Phase 11 self-test): inject a known memory phrase, run guide turn, grep all outbound payloads for the phrase — must find exactly zero.

**Warning signs:**
- Any PostHog event property name containing `memory_`, `context_`, `recall_`, `utterance_`, `user_said_`
- Vercel log searches return user reflection snippets
- PR diff adds `console.log(memoryContext)` for debugging without removal

**Phase to address:** Phase 13 (Long-Term Memory) — four-layer defense MUST exist before first deploy with real memory storage.

---

### Pitfall 9: Cross-device memory inconsistency (phone + laptop race)

**What goes wrong:**
User types on phone at 9pm KSA: "الدليل، أريد التركيز على التوكّل هذا الأسبوع." Memory extraction is async — writes to `guide_memory` via background job. User picks up laptop at 9:01pm, starts a new guide session. Laptop loads memory BEFORE the async write completes. Guide opens not knowing user just stated their focus. User feels unheard.

Opposite failure: session on phone writes memory, laptop doesn't refresh its local cache, serves stale memory for entire laptop session.

**Why it happens:**
Async extraction for cost optimization (batch embedding + Claude summarization). But async = not-yet-consistent.

**How to avoid:**
- **Synchronous write for user-explicit preference statements:** when Claude classifies turn as `explicit_preference` (high confidence), write to `guide_memory` synchronously before returning response. Keep async for inferred facts.
- **DB is source of truth** (mirror Pitfall 14 from v1.2 renewal pattern): guide session fetch on every new session start reads `guide_memory` fresh from DB, no client-side caching across sessions.
- **Session boundary = memory refresh point:** within a single session, cache memory for response consistency; across sessions, always re-read.
- **Optimistic UI:** after user's explicit preference utterance, immediately acknowledge in the current response ("سجّلت أن تركيزك هذا الأسبوع التوكّل") — user knows it's remembered, even if async DB write is still pending.
- **Realtime sync (optional, evaluate cost):** Supabase Realtime subscription on `guide_memory` updates — laptop instantly sees phone's writes. Cost: one realtime connection per active session. Defer to Phase 13.b if not in initial budget.

**Warning signs:**
- User support: "قلت له ذلك قبل دقيقة وكأنّه لا يعرف"
- Integration test: write memory on device A, read on device B within 2s — must return fresh value

**Phase to address:** Phase 13 (Long-Term Memory) — synchronous-write-on-explicit + DB-as-source-of-truth.

---

### Pitfall 10: Right-to-forget cascade — user deletes reflection, memory retains it

**What goes wrong:**
User deletes a reflection from `/account`. The reflection text is gone from `reflections` table. But:
- Its embedding still exists in `reflection_embeddings`
- It was already used to generate a `guide_memory.semantic` entry — memory still references the deleted content
- It was already included in a `theme_clusters` run — cluster label "فقدان" was assigned because of that reflection
- OpenAI API logs (default retention) still have the embedding request

User expected "delete" to mean "gone." It doesn't.

**Why it happens:**
Derived data downstream of the source is easy to forget. No cascade contract.

**How to avoid:**
- **Cascade policy documented and implemented:**
  - `ON DELETE CASCADE` on `reflection_embeddings.reflection_id` — embedding goes when reflection does.
  - `guide_memory` entries with `source_reflection_ids[]` array column: on reflection delete, any memory referencing it is recomputed (if ≥2 remaining sources) or deleted (if <2).
  - `theme_clusters` entries are regenerated on next monthly cron — staleness window max 30 days. Mark the regenerate-after-delete in a `pending_reclustering` queue for next-cron priority.
  - OpenAI: pass zero-retention flags where available on embedding and Claude API calls.
- **`/account/delete-reflection` endpoint** is a transaction: delete reflection → delete embedding → flag memory for recompute → queue cluster regen → return 200 only if all steps succeed. Partial failure = rollback.
- **User-visible confirmation:** after deletion, show "تم حذف التأمّل وأي استنتاجات مبنية عليه." Sets user expectation correctly.
- **Full-account delete (PDPL):** dedicated `/account/delete-all` that hard-deletes across all 6+ tables including embeddings, memory, clusters. Test with synthetic account monthly.

**Warning signs:**
- Guide references content that user knows they deleted
- `guide_memory.source_reflection_ids` contains IDs not in `reflections` table (orphaned references)
- OpenAI dashboard shows stored embeddings for deleted reflection IDs

**Phase to address:** Phase 13 (Long-Term Memory) — cascade contract. Also Phase 12 (Themes) for cluster regen queue.

---

### Pitfall 11: Per-turn cost explosion (vector search × 1,500 users)

**What goes wrong:**
Every guide turn now does: (a) embed current user utterance, (b) vector similarity search against user's reflection_embeddings, (c) fetch top-K relevant past reflections + guide_memory, (d) include in Claude prompt. Cost components:
- Embedding: ~$0.00002 per turn (cheap).
- Vector search: pgvector KNN query on user-scoped subset, cheap if indexed.
- Claude prompt: BASE + MEMORY + RAG context = 2–3× longer than pre-memory prompt. At $3/M input tokens with ~2,000 tokens/turn × 10 turns/session × 1,500 users × 30 days = 900M input tokens = $2,700/MONTH input cost alone.

Budget was <10K SAR total, now guide alone eats ~$2700 USD = ~10K SAR. Feature ships the business off the cliff.

**Why it happens:**
Each optimization ("add memory", "add RAG", "add themes") seems marginally cheap. Compound effect across all guide turns + all users is punishing.

**How to avoid:**
- **RAG top-K = 3, not 10.** Measurably sufficient for most turns; halves tokens.
- **Memory summary cache:** instead of feeding raw memories, maintain a `user_memory_summary` (≤500 tokens) regenerated nightly. Guide turns inject the summary, not raw memory rows. Saves 60–80% of per-turn memory tokens.
- **Prompt caching (Anthropic Claude feature):** system prompt + memory summary is STABLE across turns in a session → use Anthropic prompt caching (90% discount on cached tokens). Massively reduces session-level cost.
- **Per-user daily turn cap:** free tier 20 turns/day, VIP unlimited. Soft cap with gentle message "لنترك مساحة للتأمّل — نواصل غداً."
- **Budget alarm:** daily cost >= $30 USD → feature enters degraded mode (no memory, no RAG, basic guide only). Alert to admin.
- **Telemetry:** track `tokens_per_turn` server-side in a private table; investigate any turn > 3,000 tokens.

**Warning signs:**
- Anthropic/OpenAI bill > $10 USD/day sustained
- Single session with > 20 turns from one user (loop detection)
- Response latency up > 2× post-memory ship (prompt length killing TTFB)

**Phase to address:** Phase 13 (Long-Term Memory) — summary cache + prompt caching MUST be in first release, not a follow-up.

---

### Pitfall 12: Hallucinated recall — guide "remembers" something user never said

**What goes wrong:**
Guide response: "تذكّر عندما قلت في اليوم السابع إنّك تشعر بالوحدة؟" User: "ما قلت هذا أبداً." Either (a) Claude confabulated the recall from embedding context that wasn't explicit, or (b) vector search returned a loose match (cosine 0.72, threshold was 0.70), or (c) memory entry got corrupted/merged with another user's memory.

This is worse than "guide forgot" — it's "guide lied." Breaks trust irreparably.

**Why it happens:**
LLMs hallucinate. RAG reduces but doesn't eliminate. When memory/RAG context is ambiguous, LLM fills gaps with plausible confabulation.

**How to avoid:**
- **Citation contract in prompt:** "When referencing the user's past utterance, quote it VERBATIM in Arabic quotes «...». If you cannot quote verbatim, do NOT claim recall — instead say 'بناءً على ما كتبتَه سابقاً' without quotation."
- **Output validation:** if response contains «...» Arabic quotes, verify the quoted string appears verbatim (with normalization) in retrieved memory. If not → regenerate with "do not quote" instruction. If regeneration still fails → strip quotes from response programmatically.
- **Confidence threshold on vector search:** only retrieve memories with cosine >= 0.80. Below that, don't pass to prompt at all.
- **Cross-user isolation guard:** vector search MUST include `WHERE user_id = :current_user_id` — this is RLS-enforced but double-check via integration test that impersonates user A and asserts zero of user B's memories return.
- **User-facing correction affordance:** every guide response that references memory shows a subtle "هذا ليس صحيحاً" link → user flags → entry marked `disputed` → removed from future recall + review queue.

**Warning signs:**
- User support: "الدليل نسب لي كلاماً لم أقله"
- `disputed_memory` flag rate > 2% of memory references
- Any cross-user memory leak in integration tests — P0 halt

**Phase to address:** Phase 13 (Long-Term Memory) — citation contract + validation + user flag mechanism.

---

## Critical Pitfalls — Voice Journaling (Munsit STT)

### Pitfall 13: Safari iOS MediaRecorder quirks — recording silently fails

**What goes wrong:**
`MediaRecorder` API has well-documented iOS Safari inconsistencies:
- **MIME type mismatch:** Chrome/Android produce `audio/webm;codecs=opus`. Safari iOS produces `audio/mp4` (AAC) — different container. Server expecting webm chokes on mp4 blob.
- **`start()` without a timeslice:** works on Chrome; on Safari iOS, `dataavailable` fires ONLY on `stop()` — developer expects chunked streaming, gets silence until user taps stop.
- **Background tab suspends recording:** iOS Safari pauses MediaRecorder when tab is backgrounded (user checks a WhatsApp notification mid-recording) — reflection lost.
- **No error thrown:** failures are silent in many cases; `mediaRecorder.state` stays `"recording"` but no audio is captured.

For KSA audience with heavy iPhone usage (Gulf iOS market share ~65%), "works on Chrome" = "works for 35% of users."

**Why it happens:**
MediaRecorder spec has ambiguous edge cases; Safari implements the spec conservatively; Chrome is permissive.

**How to avoid:**
- **Feature detection:** `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')` — if false, fallback to `audio/mp4`. Handle BOTH server-side by inspecting content-type on upload.
- **Explicit timeslice:** `mediaRecorder.start(1000)` (1-sec chunks). Works cross-browser. Accumulate chunks client-side, upload on stop.
- **`visibilitychange` listener:** if tab backgrounds, auto-stop recording, show recovery UI: "توقّف التسجيل. هل تريد المتابعة؟" — user re-taps to resume with new recording.
- **Cross-browser test matrix:** iOS Safari 17/18, iOS Chrome (uses WebKit underneath — same quirks), Android Chrome, Android Samsung Browser, desktop Chrome, desktop Safari. All 6 must ship working.
- **Fallback chain:** `MediaRecorder` → Web Audio API (raw PCM, heavier but universal) → text-only input. Degrade gracefully.

**Warning signs:**
- iOS users report "ضغطت تسجيل وما حصل شي"
- PostHog `voice_recording_started` events without matching `voice_recording_stopped` from iOS UA
- Server receives 0-byte audio blobs with Safari user agent

**Phase to address:** Phase 14 (Voice Journaling) — cross-browser detection MUST be in first release.

---

### Pitfall 14: Microphone permission denied with no graceful fallback

**What goes wrong:**
User taps "سجّل تأمّلك" — browser shows permission prompt — user taps "Don't allow" (perhaps by accident, or privacy-sensitive household where someone else uses the device). App hangs: button stays in loading state, no fallback surfaced. User bounces. Next day, they try again — Safari remembers the denial, the prompt doesn't re-appear, the feature is permanently broken for them without a visible path to recovery.

**Why it happens:**
`navigator.mediaDevices.getUserMedia()` rejection is an explicit code path that's often forgotten. Once permission is denied, there's no programmatic way to re-prompt — user must manually re-enable in browser settings.

**How to avoid:**
- **Catch `NotAllowedError`:** explicit try/catch around `getUserMedia`. On catch, switch to text-input UI immediately. Copy: "لا مشكلة — اكتب تأمّلك بدلاً من ذلك."
- **Permission state check:** `navigator.permissions.query({name: 'microphone'})` before attempting recording — if `state === 'denied'`, skip the prompt, go straight to text UI + show a subtle "فعّل الميكروفون من إعدادات المتصفح" hint with platform-specific instructions (iOS: Settings → Safari → Microphone).
- **Never retry silently:** if denied, don't ask again for 7 days (store `mic_denied_at` in localStorage). Respect the user's implicit answer.
- **Voice is AUGMENTATION, not replacement:** text input must always be the primary path. Voice is a bonus for users who grant permission. Product principle, not a technical one.

**Warning signs:**
- PostHog: `voice_permission_denied` events without matching `text_reflection_submitted` follow-up (user bounces instead of falling back)
- User support: "ما قدرت أكتب تأمّل اليوم"
- Support tickets mentioning "microphone" or "صوت"

**Phase to address:** Phase 14 (Voice Journaling) — denial handling in the voice UI component.

---

### Pitfall 15: Munsit STT accuracy varies dramatically by dialect and register

**What goes wrong:**
Munsit advertises "Arabic STT" but accuracy differs across:
- **Classical Arabic with diacritics (فصحى مشكّلة):** what users WILL speak when quoting Quran — Munsit accuracy varies; may fail on rare diacritic patterns.
- **MSA without diacritics (فصحى غير مشكّلة):** typical news-anchor Arabic — usually best-case for Munsit.
- **Gulf dialect (خليجي):** "وش صار" vs MSA "ماذا حدث" — Munsit may transcribe Gulf dialect LITERALLY (correct phonetically) or MSA-ify it (wrong lexically).
- **Code-switching (Arabish):** "اليوم كان طيّب بس felt a bit off" — mid-sentence English triggers Munsit confusion.
- **Emotional speech:** whispered, crying, slow-cadence reflection — acoustic model trained on clear speech degrades.

If voice transcription feels "almost right but wrong," user has to edit every transcription manually -> voice becomes SLOWER than typing -> feature abandoned.

**Why it happens:**
STT is an optimization, not a transcription oracle. Models have training-data bias. Spiritual reflection is an out-of-distribution register compared to commercial STT training corpora.

**How to avoid:**
- **Always show transcript BEFORE submission:** user reviews + edits before save. Never auto-submit. Copy: "هذا ما سمعت — عدّله قبل الحفظ."
- **Dialect hint on first use:** "تكلّم بالفصحى أو باللهجة — النظام سيحاول فهم كليهما، قد تحتاج لتعديل بسيط."
- **Confidence-based highlighting:** Munsit returns per-word confidence; highlight low-confidence words in the transcript UI so user knows where to check. Pure CSS underline-wavy, no library.
- **A/B test BEFORE wide rollout:** 20 VIP users try voice for 2 weeks; measure edit-distance between transcription and final-saved text. If median edit-distance > 20% of transcript length, feature isn't ready.
- **Dialect-agnostic acoustic + dictionary:** if Munsit supports a language-model hint param, pass "spiritual/Islamic vocabulary" dictionary (Quranic terms, names of Allah, common supplications) to boost recognition of the register the user will actually speak.

**Warning signs:**
- Edit-rate (user modifies transcript before save) > 40% — feature is net-negative
- Voice transcriptions consistently drop short words (و, في, على) — common STT failure; flag to Munsit support
- User abandonment curve: 80% try voice, 15% second-use, <5% daily — indicates post-trial disappointment

**Phase to address:** Phase 14 (Voice Journaling) — edit-before-submit flow + 2-week VIP pilot before general ship.

---

### Pitfall 16: Long recording hits Vercel function timeout (300s default)

**What goes wrong:**
User records a 10-minute reflection (some users are verbose, especially first-time users exploring). Audio blob ~5MB. Upload to `/api/voice/transcribe` — uploads in ~30s, Munsit processes in ~60s, response back ~10s. Total ~100s — fine. But user with slow 3G recording a 15-minute reflection: upload 120s + Munsit 90s + response 10s = 220s. Approaching Vercel's 300s default limit for Pro tier Node functions. Hobby tier is 10s — instant failure.

When timeout hits: user sees generic 504 error, their 15-minute recording is LOST. This is catastrophic UX — the longest reflection is often the most meaningful.

**Why it happens:**
Serverless function timeouts are invisible until hit. Nobody tests with 15-minute audio.

**How to avoid:**
- **Cap recording at 5 minutes client-side:** `MediaRecorder` auto-stops at 5:00. Copy: "التأمّل الموجز أعمق من المطوّل. إذا احتجت أكثر، سجّل مقطعاً آخر." Research-backed: spiritual journaling research shows 3–5 minutes is optimal reflection length.
- **Client-side chunked upload:** split recording into 60s chunks, upload each as it's recorded (live streaming) rather than one big blob on stop. Server transcribes each chunk, concatenates. User perceives instant transcription.
- **Vercel function config:** set `maxDuration = 300` explicitly in route config if recording is not chunked. Verify Pro tier is active (Hobby tier 10s timeout is fatal here).
- **Fluid Compute for voice route:** Taamun already uses Vercel Fluid Compute (per PROJECT.md) — this route specifically needs longer runtime; verify config.
- **Never-lose guarantee:** if transcription fails, return the audio blob URL + error code; client saves raw audio locally (IndexedDB, <=10MB), shows "التسجيل محفوظ — حاول نقله للنص لاحقاً." See Pitfall 17 re: audio-never-stored — this local save is ephemeral (cleared after successful transcription or 24h, whichever first), never uploaded permanently.

**Warning signs:**
- Server logs show 504 spikes on `/api/voice/transcribe`
- User support: "فقدت تسجيلي الطويل"
- Audio blobs with duration > 5min in upload logs

**Phase to address:** Phase 14 (Voice Journaling) — 5-min cap + chunked upload + maxDuration config.

---

### Pitfall 17: Audio data leaks into logs / storage / analytics (privacy catastrophe)

**What goes wrong:**
v1.3 goal: "no audio storage." But audio data is SUBTLY leaky:
- **Vercel request/response logs:** if POST body is large, Vercel may truncate but still stores metadata; if developer enables verbose logging, entire base64 audio ends up in log retention (30 days).
- **Sentry breadcrumbs:** error captured during transcription -> Sentry records request context -> audio blob ends up in Sentry's permanent error storage.
- **PostHog session replay:** if enabled (it's not currently, but could be added for debugging) replays the UI including the mic waveform AND captures the audio stream.
- **Supabase Storage with 7-day TTL:** developer uses Supabase Storage as a transcription queue, sets 7-day auto-delete — during those 7 days, audio IS stored despite the promise.
- **Munsit API logs:** Munsit retains sent audio for "service improvement" by default (many STT providers do) — unless explicitly opted out via contract.
- **Client-side IndexedDB cache:** if transcription fails (Pitfall 16), client caches blob locally; if not cleared on success, audio lives indefinitely on user's device.
- **Browser network log:** user with DevTools open sees the audio blob in the request — not a privacy violation per se, but reminds them the data was transmitted.

Users are told "no audio is stored." If this promise breaks — for a spiritual app — trust evaporates.

**Why it happens:**
"No storage" is an intent; the default behavior of every tool in the stack is "store things for debuggability."

**How to avoid — apply Phase 11 four-layer defense to audio:**
- **L1 Data:** no table with a `audio_blob` or `audio_url` column. Period. Schema review gate: any migration with `bytea` or `text NOT NULL` referencing audio -> reject.
- **L2 Type:** audio blob is a `Blob` / `ArrayBuffer` in memory ONLY, never serialized to a persistent type. A `TranscriptionRequest` type has `audio: Blob` (request-scoped) but `TranscriptionResult` has `text: string` only. Types enforce "audio is transient."
- **L3 Import:** grep guard `scripts/guards/phase-14-anti-patterns.sh` — `audio`, `Blob`, `MediaRecorder` must not appear in `src/lib/analytics.ts`, `src/lib/sentry.ts` (if added), `src/lib/email/`, or any storage helper. Munsit client imports ONLY in `src/lib/voice/transcribe.ts`.
- **L4 CI:** integration harness (mirror Phase 11 Scenario F): mock the transcription endpoint, submit a test audio blob with a known marker signature, assert zero occurrences of the marker in (a) Vercel logs dump, (b) PostHog event payloads, (c) any DB table. Harness fails if marker found.
- **Munsit contract:** contractually confirm zero-retention. If Munsit doesn't offer it, switch provider. Document the retention setting in `docs/voice-privacy.md`.
- **No Sentry/tracing in voice route:** voice API route has `export const runtime = 'nodejs'`, `export const dynamic = 'force-dynamic'`, AND explicit opt-out from any error-reporting middleware.
- **IndexedDB auto-purge:** any locally-cached blob auto-deletes on success (via explicit `indexedDB.delete`) and on failure after 24h (via periodic cleanup job in Service Worker if used).
- **Client-visible contract:** first-use modal states "صوتك لا يُحفظ — فقط النص المستخرج." User taps "فهمت" to proceed.

**Warning signs:**
- Any PR touching voice code that imports analytics / Sentry / logger libraries
- Vercel log search on signature marker returns results
- Storage bucket with name containing "voice", "audio", "recording", "transcribe-queue"
- Munsit usage dashboard shows stored audio file count > 0

**Phase to address:** Phase 14 (Voice Journaling) — non-negotiable. Privacy self-test harness MUST run in `guard:release`.

---

### Pitfall 18: Offline capture — user records without internet, transcription fails ungracefully

**What goes wrong:**
User is on Riyadh metro, no signal. Records a 3-minute reflection (MediaRecorder doesn't need internet). Taps "حفظ" — transcription API call fails with network error. App shows "حدث خطأ حاول مرة أخرى" and loses the audio. User loses their reflection. Worst on metros, planes, elevators — the exact contexts where reflection happens most.

**Why it happens:**
Happy-path assumption: "user always has connection."

**How to avoid:**
- **Offline detection pre-record:** `navigator.onLine === false` -> show "أنت خارج الإنترنت — سنسجّل الآن، وننقله للنص عند عودة الاتصال." Proceed with recording.
- **Queue pending transcriptions in IndexedDB:** offline-captured audio stored in a queue (with same TTL + auto-purge guarantees as Pitfall 17). When `online` event fires, auto-submit the queue.
- **User-visible queue status:** badge on the voice button: "1 تسجيل ينتظر الاتصال."
- **Fallback to transcript-less save:** if user doesn't want to wait for connection, allow saving the audio waveform visualization + a placeholder text "تسجيل صوتي — في انتظار النقل." Then delete audio on successful transcription. This preserves UX continuity.
- **Never silently drop:** any error path that would result in audio loss MUST surface recovery UI. Copy: "احتفظنا بالتسجيل — سنحاول مرة أخرى عند عودة الاتصال."

**Warning signs:**
- User support: "سجّلت تأمّلي بدون إنترنت وفقدته"
- `voice_recording_started` without matching `voice_transcription_completed` AND the user was offline per telemetry (check `navigator.onLine` at event time)

**Phase to address:** Phase 14 (Voice Journaling) — offline queue + visible status.

---

### Pitfall 19: Accidental long recording (user taps, walks away, records 20 minutes of nothing)

**What goes wrong:**
User taps "سجّل" by accident while scrolling. Button is tap-target-large (Arabic UI convention for accessibility). User doesn't notice they're recording — puts phone in pocket. 15 minutes later, they pull phone out, see a 15-minute audio visualizer. Tap "إيقاف" — app uploads 15 minutes of pocket-fabric rustling, Munsit spends minutes transcribing ambient noise into garbage, user sees 2,000 words of "ششش خخخ" -> confused/embarrassed. Feature-trust broken.

Also: cost attack vector — malicious user could intentionally record long silence to burn Munsit API quota.

**Why it happens:**
Tap-to-record has no "are you sure" friction. No silence detection. No max duration (covered by Pitfall 16 but even 5 min of pocket noise is bad UX).

**How to avoid:**
- **Press-and-hold to record, not tap-to-record:** user must keep finger on button. Release = stop. Matches WhatsApp voice note convention — familiar to KSA audience. Removes accidental-start + accidental-long.
- **Alternative for a11y users (can't hold):** tap once shows large red "يسجّل الآن — اضغط لإيقاف" button covering 1/3 of screen. Impossible to miss. 30-second countdown visible.
- **Silence detection:** Web Audio API analyzer on the mic stream; if amplitude < threshold for 5 consecutive seconds, auto-stop + discard. Copy: "لم نسمع شيئاً — حاول مرة أخرى."
- **Confirmation preview:** after recording stops, show waveform + duration ("تسجيل مدّته 3:42") + "سأحوّله للنص" / "إلغاء" buttons. User must explicitly confirm before transcription starts. Prevents accidental sends.
- **Visual + haptic feedback while recording:** red pulsing indicator + periodic haptic tap (iOS/Android) every 30s — impossible to forget a recording is in progress.

**Warning signs:**
- User support: "سجّلت بالخطأ"
- Munsit transcripts that are >90% repeated characters or spaces
- Recordings with duration > 5min AND transcript length < 50 words (signal: lots of silence)

**Phase to address:** Phase 14 (Voice Journaling) — press-and-hold pattern + silence detection.

---

## Critical Pitfalls — Arabic Screen Reader A11y Audit

### Pitfall 20: Arabic letter joining breaks on screen readers (letter-by-letter pronunciation)

**What goes wrong:**
VoiceOver / TalkBack read Arabic text. For properly joined Arabic ("صبر" rendered as three connected glyphs), screen readers should pronounce "sabr" as one word. But if the DOM contains the letters separated by invisible Unicode (zero-width joiner, soft hyphen, RTL/LTR marks) inserted by CSS pseudo-elements, copy-paste corruption, or CMS sanitizers — or if the font fails to load Arabic shaping — the reader pronounces "صاد · باء · راء" (letter names) one at a time. Unusable.

Another failure mode: developer uses `<span>` per character for hover-style animation. Each span breaks the screen reader's word boundary detection. Hover-animation devs rarely test with screen readers.

**Why it happens:**
Arabic text shaping is a font+renderer responsibility. DOM-level character separation defeats it. Developers not fluent in Arabic don't notice the listening experience.

**How to avoid:**
- **Never split Arabic strings character-by-character in DOM.** No `<span>{char}</span>` loops for Arabic content. If animation is required, use CSS animation on the whole text node (no JS split).
- **No `letter-spacing` on Arabic:** CSS `letter-spacing` is fundamentally broken for connected scripts — breaks glyph joining visually AND semantically. Grep guard: `letter-spacing:` in any component with `dir="rtl"` or `lang="ar"` is a bug.
- **Font-loading check:** Arabic fonts must load before first paint. Use `font-display: swap` NOT `optional` — the fallback system font may not have proper Arabic shaping on older Windows.
- **VoiceOver test protocol:** listen to every v1.2 component with VoiceOver enabled (Safari iOS + macOS). If any Arabic word sounds "letter-name-letter-name-letter-name" instead of one word, flag as P0.
- **Automated screenshot + OCR test** (ambitious): render the page, OCR the image, compare to the expected text. If OCR returns disconnected letters, font shaping broke.

**Warning signs:**
- VoiceOver reads "ألف لام صاد باء راء" instead of "الصبر"
- Arabic rendered with small visual gaps between letters that should be joined (visual symptom of shaping failure, audible symptom imminent)
- Font loading race causing flash of unshaped Arabic on slow networks

**Phase to address:** Phase 15 (Arabic A11y Audit) — VoiceOver/TalkBack pass is the core deliverable.

---

### Pitfall 21: Eastern Arabic numerals `١٢٣` read as individual digits or wrong

**What goes wrong:**
Phase 11 established "Eastern Arabic numerals on page, Western on share card" (e.g., YearInReviewArchive uses `Intl.NumberFormat("ar-SA-u-nu-arab")`). But VoiceOver's pronunciation of Eastern Arabic digits varies by platform:
- **iOS VoiceOver (Arabic voice):** reads `١٢٣` as "مئة وثلاثة وعشرون" (correct) when set to Arabic voice
- **iOS VoiceOver (English voice):** reads `١٢٣` as "one two three" (digit-by-digit) or sometimes skips entirely
- **TalkBack (Arabic):** usually OK
- **TalkBack (English on Arabic page):** often reads as Unicode code points or skips
- **Desktop NVDA/JAWS:** heavily locale-dependent; without Arabic voice pack installed, user hears "Arabic-Indic digit one, Arabic-Indic digit two, Arabic-Indic digit three"

Users with vision impairment who have their screen reader set to English (for English content elsewhere) but use Taamun for Arabic content are stuck with a degraded experience.

**Why it happens:**
Eastern Arabic digits (U+0660–U+0669) are distinct Unicode code points from Western digits (U+0030–U+0039). Screen readers rely on locale detection; if page locale doesn't match voice locale, pronunciation degrades.

**How to avoid:**
- **Explicit `lang="ar"` on the numeric element:** wrap numbers in `<span lang="ar">١٢٣</span>` — forces reader locale. Even if user's voice is English, SOME readers will switch voice for the lang-attributed span.
- **Aria-label with written-out number:** `<span aria-label="مئة وثلاثة وعشرون">١٢٣</span>` — bulletproof. Cost: need to convert number-to-Arabic-words function (~30 lines of JS, zero deps).
- **Test matrix:** VoiceOver iOS (Arabic voice + English voice), VoiceOver macOS (Arabic + English), TalkBack (Arabic + English), NVDA, JAWS. Document actual pronunciation per combination. If any combination is "unusable" (letter-by-letter), fix with aria-label.
- **On share card (Phase 11 uses Western numerals):** no action needed — Latin digits pronounced correctly everywhere.
- **Document the policy:** `docs/a11y-numerals.md` — every numeric display in Arabic UI uses pattern `<span lang="ar" aria-label="{arabic-words}">{eastern-digits}</span>`. Enforce via code review checklist.

**Warning signs:**
- VoiceOver reads "Arabic-Indic digit" prefix (catastrophic — unusable)
- Users with screen readers abandoning numeric flows (streak counters, day counters)
- A11y audit logs: "unlabeled content" warnings on numeric elements

**Phase to address:** Phase 15 (Arabic A11y Audit) — number-to-Arabic-words utility + wrap pattern.

---

### Pitfall 22: Live regions announcing too aggressively — every badge unlock shouts

**What goes wrong:**
Phase 7 badge-unlock UI uses `aria-live="assertive"` to announce "مبروك! فتحت وسام يوم 7." Assertive interrupts whatever the screen reader is currently saying — including if the user is mid-read of a Quranic verse on the same page. The sacred content gets interrupted by a congratulatory announcement. Opposite of the ritual mood.

Also: if multiple live regions fire in quick succession (badge + awareness-log save + progress-badge), they queue up and user hears a 20-second announcement barrage.

**Why it happens:**
`aria-live="assertive"` is the "make sure it's heard" option — developers reach for it when they want reliability. Doesn't consider that reliability is not the same as priority.

**How to avoid:**
- **`aria-live="polite"` by default:** announcement waits for current speech to finish. No interruption of Quranic verses or user-initiated actions.
- **`aria-live="assertive"` reserved ONLY for errors** the user must act on immediately (network failure during save, auth expiry).
- **Throttle announcements:** max 1 live-region announcement per 3 seconds. Queue excess; drop oldest if queue > 3.
- **Silence on sacred surfaces:** `/day`, `/reflection`, `/book` — NO live-region announcements whatsoever. Badge reveal happens on `/program` (Pitfall 7 from v1.2 — consistent with that decision).
- **Announcement audit:** grep for `aria-live` across codebase. Every occurrence gets a justification comment. Reviewer challenges any `assertive` that's not error-critical.

**Warning signs:**
- VoiceOver users report "يقاطعني أثناء القراءة"
- Multiple `aria-live="assertive"` regions on the same page
- Any `aria-live` inside `/day`, `/reflection`, `/book` routes

**Phase to address:** Phase 15 (Arabic A11y Audit) — audit + throttle + sacred-surface silence.

---

### Pitfall 23: ARIA-label pollution — label contradicts visible text

**What goes wrong:**
Developer adds `aria-label="Day 7 completed"` (English) on a button that visually displays "اليوم 7 مكتمل" (Arabic). Screen reader ignores the visible Arabic, reads the English label. User with VoiceOver hears English despite being on an Arabic page. Or: label says "button" on an element that's actually a link — semantic confusion. Or: outdated label — button text changed to "ابدأ الحلقة الثانية" but aria-label still says "Next cycle."

In some cases the aria-label is MORE detailed than the visible text and provides better context. But when label and visible text tell different stories, sighted+screen-reader users (low-vision users who use both) get a jarring experience.

**Why it happens:**
Developers add aria-labels as an afterthought, in English because that's the dev-facing language. Labels don't update when content does.

**How to avoid:**
- **Prefer visible text over aria-label:** if the button has visible Arabic text, don't add aria-label — screen reader uses the visible text by default (correct behavior).
- **Only use aria-label when text is missing** (icon-only buttons) or insufficient (icon + number like "7" needs "اليوم السابع مكتمل" context).
- **Aria-label MUST match language of page:** `aria-label` on Arabic page must be Arabic. Grep guard: any `aria-label="[A-Za-z ]+"` in `src/app/` is a bug.
- **Aria-label synchronization:** if visible text changes in a PR, reviewer verifies aria-label also updated.
- **Icon buttons default to `aria-label`:** `<button aria-label="حفظ"><SaveIcon /></button>` — required for icon-only.
- **Automated test:** extract every aria-label from the rendered DOM, assert all are Arabic (only Arabic Unicode range).

**Warning signs:**
- `aria-label` containing English on an Arabic page
- Button where visible text and aria-label differ semantically
- Screen reader announces stale text after a visible UI change

**Phase to address:** Phase 15 (Arabic A11y Audit) — labels pass + automated Arabic-only check.

---

### Pitfall 24: Focus management — RenewalBanner and modal-like components miss focus-trap

**What goes wrong:**
Phase 9 shipped RenewalBanner. Is it a modal? If yes, focus must be trapped inside (Tab cycles within banner, not to elements behind); first focusable element auto-focused; Escape closes + returns focus. If no, focus flows normally past it.

Two failure modes:
- **Treated as modal, but not:** auto-focuses the renewal CTA, hijacking user's attention from the reflection flow. User mid-way through reflection has focus yanked to "جدّد اشتراكك." Hostile.
- **Treated as non-modal, but should be:** keyboard user tabs past the banner and never reaches the "Dismiss" button, or dismiss button is reachable only by reverse-tabbing through the entire page.

Also: after dismissing a banner, focus should return to where the user was — often lost, user dropped to page top.

**Why it happens:**
"Modal-or-not" is a binary that's rarely documented. Developer picks one, doesn't test with keyboard-only navigation.

**How to avoid:**
- **Document the decision:** `src/components/RenewalBanner.tsx` comment: "// Non-modal: flows inline, focus flows naturally, no trap."
- **Non-modal banners:** render inline in the page flow. Tab reaches dismiss/CTA naturally. No `role="dialog"`. No auto-focus.
- **Modal banners (reserve for critical flows like renewal mid-checkout):** `role="dialog"`, `aria-modal="true"`, focus trap using standard pattern (tab from last focusable cycles to first; reverse-tab from first cycles to last), Escape closes, focus returns to trigger. Consider if the existing codebase already uses a modal pattern somewhere (check `src/components/`) and reuse it.
- **Test with Tab key only:** keyboard-only user attempts every flow. Must be able to complete without mouse. 100/100 Lighthouse a11y implies tab-navigable — verify.
- **Focus-return invariant:** every component that removes a focused element from the DOM (banner dismissal, modal close) explicitly calls `triggerElement.focus()` before unmount.

**Warning signs:**
- Keyboard user can't dismiss banner without 30 tabs
- Auto-focus on a banner disrupts a user typing in a textarea
- Screen reader announces "dialog opened" for a non-dialog banner

**Phase to address:** Phase 15 (Arabic A11y Audit) — focus audit across all banner/modal surfaces.

---

### Pitfall 25: Missing `lang="ar"` on nested Arabic within English sections (or vice versa)

**What goes wrong:**
Admin dashboard (or any devops-facing surface) is often English. If admin emails embed Arabic quote ("قال المستخدم: ...عبارة") without `lang="ar"`, screen reader reads Arabic chars with English phonetic approximation — incomprehensible. Or: marketing landing page in Arabic embeds an English book title "City of Meaning" — without `lang="en"`, Arabic voice attempts to pronounce English, sounds ridiculous.

Also: CLAUDE.md mandates `html dir="rtl" lang="ar"` at root, but components mix Arabic + English strings at finer granularity (share card mentions Latin TAAMUN + Arabic content; email with Arabic body + English footer).

**Why it happens:**
Root-level lang attribute is set once, forgotten. Nested language switches not signaled.

**How to avoid:**
- **Explicit `lang` attr on any language-switched span:** `<span lang="en">TAAMUN</span>` inside Arabic content. And vice versa.
- **Automated check:** scan rendered DOM for text nodes where detected script doesn't match closest `lang` ancestor. Script: iterate nodes, check if Arabic Unicode chars appear under `lang="en"` or Latin chars under `lang="ar"`. Flag as warning.
- **Emails + OG images:** apply same rule in Satori/ImageResponse templates.
- **Component library:** wrap `<EnglishSpan>` and `<ArabicSpan>` components that auto-set lang. Reduces forgotten attrs.
- **Admin UI:** admin dashboard deliberately English for Ziad's dev workflow; apply lang="en" at admin root, nested Arabic content always gets `lang="ar"` span.

**Warning signs:**
- Arabic screen reader pronouncing English words phonetically Arabic (unintelligible)
- English screen reader pronouncing Arabic chars letter-name (unintelligible)
- Mixed-language pages missing nested `lang` attrs

**Phase to address:** Phase 15 (Arabic A11y Audit) — nested-lang audit + helper components.

---

## Critical Pitfalls — General Integration (cross-cutting v1.3)

### Pitfall 26: Vector column migration breaks live `/api/guide` during deploy (NFR-09 two-step)

**What goes wrong:**
Phase 12 and Phase 13 both need `vector` columns (pgvector extension). Naive migration: `ALTER TABLE reflections ADD COLUMN embedding vector(1536) NOT NULL`. On a table with thousands of rows, this locks the table while Postgres scans and computes defaults. Meanwhile, `/api/program/progress` trying to INSERT new reflection hangs, times out, returns 500 to the live user. Mirror of Pitfall 30 from v1.2.

Worse: pgvector extension must exist in the DB. If `CREATE EXTENSION vector` wasn't run, the migration fails midway — partial state, some tables altered, others not. Supabase migration runner may or may not rollback depending on version.

**Why it happens:**
NFR-09 two-step pattern was articulated in v1.2 for text/boolean columns. vector columns raise the stakes: they're LARGE (1536 floats × 8 bytes = 12KB per row, huge table growth), slow to populate (need OpenAI API call per row), and require an extension.

**How to avoid:**
- **Three-step vector migration:**
  1. **Schema:** `CREATE EXTENSION IF NOT EXISTS vector;` + `ALTER TABLE ... ADD COLUMN embedding vector(1536)` (NULLABLE, no default). Instant.
  2. **Backfill:** dedicated cron `/api/cron/backfill-embeddings` — processes 100 rows/minute, calls OpenAI, writes embedding. Runs for however long it takes (likely hours for thousands of rows). Respects `OPENAI_DAILY_BUDGET_USD` (Pitfall 6).
  3. **Index + constraint (optional):** once backfilled, add pgvector HNSW/IVFFlat index. NEVER set NOT NULL — embeddings may legitimately be absent for deleted/corrupted rows.
- **Deploy order:** migration (step 1) ships in a PR alone. App code using embeddings ships in subsequent PR, AFTER backfill completes. App code gracefully handles `embedding IS NULL` (fallback: skip RAG, use base prompt).
- **Pgvector extension existence check:** dedicated migration that ONLY runs `CREATE EXTENSION IF NOT EXISTS vector;` BEFORE any column additions. Verify on a Supabase staging project before prod.
- **Supabase `supabase db push` order:** run migrations in numerical order, verify each success before next. `db push` may batch — explicitly apply one at a time in prod.
- **Rollback plan documented:** if backfill cron runs wildly over budget, the app code must gracefully handle embedding-less users; rollback = drop the column, re-deploy app code without RAG.

**Warning signs:**
- Supabase dashboard shows long-running `ALTER TABLE` query
- `/api/program/*` latency spikes during deploy window
- Backfill cron incomplete after 24 hours
- Mixed state: some rows embedded, some not, and code doesn't handle gracefully

**Phase to address:** Phases 12 + 13 — migration pattern documented in each phase plan.

---

### Pitfall 27: Service-role abuse — new cron routes bypass CRON_SECRET check

**What goes wrong:**
v1.3 adds ≥3 new cron routes: `/api/cron/cluster-themes`, `/api/cron/extract-memory`, `/api/cron/backfill-embeddings`. Each uses Supabase admin client (service role) for user-crossing reads. If route doesn't verify `CRON_SECRET`:
- Attacker hits `/api/cron/cluster-themes` publicly → server burns OpenAI credits running clustering for random users → DOS + cost attack
- Attacker hits `/api/cron/extract-memory` → bypasses RLS → can read OTHER users' memory via service-role query
- Attacker hits `/api/cron/backfill-embeddings` → same RLS bypass, can dump embeddings

Service role bypasses RLS by design. Service-role route MUST be either (a) not publicly routable, or (b) gated by a secret. Vercel cron routes are publicly routable by default — anyone can `curl /api/cron/whatever`.

**Why it happens:**
Vercel cron is a scheduler, not an authenticator. Cron sends `Authorization: Bearer $CRON_SECRET` but the route must VERIFY it.

**How to avoid:**
- **Standard cron guard:** `src/lib/cron.ts` exports `requireCronSecret(req: Request): void | throws`. Every cron route starts with `requireCronSecret(req);`. Missing header or wrong value → 401.
- **Env var required:** `CRON_SECRET` (already exists in the stack pattern). Verify set in production before ship.
- **Service role client isolated:** `src/lib/supabaseAdmin.ts` — already exists per CLAUDE.md. Grep guard: service role client imported ONLY in `src/app/api/cron/*`, `src/app/api/admin/*`, and webhook routes. Forbidden in user-scoped routes, components, or lib/ (except the admin file itself).
- **Audit table:** every service-role query writes an audit entry `cron_audit_log(route, actor='cron'|'admin', started_at, user_ids_touched_count)`. Retain 90 days. Anomaly detection: unexpected row count in audit log signals abuse.
- **Integration harness:** attempt each cron route WITHOUT the header → assert 401. Attempt WITH header → assert 200. Fail CI otherwise.

**Warning signs:**
- Any `src/app/api/cron/*/route.ts` without `requireCronSecret` call in first 5 lines
- Service role client imported outside the allowed paths
- Cron audit log showing anomalous invocation counts

**Phase to address:** Phases 12, 13, and the embeddings-backfill cron (cross-phase) — every cron route.

---

### Pitfall 28: Embeddings infrastructure duplication (themes + memory both need it)

**What goes wrong:**
Phase 12 (themes) adds `reflection_embeddings` table and `openaiEmbed()` util. Phase 13 (memory) — shipped 2 months later — adds `memory_embeddings` table and `computeEmbedding()` util. Two tables with identical schema, two utility functions with divergent retry logic, two places where API key is referenced, two places where dimension changes (3-small → 3-large if upgraded) need to be updated.

Year from now: OpenAI deprecates `text-embedding-3-small`. Need to re-embed. Two migration paths, two backfill crons, two opportunities for drift. One gets updated, the other doesn't. Theme clusters now use new embeddings, memory vector search uses old — cross-compatibility gone.

**Why it happens:**
Phases ship independently. DRY infrastructure is second-order; getting each feature working is first-order.

**How to avoid:**
- **Phase 12 designs for Phase 13 reuse:**
  - Single `embeddings` table with `entity_type` discriminator (enum: `reflection`, `memory_note`, `guide_turn`) and `entity_id` FK. Not per-feature tables.
  - Single util `src/lib/embeddings/index.ts` exporting `embedText(text, { model })`. Retry logic, batching, rate limiting in ONE place.
  - Single model version constant: `EMBEDDING_MODEL = 'text-embedding-3-small'` + `EMBEDDING_DIM = 1536`. Any migration to new model updates both.
  - Single `openai_usage_log` for cost tracking (Pitfall 6) covers all embedding users.
- **Phase 13 plan explicitly says "extend existing embeddings infra, do not re-create."** Gate check at Phase 13 kickoff: inventory what Phase 12 shipped, design memory ON TOP of it.
- **Shared guard file:** `scripts/guards/embeddings-discipline.sh` — grep asserts there's ONE `embedText` callsite pattern, ONE table, ONE model constant.

**Warning signs:**
- Two tables with `vector(1536)` columns
- Two util functions calling `openai.embeddings.create`
- Inconsistent retry/batching behavior between code paths

**Phase to address:** Phase 12 (Themes) — embeddings infra design decision locked in here. Phase 13 (Memory) — reuse audit at kickoff.

---

### Pitfall 29: RLS missing on new v1.3 tables

**What goes wrong:**
Recurrence of v1.2 Pitfall 31. New tables in v1.3: `reflection_embeddings`, `theme_clusters`, `theme_cluster_runs`, `guide_memory`, `memory_embeddings`, `openai_usage_log`, `cron_audit_log`, possibly `voice_transcription_log` (if needed — but per Pitfall 17 we avoid this). Each MUST have RLS enabled + user-scoped policy, or anon client reads all users' data.

Extra risk for v1.3: `guide_memory` is MORE sensitive than v1.2 data — it's accumulated user-inner-world distilled to keyword form. Leak = catastrophic.

**Why it happens:**
Supabase tables default to RLS-off. Easy to forget.

**How to avoid:**
- **Migration template:** every `CREATE TABLE` followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + at minimum `CREATE POLICY user_scope_select ON ... FOR SELECT USING (auth.uid() = user_id);` and INSERT/UPDATE/DELETE policies.
- **Post-migration audit script:** `scripts/audit-rls.sql` runs `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;` — wire into `guard:release`. Must return zero rows.
- **Admin-accessible tables (`cron_audit_log`, `openai_usage_log`):** RLS still enabled; policy `FOR SELECT USING (auth.jwt()->>'email' = ANY(ADMIN_EMAILS))` — never open-select.
- **For embeddings tables:** RLS policy uses the JOIN to parent (e.g., `reflection_embeddings` policy joins `reflections` to check `auth.uid() = reflections.user_id`). OR denormalize `user_id` onto embeddings table for simpler policy — prefer this: faster + simpler RLS.
- **`guide_memory` double-isolation:** RLS + mandatory `WHERE user_id = :current` in every query (belt and suspenders). Integration test asserts cross-user query returns empty.

**Warning signs:**
- New table without `ENABLE ROW LEVEL SECURITY` statement
- Supabase dashboard "unrestricted" warning banner
- Any anonymous-role SELECT returning > 0 rows from user-scoped tables

**Phase to address:** Every phase adding tables (12, 13, 14) + add to `guard:release`.

---

### Pitfall 30: Privacy invariant erosion — new analytics events sneak in PII through derived data

**What goes wrong:**
v1.2 established 4-layer privacy defense for Year-in-Review. v1.3 adds many new event opportunities:
- `themes_generated` with `{ theme_labels: [...] }` → if vocab not tight (Pitfall 3, 5), leaks derived content
- `voice_transcription_completed` with `{ word_count, duration_ms }` → seems safe, BUT transcript text could sneak in via error event `{ transcript_snippet: '...' }` "for debugging"
- `memory_updated` with `{ fact_type: 'preference' }` → what if fact_type includes user name or reflection keyword?
- `a11y_feature_used` with `{ reader: 'VoiceOver', lang: 'ar' }` → assistive-tech disclosure is sensitive (disability disclosure is PII in most jurisdictions)

Each event is individually innocent. Cumulative effect: user's spiritual inner world reconstructable from analytics stream.

**Why it happens:**
Event schemas grow incrementally. Each addition reviewed in isolation. Cross-event correlation risk rarely considered.

**How to avoid:**
- **Explicit event allow-list extended for v1.3:** add Phase 12 (2 events: `themes_viewed`, `themes_regenerated`), Phase 13 (2 events: `memory_surfaced`, `memory_disputed`), Phase 14 (3 events: `voice_permission_granted`, `voice_transcription_completed`, `voice_fallback_used`), Phase 15 (0 analytics events — a11y is not tracked). Anything beyond this list requires explicit privacy review PR.
- **Property whitelist per event:** defined in `src/lib/analytics/eventSchema.ts` (or equivalent). Compile error if code emits a property not in the schema for that event.
- **Banned property names (lint rule):** `*_text`, `*_content`, `*_snippet`, `transcript`, `utterance`, `reflection_*` (except `_count`, `_duration`), `memory_*` (except `_tier`, `_count`), `disability`, `impairment`, `reader_name`. Pre-commit hook greps for these in `track(` calls.
- **Red-team self-test per phase:** attempt to reconstruct user's reflection content from event stream. If any property narrows it down by >1 bit of entropy, it's sensitive.
- **Assistive tech disclosure:** NEVER log which reader/assistive tech is used. Know by A/B test aggregate metrics only.

**Warning signs:**
- Any event property name on the banned list
- New event emitted without corresponding schema update
- PR diff adds event without privacy review checklist checked

**Phase to address:** All v1.3 phases — each phase plan enumerates its events + properties up-front.

---

### Pitfall 31: VIP-first tier strategy accidentally creates a two-tier privacy model

**What goes wrong:**
To control costs (Pitfall 11) AND manage rollout risk, v1.3 considers VIP-first gating for memory/voice/themes. Intent: VIP users get depth features, free/quarterly users keep basic experience. Risk: VIP users' data flows through MORE pipelines (embeddings, memory extraction, theme clustering, voice transcription) — more surfaces where privacy can leak. Paying users accidentally get WORSE privacy than free users.

Also: billing-tier-aware code has bugs. What happens if a VIP user downgrades? Their memory stays, but their embeddings stop regenerating — memory gets stale, reinforces old self-image. Is that acceptable?

**Why it happens:**
Feature gating is product logic; privacy is infrastructure. Two different teams (or two different mental models of the solo founder) design them independently.

**How to avoid:**
- **Privacy invariants are universal, not tiered:** all 4-layer defenses (Themes/Memory/Voice) apply regardless of tier. VIP users don't get a "richer" (= leakier) pipeline; same privacy contract for everyone.
- **Tier gate is at FEATURE ACCESS, not DATA FLOW:** "VIP can use voice" → entire voice pipeline (Pitfall 17 four-layer defense) is identical for a VIP user vs a hypothetical free user allowed to test.
- **Downgrade handling:** when user downgrades, STOP regenerating memory/themes. Existing memory is retained (user-accessible via `/account/memory`). Show "ميزة الذاكرة متاحة للمشتركين — تأمّلاتك محفوظة وستستأنف عند التجديد."
- **No VIP-only log destinations:** if VIP events go to a separate PostHog project or log bucket, it's a two-tier privacy model. Same project, same tier of privacy.
- **Document the universal invariants:** `docs/privacy-invariants.md` — applies to every tier, every feature, every user.

**Warning signs:**
- Conditional branches like `if (user.tier === 'vip') { ...extra logging... }`
- Feature flag `ENABLE_DEEP_ANALYTICS_FOR_VIP`
- VIP-only tables or buckets

**Phase to address:** Every v1.3 phase that has tier-based access — memory, voice, themes.

---

## Technical Debt Patterns (v1.3 additions)

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Monthly cron-only theme regen (no event trigger) | Simple to implement | Stale themes (Pitfall 4); feels impersonal | Only as v1.3.0 initial ship; add event trigger in v1.3.1 |
| Open-vocabulary Claude theme labeling | More expressive labels | Drift / hallucination / privacy surface (Pitfalls 3, 5) | Never — fixed vocabulary from the start |
| Raw memory rows injected per-turn (no summary cache) | Simpler code | Cost explosion (Pitfall 11) | Never — summary cache is day-1 |
| Tap-to-record voice UI | One-tap simplicity | Accidental long recordings (Pitfall 19) | Never — press-and-hold from day 1 |
| Audio-in-Supabase-Storage queue for retries | Reliable retry | Privacy promise broken (Pitfall 17) | Never — IndexedDB local-only retry |
| `aria-live="assertive"` on badges/notifications | Guaranteed announcement | Interrupts sacred content (Pitfall 22) | Never — polite + throttled |
| Separate embeddings infra per feature | Each phase ships independently | Drift when model upgrades (Pitfall 28) | Never — Phase 12 designs for Phase 13 reuse |
| Async memory extraction everywhere | Cost optimization | Cross-device inconsistency (Pitfall 9) | Only for inferred facts, never for explicit preferences |
| Open event schema (add properties as needed) | Fast iteration | PII erosion (Pitfall 30) | Never — whitelist at Phase kickoff |

---

## Integration Gotchas (v1.3)

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI embeddings + Arabic text | Send raw text, assume multilingual handles morphology | Light normalization (Pitfall 2) + verify empirically before shipping |
| Claude theme labeling | Open prompt "generate a label" | Classification prompt with fixed vocabulary + regex validation |
| pgvector migrations | `ADD COLUMN vector NOT NULL` on live table | Three-step: add nullable → backfill cron → add index (never set NOT NULL) |
| Anthropic prompt caching | Ignore, pay full per-turn cost | Use cache_control on stable system prompt + memory summary (Pitfall 11) |
| MediaRecorder | Assume uniform cross-browser | Feature-detect MIME + explicit timeslice + visibilitychange handler |
| `getUserMedia` rejection | No catch, button hangs | Explicit `NotAllowedError` → text-input fallback |
| Munsit STT | Trust transcript, auto-submit | Show transcript, require user edit+confirm before save |
| Vercel cron routes | Public by default, forget CRON_SECRET | `requireCronSecret(req)` in first 5 lines of every cron handler |
| Supabase Realtime for memory sync | Enable for all sessions | Evaluate cost per active connection; defer to v1.3.b if not in budget |
| VoiceOver + Eastern Arabic digits | Assume reader pronounces numerals | `<span lang="ar" aria-label="{arabic-words}">١٢٣</span>` wrap |
| `aria-label` authored in English | Dev-language convenience | Arabic-only labels; grep guard on lang mismatch |
| Service role client usage | Anywhere admin-ish seems needed | Only in `src/app/api/cron/*`, `src/app/api/admin/*`, webhooks |

---

## Performance Traps (v1.3)

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-turn RAG context including raw memories | Token count > 2x, TTFB > 3s | Memory summary cache (<=500 tokens) + prompt caching | Immediately on any active user |
| k-means on full-dim embeddings at small-N | Unstable clusters, poor labels | Dimensionality reduction (UMAP) + min-N=60 gate | First real users past 30 reflections |
| Missing pgvector index on vector column | Slow similarity search at scale | HNSW or IVFFlat index after backfill | >100 embeddings per user |
| Regenerating embeddings every cron tick | OpenAI bill spike | Only embed NEW reflections; cache existing | Cron frequency > daily |
| Voice upload 15-min blob on one POST | 504 timeout, user loses reflection | 5-min client cap + chunked upload | First verbose user |
| Live-region queue on component remount | 20-sec announcement barrage | Throttle + dedup announcement IDs | Badge + awareness + progress same page |
| Cluster regeneration triggered on every reflection | Cron invocation flood | 3-day minimum throttle + idempotency table | Active user writing 5+ reflections/day |
| Admin-key check on every admin request via DB | Every admin view triggers extra query | Cache decision in session; 5-min TTL | After ~50 admin views |

---

## Security Mistakes (v1.3)

| Mistake | Risk | Prevention |
|---------|------|------------|
| Theme label = personal-event term in vocabulary | Privacy breach via derived data (Pitfall 5) | Vocabulary review with privacy lens; Quranic concepts only |
| Memory stored from sarcastic/despairing utterance as semantic | Re-traumatization of user (Pitfall 7) | Valence filter + 3-session promotion rule |
| Vector search cross-user bleed | Other users' memory leaks into response (Pitfall 12) | RLS + mandatory `WHERE user_id=:current` + integration test |
| Audio blob in Vercel request logs | Privacy promise broken (Pitfall 17) | No verbose logging on voice route; Sentry opted out |
| Cron route missing `requireCronSecret` | DOS / cost attack / RLS bypass (Pitfall 27) | Standard guard import in every cron route |
| Service-role client imported outside allowed paths | RLS bypass vector | Grep guard in CI |
| aria-label containing English on Arabic page | A11y failure + potential XSS if dynamic (Pitfall 23) | Arabic-only automated check |
| New v1.3 table without RLS | Data breach (Pitfall 29) | Migration template + post-deploy audit |
| PostHog event property containing transcript/memory content | PII leak (Pitfall 30) | Banned-name lint rule + schema whitelist |
| Assistive-tech disclosure in analytics | Disability disclosure violation | Never log screen reader name/type |
| VIP-only data flow to separate log destination | Two-tier privacy model (Pitfall 31) | Universal invariants documented |
| OpenAI API logs retain audio/reflection content | Third-party retention | `store=false` on all API calls where supported + contract |

---

## UX Pitfalls (v1.3)

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Themes feel random at low-N (Pitfall 1) | User sees themes they never wrote about — trust lost | Min-N=60 gate + stability check |
| Themes drift English / hallucinate (Pitfall 3) | Jarring Arabic UI; feels non-native | Fixed Arabic vocabulary + classification not generation |
| Themes stale relative to user's current state (Pitfall 4) | Feature feels impersonal, defeats v1.3 goal | Dual trigger (cron + event) + freshness indicator |
| Memory surfaces negative past utterance (Pitfall 7) | Re-traumatization; catastrophic trust loss | Valence filter + tier promotion + user-editable memory |
| Memory inconsistent across devices (Pitfall 9) | "You don't remember what I just said" | Synchronous write for explicit preferences |
| Guide hallucinates recall (Pitfall 12) | "The guide lied about me" | Citation contract + output validation + user-flag mechanism |
| Voice recording silently fails on iOS (Pitfall 13) | iPhone users (65% KSA) can't use feature | Cross-browser detection + MIME fallback |
| Mic denied, feature frozen (Pitfall 14) | User bounces, feature abandoned | Text-input fallback + no silent re-prompt |
| STT transcription unusable (Pitfall 15) | User spends more time editing than writing | Show transcript, require edit+confirm; VIP pilot before ship |
| Long recording lost to timeout (Pitfall 16) | Most meaningful reflection disappears | 5-min cap + chunked upload + never-lose guarantee |
| Offline recording fails ungracefully (Pitfall 18) | Metro/plane/elevator reflections lost | Offline queue with visible status |
| Accidental pocket recording (Pitfall 19) | Embarrassing garbage transcript | Press-and-hold + silence detection + confirm preview |
| Screen reader pronounces Arabic letter-by-letter (Pitfall 20) | Unusable for blind users | No character splitting; verify VoiceOver per component |
| Eastern Arabic numerals read wrong (Pitfall 21) | Numeric content inaccessible | `lang="ar"` + aria-label with Arabic words |
| Assertive live regions interrupt Quran (Pitfall 22) | Sacred content interrupted | Polite + throttled + silent on sacred surfaces |
| Focus trap wrong on banners (Pitfall 24) | Keyboard users stuck | Document modal-or-not decision per component |
| English aria-label on Arabic page (Pitfall 23) | Screen reader mismatches visible | Arabic-only lint |
| Nested lang attrs missing (Pitfall 25) | Phonetic garbage across language boundaries | Helper components auto-set lang |

---

## "Looks Done But Isn't" Checklist (v1.3)

Critical verifications before declaring each phase complete.

### Phase 12 (Themes ML Clustering)
- [ ] Min-N=60 gate: <60 reflections → gentle message, NO clustering attempted
- [ ] Stability check: 5-seed Rand index > 0.7 required before surfacing
- [ ] Fixed vocabulary: all labels validate regex `^[\u0600-\u06FF]{2,8}$` — no English / Latin drift
- [ ] Vocabulary privacy review: no personal-event / relationship / health terms
- [ ] Arabic normalization: test fixture of 20 same-theme pairs shows similarity improvement
- [ ] Idempotency: `theme_cluster_runs` unique constraint prevents double-run/day
- [ ] Cron has `requireCronSecret(req)` — test returns 401 without header
- [ ] Dual trigger: cron every 7 days AND event-driven at +10 new reflections
- [ ] Four-layer privacy defense: `ThemeEvidence` type never imported outside Server Components or `src/lib/themes/`
- [ ] Guard script `phase-12-anti-patterns.sh` blocks ThemeEvidence in analytics/email/OG/push
- [ ] Cost circuit breaker: max 2 runs/user/day enforced
- [ ] RLS enabled on `theme_clusters`, `theme_cluster_runs`, `reflection_embeddings`

### Phase 13 (Long-Term Memory)
- [ ] Three tiers (ephemeral/episodic/semantic) implemented; first 4 weeks semantic tier disabled
- [ ] Valence filter: negative-valence utterances never promoted to semantic
- [ ] Promotion rule: ≥3 sessions with same theme required for semantic
- [ ] Synchronous write on `explicit_preference` classification; async only for inferred
- [ ] `/account/memory` page shows all semantic entries; delete button per entry works
- [ ] Reflection delete cascades: embedding + memory recompute + cluster regen queue
- [ ] Memory summary cache (≤500 tokens) used per turn, NOT raw memory rows
- [ ] Anthropic prompt caching enabled on system prompt + summary
- [ ] Per-user daily turn cap active (free: 20, VIP: unlimited)
- [ ] Budget alarm at $30/day triggers degraded mode
- [ ] Citation contract in prompt: verbatim Arabic quotes required for recall claims
- [ ] Output validation: quoted strings verified against retrieved memory
- [ ] Confidence threshold 0.80 on vector retrieval
- [ ] Cross-user isolation: integration test impersonates user A, asserts zero user B memories
- [ ] Four-layer privacy defense: `MemoryContext` never imported outside `src/lib/guide/`
- [ ] Guard script `phase-13-anti-patterns.sh` blocks MemoryContext in analytics/email/push
- [ ] Harness regression-insurance self-test: inject memory phrase, grep all outbound → zero
- [ ] Event whitelist: only `memory_surfaced`, `memory_disputed` emitted; no content properties
- [ ] RLS enabled on `guide_memory`, `memory_embeddings`

### Phase 14 (Voice Journaling)
- [ ] Cross-browser test matrix: iOS Safari 17/18, Android Chrome, Samsung Browser, desktop Chrome/Safari — all pass
- [ ] MIME detection: webm+opus OR mp4+aac handled server-side
- [ ] `NotAllowedError` caught, text-input fallback shown
- [ ] Permission denial stored, no re-prompt for 7 days
- [ ] Press-and-hold recording pattern (or large-button-with-countdown for a11y)
- [ ] Silence detection: 5s sub-threshold → auto-stop + discard
- [ ] 5-minute client-side cap enforced
- [ ] Confirmation preview (waveform + duration) before transcription submitted
- [ ] Transcript edit+confirm UI before save (never auto-submit)
- [ ] Low-confidence word highlighting
- [ ] 2-week VIP pilot: edit-distance median < 20% before general release
- [ ] Offline queue: captures during offline, auto-submits on reconnect
- [ ] IndexedDB blobs auto-purge on transcription success OR after 24h
- [ ] Four-layer privacy defense: audio never in any table, type, import, or CI payload
- [ ] Guard script `phase-14-anti-patterns.sh` blocks audio/Blob in analytics/Sentry/email
- [ ] Harness regression-insurance: audio marker injection → grep outbound → zero
- [ ] Munsit contract: zero-retention confirmed in writing
- [ ] Vercel route: `maxDuration` configured; Fluid Compute enabled for route
- [ ] First-use modal: "صوتك لا يُحفظ — فقط النص المستخرج"
- [ ] No Sentry / tracing middleware on `/api/voice/transcribe`
- [ ] Event whitelist: voice_permission_granted, voice_transcription_completed (no transcript), voice_fallback_used

### Phase 15 (Arabic A11y Audit)
- [ ] VoiceOver test: every v1.2 component passes — Arabic read as words, not letters
- [ ] TalkBack test: every v1.2 component passes
- [ ] No `<span>` per character in Arabic text; no `letter-spacing` on RTL
- [ ] Eastern Arabic numerals: wrapped `<span lang="ar" aria-label="{words}">` pattern everywhere
- [ ] Number-to-Arabic-words utility shipped + unit tested
- [ ] Live regions: zero `aria-live="assertive"` on sacred pages
- [ ] Live regions: polite + throttled (max 1 per 3s) elsewhere
- [ ] Zero `aria-live` in `/day`, `/reflection`, `/book` routes (grep guard)
- [ ] All `aria-label` values Arabic-only (automated DOM scan)
- [ ] Icon-only buttons have aria-label; text buttons do NOT (avoid pollution)
- [ ] Focus-trap decision documented per banner/modal
- [ ] Non-modal banners: keyboard Tab reaches CTA naturally, no auto-focus
- [ ] Dismiss returns focus to trigger element
- [ ] Keyboard-only flow walkthrough: complete day-reflection-awareness-share without mouse
- [ ] Nested lang attrs: `<span lang="en">` on English fragments in Arabic, `<span lang="ar">` on Arabic in English
- [ ] Lighthouse A11y ≥ 98 at 3 viewports (375px / 768px / 1440px)
- [ ] Guard script `phase-15-anti-patterns.sh`: letter-spacing on RTL, assertive on sacred pages, aria-label English regex

### Cross-Cutting (applies to all v1.3 phases)
- [ ] Every new table has RLS + policy; `rowsecurity=false` audit returns zero
- [ ] Every cron route calls `requireCronSecret(req)` in first 5 lines
- [ ] Vector migrations three-step (extension → nullable add → backfill cron → index)
- [ ] Single embeddings infra (one table with entity_type discriminator, one util)
- [ ] Event schema whitelist extended for v1.3; no wildcard properties
- [ ] Banned-name lint rule active: `*_text`, `*_content`, `*_snippet`, `transcript`, `utterance`, `memory_*` except enum/count, `reflection_*` except _count/_duration
- [ ] `npx tsc --noEmit && npm run build` passes
- [ ] `guard:release` chain includes phase-12, phase-13, phase-14, phase-15 anti-pattern guards
- [ ] Arabic-only UI strings in new components (grep PR diff)
- [ ] Privacy invariants universal across tiers (free = VIP privacy contract)

---

## Recovery Strategies (v1.3)

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Theme label is wrong/English (Pitfall 3) | LOW | Admin manual override table `theme_label_corrections`; re-run failed labels with fixed prompt |
| Theme labeled with personal-event term (Pitfall 5) | MEDIUM | Remove term from vocabulary; re-cluster affected users; audit previous labels for leakage |
| Memory poisoned with despair utterance (Pitfall 7) | MEDIUM | Admin mass-demote `semantic`→`ephemeral` on affected rows; user-visible "ذاكرة الدليل أُعيد ضبطها" |
| Memory leaked into analytics (Pitfall 8) | HIGH | PostHog data-delete API for affected events; audit retention; user notification per PDPL |
| Audio leaked into logs (Pitfall 17) | HIGH | Incident response: purge Vercel logs, Sentry events, Munsit contract review, user comms if material |
| STT transcription unusable for most users (Pitfall 15) | MEDIUM | Disable voice feature, keep text; VIP-only re-enable after Munsit tuning |
| pgvector migration stalls (Pitfall 26) | HIGH | Rollback column, re-deploy app without embeddings; re-plan three-step |
| Cron route DOS'd (Pitfall 27) | MEDIUM | Rotate `CRON_SECRET`; verify `requireCronSecret` added to route; audit log for affected window |
| RLS missing on v1.3 table (Pitfall 29) | HIGH | Emergency policy deploy; audit access logs for anon-role reads; user notification if data accessed |
| Hallucinated recall quoted verbatim by guide (Pitfall 12) | HIGH | User trust repair message; memory entry marked disputed; guide prompt hotfix (strict citation enforcement) |
| VoiceOver unusable (Pitfall 20) | MEDIUM | Font-loading fix + remove character splits; VoiceOver re-verify per component |

---

## Pitfall-to-Phase Mapping

| # | Pitfall | Prevention Phase | Verification |
|---|---------|------------------|--------------|
| 1 | Clustering noise at small-N | Phase 12 | Min-N=60 gate + stability 5-seed test |
| 2 | Arabic morphology breaks embeddings | Phase 12 | Empirical fixture test, similarity delta |
| 3 | Label hallucination / English drift | Phase 12 | Fixed vocabulary + regex + temp 0 |
| 4 | Stale themes | Phase 12 | Dual trigger + freshness UI |
| 5 | Theme = derived content privacy | Phase 12 | Four-layer defense + vocabulary review |
| 6 | Cost explosion on re-clustering | Phase 12 | Idempotency + circuit breaker + budget ceiling |
| 7 | Memory poisoning | Phase 13 | Valence filter + tier promotion + /account/memory |
| 8 | Memory in analytics | Phase 13 | Four-layer defense + harness self-test |
| 9 | Cross-device memory inconsistency | Phase 13 | Synchronous write on explicit + DB source-of-truth |
| 10 | Right-to-forget cascade | Phase 13 + 12 | CASCADE + reclustering queue |
| 11 | Per-turn cost explosion | Phase 13 | Summary cache + prompt caching + daily cap |
| 12 | Hallucinated recall | Phase 13 | Citation contract + output validation + flag UI |
| 13 | Safari iOS MediaRecorder | Phase 14 | Cross-browser test matrix |
| 14 | Mic permission denial | Phase 14 | NotAllowedError catch + 7-day no-reprompt |
| 15 | STT accuracy / dialect | Phase 14 | 2-week VIP pilot + edit-distance metric |
| 16 | Recording timeout | Phase 14 | 5-min cap + chunked upload |
| 17 | Audio privacy leak | Phase 14 | Four-layer defense + harness self-test + contract |
| 18 | Offline recording lost | Phase 14 | IndexedDB queue + visible status |
| 19 | Accidental recording | Phase 14 | Press-and-hold + silence detection |
| 20 | Letter-by-letter screen reader | Phase 15 | VoiceOver per-component pass |
| 21 | Eastern Arabic numerals | Phase 15 | Lang+aria-label wrap pattern |
| 22 | Aggressive live regions | Phase 15 | Polite + throttle + sacred-surface silence |
| 23 | Aria-label English on Arabic | Phase 15 | Arabic-only automated scan |
| 24 | Focus trap missing/wrong | Phase 15 | Keyboard-only flow test |
| 25 | Nested lang attrs missing | Phase 15 | Helper components + lint |
| 26 | Vector migration outage | Phase 12/13 | Three-step pattern in phase plans |
| 27 | Cron route unauthed | Phase 12/13 + any new cron | requireCronSecret in every route |
| 28 | Embeddings infra duplication | Phase 12 designs, Phase 13 reuses | Cross-phase design review at 13 kickoff |
| 29 | Missing RLS v1.3 tables | All phases adding tables | Migration template + audit script |
| 30 | Event PII erosion | All phases | Event schema whitelist + banned-name lint |
| 31 | VIP two-tier privacy | Any tier-gated phase | Universal invariants documented |

---

## Sources

- Existing codebase analysis:
  - `src/lib/yearInReview/types.ts` — `YIRPublicStats` / `YIRPrivateContent` disjoint-key pattern (template for Themes / Memory)
  - `src/app/year-in-review/og/route.tsx` — four-layer defense implementation reference
  - `scripts/guards/phase-11-anti-patterns.sh` — grep guard template
  - `scripts/test-phase-11-integration.mjs` — regression-insurance self-test template (inject/grep/revert)
  - `src/lib/supabaseAdmin.ts` — service-role client isolation pattern
  - `src/lib/analytics.ts` — PostHog `person_profiles: "never"`, `capture_pageview: false`
  - `src/lib/entitlement.ts` — cookie pattern for tier gating
  - `src/app/api/activate/route.ts` — server-side cookie issuance + entitlement
- `.planning/research/PITFALLS.md` — v1.2 pitfalls 1–33 (many recur or extend into v1.3: 24, 25, 27, 30, 31, 32, 33)
- `.planning/phases/11-year-in-review/11-VERIFICATION.md` — Phase 11 four-layer privacy defense (Data → Type → Import → CI) applied recursively to v1.3 features
- `.planning/PROJECT.md` — v1.3 feature list, budget <10K SAR, NFR-04/08/09 carry-over
- `CLAUDE.md` — S1–S5 safety rules, mandatory tsc+build, no-new-deps rule
- KSA PDPL (Personal Data Protection Law, 2024) — PII handling for memory + voice content + assistive-tech disclosure
- Cross-feature reasoning: every pitfall traced to a file/table/invariant/behavior that exists in-repo or is explicitly being added in v1.3

---

*Pitfalls research for: Taamun v1.3 العمق (Depth & Personalization)*
*Researched: 2026-04-21*
*Total pitfalls: 31 (6 Themes + 6 Memory + 7 Voice + 6 A11y + 6 Integration)*
*Model: applied Phase 11 four-layer privacy defense (Data → Type → Import → CI) recursively to every derived-from-reflection surface*
