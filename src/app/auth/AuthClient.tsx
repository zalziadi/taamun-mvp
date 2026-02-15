"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Tab = "signin" | "signup";

const REDIRECT_PATH = "/day";

export function AuthClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(REDIRECT_PATH);
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
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(REDIRECT_PATH);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = tab === "signin" ? handleSignIn : handleSignUp;

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">تسجيل الدخول</h1>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("signin")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "signin"
              ? "bg-white text-[#0B0F14]"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          تسجيل دخول
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "signup"
              ? "bg-white text-[#0B0F14]"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          إنشاء حساب
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-white/70">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            placeholder="example@mail.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-white/70">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === "signin" ? "current-password" : "new-password"}
            minLength={6}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white px-6 py-3 font-bold text-[#0B0F14] transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? "جاري..." : tab === "signin" ? "تسجيل دخول" : "إنشاء حساب"}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/account" className="text-sm text-white/70 underline hover:text-white">
          حسابي
        </Link>
      </p>
    </div>
  );
}
