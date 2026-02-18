import { APP_NAME, RAMADAN_ENDS_AT_LABEL } from "@/lib/appConfig";
import { getPlanLabel, type PlanKey } from "@/lib/plans";

export type SubscribePlan = PlanKey;

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966553930885";

export function buildWhatsAppSubscribeMessage(plan: SubscribePlan): string {
  const planLabel = getPlanLabel(plan);
  return [
    "السلام عليكم،",
    "",
    `أرغب بالاشتراك في برنامج *${APP_NAME}* (${planLabel}).`,
    "",
    "الرجاء التفعيل عبر التحويل البنكي:",
    "1) الاسم",
    "2) رقم الجوال",
    "3) صورة التحويل",
    "",
    "ملاحظة: التفعيل يتطلب تسجيل الدخول أولاً.",
    `صلاحية باقة رمضان: ${RAMADAN_ENDS_AT_LABEL}`,
    "",
    "بانتظار رابط التفعيل والكود. جزاكم الله خيرًا.",
  ].join("\n");
}

export function buildWhatsAppSubscribeUrl(plan: SubscribePlan): string {
  const message = encodeURIComponent(buildWhatsAppSubscribeMessage(plan));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}
