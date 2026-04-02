"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  tier: "basic" | "full";
  endpoint: string;
  className?: string;
  children: React.ReactNode;
}

export function CheckoutButton({ tier, endpoint, className, children }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (res.status === 401) {
        router.push("/auth?next=/pricing");
        return;
      }

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      className={className}
    >
      {loading ? "جارٍ التحويل…" : children}
    </button>
  );
}
