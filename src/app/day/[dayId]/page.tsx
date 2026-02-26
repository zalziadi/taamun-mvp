import { redirect } from "next/navigation";
import { programDayRoute } from "@/lib/routes";

type Params = {
  params: Promise<{ dayId: string }>;
};

export default async function LegacyDayPage({ params }: Params) {
  const { dayId } = await params;
  const day = Number(dayId);
  redirect(programDayRoute(day));
}
