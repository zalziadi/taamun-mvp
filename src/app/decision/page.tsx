"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DecisionInputForm from "@/components/DecisionInput";
import DecisionOutput from "@/components/DecisionOutput";
import { DabboosLogo } from "@/components/dbs/DabboosLogo";
import type { Decision, DecisionInput } from "@/lib/decisionEngine";

export default function DecisionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: DecisionInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.status === 401) {
        router.replace("/auth?next=/decision");
        return;
      }

      const data = (await res.json()) as { ok?: boolean; error?: string } & Decision;
      if (!res.ok || !data.ok) {
        setError("تعذر تحليل القرار. حاول مرة أخرى");
        return;
      }
      setDecision(data);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setDecision(null);
    setError(null);
  }

  return (
    <div className="dbs-theme min-h-screen">
      <div className="mx-auto w-full max-w-[760px] px-4 py-8 md:py-10 space-y-6 pb-10">
        <header className="text-center">
          <div className="flex items-center justify-center gap-2">
            <DabboosLogo size={40} />
            <span className="dbs-heading text-3xl font-bold">دبّوس</span>
          </div>
          <h1 className="dbs-heading mt-5 text-4xl leading-tight sm:text-5xl">
            لا تحفظ الأفكار… نفّذها.
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-sm leading-relaxed text-[color:var(--dbs-ink-soft)]">
            أدخل وضعك الحالي + هدفك + قيودك. اخرج بقرار واحد + خطوة واحدة.
          </p>
        </header>

        {error && (
          <div className="dbs-card border-[color:var(--dbs-red)] p-4 text-center">
            <p className="text-sm text-[color:var(--dbs-red)]">{error}</p>
          </div>
        )}

        {decision ? (
          <DecisionOutput decision={decision} onReset={handleReset} />
        ) : (
          <DecisionInputForm onSubmit={handleSubmit} loading={loading} />
        )}
      </div>
    </div>
  );
}
