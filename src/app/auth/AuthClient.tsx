"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getAppOriginClient } from "@/lib/appOrigin";
import { APP_NAME } from "@/lib/appConfig";

const REDIRECT_PATH = "/day";
const COOLDOWN_SECONDS = 60;

function getSafeRedirect(next: string | null): string {
  if (!next || typeof next !== "string") return REDIRECT_PATH;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes(":")) {
    return REDIRECT_PATH;
  }
  return trimmed;
}

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("validate email") || m.includes("invalid email")) return "البريد الإلكتروني غير صالح";
  if (m.includes("too many") || m.includes("rate limit")) return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
  if (m.includes("signups not allowed")) return "التسجيل مغلق حالياً.";
  return message;
}

function isTooManyRequests(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("too many") || m.includes("rate limit");
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0B0F14] border-t-transparent" />
  );
}

interface AuthClientProps {
  embedded?: boolean;
}

export function AuthClient({ embedded }: AuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = getSafeRedirect(searchParams.get("next"));
  const isActivationFlow = safeNext.startsWith("/activate");
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const e = searchParams.get("error");
    if (e === "auth_failed") return "فشل التحقق من الرابط. حاول مرة أخرى.";
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldownSeconds]);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (session) {
          router.replace(safeNext);
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (!active) return;
        setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [router, safeNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const origin = getAppOriginClient();
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });
      if (err) {
        const msg = translateError(err.message);
        setError(msg);
        if (isTooManyRequests(err.message)) setCooldownSeconds(COOLDOWN_SECONDS);
        else setTimeout(() => emailRef.current?.focus(), 0);
        return;
      }
      setSent(true);
      setCooldownSeconds(COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const isCooldown = cooldownSeconds > 0;
  const submitDisabled = loading || isCooldown;

  if (checkingSession) {
    return (
      <div className={`flex items-center justify-center p-6 ${embedded ? "min-h-[16rem]" : "min-h-screen"}`}>
        <p className="text-white/70">جارٍ التحقق...</p>
      </div>
    );
  }

  const card = (
    <div
      className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      style={{ animation: "auth-card-enter 250ms ease-out forwards" }}
    >
      <div className="mb-6 text-center">
        <h1 className="mb-1 text-2xl font-bold tracking-wide text-white">{APP_NAME}</h1>
        <p className="mb-1 text-sm text-white/80">
          {isActivationFlow
            ? "أنشئ حسابك أو سجّل الدخول لإكمال التفعيل"
            : "ادخل لتكمل رحلة 28 يومًا في رمضان"}
        </p>
        <p className="text-xs text-white/50">بياناتك محفوظة. خروجك في أي وقت.</p>
      </div>

      {sent ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
            <p className="text-sm font-medium text-emerald-300">تم إرسال رابط الدخول!</p>
            <p className="mt-1 text-xs text-white/60">افتح بريدك الإلكتروني وانقر الرابط للدخول.</p>
            <p className="mt-2 text-xs text-white/40 font-mono">{email}</p>
          </div>
          <button
            type="button"
            disabled={isCooldown}
            onClick={() => setSent(false)}
            className="text-sm text-white/60 underline disabled:opacity-40 disabled:cursor-default"
          >
            {isCooldown ? `إعادة الإرسال بعد ${cooldownSeconds}ث` : "لم يصل؟ أعد الإرسال"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm text-white/80">
              البريد الإلكتروني
            </label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 ring-white/20 transition-all duration-200 focus:border-white/20 focus:outline-none focus:ring-2 disabled:opacity-60"
              placeholder="example@mail.com"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-white/90 to-white/70 px-6 py-3.5 font-bold text-[#0B0F14] transition-all duration-200 hover:from-white hover:to-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner />
                <span>جارٍ الإرسال...</span>
              </>
            ) : isCooldown ? (
              <span>انتظر {cooldownSeconds} ثانية</span>
            ) : (
              "أرسل رابط الدخول"
            )}
          </button>
          <p className="text-center text-xs text-white/50">
            سنرسل رابطاً مباشراً إلى بريدك. لا كلمة مرور.
          </p>
        </form>
      )}

      <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
        <p className="flex justify-center gap-4 text-sm">
          <Link href="/account" className="text-white/70 underline hover:text-white">
            حسابي
          </Link>
          <Link href="/" className="text-white/70 underline hover:text-white">
            العودة للرئيسية
          </Link>
        </p>
        <p className="text-center text-xs text-white/40">
          باستخدامك للتطبيق أنت توافق على سياسة الخصوصية.
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="flex flex-1 flex-col items-center justify-center py-8">{card}</div>;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-[#05070C] to-[#0A0F1A] px-4 pt-24 pb-12"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,255,255,0.3), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {card}
    </div>
  );
}
