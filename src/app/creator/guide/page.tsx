import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "كيف أنشئ رحلة في تمعّن — دليل المبدع",
  description:
    "دليل خطوة بخطوة لكتابة ونشر رحلة قرآنية قصيرة (٧ أو ١٤ يوماً) في تمعّن.",
  openGraph: {
    title: "دليل المبدع — تمعّن",
    description:
      "خمس خطوات لنشر رحلتك الأولى في تمعّن.",
    type: "article",
  },
};

type Step = {
  num: number;
  title: string;
  body: string;
  bullets?: string[];
};

const STEPS: Step[] = [
  {
    num: 1,
    title: "اشترك في باقة VIP",
    body: "وضع المبدع متاح لأعضاء VIP فقط. الاشتراك يفتح لك لوحة المبدع حيث تبدأ رحلاتك.",
    bullets: ["من /pricing اختر باقة VIP", "بعد التفعيل ستظهر \"وضع المبدع\" في /account"],
  },
  {
    num: 2,
    title: "اكتب مسوّدة الرحلة",
    body: "من /creator أنشئ رحلة جديدة: عنوان + وصف قصير + مدّة ٧ أو ١٤ يوماً + اسم العرض.",
    bullets: [
      "العنوان: ٥-١٢٠ حرف، واضح بلا مبالغة",
      "الوصف: ٢٠-٥٠٠ حرف، يُلامس القلب في أوّل ثلاث أسطر",
      "اسم العرض: ما يراه القرّاء (اسمك الحقيقي أو كنية)",
    ],
  },
  {
    num: 3,
    title: "أضف أيام الرحلة",
    body: "لكل يوم: آية + مرجعها + سؤال تمعّن + (اختياري) تمرين عملي.",
    bullets: [
      "النص: آية واحدة أو مقطع قصير",
      "المرجع: صيغة \"البقرة: ٢٥٥\"",
      "السؤال: ١٠-٥٠٠ حرف، دعوة للتمعّن لا إجابة",
      "التمرين: نشاط ٢-٥ دقائق يربط الآية بيومه",
    ],
  },
  {
    num: 4,
    title: "اضغط نشر",
    body: "عند نشر الرحلة: إذا كانت كل الأيام مكتملة ولا تحتوي روابط خارجية تُنشر فوراً. وإلا تدخل قائمة المراجعة.",
    bullets: [
      "كل أيام الرحلة يجب أن تكون مكتوبة قبل النشر",
      "الروابط والإيميلات تُوضع تلقائياً للمراجعة",
      "متابعوك يحصلون على إشعار دفع تلقائي",
    ],
  },
  {
    num: 5,
    title: "راقب التحليلات",
    body: "من /creator/[slug]/analytics ترى: إجمالي المشتركين، نسبة الإكمال، وأي يوم يتوقّف الناس عنده (drop-off).",
    bullets: [
      "نسبة اكتمال تحت ٤٠٪ → راجع أطول الأيام",
      "drop-off في يوم معيّن → بسّط سؤاله أو قصّر آيته",
      "المشتركون الراجعون أقوى إشارة من العدد الإجمالي",
    ],
  },
];

export default function CreatorGuidePage() {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-8" dir="rtl">
      <header className="space-y-3 text-center">
        <p className="text-[10px] tracking-widest text-[#8c7851]/70 uppercase">
          دليل المبدع
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619] leading-tight">
          كيف تنشئ رحلة في تمعّن؟
        </h1>
        <p className="text-sm text-[#5a4a35] leading-relaxed max-w-lg mx-auto">
          خمس خطوات بسيطة لتحويل تمعّنك الشخصي في القرآن إلى رحلة قصيرة
          يمكن لأي مشترك أن يسير فيها معك.
        </p>
      </header>

      <ol className="space-y-6">
        {STEPS.map((s) => (
          <li key={s.num} className="tm-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#8c7851] shrink-0">
                {s.num}
              </span>
              <h2 className="text-lg font-bold text-[#2f2619]">{s.title}</h2>
            </div>
            <p className="text-sm text-[#3d342a] leading-relaxed">{s.body}</p>
            {s.bullets && (
              <ul className="space-y-1.5 text-xs text-[#5a4a35] pr-4">
                {s.bullets.map((b, i) => (
                  <li key={i} className="leading-relaxed">
                    — {b}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <section className="tm-card p-6 space-y-3 text-center">
        <h2 className="text-sm font-bold text-[#5a4a35]">جاهز؟</h2>
        <p className="text-xs text-[#3d342a] leading-relaxed">
          افتح لوحة المبدع وابدأ بأول مسوّدة. كلّ ما تحتاجه إبداعاً هو آية
          واحدة + سؤال يُحرّك القلب.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link
            href="/creator"
            className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-5 py-2 text-xs font-bold hover:opacity-90"
          >
            افتح لوحة المبدع
          </Link>
          <Link
            href="/discover"
            className="border border-[#5a4a35] text-[#5a4a35] px-5 py-2 text-xs font-bold hover:bg-[#5a4a35]/5"
          >
            تصفّح رحلات موجودة
          </Link>
        </div>
      </section>

      <div className="text-center pt-2">
        <Link
          href="/faq"
          className="text-xs text-[#5a4a35] underline hover:no-underline"
        >
          أسئلة شائعة →
        </Link>
      </div>
    </main>
  );
}
