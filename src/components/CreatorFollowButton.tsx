"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  creatorId: string;
  journeySlug?: string; // optional — used for the auth next= redirect
}

/**
 * Small follow/unfollow toggle, suitable next to a creator's name on a journey page.
 * Unauthenticated taps redirect to /auth.
 */
export function CreatorFollowButton({ creatorId, journeySlug }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/creator/${creatorId}/follow`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok) setFollowing(!!data.following);
      })
      .catch(() => {
        if (!cancelled) setFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/creator/${creatorId}/follow`, { method });
      if (res.status === 401) {
        router.push(`/auth?next=/journey/${journeySlug ?? ""}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFollowing(!!data.following);
    } finally {
      setBusy(false);
    }
  }

  if (following === null) {
    return (
      <span className="text-[11px] text-[#8c7851]/50 italic">…</span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        "text-[11px] font-bold border px-3 py-1 transition-colors " +
        (following
          ? "border-[#5a4a35]/40 text-[#5a4a35] hover:bg-[#5a4a35]/5"
          : "border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] hover:opacity-90")
      }
    >
      {busy ? "..." : following ? "يتابع ✓" : "متابعة المبدع"}
    </button>
  );
}
