"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  slug: string;
  alreadySubscribed: boolean;
}

/**
 * Subscribe / continue button for a creator journey.
 * Unauthenticated users are redirected to /auth.
 */
export function JourneySubscribeButton({ slug, alreadySubscribed }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubscribe() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/creator/journeys/${slug}/subscribe`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.push(`/auth?next=/journey/${slug}`);
        return;
      }
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={pending}
      className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-3 text-xs sm:text-sm font-bold disabled:opacity-50 transition-opacity"
    >
      {pending
        ? "..."
        : alreadySubscribed
        ? "متابعة الرحلة"
        : "انضم الى الرحلة"}
    </button>
  );
}
