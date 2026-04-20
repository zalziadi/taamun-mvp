import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نقاشات المجتمع — تمعّن",
  description: "خيوط نقاش حول آيات وأيام برنامج تمعّن.",
};

type SearchParams = { [k: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

function anchorLabel(t?: string | null, v?: string | null): string {
  if (t === "day" && v) return `يوم ${v}`;
  if (t === "verse" && v) return `آية: ${v}`;
  return "كل النقاشات";
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

export default async function ThreadsIndex({ searchParams }: PageProps) {
  const params = await searchParams;
  const anchorType =
    typeof params.anchor_type === "string" ? params.anchor_type : null;
  const anchorValue =
    typeof params.anchor_value === "string" ? params.anchor_value : null;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("threads")
    .select("id, title, body, display_name, reply_count, created_at, anchor_type, anchor_value")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (anchorType && anchorValue) {
    query = query.eq("anchor_type", anchorType).eq("anchor_value", anchorValue);
  }

  const { data: threads } = await query;
  const list = threads ?? [];

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#2f2619]">
          {anchorLabel(anchorType, anchorValue)}
        </h1>
        <p className="text-sm text-[#5a4a35]">
          شارك تمعّنك أو اقرأ ما كتبه الآخرون.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="tm-card p-6 text-center text-sm text-[#8c7851] italic">
          لا نقاشات بعد — كن أول من يبدأ.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                href={`/threads/${t.id}`}
                className="tm-card p-5 block space-y-2 hover:bg-[#fdfbf6]"
              >
                <h2 className="text-base font-bold text-[#2f2619] leading-tight">
                  {t.title}
                </h2>
                <p className="text-xs text-[#3d342a] line-clamp-2 leading-relaxed">
                  {t.body}
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#8c7851]">
                  <span>{t.display_name}</span>
                  <span>
                    {t.reply_count > 0 ? `${t.reply_count} ردّ` : "لا ردود"} ·{" "}
                    {formatDate(t.created_at)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
