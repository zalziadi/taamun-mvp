"use client";

import Link from "next/link";
import type { NextAction } from "@/lib/nextStep";

interface Props {
  actions: NextAction[];
  title?: string;
}

/**
 * Renders 1-3 next-step actions to prevent dead ends.
 * Primary action is emphasized; alternatives shown as secondary buttons.
 */
export default function NextStepPanel({ actions, title = "وش بعد؟" }: Props) {
  if (!actions || actions.length === 0) return null;

  const primary = actions[0];
  const alternatives = actions.slice(1);

  return (
    <section className="tm-card border-[#c4a265]/40 bg-gradient-to-b from-[#f4ead7]/40 to-transparent p-6 sm:p-7 space-y-4">
      <div>
        <p className="text-xs text-[#8c7851] tracking-[0.2em]">{title}</p>
        {primary.reason && (
          <p className="mt-1 text-sm text-[#5f5648]/85">{primary.reason}</p>
        )}
      </div>

      {/* Primary action — large gold button */}
      <Link
        href={primary.route}
        className="tm-gold-btn inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold sm:w-auto"
      >
        ✦ {primary.label}
      </Link>

      {/* Alternatives — smaller secondary buttons */}
      {alternatives.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {alternatives.map((action, i) => (
            <Link
              key={`${action.type}-${i}`}
              href={action.route}
              className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-2 text-sm text-[#5f5648] transition-colors hover:border-[#8c7851]/40 hover:bg-[#f9f3e7]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
