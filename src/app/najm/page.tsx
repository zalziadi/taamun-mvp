import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NajmDashboard } from "./NajmDashboard";

export const dynamic = "force-dynamic";

export default async function NajmPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?next=/najm");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: reports } = await supabase
    .from("najm_reports")
    .select("*")
    .order("cycle_day", { ascending: false })
    .limit(7);

  const { data: tasks } = await supabase
    .from("najm_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return <NajmDashboard reports={reports ?? []} tasks={tasks ?? []} />;
}
