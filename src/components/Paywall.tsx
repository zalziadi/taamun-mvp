"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "../lib/analytics";
import { APP_NAME } from "@/lib/appConfig";
import { getTrialDaysUsed } from "@/lib/subscriptionAccess";

const WHATSAPP_NUMBER = "966553930885";

// Updated prices based on new design
const UPDATED_MESSAGE = encodeURIComponent(`السلام عليكم،

أرغب بالاشتراك في برنامج *${APP_NAME}*.

الاسم:
المدينة:
رقم الجوال:
الباقة المطلوبة: (ربع سنوي 199 ر.س / سنوي 699 ر.س / VIP 4999 ر.س)

بانتظار تأكيد الاشتراك.
جزاكم الله خيرًا.`);

function getWhatsAppUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${UPDATED_MESSAGE}`;
}

interface PaywallProps {
  reason?: string;
  title?: string;
  message?: string;
  type?: 'trial_active_locked' | 'trial_ended' | 'guide_limit_reached' | 'smart_paywall' | 'default';
  profile?: any; // Profile type from your auth
}

const REASONS: Record<string, { title: string; message: string; hidePrice?: boolean }> = {
  locked: {
    title: "لازم الاشتراك",
    message: `الاشتراك مطلوب للوصول إلى محتوى ${APP_NAME}.`,
  },
  book: {
    title: "الكتاب هو الأساس",
    message: "الكتاب هو الأساس الذي بُنيت عليه رحلتك",
    hidePrice: true,
  },
  book_locked: {
    title: "الكتيّب مقفل",
    message: "الوصول للكتيّب متاح بعد الاشتراك.",
  },
  tasbeeh: {
    title: "مسبحة الأسماء الحسنى",
    message: "مسبحة الأسماء الحسنى تُفتح مع اشتراكك",
    hidePrice: true,
  },
  journey: {
    title: "الرحلة الكاملة تنتظرك",
    message: "الرحلة الكاملة تنتظرك… ٢٨ يوماً من التحوّل",
    hidePrice: true,
  },
  journal: {
    title: "دفترك الشخصي",
    message: "دفترك الشخصي ينتظر أول تأمل",
    hidePrice: true,
  },
  trial_active_locked: {
    title: "قريباً…",
    message: "هذه الميزة تُفتح مع الاشتراك الكامل",
    hidePrice: true,
  },
  guide_limit_reached: {
    title: "وصلت لحد المرشد اليومي",
    message: `وصلت لحد المرشد اليومي (٥ رسائل)

المرشد يرافقك بلا حدود مع الاشتراك الكامل.
نشوفك بكرة؟ أو…`,
  },
  default: {
    title: "الوصول مقفل",
    message: "اشترك في البرنامج للوصول.",
  },
};

export function Paywall({ reason = "locked", title, message, type, profile }: PaywallProps) {
  useEffect(() => {
    track("paywall_viewed", { reason, type });
  }, [reason, type]);

  // Handle special paywall type: trial_ended
  if (type === 'trial_ended' && profile) {
    const daysUsed = getTrialDaysUsed(profile);
    const customMessage = `رحلتك بدأت… لكنها لم تكتمل

عشت ${daysUsed} أيام مع المرشد والتمعّن.
الرحلة الكاملة فيها ${28 - daysUsed} يوماً باقية —
٩ مجالات قرآنية، دفتر تأمل شخصي،
والكتاب الذي بُني عليه كل شيء.

مقعدك لا يزال محفوظاً.`;

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="mb-6 text-white/85 whitespace-pre-line">{customMessage}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/pricing"
            onClick={() => track("pricing_clicked", { from: "trial_ended_paywall" })}
            className="rounded-lg bg-amber-500 px-6 py-3.5 font-medium text-black hover:bg-amber-400"
          >
            أكمل رحلتك — ١٩٩ ر.س
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_clicked", { from: "trial_ended_paywall" })}
            className="rounded-lg bg-[#25D366] px-6 py-3.5 font-medium text-white hover:bg-[#20BD5A]"
          >
            تواصل عبر واتساب
          </a>
        </div>
      </div>
    );
  }

  // Handle smart paywall (single paywall after day 3)
  if (type === 'smart_paywall') {
    // Day-aware emotional message
    const dayNum = profile?.current_day ?? 4;
    const smartMessage = message || (
      dayNum <= 7
        ? "عشت ٣ أيام كاملة مع تمعّن. بدأت تلاحظ أشياء ما كنت تشوفها — هل تكمل؟"
        : dayNum <= 14
          ? "وصلت لمرحلة الهدية — الآيات بدأت تتكلم. الرحلة الكاملة فيها أعمق من هذا بكثير."
          : dayNum <= 21
            ? "أنت في مرحلة الاكتشاف — الأنماط بدأت تتضح. هل تكمل حتى التحوّل؟"
            : "الأيام الأخيرة هي الأقوى — التحوّل الحقيقي يحصل هنا. لا تتوقف الآن."
    );

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h3 className="mb-2 text-lg font-bold text-amber-400/90">الرحلة بدأت تتعمّق</h3>
        <p className="mb-6 text-white/85 whitespace-pre-line">
          {smartMessage}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/pricing"
            onClick={() => track("pricing_clicked", { from: "smart_paywall" })}
            className="rounded-lg bg-amber-500 px-6 py-3.5 font-medium text-black hover:bg-amber-400"
          >
            أكمل الرحلة — اشترك الآن
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_clicked", { from: "smart_paywall" })}
            className="rounded-lg bg-[#25D366] px-6 py-3.5 font-medium text-white hover:bg-[#20BD5A]"
          >
            تواصل عبر واتساب
          </a>
        </div>
      </div>
    );
  }

  // Handle special paywall type: guide_limit_reached
  if (type === 'guide_limit_reached') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h3 className="mb-2 text-lg font-bold text-amber-400/90">وصلت لحد المرشد اليومي (٥ رسائل)</h3>
        <p className="mb-6 text-white/85">
          المرشد يرافقك بلا حدود مع الاشتراك الكامل.
          <br />
          نشوفك بكرة؟ أو…
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/pricing"
            onClick={() => track("pricing_clicked", { from: "guide_limit_paywall" })}
            className="rounded-lg bg-amber-500 px-6 py-3.5 font-medium text-black hover:bg-amber-400"
          >
            افتح المرشد بلا حدود — اشترك الآن
          </a>
        </div>
      </div>
    );
  }

  // Default behavior
  const r = REASONS[reason] ?? REASONS.default;
  const t = title ?? r.title;
  const m = message ?? r.message;
  
  // For trial_active_locked, show a simpler lock message
  if (type === 'trial_active_locked' || r.hidePrice) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-amber-400/90 text-center">🔒 {m}</p>
      </div>
    );
  }

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
          className="rounded-lg bg-[#25D366] px-6 py-3.5 font-medium text-white hover:bg-[#20BD5A]"
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
