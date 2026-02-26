import { redirect } from "next/navigation";
import { PROGRAM_ROUTE } from "@/lib/routes";

export default function ProgressPage() {
  redirect(PROGRAM_ROUTE);
}
