import { AppShell } from "../../components/AppShell";
import { AccountClient } from "./AccountClient";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPlanEndDate, getPlanLabel } from "@/lib/plans";

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

  let entitlement = {
    plan: null as string | null,
    endsAt: null as string | null,
    status: null as string | null,
  };

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email && user.email === adminEmail) {
    entitlement = {
      plan: "ramadan_28",
      endsAt: null,
      status: "active",
    };
  } else {
    const { data: row } = await supabase
      .from("entitlements")
      .select("plan, status, ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    entitlement = {
      plan: row?.plan ?? null,
      endsAt: row?.ends_at ?? null,
      status: row?.status ?? null,
    };
  }

  return (
    <AppShell title="حسابي">
      <AccountClient
        embedded
        userEmail={user.email ?? null}
        initialEntitlement={entitlement}
        initialPlanLabel={getPlanLabel(entitlement.plan)}
        initialEndsAtLabel={formatPlanEndDate(entitlement.plan, entitlement.endsAt)}
      />
    </AppShell>
  );
}
