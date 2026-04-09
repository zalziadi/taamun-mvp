# TanStack Query + Middleware + Journey Layer

**Date:** 2026-04-09
**Project:** taamun-next (تمعّن)
**Status:** Design approved — ready for implementation plan

## Goal

Add a disciplined data layer (TanStack Query), a route guard layer (`middleware.ts`), and a journey layer (`src/lib/journey/`) to `taamun-next` without violating the project's NON-NEGOTIABLE rules in `CLAUDE.md` — specifically:

- Rule #5: LocalStorage only for progress (`taamun.progress.v1`)
- Rule #6: No new libraries without explicit permission

Zustand is explicitly **rejected** for this iteration. The only new dependency is `@tanstack/react-query`.

## Non-Goals (Out of Scope)

- Zustand or any other global state library
- Optimistic updates (can be added later per hook if needed)
- SSR prefetching of queries
- Entitlement logic in `middleware.ts` (stays in route handlers because HMAC requires server-only secret)
- Journey routing in `middleware.ts` (client-side only, because progress lives in `localStorage`)
- PostHog changes (already integrated)
- AI layer

## Architecture

### Layer Boundaries

```
┌─────────────────────────────────────────────────────┐
│  UI (React Components)                              │
├─────────────────────────────────────────────────────┤
│  Navigation Layer: src/lib/journey/                  │
│  (resolveJourneyRoute + useJourneyState)             │
├─────────────────────┬───────────────────────────────┤
│  State Layer        │  Data Layer                    │
│  localStorage       │  TanStack Query                │
│  taamun.progress.v1 │  ↕                             │
│  (Client only)      │  Supabase (@supabase/ssr)      │
├─────────────────────┴───────────────────────────────┤
│  Guard Layer: middleware.ts (auth) + authz.ts       │
└──────────────────────────────────────────────────────┘
```

### Strict rules

- **TanStack Query may READ progress** (for UI decisions like visibility/enabled) but **never write to or cache progress**.
- **localStorage may NEVER store server data** (no reflections, no awareness_logs).
- All access to `localStorage['taamun.progress.v1']` goes through a single module: `src/lib/journey/progress.ts`. Any file currently accessing it directly gets migrated.
- One `QueryClient` singleton, mounted in `src/app/providers.tsx` as a Client Component wrapping `{children}` in `layout.tsx`. Server Components remain untouched.

## Data Layer — `src/lib/queries/`

### Structure

```
src/lib/queries/
├── queryClient.ts      # makeQueryClient() with defaults
├── keys.ts             # type-safe query key factory
├── mappers.ts          # DB row → UI shape mappers
├── useReflections.ts   # read + useSaveReflection
├── useAwarenessLogs.ts # read + useSaveAwarenessLog
├── useProfile.ts       # current user profile
└── useAdminUsers.ts    # admin-only list
```

### QueryClient defaults

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false, // intentional: calm/meditative UX
    },
    mutations: { retry: 0 },
  },
})
```

`refetchOnWindowFocus: false` is an intentional product decision — the app is a meditative reading experience and aggressive refetching breaks the quiet tone.

### Hook contract

Every query hook in `src/lib/queries/`:

1. Uses `keys.ts` — no string-literal query keys anywhere in the codebase.
2. Takes `userId: string | null` as an explicit argument. Never reads user from hidden context.
3. Sets `enabled: !!userId`. If `userId` is null, the hook does not construct a key — the `enabled` flag short-circuits the fetch. **No `'anon'` fallback key.**
4. Pipes the returned rows through `mappers.ts` before returning. The UI never touches raw DB shapes.
5. Throws Supabase errors raw; the UI renders Arabic strings via `src/lib/errors.ts` (new small file).

### Mutation contract

- Every mutation calls `queryClient.invalidateQueries({ queryKey: qk.<resource>(userId) })` in `onSuccess`.
- No manual cache edits except in explicit optimistic-update hooks (none in v1).
- `upsert` with `onConflict: 'user_id,day'` requires a `UNIQUE (user_id, day)` constraint in the DB. Verify before relying on it; add a migration if missing.

### Keys factory (example)

```ts
// src/lib/queries/keys.ts
export const qk = {
  reflections: (userId: string) => ['reflections', userId] as const,
  awarenessLogs: (userId: string, day?: number) =>
    ['awareness_logs', userId, day] as const,
  profile: (userId: string) => ['profile', userId] as const,
  adminUsers: () => ['admin', 'users'] as const,
}
```

### Providers mount

New file `src/app/providers.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { makeQueryClient } from '@/lib/queries/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

`src/app/layout.tsx` is edited to wrap `{children}` in `<Providers>`. That is the only change to the root layout.

## Guard Layer — `middleware.ts`

New file at the project root. Single responsibility: **auth only**.

- Reads Supabase session from cookies via `@supabase/ssr`.
- Protects `/program/*`, `/account/*`, `/admin/*`.
- On missing session, redirects to `/auth?next=<original>`.
- Does **not** read `currentDay` or any progress field.
- Does **not** verify entitlement — entitlement stays in route handlers because HMAC requires the server-only `ENTITLEMENT_SECRET`.
- `/admin` still requires a role check via the existing `authz.ts.requireAdmin()` inside the route handler; middleware only ensures the user is logged in.

```ts
export const config = {
  matcher: ['/program/:path*', '/account/:path*', '/admin/:path*'],
}
```

## Navigation Layer — `src/lib/journey/`

### Structure

```
src/lib/journey/
├── progress.ts            # single source of truth for taamun.progress.v1
├── resolveJourneyRoute.ts # pure function: Progress → JourneyRoute
├── useJourneyState.ts     # composition hook: progress + queries
└── types.ts               # JourneyState, JourneyRoute
```

### `progress.ts`

- Exports `readProgress()`, `writeProgress(partial)`, and the `Progress` type.
- Handles SSR (`typeof window === 'undefined'` → returns empty state).
- Handles JSON corruption (try/catch → returns empty state).
- Dispatches a `CustomEvent('taamun:progress-changed')` on every write so hooks can subscribe without polling.
- **This module is the ONLY place that touches `localStorage['taamun.progress.v1']`.** All other files in the repo that currently read/write that key must be migrated.

### `resolveJourneyRoute.ts`

Pure function — no I/O, no side effects, trivially unit-testable:

```ts
export type JourneyRoute =
  | { kind: 'welcome' }
  | { kind: 'day'; day: number }
  | { kind: 'completed' }

export function resolveJourneyRoute(p: Progress): JourneyRoute {
  if (p.currentDay < 1) return { kind: 'welcome' }
  if (p.currentDay > 28) return { kind: 'completed' }
  return { kind: 'day', day: p.currentDay }
}
```

### `useJourneyState.ts` — composition hook

The single hook the `/program` and `/day` pages use:

```ts
export function useJourneyState(userId: string | null) {
  const [progress, setProgress] = useState(readProgress)
  useEffect(() => {
    const h = () => setProgress(readProgress())
    window.addEventListener('taamun:progress-changed', h)
    return () => window.removeEventListener('taamun:progress-changed', h)
  }, [])

  const reflections = useReflections(userId)
  const awareness = useAwarenessLogs(userId)
  const route = useMemo(() => resolveJourneyRoute(progress), [progress])

  return {
    progress,
    route,
    reflections,
    awareness,
    isLoading: reflections.isLoading || awareness.isLoading,
  }
}
```

This is the only hook that composes progress + server data. No other component should call `useReflections` and `readProgress` directly; they use `useJourneyState` instead.

### Client gate in `/program`

```tsx
const { route } = useJourneyState(user.id)
useEffect(() => {
  if (route.kind === 'day') router.replace(`/day?n=${route.day}`)
  if (route.kind === 'completed') router.replace('/progress')
}, [route])
```

Journey routing is client-side by necessity: `localStorage` is not available in middleware, and progress is local per rule #5.

## DayExperience integration

`src/components/DayExperience.tsx` currently saves to `reflections` and `awareness_logs` via direct Supabase calls. Replace the direct calls with `useSaveReflection` and `useSaveAwarenessLog`. Auto-save behavior is preserved — it just runs through mutations with automatic retry and invalidation.

## Implementation order

1. `src/lib/journey/progress.ts` + migrate every direct `localStorage['taamun.progress.v1']` access in the repo to use it.
2. `src/lib/queries/queryClient.ts` + `keys.ts` + `mappers.ts` + `src/lib/errors.ts`.
3. `src/app/providers.tsx` + edit `src/app/layout.tsx` to wrap `{children}`.
4. `src/lib/queries/useReflections.ts` + `useAwarenessLogs.ts` + `useProfile.ts`.
5. DB migration: add `UNIQUE (user_id, day)` on `reflections` and `awareness_logs` if missing.
6. `src/lib/journey/resolveJourneyRoute.ts` + `useJourneyState.ts` + `types.ts`.
7. Update `DayExperience.tsx` to use the new mutations.
8. Add root `middleware.ts` — test carefully against `/program`, `/account`, `/admin`, and public routes before enabling.
9. Update `src/app/program/page.tsx` with the client-side journey gate.
10. `npx tsc --noEmit && npm run build && npm run guard:release` (mandatory per `CLAUDE.md`).

## Dependency change

- Add: `@tanstack/react-query` (latest v5)
- No other libraries. Explicit permission granted in the brainstorming session on 2026-04-09.

## Risks and mitigations

- **Risk:** Duplicated localStorage access across the repo gets missed during migration. **Mitigation:** grep for `taamun.progress.v1` before and after; CI guard can be added later.
- **Risk:** Missing `UNIQUE (user_id, day)` makes `upsert` behave unexpectedly. **Mitigation:** verify constraint in migration step 5 before shipping.
- **Risk:** `middleware.ts` accidentally breaks public routes. **Mitigation:** strict matcher, manual test against `/`, `/pricing`, `/book`, `/auth` before release.
- **Risk:** `QueryClient` created per render. **Mitigation:** `useState(() => makeQueryClient())` pattern in `Providers`.

## Verification

Before declaring done:

```bash
npx tsc --noEmit
npm run build
npm run guard:release
```

Manual smoke test:
- Public routes still load: `/`, `/pricing`, `/book`, `/auth`
- Unauthenticated access to `/program` redirects to `/auth?next=/program`
- Authenticated user with `currentDay=3` lands on `/day?n=3`
- Reflection auto-save still works, survives refresh
- Awareness meter still writes correctly
