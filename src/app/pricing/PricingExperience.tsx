"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── الباقات ── */
type TierDef = {
  tierId: "trial" | "quarterly" | "yearly" | "vip";
  name: string;
  price: string;
  period: string;
  duration: string;
  note: string;
  feats: string[];
  highlight?: boolean;
  badge?: string;
  isFree?: boolean;
  saving?: string;
};

const TIERS: TierDef[] = [
  {
    tierId: "trial",
    name: "تجربة مجانية",
    price: "0",
    period: "٧ أيام",
    duration: "٧ أيام",
    note: "ابدأ رحلتك بدون التزام",
    badge: "مجاني",
    isFree: true,
    feats: ["بوابة الصمت والتمعّن", "الدفتر الشخصي", "٧ أيام كاملة", "بدون بطاقة دفع"],
  },
  {
    tierId: "quarterly",
    name: "ربع سنوي",
    price: "199",
    period: "كل ٣ شهور",
    duration: "٩٠ يوم",
    note: "٦٦ ر.س/شهر — الخيار الآمن",
    feats: ["كل ميزات التمعّن", "المدينة التفاعلية", "مرشد تمعّن", "تحليلات الرحلة"],
  },
  {
    tierId: "yearly",
    name: "سنوي",
    price: "699",
    period: "سنويًا",
    duration: "٣٦٥ يوم",
    note: "٥٨ ر.س/شهر — توفير ٤١٪",
    highlight: true,
    saving: "وفّر ٤١٪",
    feats: ["كل ميزات الربع سنوي", "توفير ٤ أشهر", "أولوية في الدعم", "محتوى إضافي حصري"],
  },
  {
    tierId: "vip",
    name: "VIP",
    price: "4,999",
    period: "سنويًا",
    duration: "٣٦٥ يوم",
    note: "للجادين في رحلتهم الروحانية",
    feats: ["كل ميزات السنوي", "جلسات تمعّن خاصة", "دعم مباشر ومخصص", "مجتمع VIP حصري"],
  },
];

/* ── زر الاشتراك عبر بوابة الدفع ── */
function CheckoutButton({ tierId, highlight }: { tierId: string; highlight?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/auth?next=/pricing");
        return;
      }
      if (res.ok && data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error === "salla_not_configured" ? "بوابة الدفع غير مفعّلة حالياً" : "حدث خطأ، حاول مرة أخرى");
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [tierId, router]);

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 ${
          highlight
            ? "bg-[#c9b88a] text-[#15130f]"
            : "border border-[#c9b88a]/30 bg-[#c9b88a]/10 text-[#c9b88a]"
        }`}
      >
        {loading ? "جاري التوجيه..." : tierId === "trial" ? "ابدأ مجاناً" : "اشترك الآن"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-amber-400">{error}</p>}
    </div>
  );
}

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
          className="rounded-xl bg-[#c9b88a] px-6 py-3.5 text-sm font-bold text-[#15130f] transition-opacity hover:opacity-90 disabled:opacity-40"
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
      <span className="text-xs">{copied ? "✓ تم النسخ" : "نسخ"}</span>
    </button>
  );
}

/* ── الصفحة الرئيسية ── */
export default function PricingExperience() {
  const router = useRouter();

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9] overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-8 overflow-hidden">

        {/* ── العنوان ── */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-7 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-[#c9b88a]">PRICING</p>
          <h2 className="mt-2 font-[var(--font-amiri)] text-2xl sm:text-4xl text-[#e8e1d9]">الأسعار والاشتراك</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[#e8e1d9]/85 break-words">
            اختر الباقة المناسبة — حوّل المبلغ عبر التحويل البنكي أو STC Pay — ثم فعّل الكود.
          </p>
        </section>

        {/* ── لماذا تمعّن؟ ── */}
        <section className="rounded-3xl border border-[#c9b88a]/20 bg-gradient-to-b from-[#2b2824] to-[#1d1b17] p-7 sm:p-8">
          <h3 className="font-[var(--font-amiri)] text-xl sm:text-2xl text-[#e8e1d9] text-center">ماذا تحصل مع تمعّن؟</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "◈", title: "٢٨ يوم تأمل", desc: "آية يومية + لحظة صمت + طبقة أعمق + تمرين عملي" },
              { icon: "✦", title: "مرشد تمعّن الشخصي", desc: "ذكاء اصطناعي يعرف رحلتك ويسألك الأسئلة الصحيحة" },
              { icon: "◉", title: "كتاب مدينة المعنى", desc: "النص الكامل — اقرأه في المتصفح مع اقتباسات يومية" },
              { icon: "◎", title: "دفتر التأمل الشخصي", desc: "اكتب تأملاتك وتابع تطور وعيك عبر الأيام" },
            ].map((item) => (
              <div key={item.title} className="text-center space-y-2 p-3">
                <span className="text-2xl text-[#c9b88a]">{item.icon}</span>
                <h4 className="text-sm font-bold text-[#e8e1d9]">{item.title}</h4>
                <p className="text-xs leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
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
              {/* بادج واحد فقط بأولوية: highlight > saving > badge */}
              {tier.highlight ? (
                <span className="absolute left-4 top-4 rounded-full bg-[#c9b88a] px-2.5 py-0.5 text-xs font-bold text-[#15130f]">
                  أفضل قيمة {tier.saving ? `· ${tier.saving}` : ""}
                </span>
              ) : tier.saving ? (
                <span className="absolute left-4 top-4 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {tier.saving}
                </span>
              ) : tier.badge ? (
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#1c1a15] px-2.5 py-0.5 text-xs font-semibold text-[#c9b88a]">
                  {tier.badge}
                </span>
              ) : null}
              <h3 className={`font-[var(--font-amiri)] text-xl sm:text-2xl text-[#e8e1d9] ${tier.badge || tier.highlight || tier.saving ? "mt-6" : ""}`}>{tier.name}</h3>
              <p className="mt-1 text-xs text-[#c9b88a]">{tier.note}</p>
              <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-bold text-[#e8e1d9]">
                {tier.price} <span className="text-base font-normal">ر.س</span>
              </p>
              <p className="text-xs text-[#c9b88a]">{tier.period}</p>
              <p className="text-xs text-white/40 mt-0.5">المدة: {tier.duration}</p>
              <ul className="mt-5 space-y-2 text-sm text-[#e8e1d9]/85">
                {tier.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e6d4a4]" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <CheckoutButton tierId={tier.tierId} highlight={tier.highlight} />
            </article>
          ))}
        </section>

        {/* ── طرق الدفع البديلة ── */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-7 sm:p-8">
          <h3 className="font-[var(--font-amiri)] text-2xl text-[#e8e1d9]">طرق دفع بديلة</h3>
          <p className="mt-2 text-sm text-[#e8e1d9]/70">
            إذا لم تتمكن من الدفع عبر الزر أعلاه، يمكنك التحويل يدوياً عبر أي من الطرق التالية.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* التحويل البنكي */}
            <div className="rounded-2xl border border-white/10 bg-[#1c1a15] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9b88a]/10 text-lg">🏦</span>
                <div>
                  <h4 className="text-sm font-bold text-[#e8e1d9]">تحويل بنكي</h4>
                  <p className="text-xs text-[#c9b88a]">STC Bank</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40">اسم المستفيد</p>
                  <p className="mt-0.5 text-sm text-[#e8e1d9]">زياد ابراهيم سعيد الزيادي</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">رقم الحساب</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p dir="ltr" className="font-mono text-sm text-[#e8e1d9] truncate min-w-0">1289471738</p>
                    <CopyButton text="1289471738" label="1289471738" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40">رقم الآيبان (IBAN)</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p dir="ltr" className="font-mono text-xs text-[#e8e1d9] truncate min-w-0">SA827800...1738</p>
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
                  <p className="text-xs text-[#c9b88a]">تحويل فوري</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40">رقم STC Pay</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p dir="ltr" className="font-mono text-sm sm:text-lg font-semibold text-[#e8e1d9] break-all">+966553930885</p>
                    <CopyButton text="+966553930885" label="الرقم" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40">اسم المستفيد</p>
                  <p className="mt-0.5 text-sm text-[#e8e1d9]">زياد ابراهيم سعيد الزيادي</p>
                </div>
              </div>
            </div>
          </div>

          {/* تعليمات */}
          <div className="mt-5 rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/5 p-4 overflow-hidden">
            <p className="text-sm font-semibold text-[#c9b88a]">بعد التحويل:</p>
            <p className="mt-1 text-sm leading-relaxed text-[#e8e1d9]/70 break-words">
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
          <p className="mt-4 text-center text-xs text-[#e8e1d9]/40">
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
