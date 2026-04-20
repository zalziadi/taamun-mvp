"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Following {
  creator_user_id: string;
  followed_at: string;
  creator_display_name: string | null;
  total_published: number;
  latest: {
    slug: string;
    title: string;
    duration_days: number;
    subscriber_count: number;
    created_at: string;
  } | null;
}

/**
 * Compact card on /account showing creators the user follows + their
 * most recent published journey. Quiet when nothing is followed.
 */
export function FollowingList() {
  const [items, setItems] = useState<Following[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/creator/follows")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) setItems(data.following ?? []);
      })
      .catch(() => {
        if (!cancelled) setHidden(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden || items === null || items.length === 0) return null;

  return (
    <div className="border-t border-[#c9b88a]/15 p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[#e8e1d9]">تتابعهم</h3>
        <p className="mt-1 text-xs text-white/40">
          مبدعون اشتركت في تنبيهاتهم.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((f) => (
          <li
            key={f.creator_user_id}
            className="border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/creator/by/${f.creator_user_id}`}
                className="text-[#c9b88a] hover:underline font-semibold"
              >
                {f.creator_display_name ?? "مبدع"}
              </Link>
              <span className="text-white/40 text-[10px]">
                {f.total_published} رحلة
              </span>
            </div>
            {f.latest && (
              <Link
                href={`/journey/${f.latest.slug}`}
                className="mt-1 block text-white/60 hover:text-white/90 text-[11px] truncate"
                title={f.latest.title}
              >
                → {f.latest.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
