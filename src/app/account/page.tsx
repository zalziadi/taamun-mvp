import { AppShell } from "../../components/AppShell";
import { AccountClient } from "./AccountClient";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth?next=%2Faccount");
  }

  return (
    <AppShell title="حسابي">
      <AccountClient embedded userEmail={user.email ?? null} />
    </AppShell>
  );
}
