"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DecisionInputForm from "@/components/DecisionInput";
import DecisionOutput from "@/components/DecisionOutput";
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
    <div className="tm-shell space-y-6 pb-10">
      <section className="tm-card p-6 sm:p-7 text-center">
        <div className="inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#D6D1C8]">
          المرشد الذكي — وضع القرار
        </div>
        <h1 className="tm-heading mt-3 text-4xl leading-tight sm:text-5xl text-[#14110F]">
          من فكرة إلى قرار
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] text-sm leading-relaxed text-[#A8A29A]/85">
          ليس محادثة. ليس عصف ذهني. هذا محرك قرار منظّم.
          <br />
          أدخل وضعك الحالي + هدفك + قيودك. اخرج بقرار واحد + خطوة واحدة.
        </p>
      </section>

      {error && (
        <div className="tm-card border-[#9b5548]/30 bg-[#fdf6f4] p-4 text-center">
          <p className="text-sm text-[#9b5548]">{error}</p>
        </div>
      )}

      {decision ? (
        <DecisionOutput decision={decision} onReset={handleReset} />
      ) : (
        <DecisionInputForm onSubmit={handleSubmit} loading={loading} />
      )}
    </div>
  );
}
