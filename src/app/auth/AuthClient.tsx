"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getAppOriginClient } from "@/lib/appOrigin";

interface AuthClientProps {
  embedded?: boolean;
}

type AuthMethod = "email" | "phone";
type PhoneStep = "input" | "verify";

const RESEND_COOLDOWN_MS = 60_000;
const OTP_LENGTH = 6;

export function AuthClient({ embedded }: AuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  // Email state
  const [email, setEmail] = useState("");

  // Phone state
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Shared state
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
      .getUser()
      .then(({ data, error }) => {
        clearTimeout(timeoutId);
        if (!active) return;
        if (!error && data.user) {
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

  /** Normalize phone: ensure it starts with + and country code */
  function normalizePhone(raw: string): string {
    let cleaned = raw.replace(/[\s\-()]/g, "");
    // If starts with 05 → Saudi number, prepend +966
    if (cleaned.startsWith("05")) {
      cleaned = "+966" + cleaned.slice(1);
    }
    // If starts with 5 and is 9 digits → Saudi
    if (cleaned.startsWith("5") && cleaned.length === 9) {
      cleaned = "+966" + cleaned;
    }
    // If starts with 966 without + → add +
    if (cleaned.startsWith("966") && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    // If no + at all → add +
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  }

  // ── Email submit ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
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

  // ── Phone: send OTP via Twilio Verify ──
  const handlePhoneSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownRemainingSec > 0) {
      setNotice(`تم إرسال الكود قبل قليل. انتظر ${cooldownRemainingSec} ثانية ثم حاول مجددًا.`);
      setError(null);
      return;
    }

    const normalized = normalizePhone(phone);
    if (normalized.length < 10) {
      setError("أدخل رقم جوال صحيح.");
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "invalid_phone") {
          setError("رقم الجوال غير صحيح. تأكد من الرقم وحاول مجددًا.");
        } else {
          setError("تعذر إرسال كود التحقق. حاول مجددًا.");
        }
        return;
      }
      setPhoneStep("verify");
      setResendCooldown();
      setNotice("تم إرسال كود التحقق إلى جوالك.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) {
      console.error("[Phone OTP] Send error:", e);
      setError("تعذر إرسال كود التحقق. حاول مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  // ── Phone: verify OTP via Twilio Verify → Supabase session ──
  const handlePhoneVerify = async (codeStr?: string) => {
    const code = codeStr ?? otpDigits.join("");
    if (code.length !== OTP_LENGTH) {
      setError("أدخل الكود المكون من 6 أرقام.");
      return;
    }

    const normalized = normalizePhone(phone);
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "wrong_code") {
          setError("الكود غير صحيح. تأكد وأعد المحاولة.");
        } else if (data.error === "max_attempts") {
          setError("تم تجاوز عدد المحاولات. أعد إرسال الكود.");
        } else {
          setError("فشل التحقق. حاول مجددًا.");
        }
        return;
      }

      // Use the hashed_token to create a Supabase session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: "magiclink",
      });
      if (verifyError) throw verifyError;
      router.replace("/program");
    } catch (e) {
      console.error("[Phone OTP] Verify error:", e);
      setError("فشل تسجيل الدخول. حاول مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    if (error) setError(null);

    // Auto-focus next
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === OTP_LENGTH - 1) {
      const full = newDigits.join("");
      if (full.length === OTP_LENGTH) {
        handlePhoneVerify(full);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    // Focus last filled or the next empty
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
    // Auto-submit if complete
    if (pasted.length === OTP_LENGTH) {
      handlePhoneVerify(pasted);
    }
  };

  // ── Reset on method change ──
  const switchMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setError(null);
    setNotice(null);
    setSent(false);
    setPhoneStep("input");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15130f] py-12">
        <p className="text-[#c9b88a]">جارٍ التحقق...</p>
      </div>
    );
  }

  // ── Method toggle ──
  const methodToggle = (
    <div className="mb-6 flex items-center justify-center gap-1 rounded-xl bg-white/5 p-1">
      <button
        type="button"
        onClick={() => switchMethod("phone")}
        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
          authMethod === "phone"
            ? "bg-[#c9b88a]/20 text-[#c9b88a]"
            : "text-[#c9b88a]/50 hover:text-[#c9b88a]/70"
        }`}
      >
        رقم الجوال
      </button>
      <button
        type="button"
        onClick={() => switchMethod("email")}
        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
          authMethod === "email"
            ? "bg-[#c9b88a]/20 text-[#c9b88a]"
            : "text-[#c9b88a]/50 hover:text-[#c9b88a]/70"
        }`}
      >
        البريد الإلكتروني
      </button>
    </div>
  );

  // ── Email sent confirmation ──
  const emailSentView = (
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
  );

  // ── Email form ──
  const emailForm = (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
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
  );

  // ── Phone: input step ──
  const phoneInputForm = (
    <form onSubmit={handlePhoneSend} className="space-y-4">
      <label className="mr-1 block text-[0.7rem] uppercase tracking-[0.2em] text-[#c9b88a]/70">رقم الجوال</label>
      <div className="flex items-center gap-2" dir="ltr">
        <span className="shrink-0 text-sm text-[#c9b88a]/60">+966</span>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setPhone(e.target.value.replace(/[^\d+\s\-()]/g, ""));
            if (error) setError(null);
          }}
          placeholder="5XXXXXXXX"
          dir="ltr"
          required
          className="w-full border-x-0 border-t-0 border-b border-[#c9b88a]/30 bg-transparent px-1 py-3 text-[#e8e1d9] placeholder:text-[#c9b88a]/40 focus:border-[#c9b88a] focus:outline-none"
        />
      </div>

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
          : "إرسال كود التحقق"}
      </button>
    </form>
  );

  // ── Phone: OTP verify step ──
  const phoneVerifyForm = (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#c9b88a]/30 bg-[#c9b88a]/10 p-4 text-center">
        <p className="mb-1 text-sm text-[#c9b88a]">أدخل كود التحقق المرسل إلى</p>
        <p className="text-lg font-semibold text-[#e8e1d9]" dir="ltr">{normalizePhone(phone)}</p>
      </div>

      {/* OTP Inputs */}
      <div className="flex items-center justify-center gap-2" dir="ltr" onPaste={handleOtpPaste}>
        {otpDigits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className="h-14 w-11 rounded-xl border border-[#c9b88a]/30 bg-white/5 text-center text-2xl font-bold text-[#e8e1d9] outline-none transition focus:border-[#c9b88a] focus:ring-1 focus:ring-[#c9b88a]/30"
          />
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-400">
          {error}
        </p>
      )}
      {notice ? (
        <p className="rounded-lg border border-[#c9b88a]/20 bg-[#c9b88a]/5 px-3 py-2 text-center text-sm text-[#c9b88a]/80">
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => handlePhoneVerify()}
        disabled={loading || otpDigits.join("").length !== OTP_LENGTH}
        className="w-full rounded-xl bg-[#c9b88a] px-6 py-3 font-semibold tracking-[0.15em] text-[#15130f] transition hover:bg-[#e6d4a4] disabled:opacity-50"
      >
        {loading ? "جارٍ التحقق..." : "تحقق"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setPhoneStep("input");
            setOtpDigits(Array(OTP_LENGTH).fill(""));
            setError(null);
            setNotice(null);
          }}
          className="text-[#c9b88a]/70 underline hover:text-[#c9b88a]"
        >
          تغيير الرقم
        </button>
        <button
          type="button"
          onClick={(e) => handlePhoneSend(e as unknown as React.FormEvent)}
          disabled={cooldownRemainingSec > 0 || loading}
          className="text-[#c9b88a]/70 underline hover:text-[#c9b88a] disabled:opacity-40 disabled:no-underline"
        >
          {cooldownRemainingSec > 0 ? `إعادة الإرسال (${cooldownRemainingSec}ث)` : "إعادة إرسال الكود"}
        </button>
      </div>
    </div>
  );

  // ── Determine body content ──
  let bodyContent: React.ReactNode;
  if (authMethod === "email") {
    bodyContent = sent ? emailSentView : emailForm;
  } else {
    bodyContent = phoneStep === "verify" ? phoneVerifyForm : phoneInputForm;
  }

  const content = (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_36px_rgba(0,0,0,0.3)] backdrop-blur-md md:p-10">
      <h1 className="mb-2 text-center font-['Amiri'] text-4xl font-bold text-[#e8e1d9]">تسجيل الدخول</h1>
      <p className="mb-8 text-center text-sm text-[#c9b88a]">عُد إلى رحلة التمعّن</p>

      {/* Phone login disabled temporarily — email only */}
      {bodyContent}

      {/* Google OAuth separator + button */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#c9b88a]/20" />
        <span className="text-xs text-[#c9b88a]/50">أو</span>
        <div className="h-px flex-1 bg-[#c9b88a]/20" />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const redirectTo = `${getAppOriginClient()}/auth/callback`;
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo },
            });
            if (oauthError) throw oauthError;
          } catch {
            setError("تعذر الدخول عبر Google. حاول مجددًا.");
            setLoading(false);
          }
        }}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[#c9b88a]/30 bg-white/5 px-6 py-3 font-medium text-[#e8e1d9] transition hover:bg-white/10 disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        الدخول بحساب Google
      </button>

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
