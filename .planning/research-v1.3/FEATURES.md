# Feature Research — Taamun v1.3 العمق (Depth & Personalization)

**Domain:** Arabic-first spiritual reflection · Quranic contemplation · long-term companionship
**Researched:** 2026-04-20
**Mode:** Ecosystem (tone-fit UX patterns for depth features)
**Overall confidence:** MEDIUM-HIGH
**Tone-fit filter:** Every recommendation tested against v1.2 anti-pattern register (SUMMARY §R4). The north-star phrase "قلبي يتشرب معاني" remains the taste-lock. v1.2 added the carry-forward filters: no Duolingo, no gamification, no "Achievement Unlocked!" language, contemplative not performative.

---

## Executive Summary

v1.3 moves Taamun from *paced ritual* (v1.0–1.2) into *companionship that knows the user*. That shift is tonally more dangerous than v1.2 was: every v1.3 feature has a surveillance-shaped shadow. Themes clustering can feel like "big brother." Long-term memory can feel like being read. Voice journaling can feel like being recorded. A11y done wrong can make Arabic users second-class. The research below picks a consistent tonal register across all four features — **intimate, not analytic; present, not tracking; invited, not demanded** — and encodes it into table-stakes / differentiators / anti-features lists the Requirements phase can lift directly.

### Four cross-cutting findings that shape every v1.3 feature

1. **The word "ذكر" is Taamun's unlock for memory framing.** `ذكر` (dhikr) in Arabic simultaneously means *remembrance*, *mention*, *invocation* — it is one of the Quran's self-descriptions (`إنّا نحن نزّلنا الذكر`). Framing long-term memory as `ذكر` rather than `سجل` (record) / `تتبّع` (tracking) / `تحليل` (analysis) is not translation — it is reclassification from *surveillance* to *faithful companionship*. This single lexical choice does more tonal work than any UI polish.
2. **The classical tradition gives Taamun its theme vocabulary for free.** The Sufi `مقامات / منازل / أحوال` tradition (Qushayri, Ibn al-Qayyim's *Madarij al-Salikin*, Ibn Arabi) has spent 1,000 years naming spiritual states — patience (صبر), trust (توكّل), gratitude (شكر), contentment (رضا), piety (ورع), ascetic focus (زهد), repentance (توبة). For clustered themes, the research finding is unambiguous: **use this inherited vocabulary**, not generated labels. It costs nothing and roots Taamun in 1,000 years of Muslim contemplative literature rather than 10 years of Silicon Valley journaling UX.
3. **Arabic screen-reader support is structurally weaker than English, and the gaps are predictable.** Three concrete failure modes dominate: (a) undiacritized Arabic mispronounced by VoiceOver (Abuali 2022), (b) mixed-numeral strings (Western/Eastern Arabic/Indo-Arabic) tumbling through the Unicode bidirectional algorithm, and (c) `aria-label` on SVG being silently dropped on iOS Safari unless the SVG is focusable. v1.2 shipped YIR sparkline, BadgeGrid, RenewalBanner — every one of these is vulnerable to #3.
4. **Voice journaling's design choice is velocity vs sanctity.** Industry pattern (Untold, Audionotes, AudioDiary): minimum taps to record, clean editable transcripts, audio-after-transcribe deletion. Taamun's pattern should be slower — one deliberate tap, transcript treated as *draft*, raw audio never stored. The Munsit STT native support for Arabic dialects removes the last technical excuse for English-first voice UX.

### Tonal register encoded as guardrails (carry v1.2 §R4 forward and extend)

Banned across v1.3 in addition to v1.2's list:
- "Insights" panel / "Analytics" dashboard / "Your patterns" framing (surveillance register)
- Heatmap of daily practice (Strava for dhikr — profane)
- "We've learned about you" in any copy (surveillant voice)
- Confidence scores / certainty percentages on themes ("80% match for صبر")
- Auto-tagging reflections visibly with themes as user writes (breaks contemplation flow)
- ML-generated theme names ("Patience-Anxiety-Uncertainty cluster #3") — always use classical vocabulary
- Always-on "listening" UI even if not recording (creates audio anxiety)
- Transcription overlaid on top of the recording while still speaking (invasive; interrupts contemplation)
- Raw audio persisted to server, even temporarily, even encrypted
- "Talk to the AI guide by voice" framing (performative; the voice is for the *user's own* reflection, not for the guide)
- Third-party a11y SDKs / accessibility overlays (they make Arabic a11y *worse*, not better — well documented)

---

## The Four Features — Table Stakes / Differentiators / Anti-Features

---

### 1. Themes ML Clustering — `THEMES-*`

**Problem it solves:** The user has written 50+ reflections across a year of practice. The lived experience contains recurring struggles (loss of a parent, job anxiety, a recurring inability to forgive a sibling) and recurring gifts (moments of unexpected patience, a softening toward a rival). Currently this texture is invisible even to the user. v1.3 surfaces it — without it becoming "The Algorithm Reads Your Soul."

**Core tension:** Calm, Insight Timer, and Headspace **do not do this**, because meditation content is the product's territory and user journals are not a content asset. Reflection.app and Stoic do it, but in a Silicon-Valley-analytics register ("your patterns this week"). For a Quranic-reflection product, neither reference works directly. The correct register is closer to the Ibn al-Qayyim `Madarij al-Salikin` format: *these are the stations your heart has been passing through*.

**Brief's question 1a — "Big Brother" avoidance:** The answer is not technical (encryption / on-device) but **semantic**. The feature must speak about *the user's heart* (قلب), *returning* (رجوع), *dwelling* (منزل) — not about *your data*, *your usage*, *your journaling history*. Every string matters.

**Brief's question 1b — monthly digest vs always-on sidebar vs heatmap:** Heatmap is **banned** (§R4 carry-forward: Strava-for-dhikr is profane). Between digest and sidebar, **monthly digest wins** for Taamun because:
- A sidebar is analytic; a letter is relational. Taamun's voice is relational.
- A sidebar invites checking behaviour ("let me see what the AI thinks of me now"); a letter arrives in its own time.
- Monthly cadence matches lunar month — Ramadan gives the cycle its own natural 12-month structure.
- Sidebar would live on `/program` or `/day`, which are on the §R5 analytics-excluded sacred-pages list. A digest is delivered out-of-band (email or `/journey` route) and does not contaminate daily ritual.

**Brief's question 1c — one-word vs phrase theme names:** **One-word, with a classical provenance.** `صبر`, `توكّل`, `شكر`, `رضا`, `ورع`, `زهد`, `توبة`, `خوف`, `رجاء`, `محبة`. Phrases like "التسليم لأمر الله" are beautiful but turn themes into homilies — less recognizable as a *pattern*, less repeatable across months. One-word theme names read like spiritual stations (`مقامات`); phrases read like headings from a book. The classical tradition names maqamat in one word; Taamun should inherit that convention. *Where* to show the phrase: as the **subtitle** when the theme is opened, sourced to the tradition (see differentiator below).

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| User's themes are surfaced at some point (not silently clustered) | If the clustering runs and never reaches the user, the feature does not exist as a product — only as tech debt | LOW | Decision: monthly digest (see differentiator) |
| User can see *why* a reflection was grouped under a theme | Minimum transparency — else it feels oracular / judgmental | MEDIUM | Digest shows 1-2 specific reflection excerpts per theme |
| User can disable themes entirely (opt-out, not opt-in is acceptable given first-party AI guide context) | Baseline agency over the feature | LOW | Settings toggle · respects existing AI-guide consent model |
| No themes computed for users with <10 reflections | Clustering with n<10 is noise not signal (k-means quality); also a "trust not ready" threshold | LOW | Server-side gate before `themes` job runs |
| Theme names rendered in Arabic-native typography, not as tags with `#` prefixes | Hashtag aesthetic is anathema to the product voice | LOW | Design constraint |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Monthly `رسالة` (letter) format** — not a dashboard, not a panel. Arrives as a single long-form piece once per lunar month, opens with a verse, closes with a short reflective prompt | Reclassifies themes output from analytic-product to contemplative-companion. Reflection.app does similar; Taamun can go further by rooting the letter in classical epistolary form (the `رسائل` of al-Ghazali, Ibn Taymiyya) | MEDIUM | One `year_reviews`-style snapshot table: `theme_digests(user_id, hijri_month, payload jsonb)` — computed server-side via existing OpenAI embeddings infrastructure |
| **Classical-vocabulary theme names with short tradition-sourced gloss** | `صبر · منزلة الصبر من منازل السائرين` — root themes in Ibn al-Qayyim's *Madarij al-Salikin* or Qushayri's *Risala*. Free cultural capital; impossible for a generic journaling app to copy | LOW | Static theme dictionary — ~12 themes, each with Arabic name + short classical reference. Does not require AI — curate once, reuse forever. ML only assigns reflections to themes |
| **"يعود إليك" (returning to you)** language rather than "recurring in your data" | `يعود إليك الصبر` not `theme: Patience (frequency: high)`. Present-tense, personal, verbs not nouns | LOW | Copy / template choice in digest renderer |
| **Theme grounded in a verse, not a chart** | Each theme in the digest opens with a Quranic verse that carries that station, not a bar chart of frequency. Mirrors v1.0 product voice: verse-led | LOW | Curate verse pairings once; reuse across users |
| **User's own words quoted back** — 1-2 short excerpts per theme, chosen by length + emotional weight (awareness_logs spike) | Self-determination: "this is what *you* wrote." Mirrors v1.2 YIR pattern. User recognizes their own voice and the theme lands | MEDIUM | Existing `reflections` table + awareness_logs join — no new infrastructure |
| **Hijri cadence** — digest arrives on 1 of each Hijri month, named in the Islamic calendar | Cultural-native framing, not aping 1st-of-Gregorian-month newsletter norm. `PROJECT.md` carries Hijri-anchored pattern from v1.2 YIR | MEDIUM | `RAMADAN_ENDS_AT_ISO` already in `appConfig.ts`; add a Hijri-month utility |
| **Zero always-on surface on `/day`, `/reflection`, `/book`** | §R5 sacred-pages rule holds in v1.3. Themes never appear inline while user is reflecting | LOW | Architectural constraint — themes output is `/journey/themes` or emailed digest only |

#### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| "Insights" sidebar on `/program` or `/day` | "Always-visible value" | Surveillance register; violates sacred-pages rule; invites compulsive checking | Monthly letter out-of-band |
| Calendar heatmap of themed days ("your صبر days") | Dashboard pattern | Strava-for-dhikr — profanes the practice; turns inner life into GitHub contribution graph | No heatmap under any framing |
| ML-generated theme names (embedding-cluster labels like "Patience-Anxiety cluster") | Cheaper than curation | Vocabulary drift; loses classical grounding; fractures meaning across users | Fixed curated theme dictionary; ML only assigns, never names |
| Confidence/match percentages on theme assignment ("82% صبر") | "Transparency about ML" | Reifies the algorithm; makes the soul measurable; false precision | Binary assignment or "this month" / "this season" language |
| Auto-tag reflections as user writes | "Progressive disclosure" | Interrupts contemplation; user self-edits to match themes; the feature starts shaping the practice instead of reflecting it | Tagging is invisible, assignment is post-hoc, surface is monthly only |
| Public theme sharing ("top themes this month across Taamun") | "Community feel" | Violates § R4 anti-comparison rule; outs users' inner states even in aggregate | Private per-user only |
| Phrase-based theme names ("التسليم لأمر الله في المواقف الصعبة") | "More descriptive" | Becomes headings, not stations; not recognizable as pattern; too much app voice | One-word classical name + tradition-sourced gloss as subtitle |
| Push notification when a new theme "is detected" | Standard SaaS | Creates anxiety; makes the user performative | Letter arrives as an in-app banner and optional Hijri-month email only |
| Themes visible on public share cards or referral cards | Viral growth temptation | Catastrophic privacy bleed; contradicts v1.2 PITFALLS §3 | Themes are strictly private — no `next/og` route carries them |
| "Your AI guide has noticed you've been struggling with X" framing | "Personalized" | Surveillant voice; reads as intrusive. `ذكر` vs `noticed` is the whole game | `يعود إليك Y هذا الشهر` (Y is returning to you this month) |
| Gamified theme "unlocks" or collection ("you've explored 7 of 12 stations!") | Gamification | Direct §R4 violation; maqamat are not Pokémon | No progress bar, no collection UI, no tiers |

**LTV ranking:** #2 — strong retention driver for month-6+ cohort (the cohort v1.2 just saved from churn at Day 28). Monthly cadence creates a natural re-engagement moment at zero marketing cost. Lower immediate lift than #2 (memory), but compounds year-over-year.

**Complexity class:** 1 phase for the pipeline and the digest; recommend **do not split**. Infrastructure is additive (`theme_digests` table, embeddings + k-means batch job, static theme dictionary). Do not build a dashboard as a "lite version" — it would ship the wrong register.

**Dependencies:**
- Hard: existing OpenAI embeddings stack (`PROJECT.md` confirms) + `reflections` table (already accumulating).
- Soft: `/journey` route from v1.2 YIR archive is the natural home for the theme-letter archive.

---

### 2. Long-Term Memory for AI Guide — `MEMORY-*`

**Problem it solves:** The AI guide `تمعّن` currently treats every conversation as first-contact. Users who have spent 60 days with the guide find it bewildering that it does not know them. The goal is continuity of companionship — without crossing into surveillance or breaking the existing sacred-pages privacy rule.

**Brief's question 2a — "remember everything" vs "remember meaningful moments":** **Meaningful moments only.** Rationale:
- ChatGPT-style "remember everything" has documented anxiety effects: users self-censor in later sessions; users feel they are being profiled; users rage-delete after discovering stored memories of sensitive moments (Shelly Palmer 2025, OpenAI community threads on "removed access for personal memory").
- Taamun's guide is already a first-party trust relationship; storing *everything* from every conversation would violate the product's own `no analytics on AI guide routes` rule by the back door (content memory is analytics-by-another-name).
- "Meaningful moments" maps naturally onto Taamun's existing primitives: awareness_logs spikes, long reflections, crossing a cycle boundary, Day 28, Ramadan entry — these are the moments worth remembering; casual small-talk turns are not.

**Brief's question 2b — user sees memories vs invisible infrastructure:** **User sees them, and this is a feature not a compromise.** Invisible memory is where the trust dies — users assume the worst when they cannot see what is held. ChatGPT learned this the hard way in 2024 (Shelly Palmer, OpenAI help center); the memory feature's trust floor is the user's ability to inspect, edit, and delete specific memories. Taamun should adopt this floor and **exceed it**: memories surfaced as human-readable `ذكر` cards, each tied to the original reflection or conversation that generated them, each individually deletable.

**Brief's question 2c — granular delete vs on/off toggle:** **Both, layered.** On/off toggle is the *coarse* control for the user who opts out of memory entirely. Granular per-memory delete is the *fine* control for the user who opts in but wants to prune. Offering only the toggle is paternalistic (choice between all or nothing); offering only granular is hostile to the user who just wants memory off. Industry precedent (ChatGPT, Claude's memory, Reflection.app) has converged on both.

**Brief's question 2d — privacy tone:** **`ذكر` / `أذكر` wins decisively.** Arabic dictates this. The candidate words:
- `أذكر` — remember, mention (also invoke, in religious register) — ✅ intimate, faithful, Quranic resonance
- `أتذكر` — recall, bring to mind — ✅ neutral, acceptable
- `أحفظ` — preserve, memorize — ⚠️ can imply storage
- `أستخدم تأملاتك لأفهمك` — I use your reflections to understand you — ❌ surveillant, analytic, wrong register
- `أتعلم منك` — I learn from you — ❌ ML register; makes the guide a model, not a companion
- `أراقب` / `أرصد` — observe, track — ❌❌ catastrophic; reads as surveillance

Copy should use `أذكر` as the verb and `ذكر` (noun) as the name of the feature itself. Example: `يذكر تمعّن أنك كنت تتأمّل الصبر في رمضان الماضي`. Not `Taamun remembers that you've been working through patience`.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Guide references prior context in conversation naturally | Baseline "memory" as users understand it post-ChatGPT | MEDIUM | Extended RAG over `guide_memory` table + existing embeddings |
| User can view all stored memories in one place | Minimum transparency floor; trust collapses without this | MEDIUM | `/account/memory` or `/journey/memory` page |
| User can delete individual memories | Granular agency; industry standard since ChatGPT 2024 | MEDIUM | Per-row delete with soft-delete (undoable for 7 days) |
| User can turn memory off entirely | Coarse agency; respect user who does not consent to the feature | LOW | Settings toggle; on-by-default is defensible given first-party AI-guide trust, but clearly disclosed at first guide interaction post-v1.3 |
| Memory scope limited to first-party (Taamun) — never exported to third parties or used for model training | Saudi PDPL + user trust | LOW | Architectural — OpenAI data-processing agreement already excludes training; confirm for Anthropic as well |
| Memories are user-readable Arabic text, not embeddings blobs | Transparency without technical literacy barrier | MEDIUM | Store both: human-readable summary + embedding vector. User sees the summary |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **`ذكر` as feature name** — not "memory," not "context," not "history" | The single most important tonal choice in v1.3. Reclassifies surveillance as faithful companionship. Quranic resonance is free cultural capital | LOW | Copy + page title |
| **Memory cards styled as `ذكر` entries** — one sentence each, in the guide's voice, human-readable | "يذكر تمعّن أنك كتبت في يوم ٧ من دورتك الأولى أن الصبر عليك ثقيل" reads as a faithful companion's recollection; a JSON payload reads as surveillance. Rendering is the product | MEDIUM | Templating in the memory-card generator |
| **Memory written only at threshold events** — cycle completion, Day 28, long reflection (>500 chars), awareness_logs spike, user-initiated "remember this" action | "Meaningful moments only" as implementation, not aspiration. Limits noise, limits privacy exposure, improves guide quality (dense signal) | MEDIUM | Threshold rule in memory-extractor worker |
| **User-initiated "remember this" action inside reflection flow** — opt-in moment capture, not always-on | Shifts power to the user. Parallels physical journaling's deliberate act of underlining. Also gives the user a positive act of relationship with the guide (vs only deletion as interaction) | MEDIUM | Small `احفظ هذا` button next to reflection save — uses `احفظ` here because *user is the one storing*, not the guide |
| **Memory surfaced in conversation, never referenced without consent** — guide says "أذكر أنك كتبت..." before using a memory, user can say "لا تستخدم هذا" | Makes retrieval visible; eliminates the "how did it know that" creep effect | MEDIUM | Prompt-engineering pattern in guide's system prompt |
| **Memory visualization as a Majlis (مجلس) archive** — not a list of stored data points, but a set of conversations one has had | Frame the archive as a gathering of past talks, not a profile. Mirrors the Arabic oral tradition of `مجالس الذكر` | MEDIUM | `/journey/memory` design brief |
| **Memories decay softly if not referenced** — memory that has not been surfaced in 6 months fades (user still sees it, but guide deprioritizes it) | Mimics real memory; reduces staleness; prevents guide from referencing something the user has grown past | MEDIUM | Retrieval weight decay in RAG ranker |
| **Hard privacy boundary around conversations tagged as `خاص` (private)** — user can mark any reflection/conversation as private, never embedded, never memorized | Gives the user an explicit "this is between me and God, not me and the guide" boundary. Rare in AI companion products; vital in a Quranic product | MEDIUM | `reflections.is_private boolean` + memory-extractor exclusion |

#### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| "Memory learned: you are a cautious introvert who values family" trait profiling | ChatGPT-like persona building | Surveillant; presumptuous; wrong theology (ML-generated character verdict on a soul). Users rage-quit when they see these on ChatGPT | Only remember *events* and *user statements*, never synthesize personality traits |
| Memory output as structured fields ("concerns: [family, work]; goals: [patience, gratitude]") | "Cleaner retrieval" | Reduces the person to a CRM record; user sees their soul as a spreadsheet | Free-text sentence memories only, each tied to a source |
| Invisible memory (no user-viewable inventory) | "Cleaner UI" | Trust-killer; documented as ChatGPT's biggest memory pitfall | User inventory is required, not optional |
| Sharing memories across users or surfacing to Ziad (founder) | "Improve the product" | Breach of trust beyond recovery | Aggregate-only telemetry for founder; never content |
| Memory referenced without acknowledgment ("By the way, you should try X based on what I know") | "More natural conversation" | Creep factor; makes user feel surveilled | Guide always says "أذكر أنك..." or similar explicit retrieval marker |
| Memory sync to marketing (retargeting emails based on stored content) | "Personalized re-engagement" | Catastrophic; conflates intimate companion role with sales channel | Memories never leave the guide context — strictly internal to `/api/guide/*` |
| Auto-remember everything, user opts out | Industry norm (ChatGPT 2024-style) | Mirrors what ChatGPT learned *not* to do in 2025 (proactive sensitive-info restraint) | Threshold-based remembering; user-initiated capture option; clear disclosure |
| "Memory upgrade tier" (paid feature for longer memory) | Revenue | Selling intimacy is crass; destroys the relationship | Memory is a core tier feature or not a feature at all |
| Remembering emotional/medical details by default | ChatGPT default | Even ChatGPT backed off this (OpenAI 2025 update) | Health / grief / specific family names explicitly excluded from auto-memory unless user taps "remember this" |
| Memory indexable via search externally | "Helps the user find things" | Expands attack surface for account compromise | Memory accessible only inside guide context + dedicated archive page; not in global search |

**LTV ranking:** #1 — highest retention lift of v1.3. "The guide knows me" is the deepest differentiator Taamun can build against generic AI chatbots and against other Quran apps. Directly extends the v1.0 validation moment ("قلبي يتشرب معاني") from daily-practice-experience into year-over-year-companionship. Highest upside, highest tonal risk.

**Complexity class:** **2 phases.** Phase A = threshold-based extraction + RAG retrieval + basic archive view (core). Phase B = user-facing archive UI polish + granular delete + `خاص` privacy flag + memory decay (depth). Do not ship B before A; do not ship A without B on the near roadmap.

**Dependencies:**
- Hard: existing AI guide stack (Anthropic + OpenAI embeddings), `reflections` table, new `guide_memory` table (`PROJECT.md` confirms planned).
- Hard: first-party data-processing agreements with Anthropic & OpenAI (training-exclusion) — likely already in place; confirm in Requirements.
- Soft: `/journey` route from v1.2 YIR archive hosts the memory archive sub-page.

---

### 3. Voice Journaling — `VOICE-*`

**Problem it solves:** Reflection today is text-input only. Users who journal daily by voice in other products (Day One, Untold, Audionotes, WhatsApp voice notes as de-facto journal) currently have high friction on Taamun — especially in Arabic, where typing on mobile is slower than typing English (diacritics, long-vowel decisions). The Arabic Saudi user base records voice notes as their default communication mode; Taamun ignoring voice is a friction tax. Munsit STT is native Arabic and already in the stack — the cost-benefit is compelling.

**Brief's question 3a — big mic button vs subtle pill:** **Subtle pill.** A big mic button is Instagram-Voice-Message aesthetic and performs a particular promise — *casual, fast, ephemeral*. Taamun's voice feature performs a different promise — *slow, deliberate, sanctified*. A small pill with a single `اضغط للتحدث` affordance below the text-input field, deferred until the user opens reflection — that communicates optionality and weight. Design reference: Day One's understated voice affordance, not Voice Memos' hero button.

**Brief's question 3b — transcription reveal, instant vs after stop; editable vs sacred:** **After stop, editable.** The choice is not aesthetic but theological:
- *Instant while speaking* creates an interruption of presence — the user watches their own speech appear and self-corrects, losing contemplation.
- *After stop* preserves the recording/reflecting state as a single contemplative act, and makes transcription a *retrospective reading* of what the user said.
- *Editable* is correct because Munsit has non-zero error rate, especially on classical Arabic and Quranic quotation — forcing the user to accept raw STT output is hostile.
- *Sacred/read-only* is tempting but wrong: the user's *memory of what they said* deserves more authority than the STT's transcription of what the microphone heard.
- **The transcript is a draft of the user's reflection**, not a recording transcript. Frame it as such: the audio is temporary scaffolding for reaching the text.

**Brief's question 3c — retry flow, re-record entire vs append segments:** **Re-record entire** for v1.3 simplicity. Append segments is a feature that seems helpful but introduces:
- Audio seam discontinuities (tone, pause, breath) that break contemplation on playback
- UX complexity (which segment am I replacing? where does this segment go?)
- Transcription challenges (Munsit may lose context across seams)

Simple pattern: one session = one reflection. User who wants to continue another thought starts a new reflection (consistent with text reflections today). Append can be a v1.4 request if users ask for it.

**Brief's question 3d — privacy copy for no-storage promise:** Direct language wins. Candidates evaluated:
- `صوتك لا يُحفَظ` — Your voice is not stored ✅ Direct, passive-voice, factual
- `نحن لا نحفظ صوتك` — We do not store your voice ⚠️ We/you framing introduces opposition
- `الصوت مؤقت` — The audio is temporary ✅ Minimal, factual — **winner for footer microcopy**
- `بعد النسخ، يُحذَف الصوت تلقائياً` — After transcription, audio is auto-deleted ✅ Most honest — **winner for first-use explanation**
- `صوتك آمن معنا` — Your voice is safe with us ❌ "With us" contradicts "not stored"
- `لن نستمع إلى صوتك` — We will not listen to your voice ❌ Defensive; implies the question

Recommended copy hierarchy: first-use modal carries the deletion mechanic explicitly; subsequent sessions show only the short footer microcopy `الصوت مؤقت · النص لك`.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Record → transcribe → edit → save text as reflection | Baseline voice-journaling flow (Untold, Audionotes, Day One) | MEDIUM | Munsit STT API + existing reflection-save endpoint |
| Visible recording indicator while recording | Users need to know recording is active | LOW | Simple waveform or pulsing dot |
| Tap to stop | Baseline UX; users must be able to end unambiguously | LOW | Single-tap stop; no timeout |
| Transcribed text is editable before save | STT error rate requires user control | LOW | Existing reflection-input component accepts the transcription |
| Explicit first-use disclosure about audio handling | Consent + trust (Saudi PDPL; user trust) | LOW | One-time modal with the "deletion after transcription" copy above |
| No audio sent to third parties beyond Munsit | Baseline; any leak is catastrophic | LOW | Architectural — Munsit is the only hop |
| Audio deleted after transcription completes | Non-negotiable; shipped promise | LOW | Delete in the same Edge function; no persistence layer ever sees the bytes |
| Fallback to text input if mic denied or fails | Accessibility + progressive enhancement | LOW | Voice is opt-in; text is always available |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Subtle pill affordance, not hero button** | Communicates voice as one possible input, not the dominant one. Preserves reflection-journal aesthetic | LOW | Design brief for reflection input component |
| **Transcription reveal *after* stop, not during** | Preserves contemplation during the recording act; transcription becomes an act of reading | LOW | Async reveal; progress shown as `جاري التحويل` |
| **Transcript framed as `مسودة` (draft)**, not "transcription" | Claims authorial agency for the user over the STT output | LOW | Copy choice; subtitle under the transcript area |
| **Post-transcribe silence beat** — transcript appears, user re-reads, only then tap to save | Adds a small deliberate beat between speaking and saving; echoes the v1.0 `SilenceGate` pattern that defines Taamun's voice | LOW | Design constraint — no auto-save on transcription complete |
| **Arabic dialect support surfaced gently** — mention `نجدي · حجازي · شامي · خليجي` once so user trusts Munsit will work, not as feature-hype | Saudi users have deep skepticism about Arabic STT because most English-first products fail on dialect. Naming the dialect Munsit handles well is a trust anchor | LOW | First-use modal microcopy only; not a dialect-selector UI |
| **No audio playback UI ever** — the audio existed, served its purpose, and is gone. User cannot re-listen, because there is nothing to listen to | Reinforces the promise; removes temptation to add "save audio" feature-creep; changes user's relationship to voice input (transient scaffold, not record) | LOW | Deliberate omission in the UI |
| **Footer microcopy persistent but small** — `الصوت مؤقت · النص لك` | Permanent reassurance without performativity | LOW | Small-size tertiary text below the record pill |
| **Reflection saved from voice flow tagged `صوت` in storage only** — not visible on the reflection card | For future analysis ("do voice reflections differ in length?") but user sees reflections as reflections, not as "voice reflections" | LOW | `reflections.input_mode` column; never displayed |

#### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Live transcription overlaid on mic UI while speaking | "Modern / polished" | Interrupts contemplation; creates self-correction anxiety | Post-stop async transcription |
| Big centered hero mic button | Instagram voice-message pattern | Casual; fast; ephemeral — wrong tonal register | Subtle pill below text input |
| Auto-save on transcription complete | "Reduce friction" | Removes the user's final review; false-positive saves of garbled transcription | Explicit save tap always required |
| Audio preserved with the reflection | "Richer journal" | Breaks the no-storage promise; privacy catastrophe; cost scaling; enables deepfake-adjacent attack vectors if account is compromised | Zero audio persistence ever |
| Audio sent to OpenAI Whisper instead of Munsit | "Better accuracy for some dialects" | Munsit is native Arabic, sovereign to region; Whisper routing introduces US data path | Munsit only |
| Voice message → AI guide conversation | "Talk to your guide" | Performative; turns the guide into Siri; pulls voice from user's own reflection into dialogue | Voice is input to *reflection* only, not to the guide |
| Voice-to-emoji sentiment overlay ("you sounded sad") | Journaling-app trope | Patronizing; analytic register; also wrong often | No sentiment layer on voice |
| "Pause recording" button (append pattern) | "Flexibility" | Seam complexity; v1.3 scope creep; transcription quality drops across seams | Re-record entire; save or discard |
| Recording time counter in large numerals | Voice-memo app convention | Creates time-consciousness; rushes the reflection | Subtle animated waveform, no numerals |
| Mic button on sacred pages outside reflection (`/day`, `/book`) | "Voice everywhere" | Sacred-pages rule (§R5); also not needed | Voice available only inside `/reflection` flow |
| Voice feature gated behind paid tier | "Monetization" | The cost is Munsit API; absorbable at current subscription tiers. Gating it splits product behaviour by tier, violates the "everyone gets the full ritual" principle | Voice is universal — no tier gating |
| Claim "AI-powered voice journal" in marketing | Buzzword | Mis-frames: Munsit STT is a tool, the practice is the product | Market as "voice reflection" or just an alternate input mode |

**LTV ranking:** #3 — meaningful friction reduction for Saudi Arabic users, expected to lift reflection depth (users write more when they can speak) and frequency (voice is faster at lunch-break or commute moments). Real impact is cohort-shaped: Arabic-L1 users benefit much more than bilingual users. Lower retention lift than memory/themes, but strongest immediate UX quality gain and a strong Arabic-app differentiator.

**Complexity class:** **1 phase.** Scope is well-bounded: add input mode to existing reflection flow, wire Munsit, enforce audio deletion, ship first-use modal. Do not expand scope.

**Dependencies:**
- Hard: Munsit STT (already in stack per `PROJECT.md`).
- Hard: microphone permission prompts in iOS Safari — test on actual devices early; iOS permission denial flow is finicky.
- Soft: None.

---

### 4. Arabic Screen-Reader A11y Audit — `A11Y-*`

**Problem it solves:** v1.0 landed Lighthouse A11y 100/100 — but Lighthouse tests against English-language heuristics. A VoiceOver Arabic user opening Taamun today hits a different app than the Lighthouse score suggests. v1.2 added 6 visual components (BadgeGrid, YIR sparkline, RenewalBanner, YIR share card, ReferralCTA, ThemeIcons) that were audited visually but not audited through VoiceOver Arabic. The gap is real and largely invisible to sighted QA.

**Brief's question 4a — what Arabic screen readers get right that English ones miss:** Reversed question: Arabic screen-reader support is weaker than English across the board (Abuali 2022; JAWS community threads). The *things Arabic users get that English users do not* are:
- Better native dialect-aware pronunciation on VoiceOver iOS when system language is Arabic and text is Arabic (MacOS/iOS ship Arabic TTS voices — Maged, Tarik — reasonably tuned)
- Bidirectional handling of well-formed Arabic strings (VoiceOver respects the Unicode bidirectional algorithm correctly *if* the string is clean)

The user-facing truth: Arabic VoiceOver support is acceptable when pages play by the rules, and collapses fast when they do not.

**Brief's question 4b — VoiceOver Arabic gotchas:** Three concrete, well-documented, and almost certainly present somewhere in the v1.2 codebase:

1. **Undiacritized Arabic mispronunciation.** VoiceOver uses heuristic diacritization on un-tashkeel text; it gets Quranic verses wrong in predictable places (waqf, idhafa, case endings). **The Quran text in `DayExperience` VerseBlock must carry tashkeel** — which the Quran text already does because the Mushaf source does, but any *hand-typed* Arabic copy in badges/banners/buttons is probably undiacritized and reads awkward or wrong (Abuali 2022, Wiley).
2. **Mixed-numeral bidirectional chaos.** A reflection count card showing "٧ تأمّلات من ٢٨ يوم" versus "7 تأمّلات من 28 يوم" versus "7 تأمّلات من ٢٨ يوم" will render differently, be *read* by VoiceOver differently, and the bidirectional algorithm can flip the number order in some browsers. Rule: **pick one numeral system per surface and commit**; Eastern Arabic (٠-٩) for immersion copy, Western (0-9) for share cards and anywhere numbers cross a locale boundary.
3. **`aria-label` on SVG silently dropped on iOS Safari.** This is the biggest actual landmine for v1.2 code. Per Paul Adam's documentation and WebKit bug tracking, `aria-label` on an `<svg>` element is ignored by VoiceOver iOS unless the SVG is wrapped in a focusable element. The YIR sparkline, BadgeGrid badge icons, and any icon-only button in ReferralCTA are all at risk.

**Brief's question 4c — specific components likely broken:**

| Component | Suspected break | Evidence basis |
|---|---|---|
| **BadgeGrid hover states** | Hover-only reveal of badge name (CSS `:hover`) has no keyboard or VoiceOver equivalent; also likely no `aria-label` on badge SVG per iOS Safari gotcha above | HIGH confidence — standard hover-state a11y failure; SVG gotcha documented |
| **YIR sparkline** | SVG chart with no `aria-label` or text alternative; if label exists it is dropped on iOS Safari; Arabic-direction axis not announced | HIGH confidence — SVG+VoiceOver gotcha (Paul Adam); also common "chart is an image, not text" failure |
| **RenewalBanner dismiss** | Dismiss button likely icon-only `×` without `aria-label` in Arabic; focus management on dismiss (where does focus go?) likely broken | MEDIUM confidence — standard dismiss-button a11y failure |
| **DayExperience verse display** | Tashkeel present (Quran source) so pronunciation OK, but: language attribute (`lang="ar"`) likely not set on the verse container, forcing VoiceOver to use the page's default voice which may be English if user has mixed language settings; also verse-ornament characters (\u06DD surah mark, waqf marks) likely read aloud as garbage | HIGH confidence — common omission; Unicode waqf marks are a known gotcha |
| **YIR share card** | Server-side rendered SVG/PNG — by definition has no a11y layer when served as an image. On-page preview may lack `alt` text | MEDIUM confidence — share cards are images, rarely have alt |
| **ThemeIcons (v1.3 preview)** | If themes ship with icon-only representations, same SVG-aria-label-on-iOS gotcha | HIGH confidence — structural |
| **SilenceGate** | Silence-beat animation may be invisible to VoiceOver; user may hit "skip" by accident; instructions for the gate may not announce | MEDIUM confidence — animation-heavy components generally fail a11y |
| **ReflectionJournal voice input pill (v1.3)** | Mic pill without `aria-label` = unlabeled button; recording state changes not announced via `aria-live` | HIGH confidence — structural |

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Every interactive element has an Arabic `aria-label` when icon-only | Baseline a11y; WCAG 2.1 AA | LOW | Audit pass: grep `<button` and `<a` elements; require either child text or `aria-label` |
| Every SVG with semantic meaning has a text alternative *and* the SVG is focusable (iOS Safari requirement) | iOS Safari gotcha; documented | LOW-MEDIUM | Wrap SVGs in `<button>`, `<a>`, or `role="img"` + `tabindex="0"` |
| `lang="ar"` set on Arabic content nodes (especially Quran verses); `lang="en"` explicit on any English fragments | VoiceOver voice-switching; correct pronunciation | LOW | Container-level `lang` attributes |
| Focus states visible on keyboard nav | WCAG 2.1 AA | LOW | Tailwind `focus-visible` audit; RTL-correct focus ring |
| Numerical consistency per surface (Eastern or Western, not mixed) | Bidirectional correctness; screen-reader predictability | LOW | Utility function + lint rule |
| Hover-only interactions have equivalent keyboard/tap affordance | WCAG 2.1 AA | LOW | BadgeGrid hover is primary concern |
| Lighthouse A11y ≥ 98 maintained | Existing v1.0 bar | LOW | CI already runs Lighthouse |
| Manual VoiceOver Arabic pass on each v1.2 component | The whole point — Lighthouse alone will miss these | MEDIUM | Ziad or contractor on actual iOS device |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **Tashkeel audit on hand-typed Arabic copy** — scan all user-facing Arabic strings in the codebase; verse text already clean, but UI copy is probably not | Abuali 2022: full diacritization meaningfully improves VoiceOver pronunciation quality; Taamun's content is *about* Arabic being read correctly — the product should embody it | MEDIUM | Manual pass; tashkeel the UI copy once and lock |
| **Skip-link for the SilenceGate** that respects the contemplative intent | VoiceOver user cannot "sit in silence" — the gate becomes an accessibility wall. Needs an audible + skippable equivalent | LOW | Clear `aria-label` + announced state + configurable skip after 2s on a11y-mode |
| **`lang="ar"` granularity at component level, not just root** | Mixed-language pages (e.g., Quran citation references in English + Arabic verse) force VoiceOver to switch voices mid-word without granular `lang`; granular tagging fixes it | LOW | Component-level `lang` props |
| **Unicode waqf/ornament marks filtered from `aria-label` versions of verses** | Those marks (\u06DD surah marker, \u06D6-\u06DC waqf marks) are visual; VoiceOver reads them as garbage | LOW | Small utility: `verseForScreenReader(text)` strips decoration Unicode |
| **Announced state changes via `aria-live`** — voice recording start/stop, save success, memory-deletion confirmations | Sighted users get visual confirmation; VoiceOver users currently get silence | LOW | `aria-live="polite"` regions on the reflection form, voice pill, memory archive |
| **Arabic RTL text flow verified in every server-rendered share card** | Satori / `next/og` Arabic font and RTL handling is a known pitfall (v1.2 PITFALLS noted Satori Arabic font spike for YIR Ramadan); confirm each share image renders correctly on actual WhatsApp preview on actual iOS | MEDIUM | Manual verification; may need specific font embedding |
| **A11y test plan as a checked-in doc** — per-component a11y criteria, not just a one-time audit | Makes v1.3 a11y *maintainable* into v1.4+, not a one-shot that decays | LOW | `.planning/research-v1.3/a11y-checklist.md` (companion doc) |
| **No third-party accessibility overlay** (AccessiBe, UserWay etc.) | These overlays are well-documented as making a11y *worse*; specifically so on RTL Arabic where they mis-inject English ARIA on Arabic components | LOW | Deliberate omission |

#### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Third-party a11y overlay SDK (AccessiBe / UserWay / Level Access overlay) | "Instant WCAG" | Well-documented harm on RTL sites; injects wrong ARIA; makes VoiceOver experience worse; also a trust signal disaster | Manual a11y fixes; no overlay |
| Pop-up "skip to content" link that appears on focus only in English | Generic skip-link pattern | The link text itself must be Arabic (`تخطّي إلى المحتوى`); English skip-link on Arabic page confuses VoiceOver voice selection | Arabic skip-link text |
| Auto-generated `alt` text from ML on SVG charts | "Scalable a11y" | Generic descriptions; miss the point of each chart | Hand-written `aria-label` per chart |
| `aria-hidden="true"` on purely-decorative elements without verifying they are indeed pure-decorative | Shortcut | Over-use hides content that actually has meaning | Explicit audit; document each `aria-hidden` decision |
| Screen-reader-only instructions that are actually stealth marketing copy | Temptation | Sacred context; user cannot even opt out of this | SR-only text is purely functional, never promotional |
| Hiding the `SilenceGate` entirely from VoiceOver (`aria-hidden`) because "it's just a moment of silence" | Shortcut | Violates principle of equivalent experience; VoiceOver user loses the ritual's opening beat | Accessible silence gate: announced, skippable, configurable duration |
| Tashkeel every Arabic word everywhere | Over-correction | Heavy tashkeel on UI chrome looks academic, not literary; wrong register for body copy | Tashkeel verse text (already present) and any hand-typed Arabic that VoiceOver mispronounces; not universal |
| Different content for screen-reader users vs sighted users | "Richer SR experience" | Violates parity principle; maintenance burden; drift risk | Same content, properly labeled |
| Skipping iOS VoiceOver testing because "Android TalkBack is more common in KSA" | Budget excuse | TalkBack Arabic support is a different profile; both required; iOS user base in KSA is actually substantial | Audit both; prioritize iOS for v1.3 MVP if budget forces choice |

**LTV ranking:** #4 — smallest direct retention lift but **floor feature**, not ceiling feature. Fixing a11y prevents silent churn of Arabic VoiceOver users who never give feedback (they just leave). Moral dimension: a Quranic-reflection product that is inaccessible to blind users is a particularly painful failure mode. Not optional.

**Complexity class:** **1 phase, cross-cutting.** Touches many files but each touch is small. Audit → fixes → regression test. Do not try to combine with feature work in the same phase; a11y fixes deserve their own attention.

**Dependencies:**
- Hard: physical iOS device with VoiceOver Arabic (or simulator at minimum; physical device recommended).
- Hard: physical Android device with TalkBack Arabic (simulator is not reliable for TalkBack).
- Soft: a11y checklist doc (companion artifact, recommended).

---

## LTV Ranking (Summary Across Features)

| Rank | Feature | LTV impact | Rationale |
|---|---|---|---|
| 1 | **MEMORY-*** | Highest | "Guide knows me" is deepest differentiator Taamun can build; extends v1.0 validation moment year-over-year; creates switching cost |
| 2 | **THEMES-*** | High | Compounds year-over-year; natural monthly re-engagement; strong month-6+ cohort retention |
| 3 | **VOICE-*** | Medium-High | Friction reduction for Arabic L1 users; strongest immediate UX quality gain; cohort-specific lift |
| 4 | **A11Y-*** | Floor | Prevents silent churn; moral imperative; table stakes for KSA market credibility |

## Complexity Class Summary

| Feature | Phases | Notes |
|---|---|---|
| THEMES-* | 1 phase | Do not split into dashboard + letter — ship only the letter |
| MEMORY-* | 2 phases | Phase A extraction/retrieval/basic archive, Phase B polish/delete UI/privacy flag/decay |
| VOICE-* | 1 phase | Well-bounded; resist scope creep (no playback, no append, no AI-guide voice) |
| A11Y-* | 1 phase cross-cutting | Touches many files; regression-test via Lighthouse + manual VoiceOver |

**Total phase count for v1.3:** 5 phases (Memory A, Memory B, Themes, Voice, A11y). Phase numbering continues from v1.2's end → Phase 12, 13, 14, 15, 16.

## Feature Dependencies

```
A11Y-*     ──pre-requisite for──> any new UI component in v1.3
                                   (Memory archive, Voice pill, Themes letter)
                                   — so A11Y-* baseline fixes on v1.2 components
                                     should ship first or concurrently

MEMORY-A ──enables──> MEMORY-B (polish depends on core)
                  ──can reuse──> THEMES-* embeddings infrastructure

THEMES-*  ──shares embeddings infra with──> MEMORY-A
          ──delivered via──> `/journey` (v1.2 YIR archive route)

VOICE-*   ──independent──> (plugs into existing reflection flow)
          ──requires──> A11Y-* mic pill labeling to ship jointly
```

## Real-Product References for Arabic Spiritual / Reflective Products

Arabic spiritual apps with directly comparable patterns are thin — the research gap in the region is real. The closest and most useful references (MEDIUM confidence, because each is only a partial analog):

| Product | Relevance to v1.3 | Pattern to borrow | Pattern to reject |
|---|---|---|---|
| **Tarteel** (AI Quran memorization, US-based but Arabic-native) | Proof that AI + Arabic + religious domain works | STT for Arabic works well in religious register; users trust AI in sacred context if framed as aide not authority | Memorization-focused — not reflection; don't import gamification scoring |
| **Muslim Pro + Ask AiDeen** | First-party AI guide in Muslim app | Companion framing ("your Muslim personal assistant") | Thin personalization; mostly content retrieval — Taamun goes deeper |
| **Munsit** (UAE-built Arabic STT) | Native Arabic/dialect STT the entire v1.3 voice feature depends on | Dialect coverage for KSA + GCC; UAE data-residency closer to KSA PDPL than US-hosted Whisper | Not a UX reference — infrastructure only |
| **Quran Circle** (AI-powered memorization) | AI + Arabic religious content | Adaptive learning framing without surveillance creep | Memorization-game aesthetic |
| **Reflection.app** (English, secular) | Closest Western analog for themes + memory + monthly digest | Monthly digest structure; theme surfacing; memory archive UI | Secular register; no classical vocabulary grounding; Silicon-Valley-analytic voice |
| **Day One** (English, secular) | Voice journaling + long-form archive | Understated voice affordance; persistent journal architecture | No memory feature; no theme clustering; subscription-gates voice |
| **Stoic** (English, philosophical) | Themed reflection + mood trends | Philosophy-rooted vocabulary (Stoic terms as theme names) | Not Islamic; mood-tracking register |
| **Untold / Audionotes / AudioDiary** | Voice journaling UX precedent | Minimum-tap record; post-stop transcription; audio-deletion-after-transcribe | English-first; casual voice-memo aesthetic |

## Arabic Tonal Register — Vocabulary Cheat Sheet

Carry into Requirements / copywriting:

| Use | Avoid | Why |
|---|---|---|
| `ذكر` (remembrance, Quranic resonance) | `سجل` (record) · `تتبّع` (tracking) · `تحليل` (analysis) | Reclassifies surveillance as faithful companionship |
| `أذكر أنك...` (I remember that you...) | `لقد لاحظت أن بياناتك تشير إلى...` (I noticed your data indicates...) | Present-tense intimate recollection, not analytic inference |
| `يعود إليك` (X is returning to you) | `النمط المتكرر` (recurring pattern) | Relational, verbal, present — not taxonomic |
| `رسالة` (letter) | `تقرير` (report) · `ملخص` (summary) | Epistolary tradition vs corporate dashboard |
| `منزل / منزلة / مقام / حال` | `pattern · cluster · segment · tag` | Classical Sufi spiritual-state vocabulary |
| `صبر · شكر · توكّل · رضا · ورع · زهد · توبة · رجاء · محبة` | ML-generated theme names | 1000-year vocabulary; each is a station with tradition behind it |
| `الصوت مؤقت` (the audio is temporary) | `صوتك آمن معنا` (your voice is safe with us) | Direct, factual, no defensive framing |
| `مسودة` (draft) for voice transcript | `النسخ` (the transcription) | Authorial agency for the user |
| `اضغط للتحدث` (tap to speak) | `سجّل صوتك الآن` (record your voice now) | Invitation vs imperative |
| `احفظ هذا` (save this) for user-initiated memory | `تذكر هذا` (remember this) | Action is the user's, not the guide's |
| `خاص` (private) for sealed reflections | `سري` (secret) | Sacred-private, not secretive |
| `ادع` (invite, da'wah register) for referral | `شارك` (share) | From v1.2, carries forward |
| `عتبة · حلقة · منزلة` for badges (v1.2) | `إنجاز` (achievement) | From v1.2, carries forward |
| `تخطّي إلى المحتوى` for skip-link | English text | A11y labels must be Arabic |

## Tone-Fit Check — Would a Taamun User Find This Shallow?

| Feature | Shallow if... | Deep if... |
|---|---|---|
| THEMES-* | "Your patterns this month: 🔥 Patience 70% · 🌊 Gratitude 30%" dashboard · heatmap of practice · ML-named clusters | Monthly `رسالة` opens with a verse, names one classical station returning to the heart, quotes the user's own words, is private |
| MEMORY-* | "I've learned you're a cautious introvert who values family" trait profile · invisible "it just knows you" · on by default no disclosure | `ذكر` archive with deletable human-readable cards · threshold-only capture · `أذكر أنك...` explicit retrieval marker · `خاص` flag |
| VOICE-* | Hero mic button · live transcription while speaking · audio saved "for your own record" · "talk to your AI guide" | Subtle pill below text input · post-stop transcript as `مسودة` · no audio persistence ever · footer microcopy `الصوت مؤقت` |
| A11Y-* | Accessibility overlay SDK · English skip-link · ML-generated `alt` text · same label strategy as English version | Hand-tashkeel on hand-typed Arabic · granular `lang` · classical vocabulary in ARIA labels · manual VoiceOver Arabic pass · no third-party overlay |

## Open Questions (for Requirements phase)

1. **MEMORY default:** on or off by default at v1.3 launch? On = better guide from day 1 but requires clear disclosure; off = more conservative privacy posture. **Recommended: on with first-use disclosure modal in guide.**
2. **MEMORY for existing users vs new users:** retroactively extract memories from existing reflections on opt-in? **Recommended: retroactive opt-in only; not automatic.**
3. **THEMES dictionary size:** 7 (classical Sufi seven), 10, or 12? **Recommended: 10-12** (allow coverage of secondary themes: `خوف`, `رجاء`, `محبة`, `إخلاص`, `يقين` alongside the core seven).
4. **THEMES digest delivery:** email only, in-app only, or both? **Recommended: in-app primary + Hijri-month email secondary; not push.**
5. **VOICE maximum session length:** silent cap or visible counter? **Recommended: silent 5-minute server cap (cost control) but no visible counter.**
6. **VOICE multilingual handling:** user mixes Arabic + English mid-sentence — does Munsit handle code-switch gracefully or does this need disclosure? **Open technical question.**
7. **A11Y scope boundary:** v1.2 components only, or also v1.0/v1.1 legacy surfaces? **Recommended: v1.0-v1.2 all in scope; v1.3 new components born-accessible.**
8. **A11Y testing resource:** Ziad personally tests, or contract a blind Arabic VoiceOver user for genuine expert audit? **Recommended: hire an expert user for one round of testing at v1.3 completion** — budget <10K SAR allows this if needed; expert-tested a11y is orders of magnitude more reliable than self-tested.

## Confidence Assessment

| Area | Level | Basis |
|---|---|---|
| Classical Arabic spiritual vocabulary (Maqamat / Manazil) | HIGH | 1000-year tradition; directly verified in Qushayri / Ibn al-Qayyim / Ibn Arabi sources |
| ChatGPT memory UX lessons | HIGH | OpenAI's own documentation + multiple post-mortem articles |
| Arabic screen-reader gotchas (tashkeel, numerals, SVG-aria-label) | HIGH | Peer-reviewed (Abuali 2022) + vendor-documented (Paul Adam) + WebKit bug tracker |
| Voice journaling UX patterns (Untold, Audionotes, AudioDiary) | MEDIUM-HIGH | Multiple independent reviews + publicly documented features |
| Monthly-digest-vs-sidebar preference for Taamun | MEDIUM | Reasoned argument from product voice + v1.2 §R5 sacred-pages rule; no direct A/B data for Arabic spiritual product |
| One-word-vs-phrase theme naming | MEDIUM-HIGH | Strong theoretical basis (classical vocabulary convention); product-test recommended in Requirements |
| Saudi Arabic VoiceOver actual-user experience | LOW-MEDIUM | Structural research strong; actual-user research would strengthen significantly — recommend hiring expert user (see Open Question 8) |
| Munsit Arabic dialect coverage for KSA | MEDIUM | Vendor claim verified in marketing + one review; not independently field-tested |
| **Overall** | **MEDIUM-HIGH** | Ready for Requirements → Roadmap with open questions captured |

---

## Sources

**Classical Arabic / Sufi spiritual vocabulary:**
- [Maqam (Sufism) — Wikipedia](https://en.wikipedia.org/wiki/Maqam_(Sufism))
- [Spiritual Stations (Maqamat) — Path of Mystics](https://pathofmystics.com/spiritual-stations-maqamat/)
- [Mystic's Stations (Maqamat) — Al-Islam.org](https://al-islam.org/al-tawhid/vol4-n1/introduction-irfan-murtadha-mutahhari/mystics-stations-maqamat)
- [Stations and Ahwal — Qushayri & Hujwiri](https://archive.org/stream/MaqamatstationsAndAhwalstatesAccordingToQushayriAndHujwiriByAbdulMuhaya/maqamat%20(stations)%20and%20ahwal%20(states)%20according%20to%20Qushayri%20and%20Hujwiri%20by%20Abdul%20Muhaya_djvu.txt)
- [Tasawwuf — Encyclopedia.com](https://www.encyclopedia.com/religion/encyclopedias-almanacs-transcripts-and-maps/tasawwuf)
- [Maqamat & its Relation to Quran](https://vocal.media/education/maqamat-sufism-and-its-relationship-with-quran)

**AI memory (transparency, user control, pitfalls):**
- [Memory and controls for ChatGPT — OpenAI](https://openai.com/index/memory-and-new-controls-for-chatgpt/)
- [Memory FAQ — OpenAI Help Center](https://help.openai.com/en/articles/8590148-memory-faq)
- [ChatGPT Memory Game-Changer or Privacy Nightmare — Shelly Palmer 2025](https://shellypalmer.com/2025/04/chatgpts-new-memory-feature-game-changer-or-privacy-nightmare/)
- [ChatGPT data retention 2025 — DataStudios](https://www.datastudios.org/post/chatgpt-data-retention-policies-updated-rules-and-user-controls-in-2025)
- [Memory-Enhanced Chatbots — AI Competence](https://aicompetence.org/memory-enhanced-ai-chatbots/)
- [User removed access — OpenAI Community](https://community.openai.com/t/user-removed-access-for-personal-memory-information/1115621)
- [ChatGPT Memory Data Loss — The Outpost](https://theoutpost.ai/news-story/chat-gpt-memory-feature-experiences-widespread-data-loss-users-report-missing-personal-information-21563/)

**Voice journaling UX:**
- [Best Voice Journaling Apps 2025 — Inner Dispatch](https://innerdispatch.com/best-voice-journaling-apps/)
- [Best Voice Journal App — Journaling Insights](https://journalinginsights.com/best-voice-journal-app/)
- [Audionotes](https://www.audionotes.app/journaling)
- [Untold Voice Journal — App Store](https://apps.apple.com/us/app/untold-voice-journal/id6451427834)
- [AudioDiary](https://audiodiary.ai/)
- [VoiceScriber offline privacy](https://voicescriber.com/)
- [Best Privacy-Focused Voice Recorder Apps 2026](https://voicescriber.com/best-privacy-focused-voice-recorder-apps-offline)
- [Audio Diary AI — Deepgram](https://deepgram.com/voice-ai-apps/audio-diary)
- [3 Apps for Effortless Audio Journaling — Medium](https://ashutoshtales.medium.com/journal-without-writing-3-apps-for-effortless-audio-journaling-92c8c8c051c2)

**Arabic STT / Munsit / Muslim AI companions:**
- [Munsit — Arabic STT](https://munsit.com/)
- [Munsit App](https://munsit.com/munsit-app)
- [Ask AiDeen — Muslim Pro](https://www.muslimpro.com/introducing-ask-aideen/)
- [Tarteel AI](https://tarteel.ai/)
- [Tarteel App Store](https://apps.apple.com/us/app/tarteel-ai-quran-memorization/id1391009396)
- [Quran Circle](https://qurancircle.ai/)
- [AI Quran Memorization research — JST 2025](https://journals.ust.edu/index.php/JST/article/view/3088)
- [Lahajati Arabic TTS/STT](https://lahajati.ai/en)

**Arabic screen-reader / VoiceOver / RTL a11y:**
- [Full Diacritization to Improve Screen Readers — Abuali, Wiley 2022](https://onlinelibrary.wiley.com/doi/10.1155/2022/1186678)
- [VoiceOver iOS HTML & ARIA support — Paul Adam](https://pauljadam.com/demos/voiceover-ios-html-aria-support.html)
- [iOS Accessibility Issues — Level Access](https://labs.levelaccess.com/index.php/IOS_Accessibility_Issues)
- [VoiceOver Recognition — Apple Support](https://support.apple.com/en-us/111799)
- [Accessibility for foreign languages — Penn State](https://accessibility.psu.edu/foreignlanguages/)
- [Is there a screen reader supporting Arabic — JFW groups](https://jfw.groups.io/g/main/topic/is_there_a_screen_reader_that/208412)
- [Handling Arabic numbers — Medium](https://medium.com/@machinestalks/input-design-how-to-handle-arabic-numbers-fe95fb66fe81)
- [Stop fixing Numbers · RTL web — xgeeks](https://medium.com/xgeeks/stop-fixing-numbers-96a0a1915719)
- [Accessible SVGs — a11y-101](https://a11y-101.com/development/svg)
- [aria-label Introduction — a11y-101](https://a11y-101.com/development/aria-label)
- [WebKit bug 260835 — aria-description not exposed to VO](https://bugs.webkit.org/show_bug.cgi?id=260835)
- [RTL bidirectional text — Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/bidirectional-support)
- [i18n for Accessibility 2026 — IntlPull](https://intlpull.com/blog/i18n-accessibility-a11y-localization-guide-2026)

**AI journaling app patterns (themes, memory, insights):**
- [AI Journaling Apps Guide 2026 — Reflection.app](https://www.reflection.app/blog/ai-journaling-app)
- [9 Best AI Journaling Apps 2026 — MyLifeNote](https://blog.mylifenote.ai/the-8-best-ai-journaling-apps-in-2026/)
- [Best AI Journaling Apps 2026 — AIJournalApp](https://www.aijournalapp.ai/blog/best-ai-journal-apps/)
- [Top 10 AI Journaling Apps — Rosebud](https://www.rosebud.app/blog/top-10-ai-journaling-apps-for-self-reflection)
- [Reflectly App Review 2025 — Ikana](https://ikanabusinessreview.com/2025/10/reflectly-app-review-2025-guided-journaling-for-wellbeing/)
- [Stoic App](https://www.getstoic.com/)
- [7 Best AI Journaling Apps 2026 — Know Your Ethos](https://knowyourethos.com/blog/best-ai-journaling-apps-2026)

---
*Feature research for: Taamun v1.3 العمق (Depth & Personalization)*
*Researched: 2026-04-20*
*Confidence: MEDIUM-HIGH (strong on classical Arabic spiritual vocabulary, strong on ChatGPT memory UX lessons, strong on Arabic a11y structural gotchas, medium on voice journaling UX specifics for Saudi Arabic users, low-medium on actual Arabic VoiceOver user experience without expert-user testing)*
