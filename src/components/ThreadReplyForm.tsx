"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * ThreadReplyForm — compose + submit a reply.
 * Requires authentication; redirects to /auth if not signed in.
 */
export function ThreadReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !displayName.trim() || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/threads/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          display_name: displayName.trim(),
        }),
      });

      if (res.status === 401) {
        router.push(`/auth?next=/threads/${threadId}`);
        return;
      }

      const data = await res.json();
      if (res.ok && data.ok) {
        setBody("");
        setMessage(
          data.status === "flagged"
            ? "ردّك في الانتظار للمراجعة — شكراً"
            : "✓ تم النشر"
        );
        setTimeout(() => {
          router.refresh();
          setMessage(null);
        }, 1500);
      } else {
        setMessage("تعذّر النشر — حاول مجدداً");
      }
    } catch {
      setMessage("تعذّر الاتصال");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tm-card p-5 sm:p-6 space-y-3">
      <h3 className="text-sm font-bold text-[#5a4a35]">أضف ردّاً</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="الاسم المعروض (أو اسم مستعار)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] placeholder:text-[#8c7851]/50 focus:outline-none focus:border-[#8c7851]"
          required
        />
        <textarea
          placeholder="شاركنا ما تتمعّن فيه..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full bg-transparent border-0 border-b border-[#c9bda8]/50 py-2 text-sm text-[#2f2619] placeholder:text-[#8c7851]/50 focus:outline-none focus:border-[#8c7851] resize-none"
          required
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={submitting || !body.trim() || !displayName.trim()}
            className="border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] px-6 py-2 text-xs font-bold disabled:opacity-40"
          >
            {submitting ? "..." : "انشر"}
          </button>
          <p className="text-[10px] text-[#8c7851]/60">
            {body.length}/500
          </p>
        </div>
        {message && (
          <p className="text-[11px] text-[#8c7851] italic">{message}</p>
        )}
      </form>
    </section>
  );
}
