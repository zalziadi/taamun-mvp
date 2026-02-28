"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { StatusCard } from "../../components/StatusCard";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966553930885";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonLocked = searchParams.get("reason") === "locked";
  const [code, setCode] = useState("");
  const [cartStatus, setCartStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [activateStatus, setActivateStatus] = useState<"idle" | "loading" | "success" | "invalid" | "auth">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const errorMessages: Record<string, string> = {
    invalid_code: "الكود غير صالح",
    expired: "انتهت صلاحية الكود",
    max_uses: "تم استخدام الكود بالكامل",
    inactive: "الكود غير مفعل",
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setActivateStatus("loading");
    try {
      const res = await fetch(
        `/api/activate?code=${encodeURIComponent(trimmed)}`,
        { method: "GET" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data?.ok) {
        setActivateStatus("success");
        router.replace("/day");
      } else if (res.status === 401) {
        setActivateStatus("auth");
        setErrorCode(null);
      } else {
        setActivateStatus("invalid");
        setErrorCode(data?.error ?? "generic");
      }
    } catch {
      setActivateStatus("invalid");
      setErrorCode("generic");
    }
  };

  const subtitle = reasonLocked
    ? "لا يمكنك متابعة الرحلة بدون تفعيل الاشتراك."
    : "أدخل كود التفعيل للمتابعة.";

  const errorMsg = errorCode ? (errorMessages[errorCode] ?? "حدث خطأ. حاول مرة أخرى.") : "";

  const handleAddToCart = async () => {
    setCartStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey: "ramadan-28-base", qty: 1 }),
      });
      if (res.status === 401) {
        router.push("/auth?next=/subscribe");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setCartStatus("error");
        return;
      }
      setCartStatus("added");
      router.push("/cart");
    } catch {
      setCartStatus("error");
    }
  };

  return (
    <AppShell title="اشتراك رمضان">
      <div className="space-y-6">
        <nav className="flex gap-4">
          <Link href="/account" className="text-white/70 hover:text-white">
            تسجيل خروج
          </Link>
          <Link href="/" className="text-white/70 hover:text-white">
            العودة للرئيسية
          </Link>
        </nav>

        <h1 className="text-2xl font-bold text-white">اشتراك رمضان</h1>
        <p className="text-white/80">{subtitle}</p>

        <div className="max-w-md space-y-6">
        {reasonLocked && (
          <StatusCard
            title="لازم الاشتراك"
            message="لازم الاشتراك عشان تقدر تستخدم تمعّن."
            variant="warning"
          />
        )}

        <form onSubmit={handleActivate} className="space-y-3">
          <label htmlFor="subscribe-code" className="block text-sm text-white/80">
            كود التفعيل
          </label>
          <div className="flex gap-2">
            <input
              id="subscribe-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setActivateStatus("idle");
              }}
              placeholder="TMN-2026-XXXXXX"
              dir="ltr"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={activateStatus === "loading"}
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] disabled:opacity-50"
            >
              {activateStatus === "loading" ? "جاري..." : "تفعيل الاشتراك"}
            </button>
          </div>
          {activateStatus === "invalid" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}
          {activateStatus === "auth" && (
            <p className="text-sm text-amber-400">
              <Link href="/auth?next=/subscribe" className="underline">
                سجّل الدخول أولاً
              </Link>{" "}
              لتتمكن من تفعيل الكود.
            </p>
          )}
        </form>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/60">السعر</p>
          <p className="text-3xl font-bold text-white">280 ر.س</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartStatus === "loading"}
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] disabled:opacity-50"
            >
              {cartStatus === "loading" ? "جاري الإضافة..." : "أضف إلى السلة"}
            </button>
            <Link
              href="/cart"
              className="rounded-lg border border-white/20 px-6 py-3 font-medium text-white hover:bg-white/10"
            >
              عرض السلة
            </Link>
          </div>
          {cartStatus === "error" && (
            <p className="mt-3 text-sm text-red-400">تعذر الإضافة إلى السلة. حاول مرة أخرى.</p>
          )}
        </div>

        <p className="text-white/80">
          للاشتراك، اضغط الزر وسيتم فتح واتساب مع رسالة جاهزة.
        </p>

        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 font-medium text-white transition-colors hover:bg-[#20BD5A]"
        >
          فتح واتساب
        </a>

        <p className="text-sm text-white/70">
          إذا وصلك كود التفعيل، أدخله أعلاه واضغط تفعيل.
        </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <SubscribeContent />
    </Suspense>
  );
}
