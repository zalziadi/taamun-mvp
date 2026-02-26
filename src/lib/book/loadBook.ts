import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const CHAPTERS_DIR = path.join(process.cwd(), "src/content/book/chapters");

export interface BookChapterSummary {
  title: string;
  slug: string;
  excerpt?: string;
  topics?: string[];
}

export interface BookChapter extends BookChapterSummary {
  meta: BookChapterSummary;
  html: string;
}

function parseTopics(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const topics = raw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return topics.length > 0 ? topics : undefined;
}

async function markdownToHtml(markdown: string): Promise<string> {
  const processed = await remark().use(html).process(markdown);
  return String(processed);
}

async function readChapterByFile(filePath: string): Promise<BookChapter> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const title = String(data.title ?? "").trim();
  const slug = String(data.slug ?? "").trim();
  if (!title || !slug) {
    throw new Error(`Invalid chapter frontmatter in ${path.basename(filePath)}`);
  }

  const meta: BookChapterSummary = {
    title,
    slug,
    excerpt: typeof data.excerpt === "string" ? data.excerpt.trim() : undefined,
    topics: parseTopics(data.topics),
  };

  const chapterHtml = await markdownToHtml(parsed.content);
  return { ...meta, meta, html: chapterHtml };
}

export async function loadAllChapters(): Promise<BookChapterSummary[]> {
  const entries = await fs.readdir(CHAPTERS_DIR);
  const files = entries.filter((name) => name.endsWith(".md"));

  const chapters = await Promise.all(
    files.map(async (name) => {
      const chapter = await readChapterByFile(path.join(CHAPTERS_DIR, name));
      return chapter.meta;
    })
  );

  return chapters.sort((a, b) => a.title.localeCompare(b.title, "ar"));
}

export async function loadChapter(slug: string): Promise<BookChapter | null> {
  const safeSlug = slug.trim();
  if (!safeSlug) return null;

  const entries = await fs.readdir(CHAPTERS_DIR);
  const files = entries.filter((name) => name.endsWith(".md"));

  for (const name of files) {
    const chapter = await readChapterByFile(path.join(CHAPTERS_DIR, name));
    if (chapter.slug === safeSlug) return chapter;
  }

  return null;
}
