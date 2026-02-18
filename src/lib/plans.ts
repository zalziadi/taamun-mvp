import { RAMADAN_ENDS_AT_LABEL } from "@/lib/appConfig";

export type PlanKey = "ramadan_28" | "trial24h" | "yearly" | "plan820";

export function getPlanLabel(plan: string | null | undefined): string {
  if (plan === "ramadan_28") return "رمضان 28 يوم";
  if (plan === "trial24h") return "تجربة 24 ساعة";
  if (plan === "yearly") return "اشتراك سنة";
  if (plan === "plan820") return "باقة 820";
  return "غير مفعّل";
}

export function formatPlanEndDate(plan: string | null | undefined, endsAt: string | null | undefined): string {
  if (plan === "ramadan_28") return RAMADAN_ENDS_AT_LABEL;
  if (!endsAt) return "غير محدد";
  return new Date(endsAt).toLocaleDateString("ar-SA");
}
