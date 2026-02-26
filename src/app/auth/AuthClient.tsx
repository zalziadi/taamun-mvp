"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { APP_NAME } from "@/lib/appConfig";

type Tab = "signin" | "signup";

const REDIRECT_PATH = "/day";

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
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "البريد أو كلمة المرور غير صحيحة";
  if (m.includes("email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولاً";
  if (m.includes("already registered") || m.includes("already exists")) return "هذا البريد مسجّل بالفعل. سجّل الدخول.";
  if (m.includes("password") && m.includes("at least")) return "كلمة المرور يجب أن تكون ٦ أحرف على الأقل";
  if (m.includes("validate email") || m.includes("invalid email")) return "البريد الإلكتروني غير صالح";
  if (m.includes("too many")) return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
  return message;
}

function focusTargetForError(message: string): "email" | "password" | null {
  const m = message.toLowerCase();
  if (m.includes("validate email") || m.includes("invalid email")) return "email";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "password";
  return null;
}

function isTooManyRequests(message: string): boolean {
  return message.toLowerCase().includes("too many");
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0B0F14] border-t-transparent" />
  );
}

const COOLDOWN_SECONDS = 5;

interface AuthClientProps {
  embedded?: boolean;
}

export function AuthClient({ embedded }: AuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = getSafeRedirect(searchParams.get("next"));
  const isActivationFlow = safeNext.startsWith("/activate");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>(() => (isActivationFlow ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signupNeedsConfirm, setSignupNeedsConfirm] = useState(false);
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSignupNeedsConfirm(false);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        const msg = translateError(err.message);
        setError(msg);
        if (isTooManyRequests(err.message)) setCooldownSeconds(COOLDOWN_SECONDS);
        else {
          const target = focusTargetForError(err.message);
          setTimeout(() => (target === "email" ? emailRef.current?.focus() : target === "password" ? passwordRef.current?.focus() : null), 0);
        }
        return;
      }
      router.replace(safeNext);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSignupNeedsConfirm(false);
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        const msg = translateError(err.message);
        setError(msg);
        if (isTooManyRequests(err.message)) setCooldownSeconds(COOLDOWN_SECONDS);
        else {
          const target = focusTargetForError(err.message);
          setTimeout(() => (target === "email" ? emailRef.current?.focus() : target === "password" ? passwordRef.current?.focus() : null), 0);
        }
        return;
      }
      if (data.session) {
        router.replace(safeNext);
        router.refresh();
        return;
      }
      setSignupNeedsConfirm(true);
      setTab("signin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = tab === "signin" ? handleSignIn : handleSignUp;
  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError(null);
    setSignupNeedsConfirm(false);
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

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signin"}
            aria-controls="auth-form"
            id="tab-signin"
            onClick={() => handleTabChange("signin")}
            onKeyDown={(e) => e.key === "Enter" && handleTabChange("signin")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === "signin"
                ? "translate-y-[-1px] bg-white/20 text-white shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            تسجيل دخول
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signup"}
            aria-controls="auth-form"
            id="tab-signup"
            onClick={() => handleTabChange("signup")}
            onKeyDown={(e) => e.key === "Enter" && handleTabChange("signup")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === "signup"
                ? "translate-y-[-1px] bg-white/20 text-white shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4" role="tabpanel">
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
          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm text-white/80">
              كلمة المرور
            </label>
            <input
              ref={passwordRef}
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              minLength={8}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 ring-white/20 transition-all duration-200 focus:border-white/20 focus:outline-none focus:ring-2 disabled:opacity-60"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-white/50">٨ أحرف على الأقل</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {signupNeedsConfirm && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
              <p className="text-sm text-blue-300">
                تم إنشاء الحساب. راجع بريدك لتأكيد التسجيل ثم سجّل الدخول.
              </p>
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
                <span>جارٍ التحقق...</span>
              </>
            ) : isCooldown ? (
              <span>انتظر {cooldownSeconds} ثانية</span>
            ) : tab === "signin" ? (
              isActivationFlow ? "تسجيل الدخول للمتابعة" : "تسجيل دخول"
            ) : (
              isActivationFlow ? "إنشاء حساب للمتابعة" : "إنشاء حساب"
            )}
          </button>
        </form>

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
