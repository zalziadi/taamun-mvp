import Link from "next/link";
import { LandingSection } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/Reveal";
import { APP_NAME } from "@/lib/appConfig";
import { DAY1_ROUTE } from "@/lib/routes";
import { buildWhatsAppSubscribeUrl } from "@/lib/whatsapp";

function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-[color:var(--glass-border)] bg-white/28 p-6">
      <div className="font-amiri text-[18px] text-[color:var(--ink)]">{title}</div>
      <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--text-mid)]">
        {desc}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 h-10 w-10 rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--parchment-deep)] grid place-items-center text-[color:var(--ink)] font-bold">
        {n}
      </div>
      <div>
        <div className="font-amiri text-[18px] text-[color:var(--ink)]">{title}</div>
        <p className="mt-1 text-[14px] leading-relaxed text-[color:var(--text-mid)]">
          {desc}
        </p>
      </div>
    </div>
  );
}

export function LandingSections() {
  return (
    <>
      {/* Journey */}
      <LandingSection
        id="journey"
        title="الرحلة"
        subtitle="ثلاث خطوات يومية بسيطة داخل 28 يومًا."
        className="pt-6 sm:pt-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--parchment-deep)] p-7">
              <div className="text-[12px] text-[color:var(--text-quiet)]">المنهج</div>
              <div className="mt-3 space-y-5">
                <Step
                  n="1"
                  title="مراقبة"
                  desc="لاحظ ما يحدث داخلك وخارجك بدون تبرير ولا مقاومة."
                />
                <Step
                  n="2"
                  title="إدراك"
                  desc="استخرج المعنى الذي ظهر لك: ظل/هدية/أفضل احتمال."
                />
                <Step
                  n="3"
                  title={APP_NAME}
                  desc="ثبت المعنى كسلوك صغير اليوم — عادة تُبنى ببطء وتثبت."
                />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-3xl border border-[color:var(--glass-border)] bg-white/22 p-7">
              <div className="text-[12px] text-[color:var(--text-quiet)]">لماذا هذا يعمل؟</div>
              <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[color:var(--text-mid)]">
                <p>• يقلل التشتيت: صفحة واحدة يوميًا.</p>
                <p>• يرفع الاستمرار: التقدم واضح + قفل تسلسلي.</p>
                <p>• يحمي الكتابة: حفظ واسترجاع + تصدير ملف.</p>
                <p>• يقيس الإنجاز: 28 يومًا = عادة حقيقية.</p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={DAY1_ROUTE}
                  className="rounded-2xl px-6 py-3 bg-[color:var(--ink)] text-[color:var(--parchment)] text-[14px] text-center hover:opacity-90"
                >
                  ابدأ اليوم
                </Link>
                <Link
                  href="/activate"
                  className="rounded-2xl px-6 py-3 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/45"
                >
                  لدي كود
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </LandingSection>

      {/* Daily */}
      <LandingSection
        id="daily"
        title="اليومي"
        subtitle="كيف تبدو تجربتك في الداخل؟"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Reveal>
            <FeatureCard title="آية اليوم" desc="آية قصيرة تفتح زاوية الوعي لليوم." />
          </Reveal>
          <Reveal>
            <FeatureCard
              title="3 أسئلة"
              desc={`مراقبة → إدراك → ${APP_NAME}. كتابة بسيطة لا تتجاوز دقائق.`}
            />
          </Reveal>
          <Reveal>
            <FeatureCard
              title="حفظ وتقدم"
              desc="يحفظ تلقائيًا، ويحسب التقدم من 1 إلى 28."
            />
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--parchment-deep)] p-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[12px] text-[color:var(--text-quiet)]">ميزة مهمة</div>
                <div className="font-amiri text-[20px] mt-2 text-[color:var(--ink)]">
                  لا تستطيع تخطي الأيام.
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--text-mid)]">
                  القفل التسلسلي يجعل الرحلة حقيقية: احفظ اليوم لتفتح التالي.
                </p>
              </div>

              <Link
                href="/progress"
                className="rounded-2xl px-6 py-3 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/45"
              >
                شاهد التقدم
              </Link>
            </div>
          </div>
        </Reveal>
      </LandingSection>

      {/* Pricing */}
      <LandingSection
        id="pricing"
        title="الاشتراك"
        subtitle="اختر طريقة الدخول الأنسب لك."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Reveal>
            <div className="rounded-3xl border border-[color:var(--glass-border)] bg-white/25 p-7">
              <div className="text-[12px] text-[color:var(--text-quiet)]">تجريبي</div>
              <div className="font-amiri text-[22px] mt-2 text-[color:var(--ink)]">كود تفعيل</div>
              <p className="mt-2 text-[14px] text-[color:var(--text-mid)] leading-relaxed">
                ادخل بالكود مباشرة إذا وصلك منّا.
              </p>

              <div className="mt-6">
                <Link
                  href="/activate"
                  className="block rounded-2xl px-6 py-3 bg-[color:var(--ink)] text-[color:var(--parchment)] text-[14px] text-center hover:opacity-90"
                >
                  تفعيل الآن
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--parchment-deep)] p-7">
              <div className="text-[12px] text-[color:var(--text-quiet)]">رمضان</div>
              <div className="font-amiri text-[22px] mt-2 text-[color:var(--ink)]">28 يومًا</div>
              <p className="mt-2 text-[14px] text-[color:var(--text-mid)] leading-relaxed">
                تجربة كاملة: قفل تسلسلي + تقدم + تصدير.
              </p>

              <div className="mt-6">
                <a
                  href={buildWhatsAppSubscribeUrl("ramadan_28")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl px-6 py-3 bg-[color:var(--ink)] text-[color:var(--parchment)] text-[14px] text-center hover:opacity-90"
                >
                  اشترك عبر واتساب
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-3xl border border-[color:var(--glass-border)] bg-white/25 p-7">
              <div className="text-[12px] text-[color:var(--text-quiet)]">ملفك</div>
              <div className="font-amiri text-[22px] mt-2 text-[color:var(--ink)]">تصدير البيانات</div>
              <p className="mt-2 text-[14px] text-[color:var(--text-mid)] leading-relaxed">
                احتفظ بكتاباتك في ملف JSON جاهز.
              </p>

              <div className="mt-6">
                <Link
                  href="/progress"
                  className="block rounded-2xl px-6 py-3 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/45"
                >
                  صفحة التقدم
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="rounded-3xl border border-[color:var(--glass-border)] bg-white/18 p-6 text-[13px] text-[color:var(--text-mid)] leading-relaxed">
            * ملاحظة: صفحة الاشتراك المدفوعة (Salla/WhatsApp) يمكن إضافتها لاحقًا
            بدون تغيير مسار البرنامج.
          </div>
        </Reveal>
      </LandingSection>
    </>
  );
}
