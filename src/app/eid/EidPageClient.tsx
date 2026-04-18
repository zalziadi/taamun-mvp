"use client";

import Link from "next/link";
import { useState } from "react";

const DAYS = [
  {
    id: 1,
    key: "shadow" as const,
    title: "اليوم الأول — الظل",
    subtitle: "مواجهة الذات بهدوء",
    body: [
      "في عيدية تمَعُّن نمنحكَ وصولًا جزئيًا ومحدودًا قصْدًا: كي تلمس طعم الرحلة دون أن تُغلقَ على نفسك باب التمعّن.",
      "ابدأ بمراجعة لطيفة لما يثقلك داخلك: ليس لإدانة النفس، بل لرؤية ما كان مخفيًا عنك.",
      "تمرين اليوم: ثلاث دقائق صمت، ثم سطر واحد صادق يصف «ما الذي يشغل قلبي الآن؟» دون تبرير.",
    ],
    teaser: "غدًا: حين ينقلب الظل إلى لمعانٍ خفيٍّ يُسمّى هدية… هل أنت مستعد؟",
  },
  {
    id: 2,
    key: "gift" as const,
    title: "اليوم الثاني — الهدية",
    subtitle: "اكتشاف المهارات والقيم",
    body: [
      "الهدية هنا ليست حدثًا خارجك، بل إدراكٌ لما وهبك الله من صفةٍ صالحةٍ تستحق أن تُسمّى.",
      "ابحث عن موقفٍ مرّ بك هذا الأسبوع: ما الذي كشف لك قيمةً كنت تتجاهلها؟",
      "دفتر اليوم: ثلاثة أسطر فقط — «لاحظت… فهمت… سأحتفظ بهذا كهدية لنفسي».",
    ],
    teaser: "بعد غدٍ: نفتح لك نافذة صغيرة على «أفضل احتمال»… وعلى مدينة المعنى.",
  },
  {
    id: 3,
    key: "best" as const,
    title: "اليوم الثالث — أفضل احتمال",
    subtitle: "رؤية المستقبل ومدينة المعنى",
    body: [
      "أفضل احتمال ليس مبالغةً، بل اتجاهًا: أن تعيش مع القرآن لغةً للمعنى، لا عادةً سريعة.",
      "تخيّل نفسك بعد شهرٍ من التمعّن المنتظم: ما أول عادةٍ تريد أن تثبتها؟",
      "معاينة «مدينة المعنى»: تسعة مجالات للحياة — تمرّ عليها كمسافرٍ يختار أين يقوّي وعيه أولًا.",
    ],
    teaser: "انتهت العيدية المحدودة هنا… وأبقيتَ شيئًا يستحق الإكمال.",
  },
];

function IconMoon() {
  return (
    <svg className="h-8 w-8 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="h-8 w-8 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconCity() {
  return (
    <svg className="h-8 w-8 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M6 21V8l3-1v14M9 21V6l3 1v14M12 21V9l3 1v11M15 21v-7l3-1v8" />
    </svg>
  );
}

const DAY_ICONS = [<IconMoon key="m" />, <IconBook key="b" />, <IconCity key="c" />];

export default function EidPageClient() {
  const [day, setDay] = useState(1);
  const active = DAYS.find((d) => d.id === day) ?? DAYS[0];

  return (
    <div className="tm-shell space-y-10 pb-24">
      {/* Hero */}
      <section className="tm-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#cdb98f]/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[#C9A84C]/10 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="tm-mono text-xs tracking-[0.22em] text-[#C9A84C]">عيدية محدودة</p>
          <h1 className="tm-heading mt-3 max-w-[920px] text-2xl leading-[1.15] text-[#14110F] sm:text-4xl md:text-[2.65rem]">
            عيدية تمَعُّن — رحلة اكتشاف المعنى بلغة القرآن
          </h1>
          <p className="mt-5 max-w-[720px] text-base leading-relaxed text-[#A8A29A]/90 sm:text-[17px]">
            هذه العيدية عبارة عن <strong className="font-semibold text-[#5a4531]">وصول جزئي ومقصود</strong> إلى تجربة تمَعُّن:
            تلمّس المسار، تتدرّج في الوعي، ثم تقرّر إن كنت تريد إكمال الرحلة. ما نقدّمه هنا مدخلٌ يوقظ الفضول، ولا يغلق
            على نفسه باب المعنى.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/auth" className="tm-gold-btn inline-flex justify-center px-8 py-3 text-[15px]">
              ابدأ العيدية الآن
            </Link>
            <Link href="/journey" className="tm-ghost-btn inline-flex justify-center px-8 py-3 text-[15px]">
              جرّب بدون تسجيل
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#7d7362]">الوصول الكامل للرحلة والمرشد والمدينة يتلو هذه العيدية عبر الاشتراك.</p>
        </div>
      </section>

      {/* 3-day journey */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="tm-heading text-xl sm:text-3xl text-[#14110F]">ثلاثة أيام — ثلاث حالات وعي</h2>
            <p className="mt-1 text-sm text-[#7d7362]">اختر اليوم لعرض نصّه. نهاية كل يوم تترك سؤالًا مفتوحًا.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="أيام العيدية">
          {DAYS.map((d, i) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={day === d.id}
              onClick={() => setDay(d.id)}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors duration-200",
                day === d.id
                  ? "border-[#C9A84C] bg-[#e9ddc6] text-[#5a4531]"
                  : "cursor-pointer border-[#ded4c2] bg-[#fcfaf7] text-[#A8A29A] hover:border-[#C9A84C]/40",
              ].join(" ")}
            >
              <span className="opacity-90">{DAY_ICONS[i]}</span>
              <span className="font-medium">{d.title}</span>
            </button>
          ))}
        </div>

        <article className="tm-card p-7 sm:p-8" role="tabpanel">
          <div className="flex items-start gap-4">
            <div className="hidden shrink-0 sm:block">{DAY_ICONS[day - 1]}</div>
            <div>
              <p className="text-xs font-medium text-[#C9A84C]">{active.subtitle}</p>
              <h3 className="tm-heading mt-1 text-2xl text-[#14110F]">{active.title}</h3>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#A8A29A]/92 sm:text-[15px]">
                {active.body.map((para, idx) => (
                  <p key={`${active.id}-${idx}`}>{para}</p>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-[#d8cdb9] bg-[#f9f4eb]/80 px-4 py-3 text-sm italic text-[#6b5d4a]">
                {active.teaser}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Conversion */}
      <section className="tm-card border-[#C9A84C]/30 bg-[#fcfaf7] p-8 sm:p-10">
        <h2 className="tm-heading text-xl sm:text-3xl text-[#14110F]">انتهت العيدية المحدودة… وبقي ما يستحقُّ الإكمال</h2>
        <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-[#A8A29A]/90 sm:text-[15px]">
          ما رأيتَه خلال ثلاثة أيام كان <strong className="text-[#5a4531]">طعمًا</strong> لا <strong className="text-[#5a4531]">استقلالًا</strong>؛
          التمعّن العميق، والدفتر، والمرشد، ومدينة المعنى، وتحليلات الرحلة تظلُّ خلف بابٍ يفتحه اشتراكٌ يتناسب معك.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#ded4c2] bg-[#fffefb] p-5">
            <h3 className="tm-heading text-xl text-[#5a4531]">أساسي</h3>
            <p className="mt-2 text-2xl font-bold text-[#14110F]">٨٢ <span className="text-base font-semibold text-[#D6D1C8]">ريالًا شهريًا</span></p>
            <p className="mt-2 text-xs text-[#7d7362]">تأمل، دفتر، مصادر قرآنية — بداية منتظمة.</p>
          </div>
          <div className="rounded-2xl border border-[#C9A84C]/35 bg-[#f4ead7]/60 p-5 ring-1 ring-[#C9A84C]/15">
            <h3 className="tm-heading text-xl text-[#5a4531]">كامل</h3>
            <p className="mt-2 text-sm font-semibold text-[#14110F]">باقة موسّعة للرحلة</p>
            <p className="mt-2 text-xs text-[#7d7362]">مدينة المعنى، المرشد الذكي، تحليلات الرحلة — السعر الحالي في صفحة الاشتراك.</p>
          </div>
          <div className="rounded-2xl border border-[#ded4c2] bg-[#fffefb] p-5">
            <h3 className="tm-heading text-xl text-[#5a4531]">خاص</h3>
            <p className="mt-2 text-2xl font-bold text-[#14110F]">٨٢٠٠ <span className="text-base font-semibold text-[#D6D1C8]">ريالًا</span></p>
            <p className="mt-2 text-xs text-[#7d7362]">للجهات والمجموعات — تنسيق محتوى، دعم، تفعيل جماعي.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/pricing?eid=1" className="tm-gold-btn inline-flex justify-center px-10 py-3 text-[15px]">
            اشترك الآن
          </Link>
          <Link href="/reflection" className="tm-ghost-btn inline-flex justify-center px-8 py-3 text-sm">
            تابع التمعّن
          </Link>
        </div>
      </section>

      <p className="text-center text-xs text-[#a09480]">
        تمَعُّن — رحلة اكتشاف المعنى بلغة القرآن · الوصول الجزئي في العيدية مقصودٌ ليحفز الإكمال بلا إغراق.
      </p>
    </div>
  );
}
