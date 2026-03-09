import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DayExperience } from "@/components/DayExperience";

export const dynamic = "force-dynamic";

export default async function DayPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data } = await supabase
    .from("reflections")
    .select("day")
    .eq("user_id", user.id)
    .order("day", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentDay = Math.min(Math.max(data?.day ?? 1, 1), 28);

  return (
    <AppShell>
      <DayExperience day={currentDay} />
    </AppShell>
  );
}
