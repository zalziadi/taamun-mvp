import type { Metadata } from "next";
import { SuccessPolling } from "./SuccessPolling";

export const metadata: Metadata = {
  title: "جاري تفعيل اشتراكك — تمعّن",
};

export default function PricingSuccessPage() {
  return (
    <div
      className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center px-4"
      dir="rtl"
    >
      <SuccessPolling />
    </div>
  );
}
