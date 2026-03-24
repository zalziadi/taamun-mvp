import type { Metadata } from "next";
import PricingExperience from "./PricingExperience";

export const metadata: Metadata = {
  title: "الأسعار",
  description: "باقات اشتراك تمَعُّن.",
};

export default function PricingPage() {
  return <PricingExperience />;
}
