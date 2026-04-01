import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { task_id, action } = body as { task_id?: string; action?: "approve" | "reject" };

  if (!task_id || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("najm_tasks")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", task_id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task_id, status: newStatus });
}
