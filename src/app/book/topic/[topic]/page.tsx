import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { loadAllChapters } from "../../../../lib/book/loadBook";

interface Props {
  params: Promise<{ topic: string }>;
}

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const decoded = decodeURIComponent(topic);
  const chapters = await loadAllChapters();
  const matching = chapters.filter((c) =>
    c.topics?.some((t) => t === decoded || t.toLowerCase().includes(decoded.toLowerCase()))
  );
  if (matching.length === 0) notFound();

  return (
    <AppShell title={`موضوع: ${decoded}`}>
      <div className="space-y-6">
        <nav className="flex gap-4 text-sm">
          <Link href="/book" className="text-white/70 hover:text-white">
            المكتبة
          </Link>
        </nav>

        <p className="text-white/80">فصول تحتوي على هذا الموضوع:</p>

        <div className="space-y-4">
          {matching.map((ch) => (
            <Link
              key={ch.slug}
              href={`/book/chapter/${ch.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10"
            >
              <h2 className="text-xl font-bold text-white">{ch.title}</h2>
              {ch.excerpt && <p className="mt-2 text-sm text-white/70">{ch.excerpt}</p>}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
