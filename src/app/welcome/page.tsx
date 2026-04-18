"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WelcomePage() {
  useEffect(() => {
    localStorage.setItem("taamun.welcomed", "true");
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{ background: "#fcfaf7", color: "#14110F", direction: "rtl" }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <h1
          className="font-[var(--font-amiri)] text-5xl font-bold"
          style={{ color: "#5a4a35", letterSpacing: "2px" }}
        >
          تمعّن
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#8a7a65" }}>
          رحلة اكتشاف المعنى بلغة القرآن
        </p>

        {/* Philosophical question */}
        <div
          className="mx-auto mt-10 max-w-sm px-4 py-7"
          style={{ borderTop: "1px solid #c9b88a55", borderBottom: "1px solid #c9b88a55" }}
        >
          <p className="text-xl leading-[2]" style={{ letterSpacing: "0.5px" }}>
            ماذا لو أن القرآن الكريم
            <br />
            كُتب ليقرأك{" "}
            <span className="text-2xl font-bold" style={{ color: "#8a6914" }}>
              أنت
            </span>
            <br />
            قبل أن تقرأه؟
          </p>
        </div>

        {/* 3 Points */}
        <div className="mt-10 space-y-6 text-right">
          <div className="flex gap-3" style={{ direction: "rtl" }}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center text-base font-bold"
              style={{ color: "#8a6914" }}
            >
              ١
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#5a4a35" }}>
                ما هو تمعّن؟
              </p>
              <p className="mt-1 text-sm leading-[1.8]" style={{ color: "#5a4a35bb" }}>
                ليس تفسيراً، ولا درساً، ولا حفظاً.
                <br />
                <span style={{ color: "#14110F" }}>
                  ماذا لو كانت كل آية تحمل رسالة كُتبت لك وحدك؟
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3" style={{ direction: "rtl" }}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center text-base font-bold"
              style={{ color: "#8a6914" }}
            >
              ٢
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#5a4a35" }}>
                كيف يعمل؟
              </p>
              <p className="mt-1 text-sm leading-[1.8]" style={{ color: "#5a4a35bb" }}>
                ٢٨ يوماً — كل يوم آية واحدة، لحظة صمت، طبقة أعمق، وتأمل تكتبه بيدك.
                <br />
                <span style={{ color: "#14110F" }}>
                  ومعك <strong style={{ color: "#8a6914" }}>تمعّن</strong> — لكن هل سبق أن سألك
                  أحد: ماذا تشعر حين تقرأ؟
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3" style={{ direction: "rtl" }}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center text-base font-bold"
              style={{ color: "#8a6914" }}
            >
              ٣
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#5a4a35" }}>
                ماذا ستجد؟
              </p>
              <p className="mt-1 text-sm leading-[1.8]" style={{ color: "#5a4a35bb" }}>
                ليست معلومات — بل تجربة.
                <br />
                <span style={{ color: "#14110F" }}>
                  متى كانت آخر مرة توقفت فيها عند آية... وسمعت ما تقوله لك؟
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/auth"
            className="inline-block px-12 py-3 text-base font-bold border"
            style={{ background: "#5a4a35", color: "#fcfaf7", borderColor: "#5a4a35" }}
          >
            ابدأ الرحلة
          </Link>
          <p className="mt-3 text-xs" style={{ color: "#8a7a65" }}>
            أول ٣ أيام مجانية بالكامل
          </p>
        </div>

        {/* Learn more */}
        <div className="mt-8 space-y-2">
          <Link href="/?skip" className="block text-xs underline" style={{ color: "#8a7a65" }}>
            اعرف أكثر عن البرنامج
          </Link>
        </div>
      </div>
    </div>
  );
}
