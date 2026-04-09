# TanStack Query + Middleware + Journey Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a disciplined data layer (`@tanstack/react-query`), a root `middleware.ts` auth guard, and a `src/lib/journey/` navigation layer to `taamun-next` without violating CLAUDE.md rules #5 (localStorage only for progress) and #6 (no new libraries without permission).

**Architecture:** Three strictly-bounded layers. Progress state stays in `localStorage` behind a single module (`src/lib/journey/progress.ts`). Server data moves to TanStack Query hooks under `src/lib/queries/` composed by `useJourneyState`. A root `middleware.ts` enforces Supabase-session auth for `/program`, `/account`, `/admin`. Entitlement HMAC stays in route handlers.

**Tech Stack:** Next.js 14 App Router · TypeScript · `@tanstack/react-query` v5 (new) · `@supabase/ssr` + `@supabase/supabase-js` (existing) · Tailwind (existing).

**Verification model:** The project has no test runner. Each task verifies with `npx tsc --noEmit`. Final task runs `npm run guard:release` per CLAUDE.md. A single node-runnable smoke script covers the pure journey-routing function.

**Spec:** `docs/superpowers/specs/2026-04-09-tanstack-query-middleware-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/lib/journey/progress.ts` | Single source of truth for `taamun.progress.v1` localStorage. SSR-safe. Emits `taamun:progress-changed` event. |
| `src/lib/journey/resolveJourneyRoute.ts` | Pure function `Progress → JourneyRoute`. No I/O. |
| `src/lib/journey/useJourneyState.ts` | Composition hook: progress + reflections + awareness queries + route. |
| `src/lib/journey/types.ts` | `Progress`, `JourneyRoute` types re-exports. |
| `src/lib/queries/queryClient.ts` | `makeQueryClient()` factory with the product's calm defaults. |
| `src/lib/queries/keys.ts` | Type-safe query key factory `qk`. |
| `src/lib/queries/mappers.ts` | DB row → UI shape mapping functions. |
| `src/lib/queries/useReflections.ts` | `useReflections` + `useSaveReflection`. |
| `src/lib/queries/useAwarenessLogs.ts` | `useAwarenessLogs` + `useSaveAwarenessLog`. |
| `src/lib/queries/useProfile.ts` | `useProfile` for current user profile row. |
| `src/lib/errors.ts` | `formatErrorAr(err)` — Arabic UI strings for any error. |
| `src/app/providers.tsx` | Client Component wrapping children in `<QueryClientProvider>`. |
| `middleware.ts` (repo root) | Supabase auth guard for protected routes only. |
| `scripts/smoke-journey.mjs` | Node-runnable smoke test for `resolveJourneyRoute`. |
| `supabase/migrations/2026-04-09_unique_user_day.sql` | `UNIQUE (user_id, day)` on `reflections` and `awareness_logs` if missing. |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Add `@tanstack/react-query` dependency. |
| `src/app/layout.tsx` | Wrap `<AppChrome>{children}</AppChrome>` in `<Providers>`. |
| `src/components/DayExperience.tsx` | Replace direct `supabase.from(...).upsert(...)` calls in `ReflectionJournal` and `AwarenessMeter` with `useSaveReflection` / `useSaveAwarenessLog`. |

### Out of scope (explicitly deferred)

- Wiring `useJourneyState` into `src/app/program/page.tsx` (current page uses `/api/progress`; reconciliation is a separate decision).
- Optimistic updates.
- SSR prefetching.
- Migrating non-progress localStorage keys in `Day1Gate.tsx`, `OnboardingOverlay.tsx`, `GrowthPrompt.tsx`, `SmartGuide.tsx` — those use different keys and are unrelated to rule #5.

---

## Task 1: Install `@tanstack/react-query`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Checkpoint commit before adding dependency**

```bash
cd /Users/ziyadalziyadi/taamun-next
git add -A && git commit -m "chore: checkpoint before tanstack-query install" --allow-empty
```

- [ ] **Step 2: Install the package**

```bash
cd /Users/ziyadalziyadi/taamun-next
npm install @tanstack/react-query@^5
```

Expected: `package.json` gains `"@tanstack/react-query": "^5.x.x"` under `dependencies`. `package-lock.json` updates.

- [ ] **Step 3: Verify install**

```bash
node -e "console.log(require('@tanstack/react-query/package.json').version)"
```

Expected: prints a version string starting with `5.`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @tanstack/react-query for data layer"
```

---

## Task 2: Create `src/lib/errors.ts`

**Files:**
- Create: `src/lib/errors.ts`

- [ ] **Step 1: Write the module**

```ts
// src/lib/errors.ts
// Arabic-facing error formatter. All UI error strings must come from here —
// never render raw Supabase or JS error messages.

export type AppError = {
  code: string;
  messageAr: string;
};

export function formatErrorAr(err: unknown): AppError {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code?: unknown }).code ?? "unknown");
    switch (code) {
      case "23505":
        return { code, messageAr: "هذا السجل موجود مسبقاً." };
      case "PGRST301":
      case "42501":
        return { code, messageAr: "لا تملك صلاحية لهذا الإجراء." };
      case "PGRST116":
        return { code, messageAr: "لم يتم العثور على البيانات." };
      default:
        return { code, messageAr: "حدث خطأ غير متوقع. حاول مرة أخرى." };
    }
  }
  if (err instanceof Error) {
    return { code: "exception", messageAr: "حدث خطأ. حاول مرة أخرى." };
  }
  return { code: "unknown", messageAr: "حدث خطأ. حاول مرة أخرى." };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/ziyadalziyadi/taamun-next
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/errors.ts
git commit -m "feat(errors): add formatErrorAr for Arabic UI error strings"
```

---

## Task 3: Create `src/lib/journey/progress.ts`

**Files:**
- Create: `src/lib/journey/progress.ts`
- Create: `src/lib/journey/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// src/lib/journey/types.ts
export type Progress = {
  currentDay: number;
  completedDays: number[];
  lastOpenedAt: string | null;
  momentum: number;
};

export type JourneyRoute =
  | { kind: "welcome" }
  | { kind: "day"; day: number }
  | { kind: "completed" };
```

- [ ] **Step 2: Write the progress module**

```ts
// src/lib/journey/progress.ts
// Single source of truth for taamun.progress.v1 localStorage.
// No other file in the repo may read/write this key directly.

"use client";

import type { Progress } from "./types";

export const PROGRESS_KEY = "taamun.progress.v1";
export const PROGRESS_CHANGED_EVENT = "taamun:progress-changed";

const EMPTY: Progress = {
  currentDay: 1,
  completedDays: [],
  lastOpenedAt: null,
  momentum: 0,
};

export function readProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      currentDay:
        typeof parsed.currentDay === "number" ? parsed.currentDay : EMPTY.currentDay,
      completedDays: Array.isArray(parsed.completedDays)
        ? parsed.completedDays.filter((d): d is number => typeof d === "number")
        : EMPTY.completedDays,
      lastOpenedAt:
        typeof parsed.lastOpenedAt === "string" ? parsed.lastOpenedAt : EMPTY.lastOpenedAt,
      momentum: typeof parsed.momentum === "number" ? parsed.momentum : EMPTY.momentum,
    };
  } catch {
    return EMPTY;
  }
}

export function writeProgress(next: Partial<Progress>): void {
  if (typeof window === "undefined") return;
  const merged: Progress = {
    ...readProgress(),
    ...next,
    lastOpenedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT));
  } catch {
    // localStorage may be full or blocked (private mode) — silently ignore.
  }
}

export { EMPTY as EMPTY_PROGRESS };
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/ziyadalziyadi/taamun-next
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/journey/progress.ts src/lib/journey/types.ts
git commit -m "feat(journey): add progress module (single source for localStorage)"
```

---

## Task 4: Create `resolveJourneyRoute` + smoke test

**Files:**
- Create: `src/lib/journey/resolveJourneyRoute.ts`
- Create: `scripts/smoke-journey.mjs`

- [ ] **Step 1: Write the pure function**

```ts
// src/lib/journey/resolveJourneyRoute.ts
import type { JourneyRoute, Progress } from "./types";

export function resolveJourneyRoute(p: Progress): JourneyRoute {
  if (p.currentDay < 1) return { kind: "welcome" };
  if (p.currentDay > 28) return { kind: "completed" };
  return { kind: "day", day: p.currentDay };
}
```

- [ ] **Step 2: Write the smoke test (Node, no framework)**

```js
// scripts/smoke-journey.mjs
// Minimal smoke test for resolveJourneyRoute. Run: node scripts/smoke-journey.mjs
// Uses a hand-inlined copy of the function to avoid needing a TS runtime.

function resolveJourneyRoute(p) {
  if (p.currentDay < 1) return { kind: "welcome" };
  if (p.currentDay > 28) return { kind: "completed" };
  return { kind: "day", day: p.currentDay };
}

function assertEqual(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: got ${a}, expected ${e}`);
    process.exit(1);
  }
  console.log(`PASS ${label}`);
}

const base = { completedDays: [], lastOpenedAt: null, momentum: 0 };

assertEqual(
  "currentDay=0 → welcome",
  resolveJourneyRoute({ ...base, currentDay: 0 }),
  { kind: "welcome" }
);
assertEqual(
  "currentDay=1 → day 1",
  resolveJourneyRoute({ ...base, currentDay: 1 }),
  { kind: "day", day: 1 }
);
assertEqual(
  "currentDay=28 → day 28",
  resolveJourneyRoute({ ...base, currentDay: 28 }),
  { kind: "day", day: 28 }
);
assertEqual(
  "currentDay=29 → completed",
  resolveJourneyRoute({ ...base, currentDay: 29 }),
  { kind: "completed" }
);
assertEqual(
  "currentDay=-5 → welcome",
  resolveJourneyRoute({ ...base, currentDay: -5 }),
  { kind: "welcome" }
);

console.log("all smoke checks passed");
```

- [ ] **Step 3: Run the smoke test**

```bash
cd /Users/ziyadalziyadi/taamun-next
node scripts/smoke-journey.mjs
```

Expected output:
```
PASS currentDay=0 → welcome
PASS currentDay=1 → day 1
PASS currentDay=28 → day 28
PASS currentDay=29 → completed
PASS currentDay=-5 → welcome
all smoke checks passed
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/journey/resolveJourneyRoute.ts scripts/smoke-journey.mjs
git commit -m "feat(journey): add resolveJourneyRoute + node smoke test"
```

---

## Task 5: Create query layer scaffolding (`queryClient`, `keys`, `mappers`)

**Files:**
- Create: `src/lib/queries/queryClient.ts`
- Create: `src/lib/queries/keys.ts`
- Create: `src/lib/queries/mappers.ts`

- [ ] **Step 1: Write `queryClient.ts`**

```ts
// src/lib/queries/queryClient.ts
// Single QueryClient factory. Defaults tuned for a calm, meditative product:
// no aggressive refetching on focus.

import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
```

- [ ] **Step 2: Write `keys.ts`**

```ts
// src/lib/queries/keys.ts
// Type-safe query key factory. No string-literal query keys anywhere else in the repo.

export const qk = {
  reflections: (userId: string) => ["reflections", userId] as const,
  awarenessLogs: (userId: string, day?: number) =>
    ["awareness_logs", userId, day] as const,
  profile: (userId: string) => ["profile", userId] as const,
  adminUsers: () => ["admin", "users"] as const,
} as const;
```

- [ ] **Step 3: Write `mappers.ts`**

```ts
// src/lib/queries/mappers.ts
// DB row → UI shape boundary. The UI never touches raw rows.

export type ReflectionRow = {
  id?: string;
  user_id: string;
  day: number;
  note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Reflection = {
  userId: string;
  day: number;
  note: string;
  updatedAt: string | null;
};

export function mapReflection(row: ReflectionRow): Reflection {
  return {
    userId: row.user_id,
    day: row.day,
    note: row.note ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? null,
  };
}

export type AwarenessLogRow = {
  id?: string;
  user_id: string;
  day: number;
  level: string;
  created_at?: string | null;
};

export type AwarenessLog = {
  userId: string;
  day: number;
  level: string;
  createdAt: string | null;
};

export function mapAwarenessLog(row: AwarenessLogRow): AwarenessLog {
  return {
    userId: row.user_id,
    day: row.day,
    level: row.level,
    createdAt: row.created_at ?? null,
  };
}

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at?: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at ?? null,
  };
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/queryClient.ts src/lib/queries/keys.ts src/lib/queries/mappers.ts
git commit -m "feat(queries): add QueryClient factory, key factory, and row mappers"
```

---

## Task 6: Create `<Providers>` and wire it into root layout

**Files:**
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write the Providers component**

```tsx
// src/app/providers.tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { makeQueryClient } from "@/lib/queries/queryClient";

export function Providers({ children }: { children: ReactNode }) {
  // useState ensures a single QueryClient per client mount.
  const [client] = useState(() => makeQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Modify `src/app/layout.tsx` to wrap children in `<Providers>`**

Read the current file, then edit the JSX block (currently lines 74-83). The only change is wrapping `<AppChrome>` in `<Providers>`.

Current:
```tsx
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${amiri.variable} ${manrope.variable} ${notoSerif.variable} tm-body antialiased`}
      >
        <AnalyticsProvider />
        <AppChrome ramadanClosed={ramadanClosed}>{children}</AppChrome>
      </body>
    </html>
  );
```

Replace with:
```tsx
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${amiri.variable} ${manrope.variable} ${notoSerif.variable} tm-body antialiased`}
      >
        <AnalyticsProvider />
        <Providers>
          <AppChrome ramadanClosed={ramadanClosed}>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
```

Also add the import near the top with the other imports:
```tsx
import { Providers } from "./providers";
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: build succeeds. `/program`, `/day`, `/` routes all still render.

- [ ] **Step 5: Commit**

```bash
git add src/app/providers.tsx src/app/layout.tsx
git commit -m "feat(providers): mount QueryClientProvider in root layout"
```

---

## Task 7: Write `useReflections` + `useSaveReflection`

**Files:**
- Create: `src/lib/queries/useReflections.ts`

- [ ] **Step 1: Write the hooks**

```ts
// src/lib/queries/useReflections.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { qk } from "./keys";
import { mapReflection, type Reflection, type ReflectionRow } from "./mappers";

export function useReflections(userId: string | null) {
  return useQuery<Reflection[]>({
    // When userId is null, enabled:false prevents the fetch —
    // the queryKey still evaluates, so we provide a stable non-executed key.
    queryKey: userId ? qk.reflections(userId) : ["reflections", "__disabled__"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", userId!)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data as ReflectionRow[]).map(mapReflection);
    },
  });
}

export type SaveReflectionInput = { day: number; note: string };

export function useSaveReflection(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveReflectionInput) => {
      if (!userId) throw new Error("no-user");
      const { error } = await supabase
        .from("reflections")
        .upsert(
          { user_id: userId, day: input.day, note: input.note },
          { onConflict: "user_id,day" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: qk.reflections(userId) });
    },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/useReflections.ts
git commit -m "feat(queries): add useReflections and useSaveReflection"
```

---

## Task 8: Write `useAwarenessLogs` + `useSaveAwarenessLog`

**Files:**
- Create: `src/lib/queries/useAwarenessLogs.ts`

- [ ] **Step 1: Write the hooks**

```ts
// src/lib/queries/useAwarenessLogs.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { qk } from "./keys";
import { mapAwarenessLog, type AwarenessLog, type AwarenessLogRow } from "./mappers";

export function useAwarenessLogs(userId: string | null) {
  return useQuery<AwarenessLog[]>({
    queryKey: userId ? qk.awarenessLogs(userId) : ["awareness_logs", "__disabled__"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awareness_logs")
        .select("*")
        .eq("user_id", userId!)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data as AwarenessLogRow[]).map(mapAwarenessLog);
    },
  });
}

export type SaveAwarenessLogInput = { day: number; level: string };

export function useSaveAwarenessLog(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveAwarenessLogInput) => {
      if (!userId) throw new Error("no-user");
      const { error } = await supabase
        .from("awareness_logs")
        .upsert(
          { user_id: userId, day: input.day, level: input.level },
          { onConflict: "user_id,day" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: qk.awarenessLogs(userId) });
    },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/useAwarenessLogs.ts
git commit -m "feat(queries): add useAwarenessLogs and useSaveAwarenessLog"
```

---

## Task 9: Write `useProfile`

**Files:**
- Create: `src/lib/queries/useProfile.ts`

- [ ] **Step 1: Write the hook**

```ts
// src/lib/queries/useProfile.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { qk } from "./keys";
import { mapProfile, type Profile, type ProfileRow } from "./mappers";

export function useProfile(userId: string | null) {
  return useQuery<Profile | null>({
    queryKey: userId ? qk.profile(userId) : ["profile", "__disabled__"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapProfile(data as ProfileRow);
    },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/useProfile.ts
git commit -m "feat(queries): add useProfile"
```

---

## Task 10: Write `useJourneyState` composition hook

**Files:**
- Create: `src/lib/journey/useJourneyState.ts`

- [ ] **Step 1: Write the hook**

```ts
// src/lib/journey/useJourneyState.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useReflections } from "@/lib/queries/useReflections";
import { useAwarenessLogs } from "@/lib/queries/useAwarenessLogs";
import { PROGRESS_CHANGED_EVENT, readProgress } from "./progress";
import { resolveJourneyRoute } from "./resolveJourneyRoute";
import type { JourneyRoute, Progress } from "./types";

export type JourneyState = {
  progress: Progress;
  route: JourneyRoute;
  reflections: ReturnType<typeof useReflections>;
  awareness: ReturnType<typeof useAwarenessLogs>;
  isLoading: boolean;
};

export function useJourneyState(userId: string | null): JourneyState {
  const [progress, setProgress] = useState<Progress>(() => readProgress());

  useEffect(() => {
    const handler = () => setProgress(readProgress());
    window.addEventListener(PROGRESS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, handler);
  }, []);

  const reflections = useReflections(userId);
  const awareness = useAwarenessLogs(userId);
  const route = useMemo(() => resolveJourneyRoute(progress), [progress]);

  return {
    progress,
    route,
    reflections,
    awareness,
    isLoading: reflections.isLoading || awareness.isLoading,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/journey/useJourneyState.ts
git commit -m "feat(journey): add useJourneyState composition hook"
```

---

## Task 11: DB migration — `UNIQUE (user_id, day)`

**Files:**
- Create: `supabase/migrations/2026-04-09_unique_user_day.sql`

- [ ] **Step 1: Write the migration (idempotent)**

```sql
-- supabase/migrations/2026-04-09_unique_user_day.sql
-- Ensure upserts with onConflict:'user_id,day' behave correctly.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reflections_user_id_day_key'
  ) THEN
    ALTER TABLE public.reflections
      ADD CONSTRAINT reflections_user_id_day_key UNIQUE (user_id, day);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'awareness_logs_user_id_day_key'
  ) THEN
    ALTER TABLE public.awareness_logs
      ADD CONSTRAINT awareness_logs_user_id_day_key UNIQUE (user_id, day);
  END IF;
END$$;
```

- [ ] **Step 2: Verify the file parses**

```bash
cd /Users/ziyadalziyadi/taamun-next
cat supabase/migrations/2026-04-09_unique_user_day.sql
```

Expected: file prints with no shell errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/2026-04-09_unique_user_day.sql
git commit -m "db(migration): ensure UNIQUE(user_id,day) on reflections and awareness_logs"
```

- [ ] **Step 4: Manual apply — remind the user**

> ⚠️ Manual step for Ziad: apply the migration via Supabase SQL editor or `supabase db push` before shipping. The mutations assume the unique constraint exists.

---

## Task 12: Migrate `DayExperience.tsx` to use mutations

**Files:**
- Modify: `src/components/DayExperience.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat src/components/DayExperience.tsx | head -200
```

Locate `ReflectionJournal` (around line 86) and `AwarenessMeter` (around line 147).

- [ ] **Step 2: Add imports at the top of the file**

After the existing imports, add:
```ts
import { useSaveReflection } from "@/lib/queries/useReflections";
import { useSaveAwarenessLog } from "@/lib/queries/useAwarenessLogs";
```

- [ ] **Step 3: Refactor `ReflectionJournal` to accept `userId` and use `useSaveReflection`**

Replace the entire `ReflectionJournal` function with:

```tsx
function ReflectionJournal({
  day,
  question,
  userId,
}: {
  day: number;
  question: string;
  userId: string | null;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMutation = useSaveReflection(userId);

  const save = useCallback(
    async (value: string) => {
      if (!value.trim() || !userId) return;
      setStatus("saving");
      try {
        await saveMutation.mutateAsync({ day, note: value });
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [day, userId, saveMutation]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) return;
    timerRef.current = setTimeout(() => save(text), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, save]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">{question}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus("idle");
        }}
        placeholder="اكتب ما يخطر ببالك..."
        rows={5}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-loose text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
      />
      <p className="h-4 text-xs text-white/30">
        {status === "saving" && "يحفظ..."}
        {status === "saved" && "✓ محفوظ"}
        {status === "error" && "تعذّر الحفظ"}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Refactor `AwarenessMeter` to accept `userId` and use `useSaveAwarenessLog`**

Replace the entire `AwarenessMeter` function with:

```tsx
function AwarenessMeter({ day, userId }: { day: number; userId: string | null }) {
  const [selected, setSelected] = useState<AwarenessLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const saveMutation = useSaveAwarenessLog(userId);

  const handleSelect = async (level: AwarenessLevel) => {
    setSelected(level);
    if (!userId) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync({ day, level });
    } catch {
      // save silently fails — selection still shows
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">كيف كان مستوى وعيك اليوم؟</p>
      <div className="flex gap-3">
        {AWARENESS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={saving}
            className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs transition-all ${
              selected === opt.value
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            <span className="text-base">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

> Note: the `emoji` / `label` fields must match what `AWARENESS_OPTIONS` actually defines in the unmodified file. Do NOT rename those. If the original markup differs, preserve the original JSX structure and only change the save handler.

- [ ] **Step 5: Pass `userId` from the `DayExperience` parent**

Find where `DayExperience` renders `<ReflectionJournal>` and `<AwarenessMeter>`. The parent must:

1. Get the current user from Supabase (it already does for auto-save; centralize via `useState` + `useEffect`).
2. Pass `userId={userId}` to both components.

Add near the top of the `DayExperience` function body:

```tsx
const [userId, setUserId] = useState<string | null>(null);
useEffect(() => {
  let cancelled = false;
  supabase.auth.getSession().then(({ data }) => {
    if (!cancelled) setUserId(data.session?.user.id ?? null);
  });
  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    setUserId(session?.user.id ?? null);
  });
  return () => {
    cancelled = true;
    sub.subscription.unsubscribe();
  };
}, []);
```

Then update the JSX:
```tsx
<ReflectionJournal day={day} question={content.reflectionPrompt} userId={userId} />
<AwarenessMeter day={day} userId={userId} />
```

(Use the exact prop name for the reflection question as it already exists in the file — do not invent field names.)

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/DayExperience.tsx
git commit -m "refactor(day-experience): use TanStack Query mutations for reflections and awareness"
```

---

## Task 13: Create root `middleware.ts` (auth only)

**Files:**
- Create: `middleware.ts` (repo root, NOT `src/middleware.ts`)

- [ ] **Step 1: Write the middleware**

```ts
// middleware.ts
// Auth-only guard for protected routes. No journey logic, no entitlement.
// Journey routing stays client-side (localStorage lives in the browser).
// Entitlement stays in route handlers (HMAC needs the server-only secret).

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Matcher is the ONLY way to scope middleware. Keep it tight — do not add
  // public routes here.
  matcher: ["/program/:path*", "/account/:path*", "/admin/:path*"],
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds. Next.js will log `ƒ Middleware` in the route table.

- [ ] **Step 4: Manual smoke test (dev server)**

```bash
npm run dev
```

In another terminal, verify behavior:

```bash
# Public routes must still work (200):
curl -s -o /dev/null -w "%{http_code} /\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code} /pricing\n" http://localhost:3000/pricing
curl -s -o /dev/null -w "%{http_code} /book\n" http://localhost:3000/book
curl -s -o /dev/null -w "%{http_code} /auth\n" http://localhost:3000/auth

# Protected route with no session must 307-redirect to /auth:
curl -s -o /dev/null -w "%{http_code} /program\n" http://localhost:3000/program
```

Expected:
```
200 /
200 /pricing
200 /book
200 /auth
307 /program
```

Kill the dev server with Ctrl+C when done.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts
git commit -m "feat(middleware): add Supabase auth guard for protected routes"
```

---

## Task 14: Final verification — `guard:release`

**Files:** (none — verification only)

- [ ] **Step 1: Run the full release guard**

```bash
cd /Users/ziyadalziyadi/taamun-next
npm run guard:release
```

Expected: `brand + runtime + metadata + tsc + build` all pass. Exit code 0.

- [ ] **Step 2: If any guard fails**

Read the specific guard's error output, fix the underlying issue, re-run. Do not bypass guards.

- [ ] **Step 3: Announce completion**

Only after `guard:release` exits 0, declare the work done and remind Ziad of the manual steps:

1. Apply the DB migration (`supabase/migrations/2026-04-09_unique_user_day.sql`) in Supabase.
2. Push from Cursor: `git push`.
3. Deploy and verify in staging: protected routes redirect, reflections auto-save, awareness meter saves.

---

## Summary of commits (expected shape of history)

```
chore: checkpoint before tanstack-query install
chore: add @tanstack/react-query for data layer
feat(errors): add formatErrorAr for Arabic UI error strings
feat(journey): add progress module (single source for localStorage)
feat(journey): add resolveJourneyRoute + node smoke test
feat(queries): add QueryClient factory, key factory, and row mappers
feat(providers): mount QueryClientProvider in root layout
feat(queries): add useReflections and useSaveReflection
feat(queries): add useAwarenessLogs and useSaveAwarenessLog
feat(queries): add useProfile
feat(journey): add useJourneyState composition hook
db(migration): ensure UNIQUE(user_id,day) on reflections and awareness_logs
refactor(day-experience): use TanStack Query mutations for reflections and awareness
feat(middleware): add Supabase auth guard for protected routes
```
