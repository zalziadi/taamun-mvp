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
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0] py-12">
        <p className="text-[#7d7362]">جارٍ التحقق...</p>
      </div>
    );
  }

  const content = (
    <div className="w-full max-w-md rounded-lg border border-[#d8cdb9]/70 bg-[#fcfaf7]/85 p-8 shadow-[0_10px_36px_rgba(122,101,66,0.12)] backdrop-blur-md md:p-10">
      <h1 className="tm-heading mb-2 text-center text-4xl font-bold text-[#2f2619]">تسجيل الدخول</h1>
      <p className="mb-8 text-center text-[#7d7362]">عُد إلى رحلة السكون</p>

      {sent ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-emerald-300">تحقق من بريدك</p>
          <p className="text-sm text-[#4e4637]">
            أرسلنا رابط الدخول إلى <span className="font-semibold text-[#2f2619]">{email}</span>
          </p>
          {notice ? (
            <p className="mt-3 rounded-lg border border-[#d8cdb9] bg-[#f8f3ea] px-3 py-2 text-xs text-[#6f6455]">
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
            className="mt-4 text-sm text-[#7d7362] underline hover:text-[#2f2619]"
          >
            تغيير البريد
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="mr-1 block text-[0.7rem] uppercase tracking-[0.2em] text-[#7d7362]">البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="بريدك الإلكتروني"
            dir="ltr"
            required
            className="w-full border-x-0 border-t-0 border-b border-[#cdbfa9] bg-transparent px-1 py-3 text-[#2f2619] placeholder:text-[#8f8576] focus:border-[#7b5804] focus:outline-none"
          />

          {error && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
              {error}
            </p>
          )}
          {notice ? (
            <p className="rounded-lg border border-[#d8cdb9] bg-[#f8f3ea] px-3 py-2 text-sm text-[#6f6455]">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || cooldownRemainingSec > 0}
            className="mt-2 w-full rounded-lg bg-[#7b5804] px-6 py-3 font-semibold tracking-[0.15em] text-[#fff8f0] transition hover:bg-[#6d4f04] disabled:opacity-50"
          >
            {loading
              ? "جارٍ الإرسال..."
              : cooldownRemainingSec > 0
              ? `انتظر ${cooldownRemainingSec}ث`
              : "دخول"}
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 block text-center text-sm text-[#7d7362] transition hover:text-[#2f2619]">
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fff8f0] text-[#1f1b10]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeZmCD9UFmRblNw_0POYhOyuoI5XsZ8_stlS2VagkD5XB0WRE_bvwYByj2VXLIocXaZ08_qaCxOHLlpZGIvoYK1yuzbh4rVZBLKytFQeCaWNoWLuoLnJtBgQ7T5jnHn000NKvi0Hqz4IOD5QFs-nSiys7slI9pOS5ctaw4stHMZywG5T1KBEQbfN9-P5pwrkTuJHUTGyev7tJt36hU2uUMWZWEMS9H4dWWctG0KhyFONHmuJUHP2f7rntesa9A6q3c4Zk6sXziPjM"
          alt=""
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(123,88,4,0.05),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f0] via-transparent to-transparent" />
      </div>

      <header className="relative z-10 flex w-full items-center justify-between px-8 py-8 md:px-12">
        <div className="font-['Amiri'] text-2xl text-[#2f2619]">تمعّن</div>
        <span className="text-[11px] tracking-[0.2em] text-[#6f6658]">SUKUN AL-HADIYA</span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        {content}
      </main>

      <footer className="relative z-10 pb-10 text-center">
        <p className="text-[11px] tracking-[0.2em] text-[#7d7362]">© TAAMUN AL-HADIYA</p>
      </footer>
    </div>
  );
}
