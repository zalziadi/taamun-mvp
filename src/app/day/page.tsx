import { redirect } from "next/navigation";
import { DAY1_ROUTE } from "@/lib/routes";

export default function DayRedirect() {
  redirect(DAY1_ROUTE);
}
