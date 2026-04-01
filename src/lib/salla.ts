import type { CheckoutTier } from "@/lib/stripe";

/**
 * Returns Salla product URL for each pricing tier.
 */
export function sallaProductUrl(tier: CheckoutTier): string | null {
    const directMap: Record<string, string | undefined> = {
          // New tier names
          quarterly: process.env.SALLA_PRODUCT_QUARTERLY ?? process.env.SALLA_PRODUCT_MONTHLY,
          yearly: process.env.SALLA_PRODUCT_YEARLY,
          vip: process.env.SALLA_PRODUCT_VIP,
          // Legacy tier names (backward compat)
          eid: process.env.SALLA_PRODUCT_EID,
          monthly: process.env.SALLA_PRODUCT_MONTHLY,
    };

  const direct = directMap[tier]?.trim();
    if (direct) return direct;

  const slug = process.env.SALLA_STORE_SLUG?.trim();
    const idMap: Record<string, string | undefined> = {
          quarterly: process.env.SALLA_PRODUCT_ID_QUARTERLY ?? process.env.SALLA_PRODUCT_ID_MONTHLY,
          yearly: process.env.SALLA_PRODUCT_ID_YEARLY,
          vip: process.env.SALLA_PRODUCT_ID_VIP,
          // Legacy
          eid: process.env.SALLA_PRODUCT_ID_EID,
          monthly: process.env.SALLA_PRODUCT_ID_MONTHLY,
    };

  const productId = idMap[tier]?.trim();
    if (slug && productId) {
          return `https://salla.sa/${slug}/product/${productId}`;
    }

  return null;
}

export function isSallaConfigured(): boolean {
    return !!(
          process.env.SALLA_PRODUCT_EID ||
          process.env.SALLA_PRODUCT_MONTHLY ||
          process.env.SALLA_PRODUCT_YEARLY ||
          process.env.SALLA_PRODUCT_VIP ||
          process.env.SALLA_STORE_SLUG
        );
}
