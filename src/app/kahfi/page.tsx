import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KahfiClient } from "./KahfiClient";

export const dynamic = "force-dynamic";

export default async function KahfiPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth?next=%2Fkahfi");
  }

  return (
    <KahfiClient
      userEmail={user.email ?? null}
      userCreatedAt={user.created_at ?? null}
      userId={user.id}
    />
  );
}
