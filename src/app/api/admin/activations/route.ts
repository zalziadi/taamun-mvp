import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/[,]/g, " ");
  const supabase = adminAuth.admin;

  let query = supabase
    .from("admin_activations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    const pat = `%${q}%`;
    query = query.or(`identifier.ilike.${pat},note.ilike.${pat},plan_key.ilike.${pat}`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id,
    identifier: r.identifier,
    planKey: r.plan_key,
    maxUses: r.max_uses ?? 1,
    note: r.note ?? "",
    createdAt: r.created_at,
  }));

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const identifier = typeof b?.identifier === "string" ? b.identifier.trim() : "";
  const planKey = typeof b?.planKey === "string" ? b.planKey.trim() : "base";
  const maxUses = typeof b?.maxUses === "number" ? b.maxUses : 1;
  const note = typeof b?.note === "string" ? b.note.trim() : "";

  if (!identifier) {
    return Response.json({ error: "identifier is required" }, { status: 400 });
  }

  const supabase = adminAuth.admin;
  const { data, error } = await supabase
    .from("admin_activations")
    .insert({
      identifier,
      plan_key: planKey,
      max_uses: maxUses,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: data.id,
    identifier: data.identifier,
    planKey: data.plan_key,
    maxUses: data.max_uses ?? 1,
    note: data.note ?? "",
    createdAt: data.created_at,
  });
}
