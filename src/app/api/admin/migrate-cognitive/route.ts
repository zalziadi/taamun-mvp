import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/migrate-cognitive
 * One-time migration to create cognitive system tables.
 * Protected by ADMIN_MIGRATION_KEY env var.
 */
export async function POST(req: Request) {
  // Simple key-based auth for one-time migration
  const { key } = await req.json().catch(() => ({ key: "" }));
  const expectedKey = process.env.ADMIN_MIGRATION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key !== expectedKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "admin_not_configured" }, { status: 500 });
  }

  const results: { step: string; ok: boolean; error?: string }[] = [];

  // Step 1: Extend user_memory
  const { error: e1 } = await admin.rpc("exec_raw_sql", {
    sql: `
      ALTER TABLE user_memory
      ADD COLUMN IF NOT EXISTS identity JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS drift_history INTEGER[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS last_cognitive_update TIMESTAMPTZ;
    `,
  });
  // If rpc doesn't exist, try direct approach
  if (e1) {
    // Fallback: use individual column additions via separate queries
    for (const col of [
      { name: "identity", def: "JSONB DEFAULT '{}'" },
      { name: "themes", def: "TEXT[] DEFAULT '{}'" },
      { name: "drift_history", def: "INTEGER[] DEFAULT '{}'" },
      { name: "last_cognitive_update", def: "TIMESTAMPTZ" },
    ]) {
      const { error } = await admin.from("user_memory").select(col.name).limit(1);
      if (error?.message?.includes("does not exist")) {
        results.push({ step: `add_column_${col.name}`, ok: false, error: `Column ${col.name} needs manual addition` });
      } else {
        results.push({ step: `check_column_${col.name}`, ok: true });
      }
    }
  } else {
    results.push({ step: "extend_user_memory", ok: true });
  }

  // Step 2: Create cognitive_actions table (test if it exists)
  const { error: e2 } = await admin.from("cognitive_actions").select("id").limit(1);
  if (e2?.message?.includes("does not exist")) {
    results.push({ step: "cognitive_actions", ok: false, error: "Table needs manual creation via Supabase Dashboard SQL Editor" });
  } else {
    results.push({ step: "cognitive_actions", ok: true });
  }

  // Step 3: Create reflection_links table
  const { error: e3 } = await admin.from("reflection_links").select("id").limit(1);
  if (e3?.message?.includes("does not exist")) {
    results.push({ step: "reflection_links", ok: false, error: "Table needs manual creation via Supabase Dashboard SQL Editor" });
  } else {
    results.push({ step: "reflection_links", ok: true });
  }

  const allOk = results.every((r) => r.ok);

  return NextResponse.json({
    ok: allOk,
    results,
    message: allOk
      ? "All tables verified/created"
      : "Some tables need manual creation — copy the SQL from supabase/migrations/20260406_cognitive_system.sql into the Supabase Dashboard SQL Editor",
  });
}
