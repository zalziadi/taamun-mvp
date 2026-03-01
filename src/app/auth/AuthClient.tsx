"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { APP_NAME } from "@/lib/appConfig";

const REDIRECT_PATH = "/program";

function getSafeRedirect(next: string | null): string {
  if (!next || typeof next !== "string") return REDIRECT_PATH;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes(":")) {
    return REDIRECT_PATH;
  }
  return trimmed;
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

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Redirect if already logged in
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
    return () => { active = false; };
  }, [router, safeNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      if (err) {
        const m = err.message.toLowerCase();
        if (m.includes("too many")) {
          setError("محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.");
        } else if (m.includes("validate email") || m.includes("invalid email")) {
          setError("البريد الإلكتروني غير صالح.");
        } else {
          setError(err.message);
        }
        return;
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

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
        <p className="mb-1 text-sm text-white/80">سجّل دخولك أو أنشئ حسابك</p>
        <p className="text-xs text-white/50">سنرسل لك رابط دخول فوري على بريدك الإلكتروني</p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-6 text-center">
          <p className="mb-2 text-lg font-bold text-green-300">✉️ تحقّق من بريدك!</p>
          <p className="text-sm text-white/70">
            أرسلنا رابط دخول إلى <span className="font-medium text-white">{email}</span>
          </p>
          <p className="mt-2 text-xs text-white/40">
            إذا لم يصلك البريد، تحقق من مجلد الرسائل غير المرغوب فيها.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(""); }}
            className="mt-4 text-sm text-white/60 underline hover:text-white"
          >
            إرسال لبريد آخر
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm text-white/80">
              البريد الإلكتروني
            </label>
            <input
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-white/90 to-white/70 px-6 py-3.5 font-bold text-[#0B0F14] transition-all duration-200 hover:from-white hover:to-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner />
                <span>جارٍ الإرسال...</span>
              </>
            ) : (
              "أرسل رابط الدخول"
            )}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
        <p className="flex justify-center gap-4 text-sm">
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
      {card}
    </div>
  );
}
