import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { loadChapter } from "../../../../lib/book/loadBook";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const chapter = await loadChapter(slug);
  if (!chapter) notFound();

  return (
    <AppShell title={chapter.meta.title}>
      <div className="space-y-6">
        <nav className="flex gap-4 text-sm">
          <Link href="/book" className="text-white/70 hover:text-white">
            المكتبة
          </Link>
          <Link href="/day" className="text-white/70 hover:text-white">
            اليوم
          </Link>
        </nav>

        {chapter.meta.excerpt && (
          <p className="text-white/80">{chapter.meta.excerpt}</p>
        )}

        <div
          className="prose prose-invert max-w-none prose-p:text-white/90 prose-headings:text-white"
          dangerouslySetInnerHTML={{ __html: chapter.html }}
        />

        {chapter.meta.topics && chapter.meta.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-white/60">مواضيع:</span>
            {chapter.meta.topics.map((t) => (
              <Link
                key={t}
                href={`/book/topic/${encodeURIComponent(t)}`}
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/20"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
