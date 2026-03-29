# Subscription Expiry System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time-based subscription expiry so each tier has a defined duration (eid=30d, monthly=30d, yearly=365d, vip=365d), after which access is revoked automatically.

**Architecture:** Store `expires_at` timestamp in `profiles` table alongside existing `subscription_status`. On activation, calculate expiry from tier duration. All access-check points query `expires_at` and treat expired subscriptions as inactive. The entitlement cookie maxAge is aligned to actual tier duration. Account page shows remaining days.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (profiles table), existing HMAC entitlement system.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/subscriptionDurations.ts` | **Create** | Tier duration constants + `calcExpiresAt()` + `isSubscriptionExpired()` helpers |
| `src/app/api/activate/route.ts` | **Modify** | Write `expires_at` to profiles, align cookie maxAge to tier |
| `src/lib/entitlement.ts` | **Modify** | Add `expiresAt` to token payload, verify expiry in `verifyEntitlementToken()` |
| `src/app/book/page.tsx` | **Modify** | Add expiry check to access gate |
| `src/app/tasbeeh/page.tsx` | **Modify** | Add expiry check to access gate |
| `src/app/account/AccountClient.tsx` | **Modify** | Show remaining days + expiry date, show "جدّد اشتراكك" if expired |
| `src/app/pricing/PricingExperience.tsx` | **Modify** | Show duration per tier in the UI |

---

### Task 1: Create Subscription Duration Constants

**Files:**
- Create: `src/lib/subscriptionDurations.ts`

- [ ] **Step 1: Create the duration constants and helper functions**

```typescript
// src/lib/subscriptionDurations.ts

/** مدة كل باقة بالأيام */
export const TIER_DURATION_DAYS: Record<string, number> = {
  eid: 30,
  monthly: 30,
  yearly: 365,
  vip: 365,
};

/** احسب تاريخ الانتهاء بناءً على الباقة */
export function calcExpiresAt(tier: string, activatedAt?: Date): string {
  const base = activatedAt ?? new Date();
  const days = TIER_DURATION_DAYS[tier] ?? 30;
  const expires = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}

/** هل الاشتراك منتهي؟ */
export function isSubscriptionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/** كم يوم متبقي؟ */
export function daysRemaining(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** مدة الكوكي بالثواني حسب الباقة */
export function cookieMaxAge(tier: string): number {
  const days = TIER_DURATION_DAYS[tier] ?? 30;
  return days * 24 * 60 * 60;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: No new errors related to `subscriptionDurations.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/subscriptionDurations.ts
git commit -m "feat: add subscription duration constants and helpers"
```

---

### Task 2: Update Activation Route to Store `expires_at`

**Files:**
- Modify: `src/app/api/activate/route.ts` (lines 73-93)

- [ ] **Step 1: Add import for duration helpers**

At the top of `src/app/api/activate/route.ts`, add:

```typescript
import { calcExpiresAt, cookieMaxAge } from "@/lib/subscriptionDurations";
```

- [ ] **Step 2: Update profile upsert to include `expires_at`**

Replace lines 73-81 (the profile upsert block):

```typescript
  /* ── 5. حدّث profile المستخدم ── */
  const now = new Date();
  const expiresAt = calcExpiresAt(tier, now);

  await admin
    .from("profiles")
    .upsert({
      id: auth.user.id,
      subscription_status: "active",
      subscription_tier: tier,
      activated_at: now.toISOString(),
      expires_at: expiresAt,
    }, { onConflict: "id" });
```

- [ ] **Step 3: Update cookie maxAge to match tier duration**

Replace lines 83-93 (the entitlement token + cookie block):

```typescript
  /* ── 6. أنشئ entitlement token واكتبه في cookie ── */
  const token = makeEntitlementToken(auth.user.id, tier, expiresAt);

  const res = NextResponse.json({ ok: true, tier, expires_at: expiresAt });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge(tier),
  });

  return res;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: May show error about `makeEntitlementToken` signature — that's expected, fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/activate/route.ts
git commit -m "feat: store expires_at in profile and align cookie to tier duration"
```

---

### Task 3: Update Entitlement Token with Expiry

**Files:**
- Modify: `src/lib/entitlement.ts` (full file)

- [ ] **Step 1: Add import for expiry check**

At the top of `src/lib/entitlement.ts`, after the existing `createHmac` import, no new imports needed — we'll inline the check.

- [ ] **Step 2: Update `makeEntitlementToken` to accept and encode `expiresAt`**

Replace the existing `makeEntitlementToken` function (lines 18-27):

```typescript
/** أنشئ token مُشفّر للمستخدم — يتضمن تاريخ الانتهاء */
export function makeEntitlementToken(userId: string, tier: string, expiresAt?: string): string {
  const exp = expiresAt ?? "";
  const payload = `${userId}:${tier}:${Date.now()}:${exp}`;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const raw = `${payload}:${signature}`;
  return Buffer.from(raw).toString("base64");
}
```

- [ ] **Step 3: Update `verifyEntitlementToken` to check expiry**

Replace the existing `verifyEntitlementToken` function (lines 29-54):

```typescript
/** تحقّق من صلاحية الـ token — يرفض التوكن المنتهي */
export function verifyEntitlementToken(token: string): {
  valid: boolean;
  userId?: string;
  tier?: string;
  expiresAt?: string;
  expired?: boolean;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    // format: userId:tier:timestamp:expiresAt:signature
    if (parts.length < 5) {
      // Backward compat: old tokens without expiresAt (4 parts)
      if (parts.length === 4) {
        const [userId, tier, timestamp, signature] = parts;
        const payload = `${userId}:${tier}:${timestamp}`;
        const hmac = createHmac("sha256", getSecret());
        hmac.update(payload);
        const expected = hmac.digest("hex");
        if (signature !== expected) return { valid: false };
        // Old token without expiry — treat as expired to force re-login
        return { valid: false, expired: true };
      }
      return { valid: false };
    }

    const userId = parts[0];
    const tier = parts[1];
    const timestamp = parts[2];
    const expiresAt = parts[3];
    const signature = parts.slice(4).join(":");

    const payload = `${userId}:${tier}:${timestamp}:${expiresAt}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const expected = hmac.digest("hex");
    if (signature !== expected) return { valid: false };

    // Check expiry
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { valid: false, userId, tier, expiresAt, expired: true };
    }

    return { valid: true, userId, tier, expiresAt };
  } catch {
    return { valid: false };
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS — no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/entitlement.ts
git commit -m "feat: encode expiresAt in entitlement token and verify on decode"
```

---

### Task 4: Update Book Access Gate with Expiry Check

**Files:**
- Modify: `src/app/book/page.tsx` (lines 20-29)

- [ ] **Step 1: Read the current file to get exact context**

Read `src/app/book/page.tsx` fully before editing.

- [ ] **Step 2: Add expiry field to the profile query**

Find the `.select(...)` call on profiles and add `expires_at`:

Change:
```typescript
.select("book_access, role, subscription_tier, subscription_status")
```

To:
```typescript
.select("book_access, role, subscription_tier, subscription_status, expires_at")
```

- [ ] **Step 3: Update the access gate logic to check expiry**

Find the access check condition and update it. The current logic is:
```typescript
profile?.book_access === true ||
profile?.role === "admin" ||
(profile?.subscription_tier === "yearly" && profile?.subscription_status === "active")
```

Replace with:
```typescript
profile?.book_access === true ||
profile?.role === "admin" ||
(profile?.subscription_tier === "yearly" &&
 profile?.subscription_status === "active" &&
 profile?.expires_at &&
 new Date(profile.expires_at) > new Date())
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/book/page.tsx
git commit -m "feat: check expires_at in book access gate"
```

---

### Task 5: Update Tasbeeh Access Gate with Expiry Check

**Files:**
- Modify: `src/app/tasbeeh/page.tsx` (lines 29-38)

- [ ] **Step 1: Read the current file to get exact context**

Read `src/app/tasbeeh/page.tsx` fully before editing.

- [ ] **Step 2: Add expiry field to the profile query**

Find the `.select(...)` call on profiles and add `expires_at`:

Change:
```typescript
.select("tasbeeh_access, book_access, role, subscription_tier, subscription_status")
```

To:
```typescript
.select("tasbeeh_access, book_access, role, subscription_tier, subscription_status, expires_at")
```

- [ ] **Step 3: Update the access gate logic to check expiry**

Find the access check condition and update it. The current logic is:
```typescript
profile?.tasbeeh_access === true ||
profile?.role === "admin" ||
(profile?.subscription_tier === "yearly" && profile?.subscription_status === "active")
```

Replace with:
```typescript
profile?.tasbeeh_access === true ||
profile?.role === "admin" ||
(profile?.subscription_tier === "yearly" &&
 profile?.subscription_status === "active" &&
 profile?.expires_at &&
 new Date(profile.expires_at) > new Date())
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/tasbeeh/page.tsx
git commit -m "feat: check expires_at in tasbeeh access gate"
```

---

### Task 6: Update Account Page to Show Expiry Info

**Files:**
- Modify: `src/app/account/AccountClient.tsx` (lines 22-24, 34-41, 200-225)

- [ ] **Step 1: Add state for expiry data**

After line 23 (`const [planTier, setPlanTier] = ...`), add:

```typescript
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
```

- [ ] **Step 2: Add import for `daysRemaining` and `isSubscriptionExpired`**

At the top of the file, add:

```typescript
import { daysRemaining, isSubscriptionExpired } from "@/lib/subscriptionDurations";
```

- [ ] **Step 3: Update profile query to fetch `expires_at`**

Replace the profile query block (lines 35-41):

```typescript
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier, expires_at, subscription_status")
          .single();
        if (profile?.tier) {
          setPlanTier(profile.tier);
        }
        if (profile?.expires_at) {
          setExpiresAt(profile.expires_at);
        }
        // Override subscription status if expired
        if (profile?.subscription_status === "active" && isSubscriptionExpired(profile?.expires_at)) {
          setSubscriptionStatus("not-subscribed");
        }
```

- [ ] **Step 4: Update the Subscription Card section to show expiry**

Replace the Subscription Card section (lines 200-225) with:

```tsx
      {/* Subscription Card */}
      <div className="rounded-2xl border border-[#c9b88a]/15 bg-[#1d1b17] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">حالة الاشتراك</p>
            {subscriptionStatus === "subscribed" ? (
              <div>
                <p className="text-base font-medium text-[#c9b88a]">مشترك ✓</p>
                {planTier && (
                  <p className="text-xs text-white/50 mt-1">{tierLabel(planTier)}</p>
                )}
                {expiresAt && !isSubscriptionExpired(expiresAt) && (
                  <p className="text-xs text-white/40 mt-1">
                    متبقي {daysRemaining(expiresAt)} يوم — ينتهي {formatDate(expiresAt)}
                  </p>
                )}
                {expiresAt && daysRemaining(expiresAt) <= 7 && daysRemaining(expiresAt) > 0 && (
                  <p className="text-xs text-amber-400 mt-1">⚠ اشتراكك ينتهي قريباً</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-base font-medium text-white/50">
                  {expiresAt && isSubscriptionExpired(expiresAt) ? "انتهى الاشتراك" : "غير مشترك"}
                </p>
                {expiresAt && isSubscriptionExpired(expiresAt) && (
                  <p className="text-xs text-amber-400 mt-1">انتهى بتاريخ {formatDate(expiresAt)}</p>
                )}
              </div>
            )}
          </div>
          {subscriptionStatus !== "subscribed" && (
            <Link
              href={PRICING_ROUTE}
              className="rounded-lg bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#15130f] transition-colors hover:bg-[#dcc9a0]"
            >
              {expiresAt && isSubscriptionExpired(expiresAt) ? "جدّد اشتراكك" : "اشترك الآن"}
            </Link>
          )}
        </div>
      </div>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/account/AccountClient.tsx
git commit -m "feat: show subscription expiry info and renewal prompt in account page"
```

---

### Task 7: Show Duration Per Tier in Pricing Page

**Files:**
- Modify: `src/app/pricing/PricingExperience.tsx` (lines 18-53)

- [ ] **Step 1: Add duration to the `TierDef` type and tier data**

Replace the `TierDef` type and `TIERS` array (lines 7-53):

```typescript
/* ── الباقات ── */
type TierDef = {
  tierId: "eid" | "monthly" | "yearly" | "vip";
  name: string;
  price: string;
  period: string;
  duration: string;
  note: string;
  feats: string[];
  highlight?: boolean;
  badge?: string;
};

const TIERS: TierDef[] = [
  {
    tierId: "eid",
    name: "عيدية التمعّن",
    price: "28",
    period: "شهر واحد",
    duration: "٣٠ يوم",
    note: "عرض مرن للمبتدئين",
    badge: "محدود",
    feats: ["صفحة التأمل", "الدفتر الشخصي", "الوصول للمصادر"],
  },
  {
    tierId: "monthly",
    name: "شهري",
    price: "82",
    period: "شهريًا",
    duration: "٣٠ يوم",
    note: "الأكثر مرونة",
    feats: ["كل ميزات التمعّن", "المدينة التفاعلية", "المرشد الذكي", "تحليلات الرحلة"],
  },
  {
    tierId: "yearly",
    name: "سنوي",
    price: "820",
    period: "سنويًا",
    duration: "٣٦٥ يوم",
    note: "الأكثر توفيرًا",
    highlight: true,
    feats: ["كل ميزات الشهري", "توفير شهرين", "أولوية في الدعم"],
  },
  {
    tierId: "vip",
    name: "VIP",
    price: "8,200",
    period: "سنويًا",
    duration: "٣٦٥ يوم",
    note: "للجادين في رحلتهم",
    feats: ["كل ميزات السنوي", "جلسات تمعّن خاصة", "دعم مباشر ومخصص", "محتوى حصري"],
  },
];
```

- [ ] **Step 2: Show duration in the tier card**

In the tier card rendering (around line 186, after the period `<p>` tag), add:

```tsx
              <p className="text-[10px] text-white/40">المدة: {tier.duration}</p>
```

Find:
```tsx
              <p className="text-xs text-[#c9b88a]">{tier.period}</p>
```

Replace with:
```tsx
              <p className="text-xs text-[#c9b88a]">{tier.period}</p>
              <p className="text-[10px] text-white/40 mt-0.5">المدة: {tier.duration}</p>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/PricingExperience.tsx
git commit -m "feat: show subscription duration per tier on pricing page"
```

---

### Task 8: Add `expires_at` Column to Supabase Profiles Table

**Files:**
- No code file — SQL migration on Supabase dashboard

- [ ] **Step 1: Run SQL migration on Supabase**

Go to Supabase Dashboard → SQL Editor → Run:

```sql
-- إضافة عمود تاريخ انتهاء الاشتراك
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- تحديث الاشتراكات الحالية (اللي ما عندها تاريخ انتهاء) — منحها 365 يوم من تاريخ التفعيل
UPDATE profiles
SET expires_at = activated_at::timestamptz + INTERVAL '365 days'
WHERE subscription_status = 'active'
  AND expires_at IS NULL
  AND activated_at IS NOT NULL;

-- فهرس للبحث عن الاشتراكات المنتهية
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles (expires_at)
WHERE subscription_status = 'active';
```

- [ ] **Step 2: Verify the column exists**

Run in SQL Editor:
```sql
SELECT id, subscription_tier, subscription_status, activated_at, expires_at
FROM profiles
WHERE subscription_status = 'active'
LIMIT 5;
```
Expected: Rows show `expires_at` populated.

- [ ] **Step 3: Document the migration**

No commit needed — this is a Supabase-side change.

---

### Task 9: Final Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npx tsc --noEmit`
Expected: PASS — zero errors

- [ ] **Step 2: Run build**

Run: `cd /Users/ziyadalziyadi/Projects/taamun-mvp && npm run build`
Expected: Build completes successfully

- [ ] **Step 3: Manual test checklist**

1. Open `/pricing` — verify each tier shows duration (٣٠ يوم / ٣٦٥ يوم)
2. Activate a test code — verify `expires_at` is set in Supabase profiles
3. Open `/account` — verify remaining days and expiry date show
4. Manually set `expires_at` to past date in Supabase → verify `/book` shows Paywall
5. Manually set `expires_at` to past date → verify `/account` shows "انتهى الاشتراك" + "جدّد اشتراكك"

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete subscription expiry system — all tiers have defined durations"
```
