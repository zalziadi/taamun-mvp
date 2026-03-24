import type { Metadata } from "next";
import PricingExperience from "./PricingExperience";

export const metadata: Metadata = {
  title: "الأسعار",
  description: "باقات اشتراك تمَعُّن — عرض ترحيبي بمناسبة العيد ثم الأسعار.",
};

export default function PricingPage() {
  return <PricingExperience />;
}
