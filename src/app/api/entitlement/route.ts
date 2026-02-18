import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data: rows, error } = await supabase
    .from("entitlements")
    .select("plan, status, starts_at, ends_at")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    return Response.json({ ok: false, active: false, error: "server_error" }, { status: 500 });
  }

  const row = rows?.[0];
  const now = new Date().toISOString();
  const active =
    !!row &&
    row.status === "active" &&
    (row.ends_at == null || row.ends_at > now) &&
    (row.starts_at == null || row.starts_at <= now);

  return Response.json({
    ok: true,
    active,
    plan: row?.plan ?? null,
    status: row?.status ?? null,
    startsAt: row?.starts_at ?? null,
    endsAt: row?.ends_at ?? null,
  });
}
