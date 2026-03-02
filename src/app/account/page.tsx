import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountClient } from "./AccountClient";
import { AppShell } from "../../components/AppShell";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth?next=%2Faccount");
  }

  return (
    <AppShell title="حسابي">
      <AccountClient
        embedded
        userEmail={user.email ?? null}
        initialEntitlement={{ plan: "free", endsAt: null, status: "active" }}
        initialPlanLabel="مجاني"
        initialEndsAtLabel="وصول مفتوح"
      />
    </AppShell>
  );
}
