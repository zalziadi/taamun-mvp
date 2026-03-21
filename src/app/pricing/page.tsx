import type { Metadata } from "next";
import PricingExperience from "./PricingExperience";

export const metadata: Metadata = {
  title: "الأسعار",
  description: "باقات اشتراك تمَعُّن — عرض ترحيبي بمناسبة العيد ثم الأسعار.",
};

type Props = {
  searchParams?: { eid?: string };
};

export default function PricingPage({ searchParams }: Props) {
  const forceEid = searchParams?.eid === "1";
  return <PricingExperience forceEidWelcome={forceEid} />;
}
