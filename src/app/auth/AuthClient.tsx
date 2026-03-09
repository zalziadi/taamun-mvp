"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getAppOriginClient } from "@/lib/appOrigin";
import { APP_NAME } from "@/lib/appConfig";

interface AuthClientProps {
  embedded?: boolean;
}

export function AuthClient({ embedded }: AuthClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectTo = `${getAppOriginClient()}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) throw signInError;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-white/50">جارٍ التحقق...</p>
      </div>
    );
  }

  const content = (
    <div className="w-full max-w-md">
      <h1 className="mb-2 text-center text-2xl font-bold text-white">{APP_NAME}</h1>
      <p className="mb-8 text-center text-white/50">أدخل بريدك لتسجيل الدخول أو إنشاء حساب</p>

      {sent ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-emerald-300">تحقق من بريدك</p>
          <p className="text-sm text-white/70">
            أرسلنا رابط الدخول إلى <span className="text-white">{email}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="mt-4 text-sm text-white/50 underline hover:text-white"
          >
            تغيير البريد
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />

          {error && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-[#0B0F14] transition-opacity disabled:opacity-50"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رابط الدخول"}
          </button>
        </form>
      )}

      <Link
        href="/"
        className="mt-6 block text-center text-sm text-white/40 hover:text-white"
      >
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      {content}
    </div>
  );
}
