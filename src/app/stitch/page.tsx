import type { Metadata } from "next";
import StitchLanding from "@/components/landing/StitchLanding";

export const metadata: Metadata = {
  title: "تمعّن — العتبة الصامتة",
  description:
    "تمعّن — تجربة تأمل قرآني عميقة. ٢٨ يوماً، تسعة مجالات، رحلة واحدة.",
};

export default function StitchPage() {
  return <StitchLanding />;
}
