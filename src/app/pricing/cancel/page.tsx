import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إلغاء الدفع",
};

export default function PricingCancelPage() {
  return (
    <div className="tm-shell flex min-h-[55vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="tm-card max-w-md p-8">
        <h1 className="tm-heading text-3xl text-[#2f2619]">لم يكتمل الدفع</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5f5648]/85">
          ألغيتَ عملية الدفع أو حدث خطأ. يمكنك العودة لصفحة الأسعار والمحاولة مرة أخرى عندما تكون جاهزًا.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/pricing" className="tm-gold-btn inline-flex justify-center">
            العودة للأسعار
          </Link>
          <Link href="/" className="tm-ghost-btn inline-flex justify-center">
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
