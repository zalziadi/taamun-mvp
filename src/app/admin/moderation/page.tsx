"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Kind = "thread" | "reply" | "journey" | "insight";

interface Item {
  id?: string;
  slug?: string;
  title?: string;
  body?: string;
  description?: string;
  content?: string;
  display_name?: string;
  creator_display_name?: string;
  created_at?: string;
  anchor_type?: string;
  anchor_value?: string;
  thread_id?: string;
}

interface Bucket {
  kind: Kind;
  label: string;
  items: Item[];
}

export default function ModerationDashboard() {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const [authError, setAuthError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/moderation");
    if (res.status === 401 || res.status === 403) {
      setAuthError(true);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setBuckets([
        { kind: "thread", label: "خيوط", items: data.threads ?? [] },
        { kind: "reply", label: "ردود", items: data.replies ?? [] },
        { kind: "journey", label: "رحلات مبدعين", items: data.journeys ?? [] },
        { kind: "insight", label: "رؤى مشاركة", items: data.insights ?? [] },
      ]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(kind: Kind, id: string, action: "approve" | "remove" | "keep") {
    const key = `${kind}:${id}`;
    if (busy) return;
    setBusy(key);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, action }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-[#1a1816] text-white/80 px-6 py-12 text-center" dir="rtl">
        <h1 className="text-xl font-bold mb-2">وصول مرفوض</h1>
        <p className="text-sm text-white/50">هذه الصفحة للأدمن فقط</p>
        <Link href="/" className="mt-4 inline-block text-xs text-[#c9b88a] underline">
          الرئيسية
        </Link>
      </main>
    );
  }

  if (!buckets) {
    return (
      <main className="min-h-screen bg-[#1a1816] text-white/60 px-6 py-12 text-center" dir="rtl">
        <p className="text-xs italic">تحميل...</p>
      </main>
    );
  }

  const totalFlagged = buckets.reduce((n, b) => n + b.items.length, 0);

  return (
    <main className="min-h-screen bg-[#1a1816] text-white px-6 py-10" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <Link href="/admin" className="text-xs text-white/40 hover:text-white/70">
            ← لوحة الأدمن
          </Link>
          <h1 className="text-2xl font-bold text-white">مركز المراجعة</h1>
          <p className="text-sm text-white/60">
            {totalFlagged === 0 ? "لا يوجد محتوى بانتظار المراجعة." : `${totalFlagged} عنصر بانتظار القرار`}
          </p>
        </header>

        {buckets.map((bucket) => (
          <section key={bucket.kind} className="space-y-3">
            <h2 className="text-sm font-bold text-[#c9b88a]">
              {bucket.label} ({bucket.items.length})
            </h2>
            {bucket.items.length === 0 ? (
              <p className="text-xs text-white/30 italic">لا شيء هنا.</p>
            ) : (
              <ul className="space-y-2">
                {bucket.items.map((item) => {
                  const id = (item.id ?? item.slug ?? "") as string;
                  const key = `${bucket.kind}:${id}`;
                  const isBusy = busy === key;
                  const text =
                    item.title ??
                    item.body ??
                    item.description ??
                    item.content ??
                    "(بدون نص)";
                  const author =
                    item.creator_display_name ?? item.display_name ?? "مجهول";
                  return (
                    <li
                      key={key}
                      className="rounded-2xl border border-white/10 bg-[#2b2824] px-4 py-3 space-y-2"
                    >
                      <p className="text-sm text-white/90 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {text}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {author}
                        {item.anchor_type && item.anchor_value && (
                          <span> · {item.anchor_type}: {item.anchor_value}</span>
                        )}
                        {item.created_at && (
                          <span>
                            {" "}· {new Date(item.created_at).toLocaleString("ar-SA")}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={isBusy}
                          onClick={() => act(bucket.kind, id, "approve")}
                          className="border border-green-500/40 text-green-300 hover:bg-green-500/10 px-3 py-1 text-[11px] disabled:opacity-40"
                        >
                          اعتماد
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => act(bucket.kind, id, "remove")}
                          className="border border-red-500/40 text-red-300 hover:bg-red-500/10 px-3 py-1 text-[11px] disabled:opacity-40"
                        >
                          حذف
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => act(bucket.kind, id, "keep")}
                          className="border border-white/20 text-white/60 hover:bg-white/5 px-3 py-1 text-[11px] disabled:opacity-40"
                        >
                          إبقاء في الانتظار
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
