"use client";

interface AppShellProps {
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative overflow-hidden">
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
      <div className="mx-auto max-w-3xl px-4 pb-8">
        {children}
      </div>
    </div>
  );
}
