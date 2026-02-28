export type CatalogItem = {
  productKey: string;
  title: string;
  unitAmount: number;
  currency: "sar";
  plan: "base";
};

export const RAMADAN_BASE_ITEM: CatalogItem = {
  productKey: "ramadan-28-base",
  title: "اشتراك رمضان 28 يوم",
  unitAmount: 28000,
  currency: "sar",
  plan: "base",
};

export function getCatalogItem(productKey: string): CatalogItem | null {
  if (productKey === RAMADAN_BASE_ITEM.productKey) {
    return RAMADAN_BASE_ITEM;
  }
  return null;
}
