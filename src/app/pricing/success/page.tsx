import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تم الاشتراك بنجاح — تمعّن",
};

export default function PricingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">تم الاشتراك بنجاح</h1>
        <p className="text-zinc-400 leading-7 mb-8">
          مرحباً بك في رحلة تمعّن.
          <br />
          ستجد رحلتك جاهزة عند تسجيل الدخول.
        </p>
        <Link
          href="/day"
          className="inline-block bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer"
        >
          ابدأ رحلتك الآن
        </Link>
      </div>
    </div>
  );
}
