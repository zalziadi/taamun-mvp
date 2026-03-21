import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TapSuccessVerifier } from "./TapSuccessVerifier";

export const metadata: Metadata = {
  title: "تم الاشتراك",
};

export default function PricingSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; tap_id?: string };
}) {
  const sid = searchParams?.session_id;
  const tapId = searchParams?.tap_id;
  return (
    <div className="tm-shell flex min-h-[55vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="tm-card max-w-md p-8">
        <p className="tm-mono text-xs tracking-[0.2em] text-[#8c7851]">شكرًا لك</p>
        <h1 className="tm-heading mt-2 text-3xl text-[#2f2619]">تم استلام الدفع</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5f5648]/85">
          تم تفعيل اشتراكك (أو جاري التفعيل خلال ثوانٍ). يمكنك متابعة رحلتك من حسابك. إذا لم تظهر الميزات فورًا، حدّث الصفحة بعد لحظات.
        </p>
        <Suspense fallback={null}>
          <TapSuccessVerifier />
        </Suspense>
        {sid ? (
          <p className="tm-mono mt-4 break-all text-[10px] text-[#a09480]">مرجع جلسة Stripe: {sid}</p>
        ) : null}
        {tapId ? (
          <p className="tm-mono mt-2 break-all text-[10px] text-[#a09480]">مرجع Tap: {tapId}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account" className="tm-gold-btn inline-flex justify-center">
            حسابي
          </Link>
          <Link href="/journey" className="tm-ghost-btn inline-flex justify-center">
            الرحلة
          </Link>
        </div>
      </div>
    </div>
  );
}
