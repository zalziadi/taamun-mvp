"use client";
interface RequireEntitlementProps { children: React.ReactNode; subscribeReason?: string; allowDemoDay?: boolean; demoDayId?: number; }
export function markDemoUsed(): void {}
export function RequireEntitlement({ children }: RequireEntitlementProps) {
  return <>{children}</>;
}
