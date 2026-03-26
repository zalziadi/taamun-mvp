import type { Metadata } from "next";
import { TaamunLanding2 } from "@/components/landing/TaamunLanding2";

export const metadata: Metadata = {
  title: "تمعّن — العتبة الصامتة",
  description: "المسار الروحاني — ٢٨ يوماً من التمعّن القرآني",
};

export default function Landing2Page() {
  return <TaamunLanding2 />;
}
