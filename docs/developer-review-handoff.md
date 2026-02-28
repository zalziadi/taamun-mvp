# Taamun MVP - Developer Review Handoff

## Working Links

- Local app: `http://localhost:3000`
- Deployed app: `https://taamun-mvp.vercel.app`

## Scope Implemented (No UI identity change)

- Added cart and checkout flow without changing project visual identity.
- Kept existing subscribe/activation journey and added integration-only behavior.
- Added Stripe-based checkout backend flow and secure webhook handling.

## New Database Migration

- `supabase/migrations/20260228123000_cart_checkout.sql`
  - Adds:
    - `cart_items`
    - `orders`
    - `order_items`
  - Adds RLS policies for owner-only access.

## New Backend Files

- `src/lib/cart-catalog.ts`
- `src/lib/stripeServer.ts`
- `src/app/api/cart/route.ts`
- `src/app/api/checkout/session/route.ts`
- `src/app/api/checkout/confirm/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

## New Frontend Pages

- `src/app/cart/page.tsx`
- `src/app/checkout/success/page.tsx`

## Updated Existing Page

- `src/app/subscribe/page.tsx`
  - Added:
    - "أضف إلى السلة"
    - "عرض السلة"
  - Kept existing WhatsApp subscribe fallback.

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `ENTITLEMENT_SECRET`

## Verification Status

- Build: `npm run build` passes.
- Lint: passes with existing project warnings (no new blocking errors).
- API smoke checks:
  - Protected endpoints return `401` when unauthenticated (expected).
  - Stripe webhook returns `400` without signature (expected).

## Remaining Setup for Full Payment E2E

1. Apply Supabase migration.
2. Configure Stripe keys and webhook secret in environment.
3. Point Stripe webhook to:
   - `/api/webhooks/stripe`
4. Run end-to-end payment test with Stripe test cards.
