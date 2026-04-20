"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Small amber hero badge for /admin — hidden when the queue is empty
 * or the viewer isn't an admin.
 */
export function ModerationQueueBadge() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/moderation")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        const sum =
          (data.threads?.length ?? 0) +
          (data.replies?.length ?? 0) +
          (data.journeys?.length ?? 0) +
          (data.insights?.length ?? 0);
        setTotal(sum);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (total === null || total === 0) return null;

  return (
    <Link
      href="/admin/moderation"
      className="block border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 transition-colors hover:bg-amber-500/15"
    >
      <p className="text-xs font-bold">
        {total} عنصر بانتظار المراجعة —{" "}
        <span className="underline">افتح مركز المراجعة</span>
      </p>
    </Link>
  );
}
