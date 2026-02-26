import { NextResponse } from "next/server";
import { loadAllChapters } from "../../../../lib/book/loadBook";

export async function GET() {
  try {
    const chapters = await loadAllChapters();
    return NextResponse.json({ chapters });
  } catch {
    return NextResponse.json({ chapters: [] }, { status: 500 });
  }
}
