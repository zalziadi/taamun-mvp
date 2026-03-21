import type { Metadata } from "next";
import EidPageClient from "./EidPageClient";

export const metadata: Metadata = {
  title: "عيدية تمَعُّن",
  description: "عيدية محدودة — رحلة اكتشاف المعنى بلغة القرآن. وصول جزئي ثم إكمال الرحلة بالاشتراك.",
};

export default function EidPage() {
  return <EidPageClient />;
}
