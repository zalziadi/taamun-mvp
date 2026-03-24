"use client";

import { useState } from "react";
import { HomePage } from "@/components/stitch/HomePage";

export function HomeLanding({ ramadanClosed }: { ramadanClosed: boolean }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    try {
      // Get existing waitlist from localStorage
      const existingWaitlist = localStorage.getItem("taamun.waitlist");
      const waitlist = existingWaitlist ? JSON.parse(existingWaitlist) : [];

      // Check if email already exists
      if (!waitlist.includes(email)) {
        waitlist.push(email);
        localStorage.setItem("taamun.waitlist", JSON.stringify(waitlist));
      }

      setSubmitted(true);
      setEmail("");

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError("حدث خطأ. يرجى المحاولة لاحقاً");
    }
  };

  if (ramadanClosed) {
    return (
      <div dir="rtl" lang="ar" className="min-h-screen overflow-x-hidden bg-[#15130f] text-[#e8e1d9]">
        <div className="relative flex min-h-screen items-center justify-center px-6">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-b from-[#c9b88a]/10 to-[#15130f]" />
          </div>

          {/* Waitlist section */}
          <div className="relative z-10 mx-auto w-full max-w-md space-y-6">
            <div className="space-y-3 text-center">
              <h1 className="font-[var(--font-amiri)] text-3xl leading-[1.8] text-[#e8e1d9]">
                تمعّن يعود قريباً
              </h1>
              <p className="text-sm leading-6 text-[#c9b88a]">
                البرنامج متوقف حالياً. سجّل بريدك وسنُعلمك فور عودته.
              </p>
            </div>

            {/* Form or success message */}
            {submitted ? (
              <div className="rounded-2xl border border-[#c9b88a]/30 bg-[#c9b88a]/10 p-6 text-center">
                <p className="text-sm text-[#c9b88a]">
                  تم التسجيل بنجاح ✓
                </p>
                <p className="mt-2 text-xs text-[#c9b88a]/70">
                  سنُعلمك فور عودة تمعّن
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-[#e8e1d9] placeholder-[#c9b88a]/50 transition-colors focus:border-[#c9b88a]/50 focus:bg-white/10 focus:outline-none"
                  dir="ltr"
                />

                {error && (
                  <p className="text-center text-xs text-amber-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#c9b88a] px-4 py-3 text-sm font-semibold text-[#15130f] transition-all hover:bg-[#dcc9a0] active:scale-95 disabled:opacity-50"
                >
                  سجّلني
                </button>
              </form>
            )}

            {/* Back home link */}
            <div className="text-center">
              <a
                href="/"
                className="text-xs text-[#c9b88a]/70 transition-colors hover:text-[#c9b88a]"
              >
                العودة للرئيسية
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <HomePage />;
}
