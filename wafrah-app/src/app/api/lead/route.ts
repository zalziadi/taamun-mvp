import { NextResponse } from "next/server";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

interface Body {
  name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  // سقوط آمن — التطبيق لا ينكسر إن غابت مفاتيح Supabase
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, synced: false, mode: "local" });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json({ ok: true, synced: false, mode: "local" });
  }

  const { error } = await supabase.from("wafrah_leads").upsert(
    {
      name,
      email,
      source: "wafrah-funnel",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, synced: true, mode: "supabase" });
}
