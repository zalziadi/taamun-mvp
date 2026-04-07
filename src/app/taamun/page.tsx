import type { Metadata } from "next";
import TaamunV2Landing from "@/components/landing/TaamunV2Landing";

export const metadata: Metadata = {
  title: "تمعّن — رحلة التمعّن القرآني",
  description:
    "تمعّن ليست أداة — هي كيان راسخ. تسعة مجالات تحيط بالمحور، ورحلة تأمل قرآني تتدرج من ظلّ الذهب إلى أفضل الاحتمال.",
};

export default function TaamunPage() {
  return <TaamunV2Landing />;
}
