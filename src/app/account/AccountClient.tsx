"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { buildWhatsAppSubscribeUrl } from "@/lib/whatsapp";
import { formatPlanEndDate, getPlanLabel } from "@/lib/plans";
import { DAY1_ROUTE } from "@/lib/routes";
import { setEntitlement as setLocalEntitlement } from "@/lib/storage";

interface AccountClientProps {
  embedded?: boolean;
  userEmail: string | null;
  initialEntitlement: {
    plan: string | null;
    endsAt: string | null;
    status: string | null;
  };
  initialPlanLabel: string;
  initialEndsAtLabel: string;
}

export function AccountClient({
  embedded,
  userEmail,
  initialEntitlement,
  initialPlanLabel,
  initialEndsAtLabel,
}: AccountClientProps) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState(initialEntitlement);
  const [friendlyPlan, setFriendlyPlan] = useState(initialPlanLabel);
  const [friendlyEndsAt, setFriendlyEndsAt] = useState(initialEndsAtLabel);
  const [activationCode, setActivationCode] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  const loadEntitlement = async () => {
    try {
      const res = await fetch("/api/entitlement", { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as {
        active?: boolean;
        plan?: string | null;
        endsAt?: string | null;
        status?: string | null;
      };
      if (data.active) {
        setLocalEntitlement("active");
      }
      const nextEntitlement = {
        plan: data.plan ?? null,
        endsAt: data.endsAt ?? null,
        status: data.status ?? null,
      };
      setEntitlement(nextEntitlement);
      setFriendlyPlan(getPlanLabel(nextEntitlement.plan));
      setFriendlyEndsAt(formatPlanEndDate(nextEntitlement.plan, nextEntitlement.endsAt));
    } catch {
      // ignore entitlement fetch errors in account page
    }
  };

  const handleLogout = async () => {
    setError(null);
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivationError(null);
    setActivationSuccess(null);

    const code = activationCode.trim().toUpperCase();
    if (!code) {
      setActivationError("أدخل كود التفعيل.");
      return;
    }

    try {
      setActivationLoading(true);
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (data.ok) {
        setLocalEntitlement("active");
        setActivationSuccess("تم تفعيل الاشتراك بنجاح.");
        setEntitlement((prev) => ({ ...prev, status: "active", plan: prev.plan ?? "ramadan_28" }));
        setFriendlyPlan("رمضان 28 يوم");
        setFriendlyEndsAt("30 رمضان 1447 هـ الموافق 29 مارس 2026");
        setActivationCode("");
        await loadEntitlement();
        router.refresh();
        return;
      }

      if (data.error === "ramadan_ended") {
        setActivationError("انتهت فترة تفعيل باقة رمضان.");
      } else if (data.error === "not_found" || data.error === "invalid_format") {
        setActivationError("الكود غير صالح.");
      } else {
        setActivationError("تعذر التفعيل الآن. حاول مرة أخرى.");
      }
    } catch {
      setActivationError("حدث خطأ غير متوقع.");
    } finally {
      setActivationLoading(false);
    }
  };

  const content = (
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">حسابي</h1>

        {userEmail && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="mb-1 text-sm text-white/60">البريد الإلكتروني</p>
            <p className="text-lg text-white">{userEmail}</p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="mb-1 text-sm text-white/60">الباقة الحالية</p>
          <p className="text-lg text-white">{friendlyPlan}</p>
          <p className="mt-3 mb-1 text-sm text-white/60">صالحة حتى</p>
          <p className="text-white/90">{friendlyEndsAt}</p>
          <p className="mt-3 mb-1 text-sm text-white/60">حالة الاشتراك</p>
          <p className="text-white/90">{entitlement.status ?? "غير مفعّل"}</p>
          <a
            href={buildWhatsAppSubscribeUrl("ramadan_28")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            الدعم عبر واتساب
          </a>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="mb-1 text-sm text-white/60">تفعيل الاشتراك</p>
          <p className="mb-3 text-sm text-white/80">أدخل كود التفعيل لتحديث باقتك مباشرة.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => {
                setActivationCode(e.target.value);
                if (activationError) setActivationError(null);
                if (activationSuccess) setActivationSuccess(null);
              }}
              placeholder="TAAMUN-XXXX"
              dir="ltr"
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleActivate}
              disabled={activationLoading}
              className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0B0F14] disabled:opacity-50"
            >
              {activationLoading ? "جارٍ..." : "تفعيل"}
            </button>
          </div>
          {activationError ? (
            <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              {activationError}
            </p>
          ) : null}
          {activationSuccess ? (
            <div className="mt-3 space-y-3">
              <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {activationSuccess}
              </p>
              <button
                type="button"
                onClick={() => router.push(DAY1_ROUTE)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                ابدأ اليوم الأول
              </button>
            </div>
          ) : null}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="mb-4 w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {logoutLoading ? "جاري..." : "تسجيل الخروج"}
        </button>

        <Link
          href="/"
          className="block w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-white/10"
        >
          الرئيسية
        </Link>
      </div>
  );

  if (embedded) {
    return <div className="flex flex-1 flex-col items-center justify-center py-8">{content}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      {content}
    </div>
  );
}
