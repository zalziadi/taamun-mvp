import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  const supabase = adminAuth.admin;
  const { data, error } = await supabase
    .from("admin_activations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const headers = ["id", "identifier", "plan_key", "max_uses", "note", "created_at"];
  const rows = (data ?? []).map((r) =>
    headers.map((h) => escapeCsv((r as Record<string, unknown>)[h])).join(",")
  );
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activations.csv"`,
    },
  });
}
