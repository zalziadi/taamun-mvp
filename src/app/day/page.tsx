import { redirect } from "next/navigation";
import { PROGRAM_DAY1_ROUTE } from "@/lib/routes";

export default function DayRedirect() {
  redirect(PROGRAM_DAY1_ROUTE);
}
