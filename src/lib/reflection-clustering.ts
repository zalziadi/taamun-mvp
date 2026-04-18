/**
 * Reflection Theme Clustering
 *
 * Extracts recurring themes from a user's reflections using:
 *   1. OpenAI text-embedding-3-small for each reflection
 *   2. Simple cosine-similarity clustering
 *   3. Claude labels each cluster with an Arabic theme name
 *
 * Designed for light use — runs monthly per user, caches results.
 * Cost per user per month: ~$0.005 embeddings + ~$0.003 labeling = ~$0.008
 */

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface ReflectionItem {
  id: string;
  day: number;
  text: string;
}

export interface ThemeCluster {
  label: string;
  keywords: string[];
  reflection_ids: string[];
  reflection_count: number;
  sample_texts: string[];
}

/** Cosine similarity of two equal-length vectors. */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Fetches embeddings for a batch of texts.
 * OpenAI supports batch input up to 2048 inputs per call.
 */
async function fetchEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || texts.length === 0) return null;

  const model =
    process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  try {
    const res = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: texts }),
    });
    if (!res.ok) {
      console.error("[clustering] embeddings error:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      data?: Array<{ embedding: number[] }>;
    };
    return data.data?.map((d) => d.embedding) ?? null;
  } catch (err) {
    console.error("[clustering] embeddings exception:", err);
    return null;
  }
}

/**
 * Simple threshold-based clustering (agglomerative-lite).
 * Two reflections are in the same cluster if cosine(a, b) >= threshold.
 *
 * Not as accurate as k-means but deterministic and works well for small
 * N (< 100 reflections), which covers most users.
 */
function clusterByThreshold(
  embeddings: number[][],
  threshold = 0.6
): number[][] {
  const n = embeddings.length;
  const assigned = new Array<number>(n).fill(-1);
  const clusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (assigned[i] !== -1) continue;
    const clusterId = clusters.length;
    assigned[i] = clusterId;
    const members = [i];

    for (let j = i + 1; j < n; j++) {
      if (assigned[j] !== -1) continue;
      if (cosine(embeddings[i], embeddings[j]) >= threshold) {
        assigned[j] = clusterId;
        members.push(j);
      }
    }

    clusters.push(members);
  }

  return clusters;
}

/**
 * Uses Claude to label a cluster of reflections with an Arabic theme name.
 */
async function labelCluster(
  texts: string[]
): Promise<{ label: string; keywords: string[] } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model =
    process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514";

  const joined = texts
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${t.slice(0, 200)}`)
    .join("\n");

  const systemPrompt = `أنت تحلل تأملات روحانية مكتوبة من مستخدم تطبيق "تمعّن".

مهمتك: اقرأ مجموعة تأملات متقاربة دلالياً، وارجع:
- label: اسم موضوع عربي مختصر (كلمة أو كلمتين) يصف الجامع بينها
- keywords: 3-5 كلمات مفتاحية عربية

قواعد:
- الاسم عربي فصيح بسيط (مثال: "الصبر على الفقد"، "البحث عن المعنى")
- لا تحكم على المستخدم
- الكلمات المفتاحية تعكس ما كُتب فعلاً

أجب بـ JSON فقط.`;

  const userPrompt = `التأملات:\n${joined}\n\nأرجع:\n{"label": "...", "keywords": ["...", "..."]}`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text;
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as {
      label?: string;
      keywords?: string[];
    };
    if (!parsed.label) return null;
    return {
      label: parsed.label.slice(0, 80),
      keywords: (parsed.keywords ?? []).slice(0, 5).map((k) => String(k).slice(0, 50)),
    };
  } catch {
    return null;
  }
}

/**
 * Main entry: cluster a user's reflections into themes.
 * Returns the top N clusters by size (default 3).
 */
export async function clusterReflections(
  reflections: ReflectionItem[],
  options: { maxThemes?: number; similarity?: number } = {}
): Promise<ThemeCluster[]> {
  const { maxThemes = 3, similarity = 0.6 } = options;

  if (reflections.length < 5) return [];

  const embeddings = await fetchEmbeddings(reflections.map((r) => r.text));
  if (!embeddings) return [];

  const clusterIndices = clusterByThreshold(embeddings, similarity);

  // Keep only clusters with ≥2 members (single reflections aren't themes)
  const significantClusters = clusterIndices.filter((c) => c.length >= 2);

  // Sort by size, take top N
  significantClusters.sort((a, b) => b.length - a.length);
  const topClusters = significantClusters.slice(0, maxThemes);

  // Label each cluster with Claude
  const themes: ThemeCluster[] = [];
  for (const clusterMemberIndices of topClusters) {
    const members = clusterMemberIndices.map((i) => reflections[i]);
    const label = await labelCluster(members.map((m) => m.text));
    if (!label) continue;
    themes.push({
      label: label.label,
      keywords: label.keywords,
      reflection_ids: members.map((m) => m.id),
      reflection_count: members.length,
      sample_texts: members.slice(0, 3).map((m) => m.text.slice(0, 150)),
    });
  }

  return themes;
}
