// DO NOT hardcode brand name anywhere else. Always import APP_NAME.
export const APP_NAME = "تمَعُّن" as const;
export const APP_TAGLINE = "رمضان 28 يوم للوعي العميق" as const;
export const APP_DESCRIPTION =
  "برنامج رمضان 28 يوم للانتقال من الظل إلى الهدية إلى أفضل احتمال." as const;
export const APP_SLUG = "taamun" as const;
export const RAMADAN_PROGRAM_KEY = "taamun-ramadan-28" as const;
export const RAMADAN_ENDS_AT_ISO = "2026-03-29T23:59:59+03:00" as const;
export const RAMADAN_ENDS_AT_LABEL =
  "30 رمضان 1447 هـ الموافق 29 مارس 2026" as const;
export const ENTITLEMENT_HEADER = "X-Taamun-Entitlement" as const;
export const PLAN820_HEADER = "X-Taamun-Plan-820" as const;
export const APP_CODE_PREFIX = "TAAMUN" as const;
export const APP_DOMAIN = "https://taamun-mvp.vercel.app" as const;
export const LEGACY_ENTITLEMENT_COOKIE = "TAAMUN_ENTITLEMENT" as const;
export const APP_ENTITLEMENT_COOKIE = `${APP_SLUG}_entitled` as const;
