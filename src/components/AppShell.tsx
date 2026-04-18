"use client";

interface AppShellProps {
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0908] text-[#e8e1d9]">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{ background: "linear-gradient(180deg, #0A0908 0%, #1c1a15 40%, #0A0908 100%)" }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        aria-hidden
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,184,138,0.06) 0%, transparent 60%)" }}
      />
      <div className="mx-auto max-w-3xl px-4 pb-8">
        {children}
      </div>
    </div>
  );
}
