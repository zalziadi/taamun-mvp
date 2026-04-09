"use client";

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import NextLink from "next/link";
import { useJourneyNavigate } from "@/hooks/useJourneyNavigate";
import type { NavigationEvaluation } from "@/lib/journey/navigation";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
  /** Called when the gate blocks or soft-notices the navigation. */
  onGateDecision?: (evaluation: NavigationEvaluation) => void;
  /** If true, bypass the gate entirely (use with care). */
  bypass?: boolean;
}

/**
 * JourneyLink — drop-in replacement for Next `<Link>` that passes the
 * click through `useJourneyNavigate()`. Use this for CTAs that should
 * respect continuity rules (resume, reconciliation, logging).
 *
 * For marketing/auth/static pages that don't need the gate, keep using
 * the plain Next `<Link>`.
 *
 * Accessibility: the rendered element is still an <a> with the correct
 * href, so right-click, middle-click, and screen readers work normally.
 * The gate only runs on plain left-click.
 */
export const JourneyLink = forwardRef<HTMLAnchorElement, Props>(
  function JourneyLink(
    { href, children, onGateDecision, bypass = false, onClick, ...rest },
    ref
  ) {
    const { navigate } = useJourneyNavigate();

    return (
      <NextLink
        href={href}
        ref={ref}
        {...rest}
        onClick={(e) => {
          // Let the user's own onClick run first
          onClick?.(e);
          if (e.defaultPrevented) return;

          // Respect modified clicks (new tab, middle click, etc.)
          if (
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey ||
            (e as unknown as { button?: number }).button === 1
          ) {
            return;
          }

          if (bypass) return;

          // Take over — prevent Next's default navigation and run it through the gate
          e.preventDefault();
          navigate(href, {
            onBlocked: (evaluation) => onGateDecision?.(evaluation),
          });
        }}
      >
        {children}
      </NextLink>
    );
  }
);
