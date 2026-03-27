"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { JOURNEY_ROUTE, PRICING_ROUTE } from "@/lib/routes";

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
  const [avgAwareness, setAvgAwareness] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"subscribed" | "not-subscribed">("not-subscribed");
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        // Check entitlement cookie
        const cookies = document.cookie.split("; ");
        const entitlementCookie = cookies.find(c => c.startsWith("taamun_entitled="));
        setSubscriptionStatus(entitlementCookie ? "subscribed" : "not-subscribed");

        // Try to get profile tier info
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier")
          .single();
        if (profile?.tier) {
          setPlanTier(profile.tier);
        }

        // Fetch completed days from progress API (source of truth)
        try {
          const progressRes = await fetch("/api/program/progress");
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            if (progressData.ok) {
              const days: number[] = progressData.completed_days ?? [];
              setCompletedDays(days.length);

              // Calculate streak from completed_days
              if (days.length > 0) {
                const sorted = [...days].sort((a, b) => b - a);
                let streak = 1;
                for (let i = 1; i < sorted.length; i++) {
                  if (sorted[i] === sorted[i - 1] - 1) {
                    streak++;
                  } else {
                    break;
                  }
                }
                setCurrentStreak(streak);
              }
            } else {
              setCompletedDays(0);
            }
          } else {
            setCompletedDays(0);
          }
        } catch {
          setCompletedDays(0);
        }

        // Fetch average awareness — level is a string, map to score
        const levelScore: Record<string, number> = {
          present: 3,
          tried: 2,
          distracted: 1,
        };
        const { data: awarenessData } = await supabase
          .from("awareness_logs")
          .select("level")
          .limit(1000);

        if (awarenessData && awarenessData.length > 0) {
          const total = awarenessData.reduce(
            (sum, a) => sum + (levelScore[a.level as string] ?? 0),
            0
          );
          const avg = total / awarenessData.length;
          setAvgAwareness(Math.round(avg * 10) / 10);
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

  const tierLabel = (tier: string | null): string => {
    if (!tier) return "—";
    switch (tier) {
      case "eid": return "العيدية — ٢٨ ر.س";
      case "monthly": return "المسار — ٨٢ ر.س";
      case "yearly": return "التمكين — ٨٢٠ ر.س";
      case "vip": return "الخلوة — ٨,٢٠٠ ر.س";
      default: return tier;
    }
  };

  const progressPercent = completedDays !== null ? Math.round((completedDays / 28) * 100) : 0;

  const content = (
    <div className="w-full max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9b88a]/20 bg-[#c9b88a]/10">
          <svg className="h-8 w-8 text-[#c9b88a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
            <path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
          </svg>
        </div>
        <h1 className="font-[var(--font-amiri)] text-3xl text-[#e8e1d9]">حسابي</h1>
        {userEmail && (
          <p className="text-sm text-[#c9b88a]">{userEmail}</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {error}
        </div>
      )}

      {/* Progress Overview */}
      <div className="rounded-2xl border border-[#c9b88a]/15 bg-[#1d1b17] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-amiri)] text-lg text-[#e8e1d9]">رحلة التمعّن</h2>
          <span className="text-xs text-[#c9b88a]">
            {loading ? "..." : `${completedDays ?? 0} / ٢٨ يوم`}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#c9b88a] to-[#e0c29a] transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : (completedDays ?? 0)}</p>
            <p className="text-[10px] text-white/40 mt-1">يوم مكتمل</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : currentStreak}</p>
            <p className="text-[10px] text-white/40 mt-1">أيام متتالية</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : (avgAwareness ?? "—")}</p>
            <p className="text-[10px] text-white/40 mt-1">متوسط الحضور</p>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="rounded-2xl border border-[#c9b88a]/15 bg-[#1d1b17] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">حالة الاشتراك</p>
            {subscriptionStatus === "subscribed" ? (
              <div>
                <p className="text-base font-medium text-[#c9b88a]">مشترك ✓</p>
                {planTier && (
                  <p className="text-xs text-white/50 mt-1">{tierLabel(planTier)}</p>
                )}
              </div>
            ) : (
              <p className="text-base font-medium text-white/50">غير مشترك</p>
            )}
          </div>
          {subscriptionStatus !== "subscribed" && (
            <Link
              href={PRICING_ROUTE}
              className="rounded-lg bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#15130f] transition-colors hover:bg-[#dcc9a0]"
            >
              اشترك الآن
            </Link>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-2xl border border-[#c9b88a]/15 bg-[#1d1b17] p-5 space-y-4">
        <h2 className="font-[var(--font-amiri)] text-lg text-[#e8e1d9]">تفاصيل الحساب</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-xs text-white/40">البريد الإلكتروني</span>
            <span className="text-sm text-[#e8e1d9]">{userEmail ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-xs text-white/40">تاريخ التسجيل</span>
            <span className="text-sm text-[#e8e1d9]">{formatDate(userCreatedAt)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-white/40">الباقة</span>
            <span className="text-sm text-[#e8e1d9]">{tierLabel(planTier)}</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={JOURNEY_ROUTE}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#c9b88a]/15 bg-[#1d1b17] px-4 py-3.5 text-sm font-medium text-[#e8e1d9] transition-colors hover:bg-[#221f1b]"
        >
          <svg className="h-4 w-4 text-[#c9b88a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17h4l3-8 4 10 3-6h4" />
          </svg>
          الرحلة
        </Link>
        <Link
          href="/program"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#c9b88a]/15 bg-[#1d1b17] px-4 py-3.5 text-sm font-medium text-[#e8e1d9] transition-colors hover:bg-[#221f1b]"
        >
          <svg className="h-4 w-4 text-[#c9b88a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          البرنامج
        </Link>
      </div>

      {/* Logout */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {logoutLoading ? "جاري..." : "تسجيل الخروج"}
        </button>

        <Link
          href="/"
          className="block w-full rounded-xl px-6 py-3 text-center text-xs text-white/30 transition-colors hover:text-white/50"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="flex flex-1 flex-col items-center justify-center px-4">{content}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#15130f] p-6">
      {content}
    </div>
  );
}
