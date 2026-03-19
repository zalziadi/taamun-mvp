import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: users, error: userError } = await admin.auth.admin.listUsers();
  if (userError) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
  const { error } = await admin
    .from("profiles")
    .update({ book_access: true, book_activated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email });
}
