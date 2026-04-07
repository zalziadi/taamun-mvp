"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GrowthPrompt } from "./GrowthPrompt";

// ── Types ──
interface GuideMessage {
  role: "guide" | "user";
  text: string;
  stage?: "question" | "reflection" | "action" | "growth_trigger";
}

interface GuideApiResponse {
  reply: string;
  stage: "question" | "reflection" | "action" | "growth_trigger";
  memory_update?: Record<string, unknown>;
  done: boolean;
  upgrade?: { message: string; cta: string; url: string; package: string };
}

interface SmartGuideProps {
  verse: string;
  verseRef?: string;
  day: number;
  onComplete?: () => void;
}

const MEMORY_KEY = "taamun.memory.v1";

const STAGE_DOT: Record<string, string> = {
  question: "#C9A96E",       // gold
  reflection: "#D4A853",     // amber
  action: "#6B9B6B",         // green
  growth_trigger: "#9B6BC9", // purple
};

// ── Component ──
export function SmartGuide({ verse, verseRef, day, onComplete }: SmartGuideProps) {
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showGrowth, setShowGrowth] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Focus input
  useEffect(() => {
    if (!loading && !done) inputRef.current?.focus();
  }, [loading, done]);

  // Load anonymous memory
  const getAnonMemory = useCallback(() => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const saveAnonMemory = useCallback((update: Record<string, unknown>) => {
    try {
      const existing = getAnonMemory() ?? {};
      localStorage.setItem(MEMORY_KEY, JSON.stringify({ ...existing, ...update }));
    } catch {
      // silent
    }
  }, [getAnonMemory]);

  // Send message to API
  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: GuideMessage = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === "guide" ? "assistant" : "user",
        content: m.text,
      }));

      const body: Record<string, unknown> = {
        message: text,
        context: { verse, day },
        history,
      };

      // Include anonymous memory if available
      const anonMem = getAnonMemory();
      if (anonMem) body.memory = anonMem;

      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          role: "guide", text: "وصلت الحد اليومي. ارجع بكره وأكمل المسار.", stage: "reflection"
        }]);
        setDone(true);
        return;
      }

      const data: GuideApiResponse = await res.json();

      setMessages(prev => [...prev, {
        role: "guide", text: data.reply, stage: data.stage,
      }]);

      // Save anonymous memory
      if (data.memory_update) {
        saveAnonMemory(data.memory_update);
      }

      // Track action
      if (data.memory_update?.action_given) {
        setLastAction(data.memory_update.action_given as string);
      }

      // Growth trigger
      if (data.stage === "growth_trigger") {
        setShowGrowth(true);
      }

      // Session done
      if (data.done) {
        setDone(true);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "guide",
        text: "ماذا لو توقفت لحظة وسألت نفسك: ما الذي يمنعني من التمعّن الحقيقي؟",
        stage: "question",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#15130f", color: "#e8e1d9" }}
      dir="rtl"
    >
      {/* ── Header: Verse ── */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 text-center">
        <p
          className="text-2xl leading-[2.2] mb-2"
          style={{ fontFamily: "Amiri, serif", color: "#C9A96E" }}
        >
          {verse}
        </p>
        {verseRef && (
          <p className="text-xs" style={{ color: "rgba(201,169,110,0.5)" }}>
            {verseRef}
          </p>
        )}
        <div className="mt-3 mx-auto w-16 h-px" style={{ background: "rgba(201,169,110,0.2)" }} />
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {m.role === "guide" ? (
              <div className="flex gap-2.5 items-start max-w-sm">
                {/* Stage dot */}
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ background: STAGE_DOT[m.stage ?? "question"] }}
                />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#e8e1d9", lineHeight: 1.8 }}
                >
                  {m.text}
                </p>
              </div>
            ) : (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-4 py-2.5 max-w-xs text-sm"
                  style={{
                    background: "rgba(201,169,110,0.1)",
                    border: "1px solid rgba(201,169,110,0.15)",
                    lineHeight: 1.7,
                  }}
                >
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading: breathing circle */}
        {loading && (
          <div className="flex gap-2.5 items-center">
            <div
              className="w-6 h-6 rounded-full animate-[breathe_2s_ease-in-out_infinite]"
              style={{ background: "rgba(201,169,110,0.2)" }}
            />
            <span className="text-xs" style={{ color: "rgba(201,169,110,0.4)" }}>
              يتأمل...
            </span>
          </div>
        )}

        {/* Growth trigger */}
        {showGrowth && <GrowthPrompt onDismiss={() => setShowGrowth(false)} />}

        {/* Session complete */}
        {done && (
          <div
            className="rounded-2xl p-5 mt-4 animate-[fadeUp_0.5s_ease_both]"
            style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)" }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: "#C9A96E" }}>
              ملخص الجلسة
            </p>
            {lastAction && (
              <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(232,225,217,0.8)" }}>
                الفعل: {lastAction}
              </p>
            )}
            <button
              onClick={onComplete}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}
            >
              أكملت — العودة للبرنامج
            </button>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      {!done && (
        <div
          className="flex-shrink-0 px-4 pb-6 pt-3"
          style={{ borderTop: "1px solid rgba(201,169,110,0.08)" }}
        >
          <form
            onSubmit={e => { e.preventDefault(); send(); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اكتب تأملك..."
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.12)",
                color: "#e8e1d9",
              }}
              dir="rtl"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-30"
              style={{ background: "rgba(201,169,110,0.15)", color: "#C9A96E" }}
            >
              ↵
            </button>
          </form>
        </div>
      )}

      {/* ── Keyframe animations (inline) ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1);   opacity: 0.3; }
          50%      { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
