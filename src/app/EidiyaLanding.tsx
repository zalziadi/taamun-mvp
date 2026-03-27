"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Countdown hook ─── */
function useCountdown(deadline: Date) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function tick() {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return setRemaining({ d: 0, h: 0, m: 0, s: 0 });
      setRemaining({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    }
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

/* ─── IntersectionObserver hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Colors (matching existing brand) ─── */
const C = {
  gold: "#e6d4a4",
  goldDim: "#c9b88a",
  bgDeep: "#0a0908",
  bgCard: "#1c1a15",
  textPrimary: "#e8e1d9",
  textSecondary: "rgba(232,225,217,0.8)",
  textMuted: "rgba(232,225,217,0.4)",
  border: "rgba(201,184,138,0.12)",
  accent: "#d4a574",
} as const;

/* ─── Deadline ─── */
const DEADLINE = new Date("2026-04-05T23:59:59+03:00");

const WA_LINK =
  "https://wa.me/966553930885?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%AD%D9%88%D9%91%D9%84%D8%AA%20%D9%84%D8%B9%D9%8A%D8%AF%D9%8A%D8%A9%20%D8%AA%D9%85%D8%B9%D9%91%D9%86";

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function EidiyaLanding() {
  const cd = useCountdown(DEADLINE);
  const [navVisible, setNavVisible] = useState(false);
  const [floatingVisible, setFloatingVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setNavVisible(window.scrollY > window.innerHeight * 0.7);
      const offer = document.getElementById("offer");
      if (offer) {
        const offerTop = offer.offsetTop - window.innerHeight;
        const offerBottom = offer.offsetTop + offer.offsetHeight;
        setFloatingVisible(
          window.scrollY > window.innerHeight &&
          (window.scrollY < offerTop || window.scrollY > offerBottom)
        );
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen overflow-x-hidden"
      style={{ background: C.bgDeep, color: C.textPrimary, fontFamily: "var(--font-amiri), serif" }}
    >
      {/* ── Sticky Nav ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3 border-b transition-transform duration-400"
        style={{
          background: "rgba(10,9,8,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: C.border,
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <span className="text-lg font-bold" style={{ color: C.gold }}>تمعّن</span>
        <a
          href="#offer"
          className="rounded-lg px-4 py-2 text-sm font-bold no-underline"
          style={{ background: C.gold, color: C.bgDeep }}
        >
          ابدأ — ٢٨ ر.س
        </a>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <header className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ minHeight: "100dvh" }}>
        {/* glow */}
        <div
          className="pointer-events-none absolute top-[15%] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(201,184,138,0.06) 0%, transparent 70%)",
            animation: "breathe 8s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <span
            className="mb-8 inline-block rounded-full border px-4 py-1 text-xs tracking-widest animate-[fadeIn_1s_ease_0.2s_both]"
            style={{ borderColor: C.border, color: C.goldDim, background: "rgba(28,26,21,0.5)", backdropFilter: "blur(8px)" }}
          >
            عيدية تمعّن ٢٠٢٦
          </span>

          <h1
            className="max-w-[700px] text-4xl font-bold leading-[1.6] md:text-6xl animate-[fadeUp_1s_ease_0.4s_both]"
            style={{ color: C.textPrimary }}
          >
            وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
          </h1>

          <p className="mt-3 text-sm animate-[fadeIn_1s_ease_0.8s_both]" style={{ color: C.textMuted }}>
            سورة البقرة — ١٨٦
          </p>

          <p
            className="mt-8 max-w-[520px] text-lg leading-8 animate-[fadeUp_1s_ease_0.6s_both]"
            style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), var(--font-amiri), sans-serif" }}
          >
            في عمق كل آية بابٌ لم تطرقه بعد.
            <br />
            تمعّن يفتح لك هذا الباب — رحلة ٢٨ يوماً لاكتشاف المعنى بلغة القرآن.
          </p>

          <a
            href="#offer"
            className="mt-8 inline-flex items-center gap-3 rounded-[14px] px-8 py-4 text-lg font-bold no-underline transition-all duration-300 hover:-translate-y-0.5 animate-[fadeUp_1s_ease_0.8s_both]"
            style={{ background: C.gold, color: C.bgDeep, boxShadow: "0 8px 32px rgba(230,212,164,0.15)" }}
          >
            ابدأ رحلتك
          </a>

          <div className="mt-4 animate-[fadeIn_1s_ease_1s_both]">
            <p className="text-sm" style={{ color: C.textMuted }}>٢٨ ريال فقط — أقل من قهوة</p>
            <p className="mt-1 text-xs font-medium" style={{ color: C.accent }}>العرض ينتهي ٥ أبريل</p>
          </div>
        </div>
      </header>

      {/* ══════════ COUNTDOWN ══════════ */}
      <div className="border-y py-4 text-center" style={{ background: "rgba(28,26,21,0.9)", borderColor: C.border }}>
        <p className="mb-2 text-xs tracking-wider" style={{ color: C.goldDim }}>ينتهي العرض خلال</p>
        <div className="inline-flex gap-5" dir="ltr">
          {[
            { n: cd.d, l: "يوم" },
            { n: cd.h, l: "ساعة" },
            { n: cd.m, l: "دقيقة" },
            { n: cd.s, l: "ثانية" },
          ].map((u) => (
            <div key={u.l} className="flex flex-col items-center">
              <span className="text-2xl font-bold md:text-3xl" style={{ color: C.gold }}>{u.n}</span>
              <span className="text-[0.6rem] tracking-wider" style={{ color: C.textMuted }}>{u.l}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ══════════ QUOTE 1 ══════════ */}
      <Reveal>
        <blockquote className="relative mx-auto max-w-[680px] px-6 py-10 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10" style={{ background: `linear-gradient(90deg, transparent, ${C.goldDim}, transparent)` }} />
          <p className="text-xl leading-[2.1] md:text-2xl" style={{ color: C.textPrimary }}>
            اللغة ليست أداة تواصل فقط — اللغة وعاء المعنى. والقرآن اختار لغة لا تتسع لها لغة أخرى. حين تتمعّن في الكلمة القرآنية، أنت لا تقرأ — أنت تُكتشَف.
          </p>
          <cite className="mt-5 block text-sm not-italic tracking-wider" style={{ color: C.goldDim }}>
            من كتاب مدينة المعنى بلغة القرآن
          </cite>
        </blockquote>
      </Reveal>

      <Divider />

      {/* ══════════ WHAT IS TAAMUN ══════════ */}
      <Reveal>
        <section className="mx-auto max-w-[800px] px-5 py-16">
          <p className="mb-2 text-xs tracking-[0.2em]" style={{ color: C.goldDim }}>ما هو تمعّن</p>
          <h2 className="mb-5 text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
            ليس تطبيقاً للقراءة — بل رحلة للاكتشاف
          </h2>
          <p className="text-base leading-8" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>
            تمعّن برنامج رقمي مبني على كتاب &quot;مدينة المعنى بلغة القرآن&quot;. في ٢٨ يوماً، تنتقل من مستوى القراءة السطحية إلى مستوى التمعّن العميق. كل يوم يأخذك خطوة أعمق في فهم العلاقة بين اللغة والمعنى والوعي.
          </p>
          <p className="mt-4 text-base leading-8" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>
            الرحلة مصممة على ثلاث مراحل: من{" "}
            <strong style={{ color: C.gold }}>الظل</strong> — حيث تبدأ بالتعرف على ما كنت تتجاهله، إلى{" "}
            <strong style={{ color: C.gold }}>الهدية</strong> — حيث تكتشف المعنى المختبئ في كل آية، إلى{" "}
            <strong style={{ color: C.gold }}>أفضل احتمال</strong> — حيث يصبح التمعّن جزءاً من طريقة تفكيرك.
          </p>
        </section>
      </Reveal>

      <Divider />

      {/* ══════════ DAILY JOURNEY ══════════ */}
      <section className="mx-auto max-w-[800px] px-5 py-16">
        <Reveal>
          <p className="mb-2 text-xs tracking-[0.2em]" style={{ color: C.goldDim }}>يومك في تمعّن</p>
          <h2 className="mb-6 text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
            ١٥ دقيقة تغيّر نظرتك
          </h2>
        </Reveal>

        <div className="flex flex-col gap-3">
          {[
            { num: "١", title: "تنفّس وتهيّأ", desc: "لحظة صمت وتأمل تفصلك عن ضجيج اليوم وتحضّرك للتلقي." },
            { num: "٢", title: "آية اليوم", desc: "آية قرآنية مختارة بعناية مع تفسيرها العميق من منظور الكتاب." },
            { num: "٣", title: "سؤال التأمل", desc: "سؤال عميق يربط الآية بحياتك ويفتح لك زاوية جديدة." },
            { num: "٤", title: "التمرين والتدوين", desc: "تمرين عملي يومي ودفتر تأمل شخصي يحفظ رحلتك." },
            { num: "٥", title: "الطبقة المخفية", desc: "تفسير أعمق لمن يريد أن يغوص أكثر — اقتباس مباشر من الكتاب." },
          ].map((step) => (
            <Reveal key={step.num}>
              <div
                className="flex gap-4 rounded-2xl border p-5 transition-all duration-300 hover:translate-x-[-4px]"
                style={{ background: C.bgCard, borderColor: C.border }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold"
                  style={{ background: "rgba(230,212,164,0.06)", borderColor: "rgba(230,212,164,0.1)", color: C.goldDim }}
                >
                  {step.num}
                </div>
                <div>
                  <h4 className="text-base" style={{ color: C.gold }}>{step.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ INCLUDES ══════════ */}
      <section className="mx-auto max-w-[800px] px-5 py-16">
        <Reveal>
          <p className="mb-2 text-xs tracking-[0.2em]" style={{ color: C.goldDim }}>ماذا تحصل</p>
          <h2 className="mb-6 text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
            ثلاث أدوات في رحلة واحدة
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "📖", title: "الكتاب", desc: "مدينة المعنى بلغة القرآن — الأساس الذي بُني عليه البرنامج بالكامل." },
            { icon: "✨", title: "المساعد الذكي", desc: "مرشد يرافقك في كل يوم من رحلتك — يجيب أسئلتك ويعمّق فهمك." },
            { icon: "🕌", title: "برنامج ٢٨ يوم", desc: "رحلة متدرجة يوماً بيوم — من الظل إلى الهدية إلى أفضل احتمال." },
          ].map((card) => (
            <Reveal key={card.title}>
              <div
                className="relative overflow-hidden rounded-2xl border p-7 text-center transition-all duration-300 hover:-translate-y-1"
                style={{ background: C.bgCard, borderColor: C.border }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl"
                  style={{ background: "rgba(230,212,164,0.06)", borderColor: "rgba(230,212,164,0.1)" }}
                >
                  {card.icon}
                </div>
                <h4 className="mb-2 text-lg" style={{ color: C.gold }}>{card.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════ QUOTE 2 ══════════ */}
      <Reveal>
        <blockquote className="relative mx-auto max-w-[680px] px-6 py-10 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10" style={{ background: `linear-gradient(90deg, transparent, ${C.goldDim}, transparent)` }} />
          <p className="text-xl leading-[2.1] md:text-2xl" style={{ color: C.textPrimary }}>
            كل كلمة في القرآن اختيرت بدقة لا يستطيع بشر محاكاتها. حين تتوقف عند كلمة واحدة وتتمعّن فيها حقاً، تكتشف أن المعنى كان ينتظرك — أنت فقط لم تكن مستعداً لتراه.
          </p>
          <cite className="mt-5 block text-sm not-italic tracking-wider" style={{ color: C.goldDim }}>
            من كتاب مدينة المعنى بلغة القرآن
          </cite>
        </blockquote>
      </Reveal>

      <Divider />

      {/* ══════════ OFFER ══════════ */}
      <Reveal className="mx-auto max-w-[520px] px-5 py-16 text-center">
        <div
          id="offer"
          className="relative overflow-hidden rounded-[28px] border p-8 md:p-10"
          style={{
            borderColor: "rgba(201,184,138,0.25)",
            background: `linear-gradient(180deg, ${C.bgCard} 0%, rgba(12,11,9,1) 100%)`,
          }}
        >
          {/* top line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-44" style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

          <span
            className="mb-5 inline-block rounded-full px-4 py-1 text-xs font-bold tracking-wider"
            style={{ background: C.gold, color: C.bgDeep }}
          >
            عيدية محدودة
          </span>

          <h3 className="text-2xl" style={{ color: C.textPrimary }}>عيدية تمعّن</h3>
          <p className="mt-1 text-sm" style={{ color: C.textSecondary }}>هدية العيد لنفسك</p>

          <p className="mt-4 text-5xl font-bold" style={{ color: C.gold, fontFamily: "var(--font-manrope), sans-serif" }}>
            ٢٨ <span className="text-lg font-normal" style={{ color: C.goldDim }}>ر.س</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>شهر واحد — يبدأ فوراً عند التفعيل</p>

          <ul className="mt-6 mb-6 space-y-0 text-right" style={{ listStyle: "none", padding: 0 }}>
            {[
              "برنامج ٢٨ يوم كامل",
              "كتاب مدينة المعنى بلغة القرآن",
              "المساعد الذكي (المرشد)",
              "صفحة التأمل اليومية",
              "الدفتر الشخصي",
              "مقياس الوعي وتتبع التقدم",
              "شارات الإنجاز في المحطات المحورية",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 border-b py-2 text-sm"
                style={{ color: C.textSecondary, borderColor: "rgba(255,255,255,0.03)" }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.55rem]"
                  style={{ background: "rgba(230,212,164,0.1)", color: C.gold }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="block w-full rounded-[14px] py-4 text-center text-lg font-bold no-underline transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: C.gold,
              color: C.bgDeep,
              boxShadow: "0 8px 32px rgba(230,212,164,0.15)",
            }}
          >
            ابدأ الآن — ٢٨ ريال
          </Link>

          <p className="mt-3 text-xs font-medium" style={{ color: C.accent }}>
            ينتهي العرض يوم ٥ أبريل ٢٠٢٦
          </p>
        </div>
      </Reveal>

      <Divider />

      {/* ══════════ HOW TO START ══════════ */}
      <Reveal>
        <section className="mx-auto max-w-[800px] px-5 py-16">
          <p className="mb-2 text-xs tracking-[0.2em]" style={{ color: C.goldDim }}>كيف تبدأ</p>
          <h2 className="mb-6 text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
            ثلاث خطوات فقط
          </h2>

          <div className="space-y-0">
            {[
              <>حوّل <strong style={{ color: C.gold }}>٢٨ ريال</strong> عبر التحويل البنكي أو STC Pay</>,
              <>أرسل إيصال التحويل على واتساب{" "}<a href={WA_LINK} style={{ color: C.gold, textDecoration: "underline", textUnderlineOffset: "3px" }} dir="ltr">+966553930885</a></>,
              <>تحصل على كود التفعيل خلال دقائق — أدخله في الموقع وابدأ رحلتك فوراً</>,
            ].map((text, i) => (
              <div key={i} className="flex gap-4 border-b py-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                  style={{ background: "rgba(230,212,164,0.06)", borderColor: "rgba(230,212,164,0.1)", color: C.gold }}
                >
                  {["١", "٢", "٣"][i]}
                </div>
                <p className="pt-1 text-base" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>{text}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Divider />

      {/* ══════════ FAQ ══════════ */}
      <Reveal>
        <section className="mx-auto max-w-[800px] px-5 py-16">
          <p className="mb-2 text-xs tracking-[0.2em]" style={{ color: C.goldDim }}>أسئلة شائعة</p>
          <h2 className="mb-6 text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
            قبل ما تسأل
          </h2>

          {[
            { q: "هل البرنامج مناسب للمبتدئين؟", a: "نعم. تمعّن مصمم لكل مستوى. كل يوم يأخذك خطوة أعمق بالتدريج." },
            { q: "كم وقت يحتاج يومياً؟", a: "١٠-١٥ دقيقة يومياً كافية للتمعّن والتأمل والتمرين." },
            { q: "متى يبدأ اشتراكي؟", a: "فوراً عند تفعيل الكود. لا يوجد تاريخ بدء ثابت — ابدأ وقتما تشاء." },
            { q: "هل أقدر أرجع لأيام سابقة؟", a: "نعم. تقدمك محفوظ وتقدر ترجع لأي يوم سابق في أي وقت." },
            { q: "وش يصير بعد الـ ٢٨ يوم؟", a: "إذا أحببت الرحلة، تقدر تكمل باشتراك سنوي بأفضل قيمة. وإذا اكتفيت، فالأثر يبقى معك." },
          ].map((faq) => (
            <div key={faq.q} className="border-b py-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <p className="text-base" style={{ color: C.gold }}>{faq.q}</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: C.textSecondary, fontFamily: "var(--font-manrope), sans-serif" }}>{faq.a}</p>
            </div>
          ))}
        </section>
      </Reveal>

      <Divider />

      {/* ══════════ FINAL CTA ══════════ */}
      <Reveal className="mx-auto max-w-[600px] px-5 py-16 pb-28 text-center">
        <p className="text-2xl leading-relaxed md:text-3xl" style={{ color: C.textPrimary }}>
          أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَى قُلُوبٍ أَقْفَالُهَا
        </p>
        <p className="mt-2 text-sm" style={{ color: C.textMuted }}>سورة محمد — ٢٤</p>
        <a
          href="#offer"
          className="mt-8 inline-flex items-center gap-3 rounded-[14px] px-8 py-4 text-lg font-bold no-underline transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: C.gold, color: C.bgDeep, boxShadow: "0 8px 32px rgba(230,212,164,0.15)" }}
        >
          ابدأ تمعّنك — ٢٨ ريال
        </a>
        <p className="mt-3 text-xs font-medium" style={{ color: C.accent }}>آخر موعد: ٥ أبريل</p>
      </Reveal>

      {/* ══════════ FLOATING CTA (mobile) ══════════ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 items-center gap-3 border-t px-4 py-3 md:hidden"
        style={{
          background: "rgba(10,9,8,0.95)",
          backdropFilter: "blur(20px)",
          borderColor: C.border,
          display: floatingVisible ? "flex" : "none",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex-1">
          <span className="text-xl font-bold" style={{ color: C.gold }}>٢٨ ر.س</span>
          <span className="mr-2 text-xs" style={{ color: C.textMuted }}>عيدية تمعّن</span>
        </div>
        <a
          href="#offer"
          className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold no-underline"
          style={{ background: C.gold, color: C.bgDeep }}
        >
          ابدأ الآن
        </a>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t py-6 text-center text-xs" style={{ borderColor: C.border, color: C.textMuted }}>
        تمعّن © ٢٠٢٦ · من مشاريع الدير الرقمي
      </footer>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.04; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.08; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Divider ─── */
function Divider() {
  return (
    <div className="py-4 text-center text-lg tracking-[0.8em]" style={{ color: C.goldDim, opacity: 0.2 }}>
      ✦
    </div>
  );
}
