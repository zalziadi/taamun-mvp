"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkGuideLimit, incrementGuideUsage } from "@/lib/subscriptionAccess";
import { Paywall } from "@/components/Paywall";
import { supabase } from "@/lib/supabaseClient";
import { getGuideGreeting } from "@/lib/guide-prompt";
import { isVipTier } from "@/lib/guide-prompt-vip";

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
  "ماذا أشعر حين أقرأ القرآن؟",
  "كيف أبدأ أسمع ما تقوله لي الآية؟",
  "ما الذي يمنعني من التوقف عند الآية؟",
];

function nowLabel() {
  return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export default function GuidePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"rag" | "fallback">("fallback");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [showLimitPaywall, setShowLimitPaywall] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: getGuideGreeting({ current_day: 0, visit_type: "first_visit" }),
      time: nowLabel(),
    },
  ]);

  // Load profile and personalized quick prompts on mount
  useEffect(() => {
    async function loadData() {
      // Load profile
      let profileData: any = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        profileData = data;
        setProfile(data);
      }

      const isVip = isVipTier(profileData?.subscription_tier);

      // Load progress for dynamic greeting
      try {
        const progressRes = await fetch("/api/program/progress", { cache: "no-store" });
        const progressData = await progressRes.json();
        if (progressData.ok) {
          const day = progressData.current_day ?? 0;
          setCurrentDay(day);

          if (isVip && user) {
            // Fetch VIP-specific data: journey + Gene Keys
            const [journeyRes, gkRes] = await Promise.all([
              supabase.from("user_journey").select("last_insight, dominant_theme, session_count").eq("user_id", user.id).maybeSingle(),
              supabase.from("user_gene_keys_profile").select("sphere, shadow, gift").eq("user_id", user.id),
            ]);

            const journey = journeyRes.data;
            const gkData = gkRes.data ?? [];

            // Build personalized greeting with last insight
            const name = profileData?.full_name;
            const namePrefix = name ? `${name}، ` : "";

            let vipGreeting: string;
            if (journey?.last_insight) {
              // Best case: reference last conversation topic
              vipGreeting = `${namePrefix}مرحباً. آخر مرة تكلمنا عن "${journey.last_insight}" — وش تغيّر من وقتها؟`;
            } else if (journey?.dominant_theme) {
              vipGreeting = `${namePrefix}أهلاً. لاحظت إن موضوع "${journey.dominant_theme}" يطلع معنا كثير — تبي نتعمق فيه اليوم؟`;
            } else {
              // Fallback to day-based greeting
              vipGreeting = day <= 7
                ? `${namePrefix}أهلاً. أنا تمعّن. أعرف خريطتك وأتذكر رحلتك — خلينا نكمل من حيث وقفنا. وش يشغل بالك اليوم؟`
                : day <= 14
                  ? `${namePrefix}مرحباً. لاحظت إنك بدأت تشوف أنماط ما كنت تلاحظها — وخريطتك تأكد هذا. ماذا سمعت اليوم؟`
                  : day <= 21
                    ? `${namePrefix}وصلت لمرحلة العمق. خريطتك الجينية تقول إن عندك هدايا مخفية بدأت تظهر — ماذا تريد أن تستكشف اليوم؟`
                    : `${namePrefix}الرحلة في أيامها الأخيرة. كل ما عشته — الظل والهدية والاحتمال — صار جزء منك. ماذا تريد أن تحمل معك؟`;
            }
            setMessages([{ role: "assistant", text: vipGreeting, time: nowLabel() }]);

            // Build dynamic quick prompts from Gene Keys spheres
            const spherePromptMap: Record<string, string> = {
              pearl: "وش علاقتي بالمال والوفرة — وليش أحس بإحباط تجاهه؟",
              radiance: "كيف أظهر للعالم بشكل أصدق — بدون أقنعة؟",
              eq: "ليش أتعب في العلاقات القريبة — وش النمط المتكرر؟",
              core: "كيف أتخذ قرارات أوضح — بدون خوف؟",
              purpose: "ما هي غايتي الحقيقية — وليش أحس بضياع أحياناً؟",
              lifes_work: "وش الشي اللي لو سويته كل يوم بيعطيني معنى؟",
              attraction: "كيف أجذب الفرص الصح — بدون ما أضغط على نفسي؟",
              sq: "كيف أتعامل مع الإرهاق الجسدي والروحي؟",
              iq: "كيف أوقف التفكير الزايد وأبدأ أثق بحدسي؟",
              evolution: "ما هو النمط اللي لازم أتخلى عنه عشان أتطور؟",
            };

            const dynamicPrompts: string[] = [];
            const seenSpheres = new Set<string>();
            for (const gk of gkData) {
              if (seenSpheres.has(gk.sphere)) continue;
              seenSpheres.add(gk.sphere);
              const prompt = spherePromptMap[gk.sphere];
              if (prompt) dynamicPrompts.push(prompt);
              if (dynamicPrompts.length >= 3) break;
            }

            // Fallback if not enough sphere-based prompts
            if (dynamicPrompts.length < 3) {
              const fallbacks = [
                "ما هي الأنماط المتكررة في خريطتي الجينية؟",
                "كيف أتعامل مع شعور الإيقاف الذاتي؟",
                "أحس بإحباط تجاه المال — وش السبب؟",
              ];
              for (const fb of fallbacks) {
                if (dynamicPrompts.length >= 3) break;
                if (!dynamicPrompts.includes(fb)) dynamicPrompts.push(fb);
              }
            }

            setQuickPrompts(dynamicPrompts);
          } else {
            const greeting = getGuideGreeting({ current_day: day });
            setMessages([{ role: "assistant", text: greeting, time: nowLabel() }]);
          }
        }
      } catch {
        // Keep default greeting
      }

      // Load prompts (only override if not VIP — VIP already set above)
      if (!isVip) {
        try {
          const res = await fetch("/api/guide/prompts");
          if (!res.ok) return;
          const promptsData = (await res.json()) as PromptsPayload;
          if (promptsData.ok && promptsData.prompts && promptsData.prompts.length > 0) {
            setQuickPrompts(promptsData.prompts);
          }
        } catch {
          // Keep defaults
        }
      }
    }
    void loadData();
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

      // Check daily limit for trial users
      if (profile && profile.subscription_tier === 'trial') {
        const { withinLimit } = checkGuideLimit(profile);
        if (!withinLimit) {
          setShowLimitPaywall(true);
          return;
        }
      }

      pushUserMessage(text);
      setInput("");
      setLoading(true);

      // Increment usage for trial users
      if (profile && profile.subscription_tier === 'trial') {
        incrementGuideUsage();
      }

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
      {/* ── Welcome Section ────────────────────────────────────────────── */}
      <section className="text-center space-y-4">
        <h1 className="tm-heading text-4xl sm:text-5xl leading-tight">
          تمعّن
        </h1>
        <p className="text-sm text-[#5f5648]/85 max-w-2xl mx-auto">
          مرشدك الشخصي في رحلة اكتشاف المعنى بلغة القرآن
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className="tm-gold-btn rounded-xl px-4 py-2 text-sm">
            الرئيسية
          </Link>
          <Link href="/program" className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-2 text-sm text-[#5f5648]">
            متابعة البرنامج
          </Link>
          <Link href="/guide/voice" className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-2 text-sm text-[#5f5648]">
            🎙️ جلسة صوتية
          </Link>
        </div>
      </section>

      <section className="tm-card p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#7b694a] font-semibold">الوضع الحالي</p>
          </div>
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs",
              mode === "rag"
                ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-300/40 bg-amber-500/10 text-amber-300",
            ].join(" ")}
          >
            {mode === "rag" ? "متصل بالكتاب" : "وضع أساسي"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="tm-card p-4 sm:p-5">
          <div className="custom-scrollbar max-h-[50vh] space-y-4 overflow-y-auto p-1 sm:max-h-[58vh] sm:p-2">
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
                <p className="px-1 text-xs text-[#7d7362]">{message.time}</p>
              </div>
            ))}
            {loading ? (
              <div className="rounded-2xl border border-[#ded4c2] bg-[#f8f4ec] px-4 py-3 text-sm text-[#7d7362]">
                يكتب الآن...
              </div>
            ) : null}
            
            {/* Guide limit paywall */}
            {showLimitPaywall && (
              <div className="mx-auto max-w-md">
                <Paywall type="guide_limit_reached" />
              </div>
            )}
          </div>

          {/* Hide input form when limit reached */}
          {!showLimitPaywall && (
            <form onSubmit={onSubmit} className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder="اسأل سؤالاً عن القرآن أو مدينة المعنى..."
                className="flex-1 rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-3 text-sm text-[#2f2619] placeholder:text-[#7d7362] focus:outline-none focus:ring-2 focus:ring-[#8c7851]/25"
              />
              <button type="submit" disabled={loading} className="tm-gold-btn px-6 py-3">
                {loading ? "..." : "أرسل"}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <section className="tm-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#2f2619]">أسئلة سريعة — اضغط للبدء</h2>
            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => applyPrompt(prompt)}
                  className="w-full rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-3 py-2 text-right text-sm text-[#5f5648] transition hover:border-[#8c7851]/35 hover:text-[#2f2619] hover:bg-[#f5ede2]"
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
