import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThreadReplyForm } from "@/components/ThreadReplyForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

async function loadThread(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, body, display_name, anchor_type, anchor_value, reply_count, created_at, status")
    .eq("id", id)
    .maybeSingle();

  if (!thread || thread.status !== "published") return null;

  const { data: replies } = await supabase
    .from("thread_replies")
    .select("id, body, display_name, created_at")
    .eq("thread_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(200);

  return { thread, replies: replies ?? [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadThread(id);
  if (!data) return { title: "خيط غير موجود — تمعّن" };
  const title = `${data.thread.title} — نقاش في تمعّن`;
  const description = data.thread.body.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function anchorLabel(type: string, value: string): string {
  if (type === "day") return `يوم ${value}`;
  if (type === "verse") return `آية: ${value}`;
  return `${type}: ${value}`;
}

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadThread(id);
  if (!data) notFound();

  const { thread, replies } = data;

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      <nav className="text-xs text-[#8c7851]">
        <Link href="/" className="hover:text-[#5a4a35]">الرئيسية</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">{anchorLabel(thread.anchor_type, thread.anchor_value)}</span>
      </nav>

      <article className="tm-card p-6 sm:p-8 space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2f2619] leading-tight">
          {thread.title}
        </h1>
        <p className="text-sm leading-relaxed text-[#3d342a] whitespace-pre-wrap">
          {thread.body}
        </p>
        <div className="flex items-center justify-between pt-2 text-[11px] text-[#8c7851]">
          <span>{thread.display_name}</span>
          <span>{formatDate(thread.created_at)}</span>
        </div>
      </article>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#5a4a35]">
          الردود ({replies.length})
        </h2>
        {replies.length === 0 ? (
          <p className="text-xs text-[#8c7851]/70 italic">
            لا ردود بعد — كن أول من يشارك.
          </p>
        ) : (
          <ul className="space-y-3">
            {replies.map((r) => (
              <li key={r.id} className="tm-card p-4 sm:p-5 space-y-2">
                <p className="text-sm leading-relaxed text-[#3d342a] whitespace-pre-wrap">
                  {r.body}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#8c7851]/70">
                  <span>{r.display_name}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ThreadReplyForm threadId={thread.id} />
    </main>
  );
}
