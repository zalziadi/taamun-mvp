import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/migrate-cycles
 * One-time migration: adds current_cycle + completed_cycles to progress.
 * Protected by ADMIN_MIGRATION_KEY or SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   curl -X POST https://taamun-mvp.vercel.app/api/admin/migrate-cycles \
 *     -H "Content-Type: application/json" \
 *     -d '{"key":"<SERVICE_ROLE_KEY>"}'
 */
export async function POST(req: Request) {
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

  // Try via exec_raw_sql RPC (fastest path)
  const migrationSQL = `
    ALTER TABLE public.progress
      ADD COLUMN IF NOT EXISTS current_cycle INT NOT NULL DEFAULT 1;
    ALTER TABLE public.progress
      ADD COLUMN IF NOT EXISTS completed_cycles INT[] NOT NULL DEFAULT ARRAY[]::INT[];
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'progress_current_cycle_positive'
      ) THEN
        ALTER TABLE public.progress
          ADD CONSTRAINT progress_current_cycle_positive CHECK (current_cycle >= 1);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS progress_current_cycle_idx ON public.progress (current_cycle);
  `;

  const { error: rpcErr } = await admin.rpc("exec_raw_sql", { sql: migrationSQL });

  if (!rpcErr) {
    results.push({ step: "migration_via_rpc", ok: true });
  } else {
    results.push({
      step: "migration_via_rpc",
      ok: false,
      error: rpcErr.message,
    });
  }

  // Verify by checking if current_cycle column is readable
  const { error: verifyErr } = await admin
    .from("progress")
    .select("current_cycle, completed_cycles")
    .limit(1);

  if (!verifyErr) {
    results.push({ step: "verify_columns_exist", ok: true });
  } else {
    results.push({
      step: "verify_columns_exist",
      ok: false,
      error: verifyErr.message + " — run SQL manually in Supabase SQL Editor",
    });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { ok: allOk, results },
    { status: allOk ? 200 : 500 }
  );
}
