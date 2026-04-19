/**
 * src/components/badges/BadgeGrid.tsx
 *
 * Private badge grid rendered on /progress — shows all 7 milestone badges per
 * cycle (up to 3 cycles), earned badges opaque and un-earned badges dim.
 *
 * Reads the user's own rows from the `badges` table via the browser Supabase
 * client (Phase 7 RLS policy `users_select_own_badges` scopes the query to
 * `auth.uid() = user_id`).
 *
 * Delivers: BADGE-04 (private by default) + BADGE-08 (grid on /progress with
 * locked + unlocked states) + BADGE-09 (silent reveal).
 *
 * Animation: a single subtle `opacity 0 → 1` fade-in on unlocked badges, ≤
 * 600ms. Locked badges remain at their static dim state.
 *
 * Layer discipline (CLAUDE.md):
 *   - Client component (`"use client"`) because it needs the browser Supabase
 *     session + a `useEffect` fetch. The /progress page itself is a client
 *     component already.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MilestoneBadge,
  type BadgeCode,
} from "@/components/badges/MilestoneBadge";
import { createBrowserClient } from "@supabase/ssr";

// Ordered for display: chronological within a cycle, cycle_complete last.
const BADGE_CODES_IN_ORDER: readonly BadgeCode[] = [
  "day_1",
  "day_3",
  "day_7",
  "day_14",
  "day_21",
  "day_28",
  "cycle_complete",
];

type BadgeRow = {
  badge_code: BadgeCode;
  cycle_number: number;
  unlocked_at: string;
};

type GridStatus = "loading" | "ok" | "empty" | "error";

export function BadgeGrid() {
  const [rows, setRows] = useState<BadgeRow[]>([]);
  const [status, setStatus] = useState<GridStatus>("loading");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );

    let cancelled = false;

    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!authData.user) {
        setStatus("empty");
        return;
      }
      const { data, error } = await supabase
        .from("badges")
        .select("badge_code, cycle_number, unlocked_at")
        .eq("user_id", authData.user.id)
        .order("cycle_number", { ascending: true });
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      const parsed: BadgeRow[] = (data ?? [])
        .filter(
          (r): r is { badge_code: string; cycle_number: number; unlocked_at: string } =>
            typeof r?.badge_code === "string" &&
            typeof r?.cycle_number === "number" &&
            typeof r?.unlocked_at === "string" &&
            BADGE_CODES_IN_ORDER.includes(r.badge_code as BadgeCode),
        )
        .map((r) => ({
          badge_code: r.badge_code as BadgeCode,
          cycle_number: r.cycle_number,
          unlocked_at: r.unlocked_at,
        }));
      setRows(parsed);
      setStatus("ok");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Determine how many cycle rows to render.
  //   Cap at 3 per BADGE-01. Floor at 1 (user always sees their current cycle).
  const maxCycle = useMemo(() => {
    const max = rows.reduce((acc, r) => Math.max(acc, r.cycle_number), 1);
    return Math.min(3, Math.max(1, max));
  }, [rows]);

  const unlockedMap = useMemo(() => {
    const map = new Map<string, BadgeRow>();
    rows.forEach((r) => map.set(`${r.badge_code}:${r.cycle_number}`, r));
    return map;
  }, [rows]);

  if (status === "loading") {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse"
        aria-hidden="true"
      >
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // Silent degrade: never interrupt the page with an error banner; the rest
  // of /progress remains navigable. Guest users (no auth.user) also fall here.
  if (status === "error" || status === "empty") return null;

  return (
    <section
      dir="rtl"
      className="rounded-2xl border border-[#c9b88a]/20 bg-white/5 p-6 space-y-6"
      aria-label="شارات الرحلة"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-[#e8e1d9]">شارات الرحلة</h2>
        <span className="text-xs text-[#c9b88a]/60">
          خاصة بك — لا تُشارَك
        </span>
      </div>

      {Array.from({ length: maxCycle }).map((_, idx) => {
        const cycleNumber = idx + 1;
        return (
          <div key={cycleNumber} className="space-y-3">
            <h3 className="text-sm text-[#c9b88a]/80">
              الحلقة {toEasternArabic(cycleNumber)}
            </h3>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
              {BADGE_CODES_IN_ORDER.map((code) => {
                const row = unlockedMap.get(`${code}:${cycleNumber}`);
                const unlocked = !!row;
                const tooltip = row
                  ? `${arabicLabel(code)} — ${formatArabicDate(row.unlocked_at)}`
                  : arabicLabel(code);
                return (
                  <motion.div
                    key={code}
                    initial={unlocked ? { opacity: 0 } : false}
                    animate={{ opacity: unlocked ? 1 : 0.4 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    title={tooltip}
                    className="flex items-center justify-center"
                  >
                    <MilestoneBadge code={code} unlocked={unlocked} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function toEasternArabic(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}

function arabicLabel(code: BadgeCode): string {
  // Minimal label for the hover tooltip only; the full classical-Arabic name
  // is rendered inside MilestoneBadge via BADGE_COPY.
  const labels: Record<BadgeCode, string> = {
    day_1: "اليوم ١",
    day_3: "اليوم ٣",
    day_7: "اليوم ٧",
    day_14: "اليوم ١٤",
    day_21: "اليوم ٢١",
    day_28: "اليوم ٢٨",
    cycle_complete: "تمام الحلقة",
  };
  return labels[code];
}

function formatArabicDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ar-SA-u-nu-arab", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}
