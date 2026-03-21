import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const DEFAULT_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

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

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export async function completeWithContext(
  question: string,
  contextChunks: string[],
  systemPrompt: string
): Promise<string> {
  const context = contextChunks.map((chunk, i) => `مقتطف ${i + 1}:\n${chunk}`).join("\n\n");

  const data = await openAIRequest<ChatResponse>("chat/completions", {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `السؤال:\n${question}\n\nالمراجع من الكتاب:\n${context}`,
      },
    ],
  });

  return (
    data.choices?.[0]?.message?.content?.trim() ??
    "تعذر تكوين جواب الآن. حاول إعادة صياغة السؤال."
  );
}
