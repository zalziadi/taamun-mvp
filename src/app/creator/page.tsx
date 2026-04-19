"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Journey {
  slug: string;
  title: string;
  description: string;
  duration_days: number;
  status: string;
  subscriber_count: number;
  updated_at: string;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<null | "auth" | "vip">(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<7 | 14>(7);
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/creator/journeys");
      if (cancelled) return;
      if (res.status === 401) {
        setAuthError("auth");
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJourneys(data.journeys ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/creator/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          duration_days: duration,
          creator_display_name: displayName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthError("auth");
        return;
      }
      if (res.status === 403) {
        setAuthError("vip");
        return;
      }
      if (res.ok && data.journey) {
        router.push(`/creator/${data.journey.slug}`);
        return;
      }
      setMessage("تعذّر إنشاء الرحلة — تحقّق من الحقول");
    } finally {
      setCreating(false);
    }
  }

  if (authError === "auth") {
    return (
      <main className="max-w-lg mx-auto px-5 py-12 text-center space-y-4" dir="rtl">
        <h1 className="text-xl font-bold text-[#2f2619]">سجّل الدخول للمتابعة</h1>
        <Link
          href="/auth?next=/creator"
          className="inline-block border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-3 text-sm font-bold"
        >
          دخول
        </Link>
      </main>
    );
  }

  if (authError === "vip") {
    return (
      <main className="max-w-lg mx-auto px-5 py-12 text-center space-y-4" dir="rtl">
        <h1 className="text-xl font-bold text-[#2f2619]">وضع المبدع متاح لأعضاء VIP</h1>
        <p className="text-sm text-[#5a4a35] leading-relaxed">
          يمكنك إنشاء رحلات قرآنية قصيرة عند ترقية عضويتك.
        </p>
        <Link
          href="/pricing"
          className="inline-block border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-3 text-sm font-bold"
        >
          عرض الباقات
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-8" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619]">
          لوحة المبدع
        </h1>
        <p className="text-sm text-[#5a4a35] leading-relaxed">
          أنشئ رحلة قرآنية قصيرة (٧ أو ١٤ يوماً) وانشرها لمتابعي تمعّن.
        </p>
      </header>

      <section className="tm-card p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-[#5a4a35]">رحلة جديدة</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="عنوان الرحلة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851]"
            required
          />
          <textarea
            placeholder="وصف قصير (عن ماذا تتحدث الرحلة؟)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851] resize-none"
            required
          />
          <input
            type="text"
            placeholder="اسمك كما يظهر للقرّاء"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] focus:outline-none focus:border-[#8c7851]"
            required
          />
          <div className="flex items-center gap-4 text-xs text-[#5a4a35]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="duration"
                checked={duration === 7}
                onChange={() => setDuration(7)}
              />
              ٧ أيام
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="duration"
                checked={duration === 14}
                onChange={() => setDuration(14)}
              />
              ١٤ يوماً
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-2 text-xs font-bold disabled:opacity-40"
          >
            {creating ? "..." : "إنشاء"}
          </button>
          {message && <p className="text-[11px] text-[#8c7851] italic">{message}</p>}
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#5a4a35]">رحلاتي</h2>
        {loading ? (
          <p className="text-xs text-[#8c7851] italic">تحميل...</p>
        ) : !journeys || journeys.length === 0 ? (
          <p className="text-xs text-[#8c7851] italic">
            لم تنشئ رحلات بعد. ابدأ بأوّل واحدة في الأعلى.
          </p>
        ) : (
          <ul className="space-y-3">
            {journeys.map((j) => (
              <li key={j.slug}>
                <Link
                  href={`/creator/${j.slug}`}
                  className="tm-card p-4 sm:p-5 block space-y-1 hover:bg-[#fdfbf6]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#2f2619]">
                      {j.title}
                    </span>
                    <span
                      className={
                        "text-[10px] shrink-0 " +
                        (j.status === "published"
                          ? "text-[#5c7a3f]"
                          : j.status === "flagged"
                          ? "text-[#a6772b]"
                          : "text-[#8c7851]")
                      }
                    >
                      {j.status === "published"
                        ? "منشورة"
                        : j.status === "flagged"
                        ? "قيد المراجعة"
                        : j.status === "removed"
                        ? "محذوفة"
                        : "مسوّدة"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8c7851]">
                    {j.duration_days} يوم · {j.subscriber_count} مشترك
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
