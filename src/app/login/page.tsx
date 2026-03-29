"use client";

import { Suspense, useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/program";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error && data.user) {
        router.replace(next);
      } else {
        setCheckingSession(false);
      }
    });
    return () => {
      active = false;
    };
  }, [next, router, supabase.auth]);

  const handleGoogle = async () => {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) setError("تعذر تسجيل الدخول عبر Google. تأكد من صلاحية الحساب أو جرّب البريد الإلكتروني.");
  };

  const handleEmail = async () => {
    setError("");
    if (!email) {
      setError("أدخل بريدك الإلكتروني");
      return;
    }
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) setError("تعذر تسجيل الدخول عبر Google. تأكد من صلاحية الحساب أو جرّب البريد الإلكتروني.");
    else setSent(true);
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#15130f" }}>
        <p style={{ color: "#c9b88a", fontSize: 18 }}>جاري التحقق...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#15130f", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#2b2824", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <h1 style={{ color: "#c9b88a", fontSize: 28, marginBottom: 8 }}>تمعّن</h1>
        <p style={{ color: "#a09882", fontSize: 15, marginBottom: 32 }}>تسجيل دخول المشتركين</p>

        <button onClick={handleGoogle} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "#fff", color: "#333", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.003 24.003 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          تسجيل الدخول بـ Google
        </button>

        <div style={{ position: "relative", marginBottom: 24 }}>
          <div style={{ borderTop: "1px solid #3d3a35", position: "absolute", top: "50%", width: "100%" }} />
          <span style={{ background: "#2b2824", position: "relative", padding: "0 12px", color: "#6b6560", fontSize: 13 }}>أو</span>
        </div>

        {sent ? (
          <p style={{ color: "#c9b88a", fontSize: 15 }}>تم إرسال رابط الدخول إلى بريدك</p>
        ) : (
          <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #3d3a35", background: "#1e1c18", color: "#e8e0d0", fontSize: 15, marginBottom: 12, boxSizing: "border-box", textAlign: "right" }} />
            <button onClick={handleEmail} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1px solid #c9b88a", background: "transparent", color: "#c9b88a", fontSize: 15, cursor: "pointer" }}>إرسال رابط الدخول</button>
          </div>
        )}

        {error && <p style={{ color: "#e74c3c", marginTop: 16, fontSize: 14 }}>{error}</p>}

        <p style={{ color: "#6b6560", fontSize: 13, marginTop: 32 }}>ليس لديك اشتراك؟ <a href="/pricing" style={{ color: "#c9b88a", textDecoration: "underline" }}>تصفح الباقات</a></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#15130f" }}><p style={{ color: "#c9b88a", fontSize: 18 }}>جاري التحميل...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
