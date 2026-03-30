import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const DEFAULT_CLAUDE_MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514";

export type BookChunk = {
  source: string;
  chunkIndex: number;
  content: string;
};

function normalizeMarkdown(input: string): string {
  return input
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function loadBookCorpus(): Promise<Array<{ source: string; text: string }>> {
  const base = path.join(process.cwd(), "src", "content", "book", "chapters");
  const files = [
    { file: "muraqabah.md", source: "book:muraqabah" },
    { file: "idrak.md", source: "book:idrak" },
    { file: "best-potential.md", source: "book:best-potential" },
  ];

  const corpus = await Promise.all(
    files.map(async ({ file, source }) => {
      const raw = await readFile(path.join(base, file), "utf8");
      return { source, text: normalizeMarkdown(raw) };
    })
  );

  return corpus.filter((item) => item.text.length > 0);
}

export function chunkText(source: string, text: string, targetSize = 900): BookChunk[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: BookChunk[] = [];
  let buffer = "";
  let index = 0;

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (candidate.length <= targetSize) {
      buffer = candidate;
      continue;
    }
    if (buffer) {
      chunks.push({ source, chunkIndex: index++, content: buffer });
    }
    buffer = paragraph;
  }

  if (buffer) {
    chunks.push({ source, chunkIndex: index, content: buffer });
  }

  return chunks;
}

/* ── OpenAI (embeddings only) ────────────────────── */

async function openAIRequest<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("missing_openai_api_key");
  }

  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`openai_${endpoint}_failed:${res.status}:${message.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

type EmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

export async function embedText(input: string): Promise<number[]> {
  const data = await openAIRequest<EmbeddingResponse>("embeddings", {
    model: DEFAULT_EMBEDDING_MODEL,
    input,
  });
  return data.data[0]?.embedding ?? [];
}

/* ── Claude API (chat completions) ───────────────── */

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ClaudeResponse = {
  content?: Array<{ type: string; text?: string }>;
};

async function claudeRequest(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 512
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("missing_anthropic_api_key");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`claude_failed:${res.status}:${message.slice(0, 200)}`);
  }

  const data = (await res.json()) as ClaudeResponse;
  const textBlock = data.content?.find((b) => b.type === "text");
  return textBlock?.text?.trim() ?? "";
}

/* ── Main completion function ────────────────────── */

export async function completeWithContext(
  question: string,
  contextChunks: string[],
  systemPrompt: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  const context = contextChunks.map((chunk, i) => `مقتطف ${i + 1}:\n${chunk}`).join("\n\n");

  const messages: ChatMessage[] = [];

  // Inject only recent, trimmed history to reduce token usage
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory
      .filter((msg) => !msg.content.includes("المراجع من الكتاب:"))
      .slice(-6)
      .map((msg) => ({
        role: msg.role,
        content: msg.content.slice(0, 500),
      }));
    messages.push(...recent);
  }

  messages.push({
    role: "user",
    content: context
      ? `${question}\n\nالمراجع من الكتاب:\n${context}`
      : question,
  });

  const reply = await claudeRequest(systemPrompt, messages, 400);

  return reply || "تعذر تكوين جواب الآن. حاول إعادة صياغة السؤال.";
}

/* ── Soul summary generation ─────────────────────── */

export async function generateSoulSummary(
  existingSummary: string,
  recentMessages: ChatMessage[]
): Promise<string> {
  const systemPrompt = `أنت محلل سلوكي صامت. مهمتك تحديث ملخص شخصية المشترك بناءً على المحادثة الجديدة.

القواعد:
- اكتب بصيغة الغائب ("يميل إلى..."، "يظهر عنده نمط...")
- ركّز على: الأنماط المتكررة، المشاعر السائدة، المواضيع المهمة، نقاط القوة والتحديات
- حدّث الملخص الموجود — لا تبدأ من الصفر. أضف الجديد واحذف ما لم يعد دقيقاً
- الحد الأقصى: 300 كلمة
- لا تذكر أرقام أيام أو تواريخ محددة
- اكتب بعربية فصيحة واضحة`;

  const conversationText = recentMessages
    .map((m) => `${m.role === "user" ? "المشترك" : "المرشد"}: ${m.content}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `الملخص الحالي:\n${existingSummary || "(لا يوجد ملخص سابق)"}\n\nالمحادثة الجديدة:\n${conversationText}\n\nحدّث الملخص:`,
    },
  ];

  return claudeRequest(systemPrompt, messages, 600);
}
