"use client";

import { hasEntitlement } from "../lib/entitlement";
import type { PlanKey } from "../lib/entitlement";
import { Paywall } from "./Paywall";

interface RequireEntitlementProps {
  planKeys: PlanKey[];
  fallbackReason?: string;
  children: React.ReactNode;
}

/** Renders children if user has any of the allowed planKeys; otherwise Paywall */
export function RequireEntitlement({
  planKeys,
  fallbackReason = "locked",
  children,
}: RequireEntitlementProps) {
  const allowed = planKeys.some((k) => hasEntitlement(k));
  if (allowed) return <>{children}</>;
  return <Paywall reason={fallbackReason} />;
}
