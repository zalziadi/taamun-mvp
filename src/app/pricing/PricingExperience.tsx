"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

function SubscribeButton({ tierId, highlight }: { tierId: TierDef["tierId"]; highlight?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout(source?: string) {
    setErr(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = { tier: tierId };
      if (source) payload.source = source;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };

      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (!res.ok || !data.ok || !data.url) {
        setErr("تعذر بدء الدفع الآن. حاول لاحقًا.");
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
    <div className="mt-6 space-y-2.5">
      <button
        type="button"
        disabled={loading}
        onClick={() => void startCheckout()}
        className={
          highlight
            ? "w-full rounded-xl bg-[#2ecc71]/90 py-3 text-center text-sm font-bold text-white transition-opacity hover:bg-[#2ecc71] disabled:opacity-60"
            : "w-full rounded-xl bg-[#2ecc71]/80 py-3 text-center text-sm font-semibold text-white transition-opacity hover:bg-[#2ecc71] disabled:opacity-60"
        }
      >
        {loading ? "جاري التوجيه..." : "ادفع والاشتراك"}
      </button>
      <p className="text-center text-[10px] text-[#e8e1d9]/40">
        يتطلب تسجيل الدخول. الدفع يتم عبر بوابة سلة الآمنة.
      </p>
      {err ? <p className="text-center text-xs text-[#e8e1d9]/75">{err}</p> : null}
    </div>
  );
}

export default function PricingExperience() {
  const router = useRouter();

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-7 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-[#c9b88a]">PRICING</p>
          <h2 className="mt-2 font-[var(--font-amiri)] text-4xl text-[#e8e1d9]">الأسعار والاشتراك</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[#e8e1d9]/85">
            ادفع بأمان عبر متجر سلة بعد تسجيل الدخول. اختر الباقة المناسبة لرحلتك مع التمعّن.
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth?next=/pricing")}
            className="mt-4 rounded-xl border border-white/10 bg-[#1c1a15] px-4 py-2 text-xs text-[#e8e1d9]"
          >
            لست مسجّلًا؟ سجّل الدخول للاشتراك
          </button>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <article key={tier.tierId} className="relative rounded-3xl border border-white/10 bg-[#2b2824] p-6">
              {tier.badge ? (
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#1c1a15] px-2.5 py-0.5 text-[10px] font-semibold text-[#c9b88a]">
                  {tier.badge}
                </span>
              ) : null}
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
              <SubscribeButton tierId={tier.tierId} highlight={tier.highlight} />
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
