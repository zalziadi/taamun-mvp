"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { JOURNEY_ROUTE, REFLECTION_ROUTE, PRICING_ROUTE } from "@/lib/routes";

interface AccountClientProps {
  embedded?: boolean;
  userEmail: string | null;
  userCreatedAt?: string | null;
}

export function AccountClient({ embedded, userEmail, userCreatedAt }: AccountClientProps) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedDays, setCompletedDays] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"subscribed" | "not-subscribed">("not-subscribed");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        // Check entitlement cookie
        const cookies = document.cookie.split("; ");
        const entitlementCookie = cookies.find(c => c.startsWith("taamun_entitled="));
        setSubscriptionStatus(entitlementCookie ? "subscribed" : "not-subscribed");

        // Fetch completed days from reflections table
        const { data: reflections, error: refError } = await supabase
          .from("reflections")
          .select("id, day")
          .limit(1000);

        if (refError) {
          console.error("Error fetching reflections:", refError);
          setCompletedDays(0);
        } else {
          // Count unique days with reflections
          const uniqueDays = new Set(reflections?.map(r => r.day) || []);
          setCompletedDays(uniqueDays.size);
        }
      } catch (err) {
        console.error("Error loading account data:", err);
        setCompletedDays(0);
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, []);

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

  const formatDate = (isoDate: string | null | undefined): string => {
    if (!isoDate) return "—";
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const content = (
    <div className="w-full max-w-2xl space-y-5">
      <div className="text-center">
        <h1 className="font-[var(--font-amiri)] text-3xl text-[#e8e1d9]">حسابي</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {error}
        </div>
      )}

      {/* Email Card */}
      {userEmail && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-2 text-xs text-white/50">البريد الإلكتروني</p>
          <p className="text-base font-medium text-[#c9b88a]">{userEmail}</p>
        </div>
      )}

      {/* Registration Date Card */}
      {userCreatedAt && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-2 text-xs text-white/50">تاريخ التسجيل</p>
          <p className="text-base font-medium text-[#c9b88a]">{formatDate(userCreatedAt)}</p>
        </div>
      )}

      {/* Completed Days Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-2 text-xs text-white/50">أيام التمعّن المكتملة</p>
        {loading ? (
          <p className="text-base font-medium text-white/70">جاري التحميل...</p>
        ) : (
          <p className="text-base font-medium text-[#c9b88a]">{completedDays} يوم</p>
        )}
      </div>

      {/* Subscription Status Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-2 text-xs text-white/50">حالة الاشتراك</p>
        {subscriptionStatus === "subscribed" ? (
          <p className="text-base font-medium text-[#c9b88a]">مشترك ✓</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-white/70">غير مشترك</p>
            <Link
              href={PRICING_ROUTE}
              className="rounded-lg bg-[#c9b88a] px-3 py-1.5 text-xs font-semibold text-[#15130f] transition-colors hover:bg-[#dcc9a0]"
            >
              اشترك الآن
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={JOURNEY_ROUTE}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          الرحلة
        </Link>
        <Link
          href={REFLECTION_ROUTE}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          التقدم
        </Link>
      </div>

      {/* Logout and Home Links */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {logoutLoading ? "جاري..." : "تسجيل الخروج"}
        </button>

        <Link
          href="/"
          className="block w-full rounded-xl border border-white/10 px-6 py-3 text-center text-sm text-white/60 transition-colors hover:text-white"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="flex flex-1 flex-col items-center justify-center py-8">{content}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#15130f] p-6">
      {content}
    </div>
  );
}
