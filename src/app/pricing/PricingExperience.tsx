"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SESSION_KEY = "taamun_pricing_eid_welcome_v1";

type TierDef = {
  tierId: "basic" | "full" | "support";
  name: string;
  price: string;
  note: string;
  feats: string[];
  highlight?: boolean;
  /** If false, no Stripe price — show contact CTA */
  stripe: boolean;
};

const TIERS: TierDef[] = [
  {
    tierId: "basic",
    name: "أساسي",
    price: "—",
    note: "مناسب للبداية",
    feats: ["الوصول لصفحة التأمل", "الدفتر الشخصي", "مصادر القرآن"],
    stripe: true,
  },
  {
    tierId: "full",
    name: "كامل",
    price: "—",
    note: "الأكثر طلبًا",
    feats: ["كل ميزات الأساسي", "المدينة التفاعلية", "المرشد الذكي", "تحليلات الرحلة"],
    highlight: true,
    stripe: true,
  },
  {
    tierId: "support",
    name: "دعم خاص",
    price: "تواصل",
    note: "للجهات والمجموعات",
    feats: ["تنسيق محتوى مخصص", "دعم فني مباشر", "تفعيل جماعي"],
    stripe: false,
  },
];

function SubscribeButton({
  tierId,
  highlight,
}: {
  tierId: "basic" | "full";
  highlight?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (!res.ok || !data.ok || !data.url) {
        const d = data as {
          error?: string;
          provider?: string;
          hint?: string;
        };
        if (d.error === "tap_not_configured" || d.error === "tap_amounts_missing") {
          setErr(
            "الدفع عبر Tap غير مكتمل: أضف في Vercel → Environment Variables القيم TAP_SECRET_KEY وTAP_AMOUNT_BASIC وTAP_AMOUNT_FULL (ومثلاً TAP_CURRENCY=SAR)."
          );
        } else if (d.error === "tap_checkout_failed") {
          setErr("تعذر بدء الدفع عبر Tap. راجع مفتاح Tap والمبالغ وTAP_CUSTOMER_PHONE في إعدادات الخادم.");
        } else if (d.error === "price_not_configured" || d.error === "stripe_not_configured") {
          setErr(
            "الدفع عبر Stripe غير مهيأ: أضف STRIPE_SECRET_KEY وSTRIPE_PRICE_BASIC وSTRIPE_PRICE_FULL في Vercel. أو استخدم Tap بضبط PAYMENT_PROVIDER=tap والمتغيرات أعلاه."
          );
        } else {
          setErr("تعذر بدء الدفع. حاول لاحقًا.");
        }
        return;
      }
      window.location.href = data.url;
    } catch {
      setErr("تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void startCheckout()}
        className={
          highlight
            ? "w-full cursor-pointer rounded-xl bg-[#7b694a] py-3 text-center text-sm font-bold text-[#f4f1ea] shadow-sm transition duration-200 hover:bg-[#6d5e44] disabled:opacity-60"
            : "w-full cursor-pointer rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] py-3 text-center text-sm font-semibold text-[#4e4637] transition duration-200 hover:border-[#8c7851]/40 disabled:opacity-60"
        }
      >
        {loading ? "جاري التوجيه لصفحة الدفع الآمنة…" : "ادفع والاشتراك"}
      </button>
      {err ? <p className="text-center text-xs text-[#9b5548]">{err}</p> : null}
      <p className="text-center text-[10px] text-[#a09480]">
        يتطلب تسجيل الدخول. الدفع يتم عبر Tap أو Stripe حسب إعداد الخادم (انظر docs/PAYMENTS.md).
      </p>
    </div>
  );
}

export default function PricingExperience({ forceEidWelcome = false }: { forceEidWelcome?: boolean }) {
  const router = useRouter();
  const [showEid, setShowEid] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (forceEidWelcome) {
      setShowEid(true);
      return;
    }
    try {
      const skip = typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
      setShowEid(!skip);
    } catch {
      setShowEid(true);
    }
  }, [forceEidWelcome]);

  function dismissEid() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowEid(false);
  }

  if (!mounted) {
    return (
      <div className="tm-shell flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[#7d7362]">جارٍ التحميل...</p>
      </div>
    );
  }

  const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL ?? "";

  return (
    <>
      {showEid ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f1a12]/45 p-4 backdrop-blur-[6px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eid-title"
          aria-describedby="eid-desc"
        >
          <div className="tm-card relative max-w-lg overflow-hidden p-8 text-center shadow-[0_24px_80px_rgba(47,38,25,0.25)]">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#cdb98f]/25 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#8c7851]/15 blur-2xl"
              aria-hidden
            />

            <div className="relative mx-auto mb-5 flex justify-center text-[#8c7851]" aria-hidden>
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className="opacity-90">
                <path
                  d="M48 12c-8 0-14 6-14 14 0 7 5 13 12 14-1 8-8 14-16 14-9 0-16-7-16-16 0-10 8-18 18-18 6 0 11 2 16 6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="22" cy="24" r="1.2" fill="currentColor" />
                <circle cx="28" cy="18" r="0.9" fill="currentColor" />
                <circle cx="50" cy="38" r="0.9" fill="currentColor" />
              </svg>
            </div>

            <p className="tm-mono text-xs tracking-[0.2em] text-[#8c7851]">عيد مبارك</p>
            <h1 id="eid-title" className="tm-heading mt-3 text-3xl leading-tight text-[#2f2619] sm:text-4xl">
              كل عام وأنتم بخير
            </h1>
            <p id="eid-desc" className="mt-4 text-sm leading-relaxed text-[#5f5648]/90">
              تقبل الله منا ومنكم صالح الأعمال. يسعدنا أن نرحب بكم في <span className="font-semibold text-[#7b694a]">تمَعُّن</span>{" "}
              — نتمنى أن تكون رحلتكم مع المعنى أجمل في هذه الأيام المباركة.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={dismissEid} className="tm-gold-btn w-full sm:w-auto">
                متابعة إلى الأسعار
              </button>
              <Link href="/" className="tm-ghost-btn inline-flex w-full items-center justify-center sm:w-auto">
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="tm-shell space-y-8 pb-16 pt-4">
        <section className="tm-card p-7 sm:p-8">
          <p className="tm-mono text-xs tracking-[0.18em] text-[#8c7851]">PRICING</p>
          <h2 className="tm-heading mt-2 text-4xl text-[#2f2619]">الأسعار والاشتراك</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[#5f5648]/85">
            ادفع بأمان عبر Stripe بعد تسجيل الدخول. الباقات <span className="font-semibold">أساسي</span> و{" "}
            <span className="font-semibold">كامل</span> اشتراك شهري. باقة <span className="font-semibold">دعم خاص</span>{" "}
            عبر التواصل المباشر.
          </p>
          <p className="mt-3 max-w-[720px] rounded-xl border border-[#d8cdb9]/80 bg-[#fcfaf7]/90 px-4 py-3 text-xs leading-relaxed text-[#5f5648]/90">
            <span className="font-semibold text-[#7b694a]">للمستخدمين في السعودية:</span> صفحة الدفع الحالية (Stripe) تدعم بطاقات{" "}
            <span className="font-medium">فيزا وماستركارد</span> و<span className="font-medium">مدى</span> عند تفعيلها في
            إعدادات Stripe، كما يمكن ظهور <span className="font-medium">Apple Pay</span> و<span className="font-medium">Google Pay</span>{" "}
            على الأجهزة والمتصفحات المدعومة. المبلغ يُعرض بالريال السعودي حسب إعداد الأسعار في لوحة التحكم.
          </p>
          <p className="mt-2 max-w-[720px] rounded-xl border border-[#cdb98f]/50 bg-[#f7f2e8]/80 px-4 py-3 text-xs leading-relaxed text-[#5f5648]/90">
            <span className="font-semibold text-[#7b694a]">STC Pay وتابي وتمارا:</span> تُفعّل عادةً عبر{" "}
            <span className="font-medium">بوابة سعودية</span> (مثل Tap) أو تكاملات مباشرة مع كل مزود — وليست جميعها داخل Stripe
            بنفس الشاشة. عند ربط Tap أو تابي أو تمارا أو STC Pay للإنتاج، يمكن إضافة أزرار دفع إضافية تتزامن مع اشتراكك (راجع{" "}
            <span className="font-medium">docs/PAYMENTS.md</span>).
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth?next=/pricing")}
            className="tm-ghost-btn mt-4 text-xs"
          >
            لست مسجّلًا؟ سجّل الدخول للاشتراك
          </button>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.tierId}
              className={
                tier.highlight
                  ? "tm-card-interactive relative border-[#8c7851]/45 p-6 ring-1 ring-[#8c7851]/20"
                  : "tm-card p-6 transition-[box-shadow] duration-300 hover:shadow-[0_20px_48px_rgba(140,120,81,0.12)]"
              }
            >
              {tier.highlight ? (
                <span className="absolute left-4 top-4 rounded-full border border-[#cdb98f] bg-[#f1e7d4] px-2.5 py-0.5 text-[10px] font-semibold text-[#7b694a]">
                  موصى به
                </span>
              ) : null}
              <h3 className="tm-heading text-2xl text-[#5a4531]">{tier.name}</h3>
              <p className="mt-1 text-xs text-[#7d7362]">{tier.note}</p>
              <p className="mt-4 text-3xl font-bold text-[#2f2619]">{tier.price}</p>
              <p className="text-xs text-[#8c7851]">الريال السعودي / شهريًا (يحدد في Stripe)</p>
              <ul className="mt-5 space-y-2 text-sm text-[#5f5648]">
                {tier.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8c7851]" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.stripe ? (
                <SubscribeButton tierId={tier.tierId as "basic" | "full"} highlight={tier.highlight} />
              ) : (
                <div className="mt-6">
                  {salesEmail ? (
                    <a
                      href={`mailto:${salesEmail}?subject=${encodeURIComponent("استفسار باقة دعم خاص — تمَعُّن")}`}
                      className="block w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] py-3 text-center text-sm font-semibold text-[#4e4637] transition duration-200 hover:border-[#8c7851]/40"
                    >
                      تواصل معنا
                    </a>
                  ) : (
                    <p className="text-center text-xs text-[#7d7362]">
                      عيّن <code className="rounded bg-[#f1e7d4] px-1">NEXT_PUBLIC_SALES_EMAIL</code> لزر التواصل.
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>

        <p className="text-center text-xs text-[#7d7362]">
          لاستفسارات العيد والاشتراك الجماعي: يمكنكم التواصل عبر قنوات الدير الرقمي.
        </p>
      </div>
    </>
  );
}
