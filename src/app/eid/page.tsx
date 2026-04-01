import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عيدية تمعن — هدية مختلفة هذا العيد",
  description:
    "أهدِ من تحبّ رحلة يومية مع القرآن تغيّر طريقة العيش. مدينة المعنى + تطبيق تمعّن — بـ ٨٢ ريال فقط.",
  openGraph: {
    title: "عيدية تمعن — هدية مختلفة هذا العيد",
    description: "أهدِ من تحبّ رحلة يومية مع القرآن. بـ ٨٢ ريال فقط.",
    locale: "ar_SA",
  },
};

const WHATSAPP = "966553930885";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "٨٢",
    currency: "ريال",
    duration: "٣ شهور",
    description: "انطلاقة رائعة في رحلة المعنى",
    features: [
      "كتاب مدينة المعنى (PDF)",
      "تطبيق تمعّن — ٣ شهور",
      "خطة يومية مخصصة",
      "دعم عبر واتساب",
    ],
    highlight: false,
    badge: null as string | null,
    msg: "السلام عليكم، أبغى أهدي عيدية تمعن — باقة Starter بـ 82 ريال",
  },
  {
    id: "growth",
    name: "Growth",
    price: "٨٢٠",
    currency: "ريال",
    duration: "سنة كاملة",
    description: "الأكثر قيمة لتحول حقيقي ودائم",
    features: [
      "كتاب مدينة المعنى (PDF)",
      "تطبيق تمعّن — سنة كاملة",
      "خطة يومية متقدمة",
      "دعم أولوية عبر واتساب",
      "جلسة متابعة شهرية",
      "وصول لمحتوى حصري",
    ],
    highlight: true,
    badge: "الأكثر إهداءً",
    msg: "السلام عليكم، أبغى أهدي عيدية تمعن — باقة Growth بـ 820 ريال",
  },
  {
    id: "vip",
    name: "VIP",
    price: "٨٢٠٠",
    currency: "ريال",
    duration: "تجربة كاملة",
    description: "للجادين في التحول الحقيقي",
    features: [
      "كتاب مدينة المعنى (PDF + ورقية)",
      "تطبيق تمعّن — مدى الحياة",
      "برنامج تحول مخصص",
      "وصول مباشر للكوتش",
      "جلسات فردية شهرية",
      "مجتمع VIP حصري",
      "ضمان النتائج",
    ],
    highlight: false,
    badge: "VIP",
    msg: "السلام عليكم، أبغى أعرف عن عيدية تمعن — باقة VIP بـ 8200 ريال",
  },
];

const whatsappHref = (msg: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CheckIcon = ({ highlight }: { highlight: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-white/80" : "text-[#6D8BFF]"}`}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

export default function EidPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white" dir="rtl">

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative pt-20 pb-28 px-4 text-center overflow-hidden">
        {/* ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(109,139,255,0.12) 0%, transparent 70%)" }}
        />

        {/* Eid badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/8 text-[#C9A96E] text-sm font-medium mb-8">
          {/* crescent */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
          عيد مبارك · ١٤٤٦
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
          عيديتك هذا العام{" "}
          <span className="text-[#6D8BFF]">لها وزن آخر</span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-lg mx-auto leading-9 mb-10">
          لا تُهدي ما يُنسى بعد يوم.
          <br />
          أهدِ رحلة مع القرآن تبقى في القلب.
          <br />
          <span className="text-white font-medium">
            مدينة المعنى + تطبيق تمعّن — بـ ٨٢ ريال فقط.
          </span>
        </p>

        <a
          href={whatsappHref("السلام عليكم، أبغى أعرف عن عيدية تمعن")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors active:scale-95 cursor-pointer"
        >
          <WaIcon />
          اختر عيديتك الآن
        </a>

        {/* scroll hint */}
        <div className="mt-16 flex flex-col items-center gap-2 text-zinc-600 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          اكتشف الباقات
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHAT'S INCLUDED
      ═══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-[#0D1117]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#6D8BFF] text-sm font-medium tracking-widest uppercase text-center mb-3">
            ما في العيدية
          </p>
          <h2 className="text-3xl font-bold text-center mb-12">
            ثلاثة أشياء تغيّر كل شيء
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 — Book */}
            <div className="bg-[#131820] border border-white/10 rounded-2xl p-7 hover:border-[#6D8BFF]/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-[#6D8BFF]/10 text-[#6D8BFF] flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">كتاب مدينة المعنى</h3>
              <p className="text-zinc-400 text-sm leading-7">
                رحلة مكتوبة بعناية تأخذ القارئ من الكلمة القرآنية إلى تحول حقيقي في طريقة العيش.
              </p>
            </div>

            {/* Card 2 — App */}
            <div className="bg-[#131820] border border-white/10 rounded-2xl p-7 hover:border-[#6D8BFF]/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-[#6D8BFF]/10 text-[#6D8BFF] flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيق تمعّن</h3>
              <p className="text-zinc-400 text-sm leading-7">
                ٢٨ يومًا من التمعّن اليومي مع القرآن — تجربة تفاعلية تلمس القلب وتُثري العقل.
              </p>
            </div>

            {/* Card 3 — Plan */}
            <div className="bg-[#131820] border border-white/10 rounded-2xl p-7 hover:border-[#6D8BFF]/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-[#6D8BFF]/10 text-[#6D8BFF] flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">خطة يومية ومتابعة</h3>
              <p className="text-zinc-400 text-sm leading-7">
                مسار مدروس يلائم وقتك وظروفك — خطوة صغيرة كل يوم، أثر يبقى في القلب.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          QUOTE
      ═══════════════════════════════════════ */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-[#C9A96E] text-5xl mb-6 leading-none select-none" aria-hidden="true">
            &ldquo;
          </div>
          <p className="text-xl sm:text-2xl font-medium leading-10 text-zinc-200">
            مو كتاب تقرأه… ولا تطبيق تستخدمه…
            <br />
            <span className="text-white font-bold">
              هذه رحلة يومية مع القرآن تغيّر طريقة عيشك.
            </span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING
      ═══════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4 bg-[#0D1117]">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#6D8BFF] text-sm font-medium tracking-widest uppercase text-center mb-3">
            اختر عيديتك
          </p>
          <h2 className="text-3xl font-bold text-center mb-2">باقات العيدية</h2>
          <p className="text-zinc-400 text-center mb-14">هدية حقيقية لكل ميزانية</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col border transition-all ${
                  plan.highlight
                    ? "bg-[#6D8BFF] border-[#6D8BFF] md:scale-105 shadow-2xl shadow-[#6D8BFF]/30"
                    : "bg-[#131820] border-white/10 hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3 right-6 px-4 py-1 rounded-full text-xs font-bold ${
                      plan.highlight
                        ? "bg-white text-[#6D8BFF]"
                        : "bg-[#C9A96E] text-[#0B0F14]"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
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
                    <li
                      key={i}
                      className={`flex items-center gap-2.5 text-sm ${
                        plan.highlight ? "text-blue-50" : "text-zinc-300"
                      }`}
                    >
                      <CheckIcon highlight={plan.highlight} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappHref(plan.msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 rounded-xl font-bold text-center text-base transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-white text-[#6D8BFF] hover:bg-blue-50"
                      : "bg-[#6D8BFF] text-white hover:bg-[#5a78ee]"
                  }`}
                >
                  <WaIcon />
                  أهدِ الآن
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW TO GIFT
      ═══════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#6D8BFF] text-sm font-medium tracking-widest uppercase text-center mb-3">
            كيف تُهدي؟
          </p>
          <h2 className="text-3xl font-bold text-center mb-12">٣ خطوات بسيطة</h2>

          <div className="space-y-5">
            {[
              {
                num: "١",
                title: "اختر الباقة",
                desc: "حدّد العيدية التي تناسب من تحبّ وميزانيتك من الباقات أعلاه.",
              },
              {
                num: "٢",
                title: "تواصل معنا على واتساب",
                desc: "سيرد عليك فريق تمعّن ويكمل معك تفاصيل الدفع خلال دقائق.",
              },
              {
                num: "٣",
                title: "أرسل العيدية",
                desc: "نُرسل لك رسالة جاهزة تُهديها لمن تحبّ — وتبدأ رحلتهم فوراً.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-5 bg-[#131820] border border-white/10 rounded-2xl p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-[#6D8BFF]/10 text-[#6D8BFF] text-xl font-bold flex items-center justify-center flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-7">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TRUST BAR
      ═══════════════════════════════════════ */}
      <section className="border-t border-white/10 py-14 px-4 bg-[#0D1117]">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-white mb-1">٩٤٪</div>
            <div className="text-zinc-400 text-sm">نسبة رضا العملاء</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">٧ أيام</div>
            <div className="text-zinc-400 text-sm">ضمان استرداد كامل</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">+٥٠٠</div>
            <div className="text-zinc-400 text-sm">عميل سعيد</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section className="py-28 px-4 text-center">
        <div className="max-w-xl mx-auto">
          {/* decorative star */}
          <div className="text-[#C9A96E] text-4xl mb-6 select-none" aria-hidden="true">✦</div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            العيد فرصة لتُهدي
            <br />
            ما يُبقي أثرًا
          </h2>
          <p className="text-zinc-400 text-lg leading-8 mb-10">
            أهدِ من تحبّ رحلة مع القرآن، ورافقه في كل خطوة نحو المعنى.
          </p>

          <a
            href={whatsappHref("السلام عليكم، أبغى أهدي عيدية تمعن")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold text-lg px-10 py-4 rounded-2xl transition-colors active:scale-95 cursor-pointer"
          >
            <WaIcon />
            تواصل معنا على واتساب
          </a>

          <p className="text-zinc-600 text-sm mt-6">
            للاستفسار أو الدفع بتحويل بنكي — فريقنا جاهز
          </p>
        </div>
      </section>
    </div>
  );
}
