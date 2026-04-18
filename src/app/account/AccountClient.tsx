"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { JOURNEY_ROUTE, PRICING_ROUTE } from "@/lib/routes";
import dynamic from "next/dynamic";
import { daysRemaining, isSubscriptionExpired } from "@/lib/subscriptionDurations";
import { CYCLE_MILESTONES, getCycleShortName } from "@/lib/taamun-cycles";

const PushSetup = dynamic(
  () => import("@/components/PushSetup").then((m) => ({ default: m.PushSetup })),
  { ssr: false }
);
const InviteShare = dynamic(
  () => import("@/components/InviteShare").then((m) => ({ default: m.InviteShare })),
  { ssr: false }
);

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
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geneKeys, setGeneKeys] = useState<Array<{ sphere: string; gene_key: number; line: number; shadow: string | null; gift: string | null; siddhi: string | null }>>([]);
  const [daysSinceCompletion, setDaysSinceCompletion] = useState<number | null>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        // Source of truth for subscription state is the profile row.
        // (entitlement cookie is httpOnly, so client-side code cannot read it reliably)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("subscription_tier, expires_at, subscription_status")
          .single();

        if (!profileError && profile) {
          const active =
            profile.subscription_status === "active" &&
            !isSubscriptionExpired(profile.expires_at);

          setSubscriptionStatus(active ? "subscribed" : "not-subscribed");
          setPlanTier(profile.subscription_tier ?? null);
          setExpiresAt(profile.expires_at ?? null);
        } else {
          setSubscriptionStatus("not-subscribed");
          setPlanTier(null);
          setExpiresAt(null);
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
              // Check if user completed all 28 days — calculate days since
              if (days.length >= 28) {
                const { data: lastLog } = await supabase
                  .from("awareness_logs")
                  .select("created_at")
                  .eq("day", 28)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (lastLog?.created_at) {
                  const completionDate = new Date(lastLog.created_at);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
                  setDaysSinceCompletion(diffDays);
                }
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

        // Fetch Gene Keys for VIP users
        const vipTiers = ["yearly", "vip", "lifetime", "premium"];
        if (profile?.subscription_tier && vipTiers.includes(profile.subscription_tier)) {
          const { data: gkData } = await supabase
            .from("user_gene_keys_profile")
            .select("sphere, gene_key, line, shadow, gift, siddhi");
          if (gkData && gkData.length > 0) {
            setGeneKeys(gkData);
          }
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
      {/* Header — Cave Theme */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9b88a]/20 bg-[#c9b88a]/10">
          <svg className="h-8 w-8 text-[#c9b88a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9" />
            <path d="M3 12h3c1 0 2 .5 2.5 1.5L10 16l2-6 2 4h2c.5-1 1.5-2 3-2h2" />
            <path d="M3 12c0 4.97 4.03 9 9 9s9-4.03 9-9" />
          </svg>
        </div>
        <h1 className="font-[var(--font-amiri)] text-xl sm:text-3xl text-[#e8e1d9]">كهفي</h1>
        <p className="text-xs text-[#c9b88a]/60">مساحتك الخاصة داخل تمعّن</p>
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
      <div className="border-t border-[#c9b88a]/20 p-4 sm:p-6 space-y-4">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : (completedDays ?? 0)}</p>
            <p className="text-xs text-white/40 mt-1">يوم مكتمل</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : currentStreak}</p>
            <p className="text-xs text-white/40 mt-1">أيام متتالية</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#c9b88a]">{loading ? "—" : (avgAwareness ?? "—")}</p>
            <p className="text-xs text-white/40 mt-1">متوسط الحضور</p>
          </div>
        </div>
      </div>

      {/* Journey Milestones — totalDays from signup */}
      {userCreatedAt && (() => {
        const totalDays = Math.floor(
          (Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const reached = CYCLE_MILESTONES
          .filter((m) => m.totalDay <= totalDays)
          .sort((a, b) => b.totalDay - a.totalDay);
        const next = CYCLE_MILESTONES
          .filter((m) => m.totalDay > totalDays)
          .sort((a, b) => a.totalDay - b.totalDay)[0];
        const currentCycle =
          typeof window !== "undefined"
            ? parseInt(localStorage.getItem("taamun.currentCycle") ?? "1", 10)
            : 1;

        if (reached.length === 0 && !next) return null;

        return (
          <div className="border-t border-[#c9b88a]/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-amiri)] text-lg text-[#e8e1d9]">معالم الرحلة</h2>
              <span className="text-[10px] text-[#c9b88a]/50">{totalDays} يوم في تمعّن</span>
            </div>

            {currentCycle > 1 && (
              <div className="rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/10 px-3 py-2.5">
                <p className="text-xs text-[#c9b88a]">الدورة الحالية: {getCycleShortName(currentCycle)}</p>
              </div>
            )}

            {reached.slice(0, 3).map((m) => (
              <div key={m.totalDay} className="flex items-start gap-3 rounded-xl border border-[#c9b88a]/10 bg-[#c9b88a]/[0.04] px-3 py-2.5">
                <span className="mt-0.5 text-sm text-[#c9b88a]">✓</span>
                <div>
                  <p className="text-sm font-semibold text-[#e8e1d9]">{m.label}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{m.description}</p>
                </div>
              </div>
            ))}

            {next && (
              <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <span className="mt-0.5 text-sm text-white/25">○</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/60">{next.label}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    بعد {next.totalDay - totalDays} يوم
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Post-Completion Counter */}
      {daysSinceCompletion !== null && daysSinceCompletion >= 0 && (
        <div className="border-t border-[#c9b88a]/25 p-5 text-center space-y-3">
          <div className="text-3xl font-bold text-[#c9b88a]">{daysSinceCompletion}</div>
          <p className="text-xs text-white/50">يوم منذ إتمام الرحلة</p>
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-white/30">
            {daysSinceCompletion <= 7
              ? "أتممت الرحلة مؤخراً — خذ وقتك تتأمل ما تغيّر فيك."
              : daysSinceCompletion <= 30
                ? "شهر من النمو. الوعي الذي بنيته لا زال ينضج — تحدّث مع تمعّن."
                : daysSinceCompletion <= 90
                  ? "٣ أشهر من التحوّل. هل لاحظت كيف تغيّرت طريقة قراءتك للقرآن؟"
                  : "رحلتك مستمرة. كل يوم فرصة للتمعّن — حتى بدون برنامج."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/challenge"
              className="rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/10 px-4 py-2 text-xs font-semibold text-[#c9b88a] transition-colors hover:bg-[#c9b88a]/20"
            >
              التحدي الأسبوعي
            </Link>
            <Link
              href="/guide"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              تحدّث مع تمعّن
            </Link>
          </div>
        </div>
      )}

      {/* Push Notifications */}
      <PushSetup />

      {/* Invite a friend — free month for both on successful subscription */}
      {subscriptionStatus === "subscribed" && <InviteShare />}

      {/* Subscription Card */}
      <div className="border-t border-[#c9b88a]/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">حالة الاشتراك</p>
            {subscriptionStatus === "subscribed" ? (
              <div>
                <p className="text-base font-medium text-[#c9b88a]">مشترك ✓</p>
                {planTier && (
                  <p className="text-xs text-white/50 mt-1">{tierLabel(planTier)}</p>
                )}
                {expiresAt && !isSubscriptionExpired(expiresAt) && (
                  <p className="text-xs text-white/40 mt-1">
                    متبقي {daysRemaining(expiresAt)} يوم — ينتهي {formatDate(expiresAt)}
                  </p>
                )}
                {expiresAt && daysRemaining(expiresAt) <= 7 && daysRemaining(expiresAt) > 0 && (
                  <p className="text-xs text-amber-400 mt-1">⚠ اشتراكك ينتهي قريباً</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-base font-medium text-white/50">
                  {expiresAt && isSubscriptionExpired(expiresAt) ? "انتهى الاشتراك" : "غير مشترك"}
                </p>
                {expiresAt && isSubscriptionExpired(expiresAt) && (
                  <p className="text-xs text-amber-400 mt-1">انتهى بتاريخ {formatDate(expiresAt)}</p>
                )}
              </div>
            )}
          </div>
          {subscriptionStatus !== "subscribed" && (
            <Link
              href={PRICING_ROUTE}
              className="rounded-lg bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#15130f] transition-colors hover:bg-[#dcc9a0]"
            >
              {expiresAt && isSubscriptionExpired(expiresAt) ? "جدّد اشتراكك" : "اشترك الآن"}
            </Link>
          )}
        </div>
      </div>

      {/* Gene Keys Map — VIP only */}
      {geneKeys.length > 0 && (
        <div className="border-t border-[#c9b88a]/25 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-amiri)] text-lg text-[#e8e1d9]">خريطتك الجينية</h2>
            <span className="rounded-full border border-[#c9b88a]/40 bg-[#c9b88a]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#c9b88a]">
              VIP
            </span>
          </div>
          <div className="space-y-2">
            {geneKeys.map((gk) => {
              const sphereLabels: Record<string, string> = {
                lifes_work: "عمل الحياة", evolution: "التطور", radiance: "الإشراق",
                purpose: "الغاية", attraction: "الجاذبية", iq: "الذكاء العقلي",
                eq: "الذكاء العاطفي", sq: "الذكاء الروحي", core: "المركز",
                culture: "الثقافة", pearl: "اللؤلؤة",
              };
              const label = sphereLabels[gk.sphere] ?? gk.sphere;
              return (
                <div
                  key={gk.sphere}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-[#e8e1d9]">{label}</p>
                    <p className="text-xs text-[#c9b88a]/70">المفتاح {gk.gene_key}.{gk.line}</p>
                  </div>
                  <div className="text-left text-[10px] leading-relaxed text-white/40">
                    <span className="text-white/30">{gk.shadow ?? "—"}</span>
                    <span className="mx-1 text-[#c9b88a]/40">→</span>
                    <span className="text-[#c9b88a]/80">{gk.gift ?? "—"}</span>
                    <span className="mx-1 text-[#c9b88a]/40">→</span>
                    <span className="text-[#c9b88a]">{gk.siddhi ?? "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/profile/map"
            className="block w-full rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/10 py-2.5 text-center text-xs font-semibold text-[#c9b88a] transition-colors hover:bg-[#c9b88a]/20"
          >
            عرض الخريطة الكاملة
          </Link>
        </div>
      )}

      {/* Account Details */}
      <div className="border-t border-[#c9b88a]/20 p-5 space-y-4">
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#15130f] p-4 sm:p-6">
      {content}
    </div>
  );
}
