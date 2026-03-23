"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  text: string;
  time: string;
};

type ChatPayload = {
  ok?: boolean;
  reply?: string;
  mode?: "rag" | "fallback";
  sessionId?: string;
};

type PromptsPayload = {
  ok?: boolean;
  prompts?: string[];
  day?: number;
};

const DEFAULT_PROMPTS = [
  "كيف أتحول من الظل إلى الهدية في موقف متكرر؟",
  "كيف أعيش أفضل احتمال اليوم بشكل عملي؟",
  "أعطني تمرين تمعّن قصير قبل النوم.",
];

function nowLabel() {
  return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export default function GuidePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"rag" | "fallback">("fallback");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "أنا مرشد مدينة المعنى. اسألني عن: الظل، الهدية، أفضل احتمال، أو كيف تطبق الآية على يومك.",
      time: nowLabel(),
    },
  ]);

  // Load personalized quick prompts on mount
  useEffect(() => {
    async function loadPrompts() {
      try {
        const res = await fetch("/api/guide/prompts");
        if (!res.ok) return;
        const data = (await res.json()) as PromptsPayload;
        if (data.ok && data.prompts && data.prompts.length > 0) {
          setQuickPrompts(data.prompts);
        }
      } catch {
        // Keep defaults
      }
    }
    void loadPrompts();
  }, []);

  function pushUserMessage(text: string) {
    setMessages((prev) => [...prev, { role: "user", text, time: nowLabel() }]);
  }

  function pushAssistantMessage(text: string) {
    setMessages((prev) => [...prev, { role: "assistant", text, time: nowLabel() }]);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text || loading) return;

      pushUserMessage(text);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: sessionId ?? undefined,
          }),
        });
        if (res.status === 401) {
          router.replace("/auth?next=/guide");
          return;
        }
        const data = (await res.json()) as ChatPayload;
        if (data.mode) setMode(data.mode);
        if (data.sessionId) setSessionId(data.sessionId);
        const reply =
          res.ok && data.ok !== false && data.reply
            ? data.reply
            : "تعذر الرد الآن. حاول مجددًا.";
        pushAssistantMessage(reply);
      } catch {
        pushAssistantMessage("حدث انقطاع مؤقت. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId, router]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    await sendMessage(text);
  }

  function applyPrompt(prompt: string) {
    setInput(prompt);
  }

  function resetChat() {
    setSessionId(null);
    setMessages([
      {
        role: "assistant",
        text: "بدأنا جلسة جديدة. ما السؤال الذي يشغل قلبك اليوم؟",
        time: nowLabel(),
      },
    ]);
  }

  return (
    <div className="tm-shell space-y-6">
      <section className="tm-card p-6 sm:p-7">
        <div className="mb-2 inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#7b694a]">
          المرشد التفاعلي
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="tm-heading text-4xl leading-tight">المرشد</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5f5648]/85">
              رفيقك الذكي في رحلة التأمل القرآني وربط المعنى بسلوك اليوم.
            </p>
          </div>
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs",
              mode === "rag"
                ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-300/40 bg-amber-500/10 text-amber-300",
            ].join(" ")}
          >
            {mode === "rag" ? "RAG متصل بالكتاب" : "وضع أساسي"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="tm-card p-4 sm:p-5">
          <div className="custom-scrollbar max-h-[58vh] space-y-4 overflow-y-auto p-1 sm:p-2">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-1.5">
                <div
                  className={[
                    "max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    message.role === "assistant"
                      ? "self-start rounded-tr-md border-[#ded4c2] bg-[#f8f4ec] text-[#2f2619]"
                      : "mr-auto rounded-tl-md border-[#cbb58e]/35 bg-[#e9ddc6] text-[#4e4637]",
                  ].join(" ")}
                >
                  {message.text}
                </div>
                <p className="px-1 text-[11px] text-[#7d7362]">{message.time}</p>
              </div>
            ))}
            {loading ? (
              <div className="rounded-2xl border border-[#ded4c2] bg-[#f8f4ec] px-4 py-3 text-sm text-[#7d7362]">
                يكتب الآن...
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل المرشد..."
              className="flex-1 rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-3 text-sm text-[#2f2619] placeholder:text-[#7d7362] focus:outline-none focus:ring-2 focus:ring-[#8c7851]/25"
            />
            <button type="submit" disabled={loading} className="tm-gold-btn px-6 py-3">
              {loading ? "..." : "أرسل"}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <section className="tm-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#2f2619]">أسئلة مقترحة</h2>
            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => applyPrompt(prompt)}
                  className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-right text-sm text-[#5f5648] transition hover:border-[#8c7851]/35 hover:text-[#2f2619]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <section className="tm-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-[#2f2619]">ملخص الجلسة</h2>
            <ul className="space-y-1 text-sm text-[#7d7362]">
              <li>• عدد الرسائل: {messages.length}</li>
              <li>• آخر وضع إجابة: {mode === "rag" ? "مراجع الكتاب" : "أساسي"}</li>
              <li>• الجلسة: {sessionId ? "محفوظة" : "جديدة"}</li>
            </ul>
          </section>

          <section className="tm-card p-5">
            <button type="button" onClick={resetChat} className="tm-ghost-btn w-full">
              بدء جلسة جديدة
            </button>
          </section>
        </aside>
      </section>

      <section className="text-center text-xs text-[#7d7362]">
        المرشد يقدم توجيهًا تأمليًا ولا يغني عن المختصين.
      </section>
    </div>
  );
}
