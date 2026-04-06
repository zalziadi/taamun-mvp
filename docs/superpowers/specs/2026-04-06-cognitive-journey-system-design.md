# Taamun Cognitive Journey System — Design Spec

> Date: 2026-04-06
> Status: DRAFT — Awaiting Review
> Scope: System logic, API, data flow (NO UI changes)

---

## 1. Problem Statement

Taamun has three systems that track the same user but don't talk to each other:

| System | What it does | Table |
|--------|-------------|-------|
| **Journey** (الرحلة) | 28-day progression | `progress` |
| **Reflection** (دفتر التأمل) | Daily contemplation capture | `reflections` |
| **Awareness** (منحنى الوعي) | Transformation measurement | `awareness_logs`, `awareness_insights` |

They are separate pages, separate APIs, separate data. A user on day 6 who reflected deeply on day 3 gets zero benefit from that reflection when they open day 6.

Additionally:
- `currentDay` was purely completion-based (fixed in `153a11f`)
- No concept of "drift" (calendar vs actual progress)
- No adaptive response to user behavior patterns
- No connection between insight and action

---

## 2. Vision

Transform the 28-day program from a static tracker into a living cognitive journey:

```
Day unlocks → Context gathered → Reflection prompted → Insight generated → Action suggested
     ↑                                                                          |
     └──────────────────── Future days influenced by past actions ──────────────┘
```

**Core principle:** Progress = Time + Engagement + Awareness + Action

---

## 3. Architecture Decisions

### 3.1 DBOS is a separate project
- Taamun = independent product with its own cognitive layer
- DBOS = separate project, separate DB, separate deployment
- Future integration via Events API (webhook) — NOT in this spec
- Taamun builds its own intelligence first

### 3.2 No UI changes in this phase
- All changes are API + data layer
- Existing pages consume new data when ready
- UI redesign is a separate future phase

### 3.3 Modular and composable
- Each new capability is an independent module
- Can be enabled/disabled without breaking existing flow
- Existing endpoints remain backward-compatible

---

## 4. System Components

### 4.1 Enhanced Progress Engine

**File:** `src/lib/calendarDay.ts` (exists) + `src/lib/progressEngine.ts` (new)

The progress engine wraps the existing calendar day logic and adds drift calculation:

```typescript
interface ProgressState {
  currentDay: number;        // effective day (max of stored, calendar)
  storedDay: number;         // from DB
  calendarDay: number;       // from subscription_start_date
  drift: number;             // calendarDay - storedDay
  mode: "normal" | "catch_up" | "intervention";
  completedDays: number[];
  missedDays: number[];      // days between 1..currentDay not in completedDays
  streak: number;            // consecutive completed days ending at currentDay
  completionRate: number;    // completedDays.length / currentDay
}
```

**Drift rules:**

| Drift | Mode | Behavior |
|-------|------|----------|
| 0 | `normal` | Standard flow |
| 1-2 | `normal` | Seamless continuation, no interruption |
| 3-5 | `catch_up` | Soft catch-up suggestion returned in API |
| >5 | `intervention` | Adaptive intervention with options |

**Catch-up options (returned in API, rendered by UI later):**

```typescript
interface CatchUpData {
  message: string;           // Arabic contextual message
  missedDays: number[];
  options: CatchUpOption[];
}

type CatchUpOption =
  | { type: "continue"; label: string }        // "تابع من اليوم"
  | { type: "review"; label: string; days: number[] }  // "راجع الأيام الفائتة"
  | { type: "summary"; label: string }         // "ملخص ذكي"
```

### 4.2 Cognitive Context Builder

**File:** `src/lib/cognitiveContext.ts` (new)

Before a day is presented, the system gathers context from all three sources:

```typescript
interface CognitiveContext {
  // From reflections
  recentReflections: {
    day: number;
    emotion: string;
    awareness_state: string;
    note_preview: string;     // first 100 chars
  }[];

  // From awareness
  awarenessLevel: "surface" | "growing" | "deep";
  dominantPattern: string | null;

  // From user_memory
  recurringThemes: string[];
  commitmentScore: number;    // 0-10

  // Generated
  contextSummary: string;     // 1-2 sentence Arabic summary for the day
  suggestedQuestion: string;  // personalized question based on patterns
}
```

**How it's built:**
1. Query `reflections` for last 3 entries
2. Query `awareness_logs` for current week
3. Query `user_memory` for patterns and scores
4. If patterns exist, generate contextSummary via meaning-engine
5. If no patterns, return lightweight default context

### 4.3 Reflection Linker

**File:** `src/lib/reflectionLinker.ts` (new)

Connects reflections to the journey by detecting patterns across days:

```typescript
interface LinkedReflection {
  insight: string;             // AI-generated connection
  connectedDays: number[];     // days with similar themes
  emotionalArc: string;        // "deepening" | "shifting" | "repeating" | "emerging"
  patterns: string[];          // extracted recurring themes
}
```

**Triggers:**
- After a new reflection is saved (POST /api/reflections)
- When a day with drift > 2 is opened

**Process:**
1. Load all user reflections
2. Group by emotion and awareness_state
3. Detect recurring words/themes (simple keyword extraction, no ML needed)
4. Compare current reflection to past ones
5. Generate `LinkedReflection` via meaning-engine
6. Store patterns in `user_memory.patterns`

### 4.4 Action Generator

**File:** `src/lib/actionGenerator.ts` (new)

Every insight must produce a concrete action:

```typescript
interface CognitiveAction {
  type: "reflection" | "review" | "decision" | "practice";
  label: string;               // Arabic display text
  description: string;         // what to do
  targetDay: number | null;    // if action references a specific day
  suggestedNextStep: string;   // one clear next step
  priority: "low" | "medium" | "high";
}
```

**Action types:**

| Type | When | Example |
|------|------|---------|
| `reflection` | Drift detected, pattern found | "ارجع ليوم 2 وأضف سطر عن ما تغيّر" |
| `review` | Missed days | "اقرأ تأمل يوم 3 — فيه نمط يتكرر" |
| `decision` | Commitment dropping | "هل تريد تغيير وتيرة الرحلة؟" |
| `practice` | Normal flow | "تأمل اليوم: لاحظ ردة فعلك الأولى" |

### 4.5 Identity Tracker

**File:** `src/lib/identityTracker.ts` (new)

Builds a persistent cognitive profile from user behavior:

```typescript
interface UserIdentity {
  // Behavioral
  completionPattern: "consistent" | "bursty" | "declining" | "absent";
  avgDriftFrequency: number;          // how often drift > 2 occurs
  reflectionDepth: "surface" | "moderate" | "deep";
  preferredTime: string | null;       // if detectable from timestamps

  // Thematic
  recurringThemes: string[];          // from reflections
  dominantEmotion: string | null;     // most frequent emotion
  awarenessProgression: string;       // "growing" | "plateaued" | "fluctuating"

  // Engagement
  totalReflections: number;
  avgReflectionLength: number;
  daysWithReflection: number;
  guideSessions: number;

  // Computed
  engagementScore: number;            // 0-100
  transformationSignal: "early" | "emerging" | "deepening" | "integrated";
}
```

**Updated:**
- On every reflection save
- On every day completion
- On guide session end

**Stored in:** `user_memory` table (already exists — extend with JSONB `identity` column)

---

## 5. API Changes

### 5.1 GET /api/program/progress (enhanced)

Current response:
```json
{
  "ok": true,
  "current_day": 6,
  "completed_days": [1, 2],
  "percent": 7
}
```

New response (backward-compatible — new fields are additive):
```json
{
  "ok": true,
  "current_day": 6,
  "completed_days": [1, 2],
  "completed_count": 2,
  "percent": 7,
  "drift": 3,
  "mode": "catch_up",
  "missed_days": [3, 4, 5],
  "streak": 0,
  "completion_rate": 0.33,
  "catch_up": {
    "message": "فاتتك 3 أيام — لكن الرحلة ما توقفت",
    "options": [
      { "type": "continue", "label": "تابع من اليوم 6" },
      { "type": "review", "label": "راجع الأيام الفائتة", "days": [3, 4, 5] },
      { "type": "summary", "label": "ملخص ذكي للأيام الفائتة" }
    ]
  }
}
```

### 5.2 GET /api/program/day/[id] (enhanced)

Add cognitive context to day response:

```json
{
  "...existing fields...",
  "cognitive": {
    "context_summary": "في تأملك ليوم 2، لاحظت نمط التردد. اليوم نستكشف جذره.",
    "suggested_question": "ما الذي يجعلك تتوقف قبل أن تبدأ؟",
    "connected_days": [2, 3],
    "awareness_level": "growing"
  }
}
```

### 5.3 POST /api/reflections (enhanced)

After saving, trigger reflection linking. Add to response:

```json
{
  "...existing fields...",
  "linked": {
    "insight": "هذا التأمل يتصل بما كتبته يوم 2 عن الخوف",
    "connected_days": [2],
    "emotional_arc": "deepening",
    "patterns": ["تردد", "خوف من البداية"]
  },
  "action": {
    "type": "practice",
    "label": "تمرين اليوم",
    "description": "اكتب 3 أشياء بدأتها بنجاح",
    "suggested_next_step": "شاركها مع نفسك قبل النوم"
  }
}
```

### 5.4 GET /api/identity (new)

Returns current user cognitive profile:

```json
{
  "ok": true,
  "identity": {
    "completion_pattern": "bursty",
    "reflection_depth": "moderate",
    "recurring_themes": ["تردد", "بحث عن معنى"],
    "dominant_emotion": "contemplative",
    "awareness_progression": "growing",
    "engagement_score": 62,
    "transformation_signal": "emerging"
  }
}
```

---

## 6. Data Layer Changes

### 6.1 Extend `user_memory` table

```sql
ALTER TABLE user_memory
ADD COLUMN IF NOT EXISTS identity JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS drift_history INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_cognitive_update TIMESTAMPTZ;
```

### 6.2 New table: `cognitive_actions`

```sql
CREATE TABLE cognitive_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reflection', 'review', 'decision', 'practice')),
  label TEXT NOT NULL,
  description TEXT,
  suggested_next_step TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'expired')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cognitive_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own actions" ON cognitive_actions
  FOR ALL USING (auth.uid() = user_id);
```

### 6.3 New table: `reflection_links`

```sql
CREATE TABLE reflection_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_day INTEGER NOT NULL,
  target_day INTEGER NOT NULL,
  insight TEXT,
  emotional_arc TEXT CHECK (emotional_arc IN ('deepening', 'shifting', 'repeating', 'emerging')),
  patterns TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reflection_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own links" ON reflection_links
  FOR ALL USING (auth.uid() = user_id);
```

---

## 7. Module Dependency Graph

```
calendarDay.ts (exists)
    ↓
progressEngine.ts (new)
    ↓
cognitiveContext.ts (new) ←── reflectionLinker.ts (new)
    ↓                              ↓
actionGenerator.ts (new)    identityTracker.ts (new)
    ↓                              ↓
    └──────── API routes ──────────┘
```

No circular dependencies. Each module can be built and tested independently.

---

## 8. Implementation Order

| Phase | What | Depends on |
|-------|------|-----------|
| 1 | `progressEngine.ts` + drift + mode | `calendarDay.ts` (exists) |
| 2 | Enhanced `GET /progress` API | Phase 1 |
| 3 | `cognitiveContext.ts` | Existing tables |
| 4 | Enhanced `GET /day/[id]` API | Phase 3 |
| 5 | `reflectionLinker.ts` | Existing `reflections` table |
| 6 | Enhanced `POST /reflections` | Phase 5 |
| 7 | `actionGenerator.ts` + `cognitive_actions` table | Phase 5, 6 |
| 8 | `identityTracker.ts` + `user_memory` extension | Phase 5, 7 |
| 9 | `GET /api/identity` | Phase 8 |
| 10 | `reflection_links` table + migration | Phase 5 |

---

## 9. DBOS Integration Point (Future)

NOT in this spec. But the design prepares for it:

- `cognitive_actions` table mirrors DBOS Decision structure (type, status, priority)
- `reflection_links` mirrors DBOS Pins & Threads (source, target, insight)
- Future webhook: `POST /api/events` sends `DAY_UNLOCKED`, `REFLECTION_SAVED`, `ACTION_COMPLETED` to DBOS

When DBOS integration happens, the bridge is:
```
Taamun cognitive_actions → webhook → DBOS Decision Court
Taamun reflection_links  → webhook → DBOS Pins & Threads
DBOS insights            → webhook → Taamun user_memory
```

---

## 10. Constraints

- No UI changes
- No DBOS dependency
- Existing API responses remain backward-compatible
- All new features are additive (new fields, not changed fields)
- meaning-engine calls are optional (fallback to deterministic logic)
- No vector embeddings in this phase (keep it simple)

---

## 11. Success Criteria

1. `GET /progress` returns drift, mode, and catch_up data
2. `GET /day/[id]` returns cognitive context from past reflections
3. `POST /reflections` returns linked insights and suggested actions
4. User identity profile builds automatically from behavior
5. All 18 existing tests continue to pass
6. New modules have unit tests
7. Zero breaking changes to existing endpoints
