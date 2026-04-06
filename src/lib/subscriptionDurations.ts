/** مدة كل باقة بالأيام */
export const TIER_DURATION_DAYS: Record<string, number> = {
  trial: 7,
  quarterly: 90,
  yearly: 365,
  vip: 1095, // 3 سنوات
  // Legacy tiers (backward compatibility)
  eid: 30,
  monthly: 30,
};

/** احسب تاريخ الانتهاء بناءً على الباقة */
export function calcExpiresAt(tier: string, activatedAt?: Date): string {
  const base = activatedAt ?? new Date();
  const days = TIER_DURATION_DAYS[tier] ?? 30;
  const expires = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}

/** هل الاشتراك منتهي؟ */
export function isSubscriptionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/** كم يوم متبقي؟ */
export function daysRemaining(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** مدة الكوكي بالثواني حسب الباقة */
export function cookieMaxAge(tier: string): number {
  const days = TIER_DURATION_DAYS[tier] ?? 30;
  return days * 24 * 60 * 60;
}
