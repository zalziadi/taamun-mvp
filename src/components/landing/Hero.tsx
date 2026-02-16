"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/landing/Reveal";
import { track } from "@/lib/analytics";

export function LandingHero() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    track("landing_view");
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border border-[color:var(--glass-border)] bg-white/30 text-[12px] text-[color:var(--text-mid)]">
              28 يومًا • رحلة رمضان
            </div>
          </Reveal>

          <Reveal>
            <h1 className="font-amiri text-[40px] sm:text-[54px] leading-[1.05] text-[color:var(--ink)]">
              تمعّن
            </h1>
          </Reveal>

          <Reveal>
            <p className="text-[15px] sm:text-[17px] text-[color:var(--text-mid)] leading-relaxed">
              برنامج يومي يساعدك على بناء عادة التمعّن خلال 28 يومًا: مراقبة →
              إدراك → تمعّن.
            </p>
          </Reveal>

          <Reveal className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/day/1"
              className="rounded-2xl px-6 py-3 bg-[color:var(--ink)] text-[color:var(--parchment)] text-[14px] text-center hover:opacity-90"
            >
              ابدأ اليوم
            </Link>

            <Link
              href="/progress"
              className="rounded-2xl px-6 py-3 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/45"
            >
              شاهد التقدم
            </Link>

            <Link
              href="/activate"
              className="rounded-2xl px-6 py-3 border border-[color:var(--glass-border)] bg-white/0 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/20"
            >
              لدي كود
            </Link>
          </Reveal>

          <Reveal>
            <div className="mt-6 rounded-2xl border border-[color:var(--glass-border)] bg-white/25 p-5">
              <div className="text-[12px] text-[color:var(--text-quiet)]">
                آية اليوم
              </div>
              <div className="font-amiri text-[20px] mt-2 text-[color:var(--ink)]">
                ﴿ وَاللَّهُ مَعَ الصَّابِرِينَ ﴾
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--parchment-deep)] p-8 min-h-[320px]">
          <div className="text-[13px] text-[color:var(--text-quiet)]">لمحة</div>
          <div className="mt-3 space-y-3 text-[color:var(--ink-soft)] text-[14px] leading-relaxed">
            <p>• كتابة يومية بسيطة</p>
            <p>• شريط تقدم واضح</p>
            <p>• قفل تسلسلي يمنع التخطي</p>
            <p>• تصدير ملف التمعّن (JSON)</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
