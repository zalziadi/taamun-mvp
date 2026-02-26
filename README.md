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
SALLA_CLIENT_ID=
SALLA_CLIENT_SECRET=
SALLA_REDIRECT_URI=
SALLA_STATE_SECRET=
SALLA_WEBHOOK_SECRET=
# Optional overrides:
# SALLA_OAUTH_AUTH_URL=https://accounts.salla.sa/oauth2/auth
# SALLA_OAUTH_TOKEN_URL=https://accounts.salla.sa/oauth2/token
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

## Salla Integration

This project now includes basic Salla integration endpoints:

- `GET /api/salla/oauth/start` (admin only): starts OAuth connect flow.
- `GET /api/salla/oauth/callback`: receives OAuth callback and stores token data.
- `POST /api/salla/webhook`: verifies webhook signature and activates entitlement when payment is marked as paid.

### Salla dashboard setup

1. Set OAuth redirect URL to: `https://<your-domain>/api/salla/oauth/callback`
2. Set webhook URL to: `https://<your-domain>/api/salla/webhook`
3. Use webhook secret from Salla in `SALLA_WEBHOOK_SECRET`.

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
