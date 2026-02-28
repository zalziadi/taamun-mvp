"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type CompleteDayButtonProps = {
  day: number;
  disabled?: boolean;
  onCompleted?: (nextDay: number) => void;
  onError?: (error: string) => void;
};

export default function CompleteDayButton({
  day,
  disabled = false,
  onCompleted,
  onError,
}: CompleteDayButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      const data = await res.json();
      if (data?.ok) {
        try { localStorage.setItem('TAAMUN_DAY_' + day, '1'); } catch {}
        onCompleted?.(Number(data.current_day) || Math.min(28, day + 1));
      } else if (typeof data?.error === "string") {
        onError?.(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleComplete} disabled={disabled || loading}>
      {loading ? "جارٍ الحفظ..." : "حفظ وإكمال اليوم"}
    </Button>
  );
}
