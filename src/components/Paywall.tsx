"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "../lib/analytics";
import { APP_NAME } from "@/lib/appConfig";

const WHATSAPP_NUMBER = "966553930885";
const MESSAGE = encodeURIComponent(`السلام عليكم،

أرغب بالاشتراك في برنامج *${APP_NAME} – رمضان 28 يوم*.

الاسم:
المدينة:
رقم الجوال:

تم تحويل مبلغ *280 ريال*.
مرفق صورة التحويل.

بانتظار تأكيد الاشتراك.
جزاكم الله خيرًا.`);

function getWhatsAppUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`;
}

interface PaywallProps {
  reason?: string;
  title?: string;
  message?: string;
}

const REASONS: Record<string, { title: string; message: string }> = {
  locked: {
    title: "لازم الاشتراك",
    message: `الاشتراك مطلوب للوصول إلى محتوى ${APP_NAME}.`,
  },
  book: {
    title: "الكتيّب متاح للمشتركين",
    message: "اشترك للوصول إلى الدليل والتطبيق.",
  },
  book_locked: {
    title: "الكتيّب مقفل",
    message: "الوصول للكتيّب متاح بعد الاشتراك.",
  },
  default: {
    title: "الوصول مقفل",
    message: "اشترك في البرنامج للوصول.",
  },
};

export function Paywall({ reason = "locked", title, message }: PaywallProps) {
  useEffect(() => {
    track("paywall_viewed", { reason });
  }, [reason]);

  const r = REASONS[reason] ?? REASONS.default;
  const t = title ?? r.title;
  const m = message ?? r.message;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
      <h2 className="mb-2 text-lg font-bold text-amber-400/90">{t}</h2>
      <p className="mb-6 text-white/85">{m}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_clicked", { from: "paywall", reason })}
          className="rounded-lg bg-[#25D366] px-6 py-3 font-medium text-white hover:bg-[#20BD5A]"
        >
          فتح واتساب للاشتراك
        </a>
        <Link
          href="/"
          className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-white hover:bg-white/10"
        >
          رجوع
        </Link>
      </div>
    </div>
  );
}
