import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "باقات تمعّن — ابدأ رحلتك",
  description: "اختر الباقة المناسبة لرحلتك مع تمعّن",
};

const WHATSAPP = "966553930885";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "٨٢",
    currency: "ريال",
    duration: "٣ شهور",
    description: "ابدأ رحلتك مع تمعّن",
    features: [
      "📖 كتاب مدينة المعنى (PDF)",
      "📱 تطبيق تمعّن — ٣ شهور",
      "🌿 خطة يومية مخصصة",
      "💬 دعم عبر واتساب",
    ],
    highlight: false,
    badge: null as string | null,
    msg: "أهلاً، أبغى أشترك في باقة Starter بـ 82 ريال",
  },
  {
    id: "growth",
    name: "Growth",
    price: "٨٢٠",
    currency: "ريال",
    duration: "سنة كاملة",
    description: "الأكثر قيمة لرحلة تحول حقيقية",
    features: [
      "📖 كتاب مدينة المعنى (PDF)",
      "📱 تطبيق تمعّن — سنة كاملة",
      "🌿 خطة يومية متقدمة",
      "💬 دعم أولوية عبر واتساب",
      "🎯 جلسة متابعة شهرية",
      "⭐ وصول لمحتوى حصري",
    ],
    highlight: true,
    badge: "الأكثر مبيعاً",
    msg: "أهلاً، أبغى أشترك في باقة Growth بـ 820 ريال",
  },
  {
    id: "vip",
    name: "VIP",
    price: "٨٢٠٠",
    currency: "ريال",
    duration: "تجربة كاملة",
    description: "للجادين في التحول الحقيقي",
    features: [
      "📖 كتاب مدينة المعنى (PDF + ورقية)",
      "📱 تطبيق تمعّن — مدى الحياة",
      "🌿 برنامج تحول مخصص",
      "💬 وصول مباشر للكوتش",
      "🎯 جلسات فردية شهرية",
      "⭐ مجتمع VIP حصري",
      "🏆 ضمان النتائج",
    ],
    highlight: false,
    badge: "VIP",
    msg: "أهلاً، أبغى أعرف عن باقة VIP بـ 8200 ريال",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white" dir="rtl">
      {/* Header */}
      <div className="pt-20 pb-12 text-center px-4">
        <p className="text-[#6D8BFF] text-sm font-medium tracking-widest uppercase mb-4">
          تمعّن
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          ابدأ رحلتك اليوم
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          اختر الباقة التي تناسبك — كل خطوة تبدأ بقرار واحد
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-8 flex flex-col border transition-all ${
              plan.highlight
                ? "bg-[#6D8BFF] border-[#6D8BFF] scale-105 shadow-2xl shadow-[#6D8BFF]/30"
                : "bg-[#131820] border-white/10 hover:border-white/20"
            }`}
          >
            {plan.badge && (
              <div
                className={`absolute -top-3 right-6 px-4 py-1 rounded-full text-xs font-bold ${
                  plan.highlight ? "bg-white text-[#6D8BFF]" : "bg-[#6D8BFF] text-white"
                }`}
              >
                {plan.badge}
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className={`text-sm ${plan.highlight ? "text-blue-100" : "text-zinc-400"}`}>
                {plan.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">{plan.price}</span>
                <span className={`text-lg ${plan.highlight ? "text-blue-100" : "text-zinc-400"}`}>
                  {plan.currency}
                </span>
              </div>
              <p className={`text-sm mt-1 ${plan.highlight ? "text-blue-100" : "text-zinc-500"}`}>
                {plan.duration}
              </p>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className={`text-sm ${plan.highlight ? "text-blue-50" : "text-zinc-300"}`}>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(plan.msg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-4 rounded-xl font-bold text-center text-base transition-all hover:opacity-90 active:scale-95 ${
                plan.highlight
                  ? "bg-white text-[#6D8BFF] hover:bg-blue-50"
                  : "bg-[#6D8BFF] text-white hover:bg-[#5a78ee]"
              }`}
            >
              ابدأ الآن
            </a>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="border-t border-white/10 py-12 text-center px-4">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 text-zinc-400 text-sm">
          <div><div className="text-2xl font-bold text-white mb-1">٩٤٪</div><div>نسبة رضا العملاء</div></div>
          <div><div className="text-2xl font-bold text-white mb-1">٧ أيام</div><div>ضمان استرداد كامل</div></div>
          <div><div className="text-2xl font-bold text-white mb-1">+٥٠٠</div><div>عميل سعيد</div></div>
        </div>
      </div>

      <div className="pb-10 text-center text-zinc-600 text-xs">
        للاستفسار تواصل معنا على{" "}
        <a href={`https://wa.me/${WHATSAPP}`} className="text-[#6D8BFF] hover:underline">
          واتساب
        </a>
      </div>
    </div>
  );
}
