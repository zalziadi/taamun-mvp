import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCatalogItem } from "@/lib/cart-catalog";

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op in immutable phases
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
      .from("cart_items")
      .select("id, product_key, title, unit_amount, currency, qty")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    const items = data ?? [];
    const totalAmount = items.reduce((sum, item) => sum + item.unit_amount * item.qty, 0);
    return NextResponse.json({ ok: true, items, totalAmount, currency: "sar" });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { productKey?: string; qty?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const productKey = (body.productKey ?? "").trim();
  const qty = Number(body.qty ?? 1);
  if (!productKey || !Number.isInteger(qty) || qty < 1 || qty > 10) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const product = getCatalogItem(productKey);
  if (!product) {
    return NextResponse.json({ ok: false, error: "unknown_product" }, { status: 400 });
  }

  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("cart_items").upsert(
      {
        user_id: user.id,
        product_key: product.productKey,
        title: product.title,
        unit_amount: product.unitAmount,
        currency: product.currency,
        qty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_key" }
    );

    if (error) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const productKey = (searchParams.get("productKey") ?? "").trim();
  if (!productKey) {
    return NextResponse.json({ ok: false, error: "missing_product_key" }, { status: 400 });
  }

  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_key", productKey);

    if (error) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
