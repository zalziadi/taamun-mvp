import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAdminValid(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY ?? "";
  const provided =
    request.nextUrl.searchParams.get("key") ??
    request.nextUrl.searchParams.get("admin") ??
    request.headers.get("x-admin-key") ??
    "";
  return adminKey.length > 0 && provided === adminKey;
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  if (!isAdminValid(request)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("activation_codes")
    .select("code, plan, max_uses, uses, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: "server_error" }), { status: 500 });
  }

  const headers = ["code", "plan", "max_uses", "uses", "expires_at", "created_at"];
  const rows = (data ?? []).map((row) => headers.map((h) => escapeCsv(row[h as keyof typeof row])).join(","));
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="activation_codes.csv"',
    },
  });
}
