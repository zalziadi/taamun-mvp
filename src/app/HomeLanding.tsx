"use client";

import { HomePage } from "@/components/stitch/HomePage";

export function HomeLanding({ ramadanClosed }: { ramadanClosed: boolean }) {
  return (
    <div>
      {ramadanClosed ? (
        <div className="mx-auto mt-4 w-full max-w-[1080px] rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          تم إيقاف برنامج رمضان (٢٨ يوم) مؤقتًا، وسيعود لاحقًا ضمن العضويات المدفوعة. تم تحويلك للواجهة الرئيسية.
        </div>
      ) : null}
      <HomePage />
    </div>
  );
}
