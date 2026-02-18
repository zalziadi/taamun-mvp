import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * Returns a short-lived signed URL for the book PDF.
 * TODO: Wire to Supabase Storage or backend. Generate signed URL (60-300s TTL).
 * For now: stub returns 501. PDF is served statically from /book/City_of_Meaning_Quran_AR_EN_v0.pdf
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // Stub: no storage wired. When ready:
  // 1. Get object from Supabase Storage (or S3/GCS)
  // 2. Generate signed URL with 60-300s expiry
  // 3. Return { url: string }
  return NextResponse.json(
    { error: "Book URL not configured. Add Supabase Storage or similar." },
    { status: 501 }
  );
}
