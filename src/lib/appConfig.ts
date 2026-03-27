// DO NOT hardcode brand name anywhere else. Always import APP_NAME.
export const APP_NAME = "تمَعُّن" as const;
export const APP_TAGLINE = "رحلة اكتشاف المعنى بلغة القرآن" as const;
export const APP_DESCRIPTION =
  "برنامج 28 يوم للانتقال من الظل إلى الهدية إلى أفضل احتمال." as const;
export const APP_SLUG = "taamun" as const;
export const PROGRAM_KEY = "taamun-28" as const;
/** @deprecated alias للتوافق مع APIs رمضان القديمة */
export const RAMADAN_PROGRAM_KEY = PROGRAM_KEY;
/** @deprecated لم يعد البرنامج مربوطاً برمضان — دائماً false */
export const RAMADAN_PROGRAM_ACTIVE = false as const;
export const RAMADAN_ENDS_AT_ISO = "2099-12-31T23:59:59+03:00" as const;
export const RAMADAN_ENDS_AT_LABEL = "" as const;
export const APP_DOMAIN = "https://www.taamun.com" as const;
export const RAMADAN_PROGRAM_STATUS_NOTE = "" as const;
