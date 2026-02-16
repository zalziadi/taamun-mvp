"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966553930885";
const SUPPORT_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

function LogoMark() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
      {!failed ? (
        <img
          src="/brand/logo-mark.svg"
          alt=""
          width={28}
          height={28}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : null}
      {failed && (
        <span className="text-lg font-bold text-white" aria-hidden>
          ت
        </span>
      )}
    </span>
  );
}

export function AppShell({ title, children }: AppShellProps) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dark gradient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: "linear-gradient(180deg, #05070C 0%, #0A0F1A 40%, #0B0F14 100%)",
        }}
      />
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(109,139,255,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-8 pt-6">
        {/* Header: left=logo, center=title, right=حسابي when logged in */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <LogoMark />
            <span className="text-lg font-bold text-white">تمَعُّن</span>
          </Link>

          <h2 className="flex-1 text-center text-lg font-medium text-white/90 truncate" dir="rtl">
            {title}
          </h2>

          <div className="w-16 shrink-0 text-left">
            {loggedIn ? (
              <Link
                href="/account"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                حسابي
              </Link>
            ) : (
              <span className="invisible text-sm">حسابي</span>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-1 border-t border-white/5 pt-6 text-sm text-white/50">
          <Link href="/" className="hover:text-white/80 transition-colors">
            الرئيسية
          </Link>
          <Link href="/privacy" className="hover:text-white/80 transition-colors">
            الخصوصية
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/80 transition-colors"
          >
            واتساب الدعم
          </a>
        </footer>
      </div>
    </div>
  );
}
