import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/diagnostics?key=<ADMIN_KEY>
 * يفحص: متغيرات البيئة + وجود الجداول + اتصال Claude API
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  /* ── 1. Environment variables ── */
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENTITLEMENT_SECRET: !!process.env.ENTITLEMENT_SECRET,
    ADMIN_KEY: !!process.env.ADMIN_KEY,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN ?? "(not set)",
  };

  /* ── 2. Supabase admin client ── */
  let admin;
  try {
    admin = getSupabaseAdmin();
    results.supabase_admin = "ok";
  } catch (e) {
    results.supabase_admin = `error: ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ ok: true, results });
  }

  /* ── 3. Table existence checks ── */
  const tables = [
    "profiles",
    "activation_codes",
    "progress",
    "user_progress",
    "user_answers",
    "reflections",
    "awareness_logs",
    "awareness_insights",
    "ramadan_verses",
    "quran_ayahs",
    "book_chunks",
    "guide_sessions",
    "guide_memory",
    "ramadan_insights",
  ];

  const tableResults: Record<string, string> = {};
  for (const table of tables) {
    try {
      const { error, count } = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        tableResults[table] = `error: ${error.message}`;
      } else {
        tableResults[table] = `exists (${count ?? 0} rows)`;
      }
    } catch (e) {
      tableResults[table] = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  results.tables = tableResults;

  /* ── 4. Claude API connectivity test ── */
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "قل: مرحباً" }],
        }),
      });
      if (res.ok) {
        results.claude_api = "connected";
      } else {
        const text = await res.text();
        results.claude_api = `error ${res.status}: ${text.slice(0, 200)}`;
      }
    } catch (e) {
      results.claude_api = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    results.claude_api = "ANTHROPIC_API_KEY not set — guide will use fallback only";
  }

  /* ── 5. OpenAI API (embeddings) ── */
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
          input: "test",
        }),
      });
      results.openai_api = res.ok ? "connected" : `error ${res.status}`;
    } catch (e) {
      results.openai_api = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    results.openai_api = "OPENAI_API_KEY not set — RAG disabled, guide uses Claude only";
  }

  /* ── 6. match_book_chunks RPC ── */
  try {
    const { error } = await admin.rpc("match_book_chunks", {
      query_embedding: Array(1536).fill(0),
      match_count: 1,
    });
    results.rag_function = error ? `error: ${error.message}` : "exists";
  } catch (e) {
    results.rag_function = `exception: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ ok: true, results });
}
