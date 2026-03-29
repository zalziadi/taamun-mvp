"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const [showContent, setShowContent] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 600);
    const t2 = setTimeout(() => setShowSteps(true), 1400);
    const t3 = setTimeout(() => setShowCta(true), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#15130f" }}>

      <div className="w-full max-w-md text-center space-y-8">

        {/* الأيقونة المتحركة */}
        <div className={`transition-all duration-700 ease-out ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}>
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #e6d4a4, #c9b88a)" }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#15130f" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* العنوان والوصف */}
        <div className={`transition-all duration-700 ease-out delay-100 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#e6d4a4" }}>
            تمّ الدفع بنجاح
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#cdc6b7" }}>
            اشتراكك مفعّل الآن. ستصلك رسالة على إيميلك خلال دقائق
            تحتوي كود التفعيل وخطوات البدء.
          </p>
        </div>

        {/* الخطوات */}
        <div className={`transition-all duration-700 ease-out ${
          showSteps ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <div className="rounded-xl p-6 space-y-4 text-right"
            style={{ background: "#1e1b16", border: "1px solid #37342f" }}>
            {[
              { num: "١", text: "تحقّق من بريدك الإلكتروني (خلال 5 دقائق)" },
              { num: "٢", text: "استخدم الكود لتفعيل حسابك" },
              { num: "٣", text: "ابدأ رحلة الـ 28 يوم" },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#2c2a24", color: "#e6d4a4" }}>
                  {s.num}
                </span>
                <span className="text-sm pt-0.5" style={{ color: "#e8e1d9" }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* زر البدء */}
        <div className={`transition-all duration-700 ease-out ${
          showCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <Link href="/program"
            className="inline-block rounded-lg px-8 py-3 text-base font-bold transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #e6d4a4, #c9b88a)",
              color: "#15130f",
            }}>
            ادخل البرنامج ←
          </Link>
          <p className="mt-4 text-xs" style={{ color: "#969083" }}>
            لم تستلم الإيميل؟ تحقّق من مجلد الرسائل غير المرغوب فيها
          </p>
        </div>

      </div>
    </main>
  );
}
