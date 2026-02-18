import { requireAdmin } from "@/lib/authz";
import { APP_SLUG } from "@/lib/appConfig";

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
    .from("user_answers")
    .select("user_id, day, observe, insight, contemplate, rebuild, ai_reflection, updated_at")
    .order("user_id", { ascending: true })
    .order("day", { ascending: true })
    .limit(5000);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const headers = [
    "user_id",
    "day",
    "observe",
    "insight",
    "contemplate",
    "rebuild",
    "ai_reflection",
    "updated_at",
  ];
  const rows = (data ?? []).map((row) =>
    headers.map((h) => escapeCsv((row as Record<string, unknown>)[h])).join(",")
  );
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${APP_SLUG}-history-export.csv"`,
    },
  });
}
