"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="tm-shell">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="tm-heading text-3xl sm:text-5xl md:text-6xl leading-tight">عن تمعّن</h1>
          <p className="text-lg text-[#7d7362]">برنامج 28 يوماً لإعادة اكتشاف المعنى الحقيقي</p>
        </div>

        {/* Story Section */}
        <section className="tm-card p-8 space-y-4">
          <h2 className="tm-heading text-xl sm:text-3xl">ما هي تمعّن؟</h2>
          <p className="leading-8 text-[#A8A29A]">
            تمعّن ليست تطبيقاً عادياً للقرآن. إنها برنامج 28 يوماً يُعيد ضبط علاقتك بالآيات.
            كل يوم يأخذك أعمق — من السطح إلى المعنى الحقيقي.
          </p>
          <p className="leading-8 text-[#A8A29A]">
            البرنامج مستوحى من كتاب <span className="text-[#C9A84C] font-semibold">مدينة المعنى بلغة القرآن</span> —
            وهو يتحول الكلمات إلى تجربة حية بدل أن تبقى نصوصاً تقرأها.
          </p>
        </section>

        {/* How It Works Section */}
        <section className="tm-card p-8 space-y-6">
          <h2 className="tm-heading text-xl sm:text-3xl">كيف تعمل؟</h2>
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                1
              </div>
              <div>
                <h3 className="tm-heading text-xl mb-2">لحظة صمت</h3>
                <p className="text-[#A8A29A]">ابدأ باستعداد عميق. لحظة هدوء تُعدّك لاستقبال الآية.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                2
              </div>
              <div>
                <h3 className="tm-heading text-xl mb-2">آية واحدة</h3>
                <p className="text-[#A8A29A]">الآية اليومية — بسيطة، واضحة، منفردة. بدون تشتيت.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                3
              </div>
              <div>
                <h3 className="tm-heading text-xl mb-2">طبقة أعمق</h3>
                <p className="text-[#A8A29A]">طبقة مخفية تكشفها عندما تكون جاهزاً. معنى لا يُفرض — يُكتشف.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                4
              </div>
              <div>
                <h3 className="tm-heading text-xl mb-2">تأمل شخصي</h3>
                <p className="text-[#A8A29A]">دوّن ما تشعر به. التمعّن حوار بينك وبين الآية — لا أحكام.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                5
              </div>
              <div>
                <h3 className="tm-heading text-xl mb-2">قياس الوعي</h3>
                <p className="text-[#A8A29A]">أين وعيك اليوم؟ متصلاً أم مشتتاً؟ التتبع يساعدك ترى نموّك.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="tm-card p-8 space-y-4 border-[#C9A84C]/30 bg-[#fcfaf7]/80">
          <h2 className="tm-heading text-xl sm:text-3xl">فلسفتنا</h2>
          <div className="space-y-3 text-[#A8A29A] leading-8">
            <p>
              <span className="text-[#C9A84C] font-semibold">نؤمن أن التمعّن الحقيقي يبدأ بالصمت.</span>
              {' '}لا يوجد ضوضاء تزاحم المعنى.
            </p>
            <p>
              <span className="text-[#C9A84C] font-semibold">نؤمن أن العمق اختيار.</span>
              {' '}لا تُفرض الطبقات — تُكتشف عندما تكون مستعداً.
            </p>
            <p>
              <span className="text-[#C9A84C] font-semibold">نؤمن أن الصدق مع النفس أهم من الكمال.</span>
              {' '}تمعّن لا يحكم على تقدّمك. هو يحتفي بصدقك.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6">
          <h2 className="tm-heading text-xl sm:text-3xl">جاهز للبدء؟</h2>
          <p className="text-[#7d7362] max-w-2xl mx-auto">
            الرحلة تبدأ بخطوة واحدة. يوم واحد. آية واحدة. صمت واحد.
          </p>
          <button
            onClick={() => router.push("/program/day/1")}
            className="inline-block px-10 py-4 rounded-2xl bg-[#C9A84C] text-white font-semibold text-lg hover:bg-[#7a6340] transition-colors active:scale-95"
          >
            ابدأ رحلتك الآن
          </button>
        </section>

        {/* Footer Link */}
        <div className="text-center pt-4">
          <Link href="/">
            <span className="text-sm text-[#7d7362] hover:text-[#A8A29A] transition-colors">← العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
