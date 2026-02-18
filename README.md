# Taamun MVP (Ramadan 28-Day Program)

Next.js App Router + Supabase implementation for Taamun.

## Environment Variables

Set these in `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENTITLEMENT_SECRET=
```

## Database

Run Supabase migrations, including:

- `supabase/migrations/20260218090000_ramadan28_experience.sql`

This creates:

- `quran_ayahs`
- `ramadan_verses`
- `user_progress`
- `user_answers`
- `awareness_insights`
- `profiles` (with `role`)

## Key API Endpoints

### User (auth required via Supabase cookies)

- `GET /api/day/:dayId`
- `GET/POST /api/answers`
- `GET /api/progress`
- `POST /api/progress/complete`
- `GET /api/history`
- `GET/POST /api/awareness`

### Admin (auth required + `profiles.role = 'admin'`)

- `GET /api/admin/dashboard`
- `GET /api/admin/export` (CSV)
- `GET/POST /api/admin/activations`
- `GET /api/admin/activations/export`

## Local Run

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```
