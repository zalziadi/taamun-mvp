# أوامر للسب ايجنت — نظام التفعيل + مسار الدفع المباشر

نفّذ هذه الأوامر بالترتيب. لا تضف مكتبات جديدة. لا تعدّل ملفات أخرى.

---

## 1. تحديث APP_DOMAIN في appConfig.ts

في ملف `src/lib/appConfig.ts`، غيّر السطر:
```
export const APP_DOMAIN = "https://taamun-mvp.vercel.app" as const;
```
إلى:
```
export const APP_DOMAIN = "https://www.taamun.com" as const;
```

---

## 2. إنشاء ملف جديد: `src/lib/entitlement.ts`

أنشئ الملف `src/lib/entitlement.ts` بالمحتوى التالي بالكامل:

```typescript
/**
 * نظام الـ Entitlement — HMAC-SHA256
 *
 * - الرمز: HMAC-SHA256 مُشفّر، يُخزَّن في cookie باسم `taamun_entitled`
 * - السر: متغير بيئة `ENTITLEMENT_SECRET` (مطلوب على الخادم)
 * - أنواع الأكواد: باقة 280 (TAAMUN-XXX) أو باقة 820 (TAAMUN-820-XXX)
 */
import { createHmac } from "crypto";

const COOKIE_NAME = "taamun_entitled";

function getSecret(): string {
  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret) throw new Error("ENTITLEMENT_SECRET is not set");
  return secret;
}

/** أنشئ token مُشفّر للمستخدم */
export function makeEntitlementToken(userId: string, tier: string): string {
  const payload = `${userId}:${tier}:${Date.now()}`;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  // token = base64(payload:signature)
  const raw = `${payload}:${signature}`;
  return Buffer.from(raw).toString("base64");
}

/** تحقّق من صلاحية الـ token */
export function verifyEntitlementToken(token: string): {
  valid: boolean;
  userId?: string;
  tier?: string;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 4) return { valid: false };
    const [userId, tier, timestamp, signature] = [
      parts[0],
      parts[1],
      parts[2],
      parts.slice(3).join(":"),
    ];
    const payload = `${userId}:${tier}:${timestamp}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const expected = hmac.digest("hex");
    if (signature !== expected) return { valid: false };
    return { valid: true, userId, tier };
  } catch {
    return { valid: false };
  }
}

/** اسم الكوكي */
export { COOKIE_NAME };
```

---

## 3. إنشاء ملف جديد: `src/app/api/activate/route.ts`

أنشئ المجلد `src/app/api/activate/` ثم أنشئ الملف `route.ts` بالمحتوى التالي:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { makeEntitlementToken, COOKIE_NAME } from "@/lib/entitlement";

/**
 * POST /api/activate
 * يستقبل { code: "TAAMUN-XXXX" }
 * يتحقق من الكود في جدول `activation_codes` على Supabase
 * إذا صالح: يكتب entitlement cookie ويحدّث الكود كـ used
 */
export async function POST(req: NextRequest) {
  /* ── 1. تحقق من تسجيل الدخول ── */
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  /* ── 2. قراءة الكود ── */
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "الكود مطلوب." }, { status: 400 });
  }

  /* ── 3. التحقق من الكود في Supabase ── */
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "server_misconfig" }, { status: 500 });
  }

  const { data: codeRow, error: codeError } = await admin
    .from("activation_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (codeError) {
    console.error("[activate] DB error:", codeError.message);
    return NextResponse.json({ ok: false, error: "خطأ في الخادم." }, { status: 500 });
  }

  if (!codeRow) {
    return NextResponse.json({ ok: false, error: "الكود غير صالح." }, { status: 404 });
  }

  if (codeRow.used_by) {
    return NextResponse.json({ ok: false, error: "هذا الكود مستخدم مسبقاً." }, { status: 409 });
  }

  /* ── 4. حدّث الكود كـ used ── */
  const tier = codeRow.tier || "monthly";
  const { error: updateError } = await admin
    .from("activation_codes")
    .update({
      used_by: auth.user.id,
      used_at: new Date().toISOString(),
      used_email: auth.user.email,
    })
    .eq("id", codeRow.id);

  if (updateError) {
    console.error("[activate] Update error:", updateError.message);
    return NextResponse.json({ ok: false, error: "خطأ في التفعيل." }, { status: 500 });
  }

  /* ── 5. حدّث profile المستخدم ── */
  await admin
    .from("profiles")
    .upsert({
      id: auth.user.id,
      subscription_status: "active",
      subscription_tier: tier,
      activated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  /* ── 6. أنشئ entitlement token واكتبه في cookie ── */
  const token = makeEntitlementToken(auth.user.id, tier);

  const res = NextResponse.json({ ok: true, tier });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // سنة
  });

  return res;
}
```

---

## 4. استبدال كامل ملف `src/app/pricing/PricingExperience.tsx`

استبدل محتوى الملف بالكامل بالمحتوى التالي:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── الباقات ── */
type TierDef = {
  tierId: "eid" | "monthly" | "yearly" | "vip";
  name: string;
  price: string;
  period: string;
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
    note: "عرض مرن للمبتدئين",
    badge: "محدود",
    feats: ["صفحة التأمل", "الدفتر الشخصي", "الوصول للمصادر"],
  },
  {
    tierId: "monthly",
    name: "شهري",
    price: "82",
    period: "شهريًا",
    note: "الأكثر مرونة",
    feats: ["كل ميزات التمعّن", "المدينة التفاعلية", "المرشد الذكي", "تحليلات الرحلة"],
  },
  {
    tierId: "yearly",
    name: "سنوي",
    price: "820",
    period: "سنويًا",
    note: "الأكثر توفيرًا",
    highlight: true,
    feats: ["كل ميزات الشهري", "توفير شهرين", "أولوية في الدعم"],
  },
  {
    tierId: "vip",
    name: "VIP",
    price: "8,200",
    period: "سنويًا",
    note: "للجادين في رحلتهم",
    feats: ["كل ميزات السنوي", "جلسات تمعّن خاصة", "دعم مباشر ومخصص", "محتوى حصري"],
  },
];

/* ── مكوّن تفعيل الكود ── */
function ActivateCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleActivate() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: "تم التفعيل بنجاح! جاري التوجيه..." });
        setTimeout(() => router.push("/program"), 1500);
      } else if (res.status === 401) {
        setMsg({ ok: false, text: "يجب تسجيل الدخول أولاً." });
        setTimeout(() => router.push("/auth?next=/pricing"), 1500);
      } else {
        setMsg({ ok: false, text: data.error || "الكود غير صالح. تأكد من الكود وحاول مرة أخرى." });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم. حاول لاحقًا." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          dir="ltr"
          placeholder="TAAMUN-XXXX"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleActivate()}
          className="flex-1 rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-center font-mono text-base tracking-widest text-[#e8e1d9] placeholder:text-white/25 focus:border-[#c9b88a]/50 focus:outline-none"
        />
        <button
          type="button"
          disabled={loading || !code.trim()}
          onClick={handleActivate}
          className="rounded-xl bg-[#c9b88a] px-6 py-3 text-sm font-bold text-[#15130f] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "جاري..." : "تفعيل"}
        </button>
      </div>
      {msg && (
        <p className={`text-center text-sm ${msg.ok ? "text-emerald-400" : "text-amber-400"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

/* ── مكوّن نسخ النص ── */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-[#c9b88a]/30 hover:text-[#c9b88a]"
    >
      <span dir="ltr" className="font-mono">{label}</span>
      <span className="text-[10px]">{copied ? "✓ تم النسخ" : "نسخ"}</span>
    </button>
  );
}

/* ── الصفحة الرئيسية ── */
export default function PricingExperience() {
  const router = useRouter();

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-6xl space-y-8">

        {/* ── العنوان ── */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-7 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-[#c9b88a]">PRICING</p>
          <h2 className="mt-2 font-[var(--font-amiri)] text-4xl text-[#e8e1d9]">الأسعار والاشتراك</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[#e8e1d9]/85">
            اختر الباقة المناسبة — حوّل المبلغ عبر التحويل البنكي أو STC Pay — ثم أدخل كود التفعيل الذي سيصلك.
          </p>
        </section>

        {/* ── الباقات ── */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <article
              key={tier.tierId}
              className={`relative rounded-3xl border p-6 ${
                tier.highlight
                  ? "border-[#c9b88a]/40 bg-[#2b2824]"
                  : "border-white/10 bg-[#2b2824]"
              }`}
            >
              {tier.badge && (
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#1c1a15] px-2.5 py-0.5 text-[10px] font-semibold text-[#c9b88a]">
                  {tier.badge}
                </span>
              )}
              {tier.highlight && (
                <span className="absolute left-4 top-4 rounded-full bg-[#c9b88a] px-2.5 py-0.5 text-[10px] font-bold text-[#15130f]">
                  موصى به
                </span>
              )}
              <h3 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9]">{tier.name}</h3>
              <p className="mt-1 text-xs text-[#c9b88a]">{tier.note}</p>
              <p className="mt-4 text-3xl font-bold text-[#e8e1d9]">
                {tier.price} <span className="text-base font-normal">ر.س</span>
              </p>
              <p className="text-xs text-[#c9b88a]">{tier.period}</p>
              <ul className="mt-5 space-y-2 text-sm text-[#e8e1d9]/85">
                {tier.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e6d4a4]" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {/* ── طرق الدفع ── */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-7 sm:p-8">
          <h3 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9]">طرق الدفع</h3>
          <p className="mt-2 text-sm text-[#e8e1d9]/70">
            حوّل مبلغ الباقة المختارة عبر أي من الطرق التالية، ثم تواصل معنا لاستلام كود التفعيل.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* التحويل البنكي */}
            <div className="rounded-2xl border border-white/10 bg-[#1c1a15] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9b88a]/10 text-lg">🏦</span>
                <div>
                  <h4 className="text-sm font-bold text-[#e8e1d9]">تحويل بنكي</h4>
                  <p className="text-[11px] text-[#c9b88a]">STC Bank</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-white/40">اسم المستفيد</p>
                  <p className="mt-0.5 text-sm text-[#e8e1d9]">زياد ابراهيم سعيد الزيادي</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">رقم الحساب</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p dir="ltr" className="font-mono text-sm text-[#e8e1d9]">1289471738</p>
                    <CopyButton text="1289471738" label="1289471738" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">رقم الآيبان (IBAN)</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p dir="ltr" className="font-mono text-xs text-[#e8e1d9]">SA827800...1738</p>
                    <CopyButton text="SA8278000000001289471738" label="IBAN" />
                  </div>
                </div>
              </div>
            </div>

            {/* STC Pay */}
            <div className="rounded-2xl border border-white/10 bg-[#1c1a15] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9b88a]/10 text-lg">📱</span>
                <div>
                  <h4 className="text-sm font-bold text-[#e8e1d9]">STC Pay</h4>
                  <p className="text-[11px] text-[#c9b88a]">تحويل فوري</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-white/40">رقم STC Pay</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p dir="ltr" className="font-mono text-lg font-semibold text-[#e8e1d9]">+966553930885</p>
                    <CopyButton text="+966553930885" label="الرقم" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">اسم المستفيد</p>
                  <p className="mt-0.5 text-sm text-[#e8e1d9]">زياد ابراهيم سعيد الزيادي</p>
                </div>
              </div>
            </div>
          </div>

          {/* تعليمات */}
          <div className="mt-5 rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/5 p-4">
            <p className="text-sm font-semibold text-[#c9b88a]">بعد التحويل:</p>
            <p className="mt-1 text-sm leading-relaxed text-[#e8e1d9]/70">
              أرسل إيصال التحويل على واتساب{" "}
              <a
                href="https://wa.me/966553930885?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%AD%D9%88%D9%91%D9%84%D8%AA%20%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D8%AA%D9%85%D8%B9%D9%91%D9%86"
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-block font-mono text-[#c9b88a] underline underline-offset-2"
              >
                +966553930885
              </a>
              {" "}وسنرسل لك كود التفعيل خلال دقائق.
            </p>
          </div>
        </section>

        {/* ── تفعيل الكود ── */}
        <section className="rounded-3xl border border-[#c9b88a]/25 bg-[#2b2824] p-7 sm:p-8">
          <h3 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9]">عندك كود تفعيل؟</h3>
          <p className="mt-2 mb-5 text-sm text-[#e8e1d9]/70">
            أدخل الكود الذي وصلك بعد التحويل لتفعيل اشتراكك فوراً.
          </p>
          <ActivateCode />
          <p className="mt-4 text-center text-[10px] text-[#e8e1d9]/40">
            يتطلب تسجيل الدخول.{" "}
            <button
              type="button"
              onClick={() => router.push("/auth?next=/pricing")}
              className="underline underline-offset-2 hover:text-[#c9b88a]"
            >
              لست مسجّلًا؟ سجّل الدخول
            </button>
          </p>
        </section>

      </div>
    </div>
  );
}
```

---

## 5. استبدال كامل ملف `src/app/pricing/page.tsx`

استبدل محتوى الملف بالكامل:

```tsx
import type { Metadata } from "next";
import PricingExperience from "./PricingExperience";

export const metadata: Metadata = {
  title: "الأسعار",
  description: "باقات اشتراك تمَعُّن.",
};

export default function PricingPage() {
  return <PricingExperience />;
}
```

---

## 6. بعد تطبيق كل التغييرات، نفّذ:

```bash
npx tsc --noEmit
git add src/lib/appConfig.ts src/lib/entitlement.ts src/app/api/activate/route.ts src/app/pricing/PricingExperience.tsx src/app/pricing/page.tsx
git commit -m "feat: add activation code system + direct payment flow + taamun.com domain"
git push origin main
```

---

## ملاحظات مهمة:
- لا تضف مكتبات جديدة (`npm install` ممنوع)
- لا تعدّل ملفات أخرى غير المذكورة
- الملفات الجديدة: `src/lib/entitlement.ts` و `src/app/api/activate/route.ts`
- الملفات المعدّلة: `src/lib/appConfig.ts` و `src/app/pricing/PricingExperience.tsx` و `src/app/pricing/page.tsx`
- جدول `activation_codes` أُنشئ مسبقاً على Supabase
- `ENTITLEMENT_SECRET` و `NEXT_PUBLIC_APP_ORIGIN` مُعدّة على Vercel
