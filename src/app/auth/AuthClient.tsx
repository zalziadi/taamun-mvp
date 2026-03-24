"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getAppOriginClient } from "@/lib/appOrigin";

interface AuthClientProps {
  embedded?: boolean;
}

const RESEND_COOLDOWN_MS = 60_000;

export function AuthClient({ embedded }: AuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_failed" ? "فشل التحقق. حاول مرة أخرى." : null
  );

  useEffect(() => {
    let active = true;

    const timeoutId = setTimeout(() => {
      if (active) setCheckingSession(false);
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        clearTimeout(timeoutId);
        if (!active) return;
        if (data.session) {
          router.replace("/program");
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("auth:cooldownUntil");
      if (!saved) return;
      const parsed = Number(saved);
      if (Number.isFinite(parsed) && parsed > Date.now()) {
        setCooldownUntil(parsed);
      }
    } catch {
      // Ignore localStorage failures.
    }
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemainingSec = Math.max(0, Math.ceil((cooldownUntil - nowTs) / 1000));

  function setResendCooldown() {
    const next = Date.now() + RESEND_COOLDOWN_MS;
    setCooldownUntil(next);
    setNowTs(Date.now());
    try {
      window.localStorage.setItem("auth:cooldownUntil", String(next));
    } catch {
      // Ignore localStorage failures.
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownRemainingSec > 0) {
      setNotice(`تم إرسال رابط الدخول قبل قليل. انتظر ${cooldownRemainingSec} ثانية ثم حاول مجددًا.`);
      setError(null);
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const redirectTo = `${getAppOriginClient()}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) throw signInError;
      setSent(true);
      setResendCooldown();
      setNotice("تم إرسال رابط الدخول إلى بريدك. افحص الوارد/السبام.");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const lowered = raw.toLowerCase();
      const isRateLimit =
        lowered.includes("rate limit") ||
        lowered.includes("email rate limit exceeded") ||
        lowered.includes("security purposes");

      if (isRateLimit) {
        setSent(true);
        setResendCooldown();
        setError(null);
        setNotice("تم إرسال رابط دخول مؤخرًا. يرجى فتح البريد الإلكتروني أو الانتظار قليلًا قبل إعادة المحاولة.");
      } else {
        setError("تعذر إرسال رابط الدخول الآن. حاول مرة أخرى بعد قليل.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15130f] py-12">
        <p className="text-[#c9b88a]">جارٍ التحقق...</p>
      </div>
    );
  }

  const content = (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_36px_rgba(0,0,0,0.3)] backdrop-blur-md md:p-10">
      <h1 className="mb-2 text-center font-['Amiri'] text-4xl font-bold text-[#e8e1d9]">تسجيل الدخول</h1>
      <p className="mb-8 text-center text-sm text-[#c9b88a]">عُد إلى رحلة التمعّن</p>

      {sent ? (
        <div className="rounded-xl border border-[#c9b88a]/30 bg-[#c9b88a]/10 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-[#c9b88a]">تحقق من بريدك</p>
          <p className="text-sm text-[#e8e1d9]/70">
            أرسلنا رابط الدخول إلى <span className="font-semibold text-[#e8e1d9]">{email}</span>
          </p>
          {notice ? (
            <p className="mt-3 rounded-lg border border-[#c9b88a]/20 bg-[#c9b88a]/5 px-3 py-2 text-xs text-[#c9b88a]/80">
              {notice}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
              setNotice(null);
            }}
            className="mt-4 text-sm text-[#c9b88a]/70 underline hover:text-[#c9b88a]"
          >
            تغيير البريد
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="mr-1 block text-[0.7rem] uppercase tracking-[0.2em] text-[#c9b88a]/70">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="بريدك الإلكتروني"
            dir="ltr"
            required
            className="w-full border-x-0 border-t-0 border-b border-[#c9b88a]/30 bg-transparent px-1 py-3 text-[#e8e1d9] placeholder:text-[#c9b88a]/40 focus:border-[#c9b88a] focus:outline-none"
          />

          {error && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              {error}
            </p>
          )}
          {notice ? (
            <p className="rounded-lg border border-[#c9b88a]/20 bg-[#c9b88a]/5 px-3 py-2 text-sm text-[#c9b88a]/80">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || cooldownRemainingSec > 0}
            className="mt-2 w-full rounded-xl bg-[#c9b88a] px-6 py-3 font-semibold tracking-[0.15em] text-[#15130f] transition hover:bg-[#e6d4a4] disabled:opacity-50"
          >
            {loading
              ? "جارٍ الإرسال..."
              : cooldownRemainingSec > 0
              ? `انتظر ${cooldownRemainingSec}ث`
              : "دخول"}
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 block text-center text-sm text-[#c9b88a]/60 transition hover:text-[#c9b88a]">
        العودة للرئيسية
      </Link>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-8">{content}</div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#15130f] text-[#e8e1d9]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(201,184,138,0.06),transparent_70%)]" />
      </div>

      <header className="relative z-10 flex w-full items-center justify-between px-8 py-8 md:px-12">
        <div className="font-['Amiri'] text-2xl text-[#e6d4a4]">تمعّن</div>
        <span className="text-[11px] tracking-[0.2em] text-[#c9b88a]/50">TAAMUN</span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        {content}
      </main>

      <footer className="relative z-10 pb-10 text-center">
        <p className="text-[11px] tracking-[0.2em] text-[#c9b88a]/40">© تمعّن</p>
      </footer>
    </div>
  );
}
