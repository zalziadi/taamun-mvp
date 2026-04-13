import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "إلغاء الدفع — تمعّن",
};

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-zinc-700/30 text-zinc-400 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-3xl font-bold mb-3">تم إلغاء الدفع</h1>
        <p className="text-zinc-400 leading-7 mb-8">
          لم يتم خصم أي مبلغ.
          <br />
          يمكنك العودة والمحاولة مجدداً في أي وقت.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer"
        >
          العودة للباقات
        </Link>
      </div>
    </div>
  );
}
