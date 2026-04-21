import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_DOMAIN } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/threads", priority: 0.8, changeFrequency: "daily" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/creator/leaderboard", priority: 0.7, changeFrequency: "daily" },
  { path: "/creator/guide", priority: 0.6, changeFrequency: "monthly" },
  { path: "/book", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/sources", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((row) => ({
    url: `${APP_DOMAIN}${row.path}`,
    lastModified: new Date(),
    changeFrequency: row.changeFrequency,
    priority: row.priority,
  }));

  // Best-effort DB additions — degrade silently if Supabase is unreachable.
  try {
    const supabase = await createSupabaseServerClient();

    const [journeys, creators, threads, insights] = await Promise.all([
      supabase
        .from("creator_journeys")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("creator_journeys")
        .select("creator_user_id, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("threads")
        .select("id, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("shared_insights")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    for (const j of journeys.data ?? []) {
      entries.push({
        url: `${APP_DOMAIN}/journey/${j.slug}`,
        lastModified: new Date((j.updated_at as string) ?? Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const seenCreators = new Set<string>();
    for (const c of creators.data ?? []) {
      const id = c.creator_user_id as string;
      if (seenCreators.has(id)) continue;
      seenCreators.add(id);
      entries.push({
        url: `${APP_DOMAIN}/creator/by/${id}`,
        lastModified: new Date((c.updated_at as string) ?? Date.now()),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const t of threads.data ?? []) {
      entries.push({
        url: `${APP_DOMAIN}/threads/${t.id}`,
        lastModified: new Date((t.updated_at as string) ?? Date.now()),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }

    for (const s of insights.data ?? []) {
      entries.push({
        url: `${APP_DOMAIN}/shared/${s.slug}`,
        lastModified: new Date((s.updated_at as string) ?? Date.now()),
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  } catch {
    // Fall back to static entries only.
  }

  return entries;
}
