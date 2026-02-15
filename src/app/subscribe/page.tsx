"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { setEntitlement, isEntitled, isAdminEnabled } from "../../lib/storage";
import { getAppOriginClient } from "../../lib/appOrigin";
import { StatusCard } from "../../components/StatusCard";

const WHATSAPP_NUMBER = "966553930885";

const MESSAGE = encodeURIComponent(`السلام عليكم،

أرغب بالاشتراك في برنامج *تمعّن – رمضان 28 يوم*.

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

function SubscribeContent() {
  const searchParams = useSearchParams();
  const reasonBookLocked = searchParams.get("reason") === "book_locked";
  const reasonLocked = searchParams.get("reason") === "locked";
  const entitled = isEntitled();
  const isAdmin = isAdminEnabled();
  const origin = getAppOriginClient();

  const handleWhatsAppClick = () => {
    setEntitlement("pending");
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-white">الاشتراك</h1>

      <div className="max-w-md space-y-6">
        {reasonLocked && (
          <StatusCard
            title="لازم الاشتراك"
            message="لازم الاشتراك عشان تقدر تستخدم تمعّن."
            variant="warning"
          />
        )}
        {reasonBookLocked && (
          <StatusCard
            title="الكتيّب مقفل"
            message="الوصول للكتيّب متاح بعد الاشتراك. اضغط فتح واتساب وارسِل الرسالة."
            variant="warning"
          />
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/60">السعر</p>
          <p className="text-3xl font-bold text-white">280 ر.س</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-medium text-white/90">مقارنة الباقات</p>
          <div className="text-sm text-white/80">
            <p className="font-medium text-white/90">باقة 280:</p>
            <ul className="list-disc list-inside mr-2 mt-1 space-y-0.5">
              <li>برنامج تمعّن 28 يوم</li>
              <li>تحميل الكتيّب</li>
            </ul>
          </div>
          <div className="text-sm text-white/80">
            <p className="font-medium text-white/90">باقة 820:</p>
            <ul className="list-disc list-inside mr-2 mt-1 space-y-0.5">
              <li>كل ما في باقة 280</li>
              <li>جلسات مسح الآية غير محدودة</li>
            </ul>
          </div>
        </div>

        <p className="text-white/80">
          للاشتراك، اضغط الزر وسيتم فتح واتساب مع رسالة جاهزة.
        </p>

        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 font-medium text-white transition-colors hover:bg-[#20BD5A]"
        >
          فتح واتساب
        </a>

        {entitled && (
          <a
            href="/book/City_of_Meaning_Quran_AR_EN_v0.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            تحميل الكتيّب
          </a>
        )}

        <p className="text-sm text-amber-400/90">حالة: Pending</p>

        <p className="text-sm text-white/70">
          إذا وصلك كود التفعيل{" "}
          <Link href="/activate" className="text-white underline hover:no-underline">
            اضغط هنا
          </Link>
        </p>

        {isAdmin && origin && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-sm font-medium text-white/90">رسالة تفعيل جاهزة</p>
            <p className="text-sm text-white/70">
              تم تأكيد تحويلك ✅ هذا رابط التفعيل: {origin}/activate?code=TAAMUN-001
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <SubscribeContent />
    </Suspense>
  );
}
