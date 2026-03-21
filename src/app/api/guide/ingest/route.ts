import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { chunkText, embedText, loadBookCorpus } from "@/lib/rag";

export const dynamic = "force-dynamic";

type IngestBody = {
  reset?: boolean;
};

export async function POST(req: Request) {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  let body: IngestBody = {};
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    // Optional body; ignore parsing failures.
  }

  const admin = getSupabaseAdmin();
  if (body.reset) {
    const { error: deleteError } = await admin.from("book_chunks").delete().neq("chunk_index", -1);
    if (deleteError) {
      return NextResponse.json({ ok: false, error: "reset_failed" }, { status: 500 });
    }
  }

  const corpus = await loadBookCorpus();
  const allChunks = corpus.flatMap((item) => chunkText(item.source, item.text));

  const payload: Array<{
    source: string;
    chunk_index: number;
    content: string;
    embedding: number[];
    token_count: number;
  }> = [];

  for (const chunk of allChunks) {
    const embedding = await embedText(chunk.content);
    payload.push({
      source: chunk.source,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding,
      token_count: Math.ceil(chunk.content.length / 4),
    });
  }

  const { error } = await admin.from("book_chunks").upsert(payload, {
    onConflict: "source,chunk_index",
  });
  if (error) {
    return NextResponse.json({ ok: false, error: "ingest_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    chunks: payload.length,
    sources: corpus.map((item) => item.source),
  });
}
