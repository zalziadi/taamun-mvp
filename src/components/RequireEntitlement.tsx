"use client";

// All content is free and open — no entitlement required.
interface RequireEntitlementProps {
  children: React.ReactNode;
  subscribeReason?: string;
  allowDemoDay?: boolean;
  demoDayId?: number;
}

export function markDemoUsed(): void {
  // no-op
}

export function RequireEntitlement({ children }: RequireEntitlementProps) {
  return <>{children}</>;
}
