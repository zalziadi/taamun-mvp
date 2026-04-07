"use client";

interface Props {
  message: string;
  beforeState?: string;
  afterState?: string;
  variant?: "milestone" | "inline";
}

/**
 * Identity Reflection Card — surfaces the "you are now X instead of Y" message
 * from orchestrator.identityReflection. The deepest cognitive output that was
 * previously buried in API responses.
 */
export default function IdentityReflectionCard({
  message,
  beforeState,
  afterState,
  variant = "milestone",
}: Props) {
  if (!message) return null;

  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-[#c4a265]/40 bg-[#faf6ee] p-3 text-right">
        <p className="text-xs text-[#8c7851] tracking-[0.1em]">المرآة</p>
        <p className="mt-1 text-sm font-semibold text-[#2f2619]">{message}</p>
      </div>
    );
  }

  // Default: milestone (large, animated, celebrating)
  return (
    <section className="tm-card relative overflow-hidden border-[#c4a265] bg-gradient-to-b from-[#fbf4e3] via-[#f4ead7] to-[#fbf4e3] p-6 sm:p-7 text-center space-y-4">
      {/* Animated glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4a265]/15 blur-3xl animate-pulse" />
      </div>

      <div>
        <p className="text-xs text-[#8c7851] tracking-[0.25em]">لحظة تحوّل</p>
        <p className="mt-2 text-2xl font-semibold leading-snug text-[#2f2619] sm:text-3xl tm-heading">
          {message}
        </p>
      </div>

      {(beforeState || afterState) && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {beforeState && (
            <span className="rounded-full border border-[#d8cdb9] bg-white/60 px-3 py-1 text-[#7d7362] line-through opacity-70">
              {beforeState}
            </span>
          )}
          {beforeState && afterState && <span className="text-[#8c7851]">←</span>}
          {afterState && (
            <span className="rounded-full border border-[#c4a265] bg-[#f4ead7] px-3 py-1 font-semibold text-[#5a4531]">
              {afterState}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
