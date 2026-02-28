"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

type CartItem = {
  id: string;
  product_key: string;
  title: string;
  unit_amount: number;
  currency: string;
  qty: number;
};

function formatAmount(amount: number, currency = "SAR") {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCart() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/cart", { method: "GET" });
        if (res.status === 401) {
          router.replace("/auth?next=/cart");
          return;
        }
        const data = await res.json();
        if (!data?.ok) {
          if (!cancelled) setError("تعذر تحميل السلة");
          return;
        }
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setError("تعذر تحميل السلة");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCart();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_amount * item.qty, 0),
    [items]
  );

  async function removeItem(productKey: string) {
    setError(null);
    try {
      const res = await fetch(`/api/cart?productKey=${encodeURIComponent(productKey)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("تعذر حذف العنصر");
        return;
      }
      setItems((prev) => prev.filter((item) => item.product_key !== productKey));
    } catch {
      setError("تعذر حذف العنصر");
    }
  }

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout/session", { method: "POST" });
      if (res.status === 401) {
        router.replace("/auth?next=/cart");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data?.url) {
        if (data?.error === "stripe_not_configured") {
          setError("الدفع الإلكتروني غير مفعّل حالياً. تواصل معنا عبر واتساب.");
        } else {
          setError("تعذر بدء عملية الدفع");
        }
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setError("تعذر بدء عملية الدفع");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <AppShell title="السلة">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">سلة المشتريات</h1>

        {loading && <p className="text-white/70">جاري التحميل...</p>}

        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/80">
            السلة فارغة حالياً.
            <div className="mt-4">
              <Link href="/subscribe" className="text-white underline hover:text-white/80">
                العودة للاشتراك
              </Link>
            </div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {formatAmount(item.unit_amount, item.currency.toUpperCase())}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.product_key)}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  حذف
                </button>
              </div>
            ))}

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-white/70">الإجمالي</p>
                <p className="text-xl font-bold text-white">{formatAmount(total, "SAR")}</p>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-lg bg-white px-6 py-3 font-semibold text-[#0B0F14] disabled:opacity-50"
              >
                {checkingOut ? "جاري التحويل..." : "إتمام الدفع"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </AppShell>
  );
}
