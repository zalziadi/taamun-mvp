import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TOTAL_DAYS = 28;

async function supabaseServer() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env: SUPABASE_URL/SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // no-op in immutable response phases
        }
      },
    },
  });
}

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_progress")
      .select("current_day, completed_days")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      const defaultRow = {
        user_id: user.id,
        current_day: 1,
        completed_days: [] as number[],
      };

      const { data: inserted, error: insertError } = await supabase
        .from("user_progress")
        .insert(defaultRow)
        .select("current_day, completed_days")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
      }

      return NextResponse.json({
        current_day: inserted.current_day ?? 1,
        completed_days: Array.isArray(inserted.completed_days) ? inserted.completed_days : [],
        total_days: TOTAL_DAYS,
      });
    }

    return NextResponse.json({
      current_day: data.current_day ?? 1,
      completed_days: Array.isArray(data.completed_days) ? data.completed_days : [],
      total_days: TOTAL_DAYS,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
