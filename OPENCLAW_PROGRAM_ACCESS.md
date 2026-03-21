# OpenClaw Workspace Access (Merged)

This guide defines a safe OpenClaw scope for the currently deployed work:
- Ramadan program module
- City/Guide/Reflection/Journey/Journal experience

## 1) Access Scope

OpenClaw should be limited to these paths:

- `src/app/program/**`
- `src/app/api/program/**`
- `src/app/api/awareness-log/**`
- `src/app/api/awareness-tracker/**`
- `src/app/api/history/**`
- `src/app/api/reflections/**`
- `src/app/api/guide/**`
- `src/app/api/meaning-engine/**`
- `src/app/api/journey/**`
- `src/app/api/answers/**`
- `src/app/city/**`
- `src/app/guide/**`
- `src/app/journal/**`
- `src/app/journey/**`
- `src/app/reflection/**`
- `src/app/auth/**`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/program/**`
- `src/components/EntitlementGate.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/journey/**`
- `src/components/admin/**`
- `src/components/ui/**`
- `src/lib/appConfig.ts`
- `src/lib/routes.ts`
- `src/lib/progressStore.ts`
- `src/lib/whatsapp.ts`
- `src/lib/supabaseClient.ts`
- `src/lib/city-of-meaning.ts`
- `src/lib/rag.ts`
- `src/lib/season.ts`
- `supabase/migrations/20260226012000_progress_table.sql`
- `supabase/migrations/20260226013000_drop_legacy_user_progress.sql`
- `supabase/migrations/20260310000000_reflection_rag_analytics.sql`

## 2) Blocked Data

Never expose:

- `.env*`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any API keys or private credentials
- `.vercel/**`
- System/private files outside this project

## 3) Apply Restriction

1. Copy `cursorignore.template` to `.cursorignore` (or keep the generated `.cursorignore` in this repo).
2. Reopen OpenClaw session after adding `.cursorignore`.
3. Confirm OpenClaw can only read/edit files in the allowed scope.

## 4) Safe Prompt to Use

Use this exact prompt when starting OpenClaw:

> Work only on the allowed scope in `.cursorignore`.  
> Do not access files outside the allowed scope in `.cursorignore`.  
> Do not read or request secrets from `.env` files.  
> Do not change authentication or billing keys.
