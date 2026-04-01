import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDayIndexForToday } from "@/lib/ramadan-28";
import { formatHijri, getHijriDate } from "@/lib/hijri";
import { PatternsClient } from "./PatternsClient";

export const dynamic = "force-dynamic";

export default async function PatternsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/patterns");
  }

  const currentDay = getDayIndexForToday();
  const hijriNow = getHijriDate();
  const hijriLabel = formatHijri(hijriNow);

  // Fetch all pattern insights for this user
  const { data: insights } = await supabase
    .from("pattern_insights")
    .select("cycle_day, depth_score, shift_detected, shift_description, themes, daily_hint, weekly_summary, week_number, hijri_year, hijri_month, hijri_day")
    .eq("user_id", user.id)
    .order("cycle_day", { ascending: true });

  return (
    <PatternsClient
      insights={insights ?? []}
      currentDay={currentDay}
      hijriLabel={hijriLabel}
    />
  );
}
