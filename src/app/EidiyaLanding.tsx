"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─── Arabic numeral helper ─── */
const toAr = (n: number) =>
  n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]).padStart(2, "٠");

/* ─── Countdown hook (localStorage-persisted deadline) ─── */
function useCountdown() {
  const deadline = useMemo(() => {
    if (typeof window === "undefined") return new Date(Date.now() + 5 * 86_400_000);
    let stored = localStorage.getItem("taamun_countdown_end");
    if (!stored) {
      stored = String(Date.now() + 5 * 86_400_000);
      localStorage.setItem("taamun_countdown_end", stored);
    }
    return new Date(Number(stored));
  }, []);

  const [rem, setRem] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setRem({
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
  return rem;
}

/* ─── Reveal animation ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const WA_FREE = "https://wa.me/966594409396?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%AA%D8%AC%D8%B1%D8%A8%D8%A9%20%D8%AA%D9%85%D8%B9%D9%91%D9%86%20%D8%A7%D9%84%D9%85%D8%AC%D8%A7%D9%86%D9%8A%D8%A9";
const WA_Q = "https://wa.me/966594409396?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%AA%D9%85%D8%B9%D9%91%D9%86%20-%20%D8%B1%D8%A8%D8%B9%20%D8%B3%D9%86%D9%88%D9%8A";
const WA_Y = "https://wa.me/966594409396?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%AA%D9%85%D8%B9%D9%91%D9%86%20-%20%D8%B3%D9%86%D9%88%D9%8A";
const WA_VIP = "https://wa.me/966594409396?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%AA%D9%85%D8%B9%D9%91%D9%86%20-%20VIP";

const DOMAINS = [
  { name: "الهوية", icon: "fingerprint", desc: "إعادة اكتشاف الذات في ضوء النص الإلهي" },
  { name: "العلاقات", icon: "diversity_3", desc: "بناء الجسور الروحية مع الآخرين" },
  { name: "المال", icon: "payments", desc: "فلسفة الرزق والاستخلاف المادي" },
  { name: "النمو", icon: "trending_up", desc: "تزكية النفس في رحلة الـ ٢٨ يوماً" },
  { name: "العطاء", icon: "volunteer_activism", desc: "ممارسات الإحسان الخفية والظاهرة" },
  { name: "الجمال", icon: "auto_awesome", desc: "استشعار اللطائف الجمالية في الكون" },
  { name: "الأسرة", icon: "home", desc: "السكينة والمودة تحت سقف واحد" },
  { name: "البناء", icon: "foundation", desc: "إرساء قواعد العمل الصالح المستدام" },
  { name: "المراجعة", icon: "history_edu", desc: "وقفة تأملية في مخرجات الرحلة" },
];

const FAQS: [string, string][] = [
  ["ما الفرق بين هذا البرنامج وبين التفسير التقليدي؟", "نحن نركز على 'التدبّر النفسي'، أي كيف تلامس الآية واقعك اليومي ومشاعرك الحالية، بينما يركز التفسير على شرح المعاني اللغوية والتاريخية."],
  ["هل يتطلب البرنامج وقتاً طويلاً؟", "يكفي ١٠-١٥ دقيقة يومياً. صممنا المحتوى ليكون مكثفاً ومركزاً ليناسب أسلوب الحياة المعاصر."],
  ["أنا مبتدئ، هل البرنامج مناسب لي؟", "بالتأكيد. الرحلة مصممة لتأخذك من الصفر بأسلوب سلس وعميق في آن واحد."],
  ["ما هو 'المرشد الذكي'؟", "هو نظام متطور يساعدك في ربط الآيات بحالتك النفسية الحالية ويقترح عليك مسارات تدبرية مخصصة لك."],
  ["كيف يعمل الضمان؟", "إذا لم تشعر بأي تغيير خلال الأيام السبعة الأولى، يمكنك طلب استرداد المبلغ بالكامل فوراً."],
  ["متى تبدأ الموجة القادمة؟", "تبدأ الرحلة رسمياً فور اكتمال المقاعد الـ ١٠٠، أو عند انتهاء العداد في الأعلى."],
];

const STEPS = [
  { n: "١", title: "تنفّس وتهيّأ", desc: "لحظة صمت وتأمل تفصلك عن ضجيج اليوم وتحضّرك للتلقي." },
  { n: "٢", title: "آية اليوم", desc: "آية قرآنية مختارة بعناية مع تفسيرها العميق من منظور الكتاب." },
  { n: "٣", title: "سؤال التمعّن", desc: "سؤال عميق يربط الآية بحياتك ويفتح لك زاوية جديدة." },
  { n: "٤", title: "التمرين والتدوين", desc: "تمرين عملي يومي ودفتر تأمل شخصي يحفظ رحلتك." },
  { n: "٥", title: "الطبقة المخفية", desc: "تفسير أعمق لمن يريد أن يغوص أكثر — اقتباس مباشر من الكتاب." },
];

/* ─── Component ─── */
export function EidiyaLanding() {
  const cd = useCountdown();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Material Symbols */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style>{`
        .glass-card { background: rgba(28, 32, 37, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(212, 175, 55, 0.1); border-radius: 1rem; }
        .perspective-1200 { perspective: 1200px; }
        .preserve-3d { transform-style: preserve-3d; }
        .depth-card { transform: rotateY(-5deg) translateZ(20px); transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1); }
        .depth-card:hover { transform: rotateY(0deg) translateZ(50px); }
        .sacred-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l5.878 18.09h19.022L39.46 29.18 45.338 47.27 30 36.18 14.662 47.27l5.878-18.09L5.1 18.09h19.022L30 0z' fill='%23D4AF37' fill-opacity='0.03'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
        .btn-gold { background: linear-gradient(45deg, #e9c176, #c5a059); color: #412d00; transition: transform 0.2s ease-in-out; border-radius: 9999px; display: inline-block; text-decoration: none; }
        .btn-gold:active { transform: scale(0.95); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
      `}</style>

      <div className="min-h-screen bg-[#101419] text-[#E0E2EA] font-[family-name:var(--font-manrope)] selection:bg-[#c5a059]/30">

        {/* ── Scarcity Banner ── */}
        <div className="w-full bg-[#1C2025] py-3 px-4 text-center flex items-center justify-center gap-3 border-b border-[#c5a059]/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <p className="text-sm tracking-wide">التسجيل مفتوح — باقي <strong className="text-[#e9c176]">٢٣</strong> مقعداً من أصل ١٠٠</p>
        </div>

        {/* ── Header ── */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-[#1C2025]/80 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="text-2xl font-[family-name:var(--font-amiri)] italic text-[#E9C176]">تمعّن</div>
          <nav className="hidden md:flex gap-8">
            <a className="text-[#E9C176] border-b border-[#C5A059]/30 pb-1" href="#">الرحلة</a>
            <a className="text-[#E0E2EA]/70 hover:text-[#E9C176] transition-colors" href="#zones">المجالات التسعة</a>
            <a className="text-[#E0E2EA]/70 hover:text-[#E9C176] transition-colors" href="#pricing">الباقات</a>
            <a className="text-[#E0E2EA]/70 hover:text-[#E9C176] transition-colors" href="#faq">الأسئلة الشائعة</a>
          </nav>
          <a href="/auth?next=/day" className="btn-gold px-6 py-2 font-bold text-sm">ابدأ تجربتك المجانية</a>
        </header>

        {/* ── Countdown ── */}
        <section className="pt-32 pb-12 flex flex-col items-center">
          <h2 className="text-[#c5a059]/60 text-xs tracking-[0.2em] mb-6">باقي على إغلاق التسجيل</h2>
          <div className="flex gap-4 md:gap-8">
            {[
              { val: cd.d, label: "أيام" },
              { val: cd.h, label: "ساعة" },
              { val: cd.m, label: "دقيقة" },
              { val: cd.s, label: "ثواني" },
            ].map((u, i) => (
              <div key={u.label} className="flex items-center gap-4 md:gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-6xl font-[family-name:var(--font-amiri)] italic text-[#e9c176]">{toAr(u.val)}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#9a8f80]">{u.label}</span>
                </div>
                {i < 3 && <span className="text-4xl text-[#4e4639]">:</span>}
              </div>
            ))}
          </div>
        </section>

        {/* ── Hero ── */}
        <main className="relative w-full max-w-7xl mx-auto px-8 py-20 overflow-hidden">
          <div className="absolute inset-0 sacred-pattern -z-10 animate-[spin_120s_linear_infinite]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal className="text-right space-y-8">
              <h1 className="text-6xl md:text-8xl font-[family-name:var(--font-amiri)] italic text-[#E0E2EA] leading-tight">
                اكتشف <span className="text-[#e9c176]">معناك</span> <br />بلغة القرآن
              </h1>
              <p className="text-xl text-[#d1c5b4] max-w-lg leading-relaxed">
                برنامج ٢٨ يوم للانتقال من القراءة السطحية إلى التدبّر العميق. رحلة تعيد صياغة علاقتك بالوحي وبالحياة.
              </p>
              <div className="flex gap-4 justify-start">
                <a href="/auth?next=/day" className="btn-gold px-10 py-5 text-lg font-bold">ابدأ تجربتك المجانية</a>
                <a href="#zones" className="border border-[#c5a059]/20 px-10 py-5 text-lg text-[#c5a059] hover:bg-[#c5a059]/5 transition-all rounded-full">اكتشف المجالات</a>
              </div>
            </Reveal>

            {/* 3D Card */}
            <Reveal delay={200} className="perspective-1200 flex justify-center">
              <div className="depth-card w-full max-w-md glass-card p-8 shadow-2xl relative overflow-hidden preserve-3d">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#e9c176] to-transparent" />
                <div className="mb-10 text-center">
                  <span className="text-[#c5a059]/60 text-xs tracking-widest uppercase block mb-4">تدبّر اليوم</span>
                  <p className="text-2xl font-[family-name:var(--font-amiri)] italic leading-loose">&ldquo;أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ&rdquo;</p>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between text-xs text-[#9a8f80]">
                    <span>التقدم في الرحلة</span>
                    <span>٣٥٪</span>
                  </div>
                  <div className="w-full bg-[#1c2025] h-1.5 rounded-full overflow-hidden">
                    <div className="w-[35%] h-full bg-[#e9c176] shadow-[0_0_10px_#e9c176]" />
                  </div>
                  <div className="pt-4 border-t border-[#4e4639]/20">
                    <div className="flex items-center gap-3 text-sm text-[#e9c176]">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span>المجال الحالي: الهوية</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }, (_, i) => (
                      <div key={i} className={`h-2 w-full rounded-sm ${i < 10 ? "bg-[#e9c176] shadow-[0_0_5px_#e9c176]" : "bg-[#262a30]"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </main>

        {/* ── Problem ── */}
        <section className="bg-[#181c21] py-24 px-8">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-amiri)] italic text-center mb-16">تقرأ القرآن… لكن القلب ما تحرّك</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { icon: "heart_broken", title: "قراءة سطحية", desc: "تمر على الآيات كما تمر على أخبار الصباح، دون أن يلامس المعنى أعماقك." },
                { icon: "event_repeat", title: "مجرد طقوس", desc: "تحوّلت علاقتك بالقرآن إلى عدد صفحات تُنجز، لا حياة تُعاش." },
                { icon: "schedule", title: "انشغال دائم", desc: "تنتظر \"الفراغ\" لتقرأ، والفراغ لا يأتي أبداً في عالم يركض." },
                { icon: "extension", title: "غياب المنهجية", desc: "تفتقد للخارطة التي تربط آيات الكتاب بواقعك النفسي واليومي." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 100}>
                  <div className="flex items-start gap-4 text-right">
                    <span className="material-symbols-outlined text-[#e9c176] text-3xl">{item.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-[#d1c5b4] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quote ── */}
        <section className="py-32 px-8 text-center bg-[#101419]">
          <Reveal className="max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-[#e9c176]/30 text-6xl mb-8">format_quote</span>
            <blockquote className="text-3xl md:text-5xl font-[family-name:var(--font-amiri)] italic leading-tight mb-8">
              &ldquo;أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا&rdquo;
            </blockquote>
            <cite className="text-[#e9c176] tracking-[0.3em] text-sm not-italic">— سورة محمد، آية ٢٤</cite>
          </Reveal>
        </section>

        {/* ── Who is it for ── */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <Reveal><h2 className="text-sm tracking-[0.4em] text-[#c5a059]/60 text-center mb-16">لمن هذه الرحلة؟</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "menu_book", title: "القارئ السطحي", desc: "لمن يريد الانتقال من القراءة اللسانية إلى المشاهدة القلبية.", stagger: false },
              { icon: "alarm", title: "المشغول بذكاء", desc: "من لا يملك إلا ١٥ دقيقة يومياً، لكنه يريدها أن تكون أثمن دقائق يومه.", stagger: true },
              { icon: "auto_awesome", title: "باحث عن النتائج", desc: "لمن سئم من المعلومات النظرية ويريد أثراً ملموساً في هدوئه النفسي.", stagger: false },
              { icon: "grid_view", title: "طالب النظام", desc: "لمن يحب أن يرى القرآن كمنظومة متكاملة، لا كآيات متفرقة.", stagger: true },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 100}>
                <div className={`glass-card p-10 border-none bg-[#262a30] transition-transform hover:-translate-y-2 ${card.stagger ? "md:mt-8" : ""}`}>
                  <span className="material-symbols-outlined text-[#e9c176] mb-6 block">{card.icon}</span>
                  <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                  <p className="text-[#d1c5b4] text-sm leading-relaxed">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Features (4 Tools) ── */}
        <section className="py-24 px-8 bg-[#181c21] border-t border-[#e9c176]/10">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16 space-y-4">
              <h2 className="text-sm tracking-[0.4em] text-[#c5a059]/60">أدوات الرحلة</h2>
              <h3 className="text-4xl md:text-5xl font-[family-name:var(--font-amiri)] italic">أربع أدوات في رحلة واحدة</h3>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: "menu_book", title: "الكتاب", sub: "مدينة المعنى بلغة القرآن", desc: "الأساس الذي بُني عليه البرنامج بالكامل — كتاب يعيد تقديم القرآن كخريطة للوعي والحياة.", featured: false },
                { icon: "psychology", title: "المرشد الذكي", sub: "", desc: "رفيق تأملي شخصي يرافقك كل يوم — يجيب أسئلتك، يعمّق فهمك، ويربط الآيات بحياتك بأسلوب حواري لا أكاديمي.", featured: true },
                { icon: "radio_button_checked", title: "مسبحة تمعّن", sub: "", desc: "مسبحة إلكترونية بأسماء الله الحسنى الـ ٩٩ — تجربة تسبيح تأملية تربط الذكر بالوعي.", featured: false },
                { icon: "edit_note", title: "دفتر التمعّن", sub: "", desc: "دفتر شخصي يحفظ تأملاتك وخواطرك طوال الرحلة — ترجع لها وتشوف كيف تغيّرت نظرتك.", featured: false },
              ].map((feat, i) => (
                <Reveal key={feat.title} delay={i * 100}>
                  <div className={`glass-card p-10 group hover:-translate-y-2 transition-transform ${feat.featured ? "border-[#e9c176]/20" : ""}`}>
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#e9c176]/10 flex items-center justify-center shrink-0 group-hover:bg-[#e9c176]/20 transition-colors">
                        <span className="material-symbols-outlined text-[#e9c176] text-3xl">{feat.icon}</span>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xl font-bold mb-2">{feat.title}</h4>
                        {feat.sub && <p className="text-sm text-[#e9c176]/80 font-bold mb-2">{feat.sub}</p>}
                        <p className="text-[#d1c5b4] leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Daily 5 Steps ── */}
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center mb-16 space-y-4">
              <h2 className="text-sm tracking-[0.4em] text-[#c5a059]/60">١٥ دقيقة تغيّر نظرتك</h2>
              <h3 className="text-4xl font-[family-name:var(--font-amiri)] italic">كل يوم في ٥ خطوات</h3>
            </Reveal>
            <div className="space-y-6">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 80}>
                  <div className={`flex items-start gap-6 glass-card p-6 hover:-translate-y-1 transition-transform ${i === 4 ? "border-[#e9c176]/20" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-[#e9c176]/10 border border-[#e9c176]/20 flex items-center justify-center shrink-0 text-[#e9c176] font-bold text-sm">{step.n}</div>
                    <div className="text-right">
                      <h4 className="font-bold mb-1">{step.title}</h4>
                      <p className="text-[#d1c5b4] text-sm">{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9 Domains ── */}
        <section id="zones" className="py-32 px-8 bg-[#0a0e13] overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-right mb-20 space-y-4">
              <h2 className="text-5xl font-[family-name:var(--font-amiri)] italic">مجالات التدبّر التسعة</h2>
              <p className="text-[#9a8f80] max-w-lg">تسع مناطق قرآنية تكتشفها على مدار ٢٨ يوماً</p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1200">
              {DOMAINS.map((d, i) => (
                <Reveal key={d.name} delay={i * 60}>
                  <div className="depth-card glass-card p-12 text-center group cursor-pointer hover:bg-[#c5a059]/5 relative">
                    <span className="text-[#e9c176]/20 text-5xl font-[family-name:var(--font-amiri)] italic absolute top-4 right-4 group-hover:text-[#e9c176]/40 transition-colors">{toAr(i + 1)}</span>
                    <span className="material-symbols-outlined text-[#e9c176] text-4xl mb-4 block">{d.icon}</span>
                    <h3 className="text-2xl font-bold text-[#e9c176] mb-2">{d.name}</h3>
                    <div className="w-12 h-0.5 bg-[#4e4639] mx-auto my-4 transition-all group-hover:w-24 group-hover:bg-[#e9c176]" />
                    <p className="text-[#d1c5b4] text-sm">{d.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-8 bg-[#101419]">
          <div className="max-w-7xl mx-auto">
            <Reveal><h2 className="text-3xl font-[family-name:var(--font-amiri)] italic text-center mb-16">أصوات من الرحلة</h2></Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { text: "أول مرة في حياتي أقرأ آية وأشعر أنها تتكلّم عن موقف أعيشه بالضبط. كنت أختم القرآن في رمضان وأنساه بعد العيد — بعد تمعّن صرت أرجع للآية كل ما واجهت موقف صعب.", name: "محمد العتيبي", meta: "مهندس، الرياض — من المختبرين الأوائل", initial: "م" },
                { text: "كنت أخشى أن يكون كورساً أكاديمياً جافاً. لكن تمعّن رحلة حية — كل يوم أفتحه بشوق حقيقي. أكملت الـ٢٨ يوم ولم أتخيّل ذلك أبداً.", name: "ريم الشمري", meta: "معلمة، جدة — من المختبرين الأوائل", initial: "ر" },
                { text: "منذ سنوات وأنا أبحث عن شيء يربطني بالقرآن بشكل حقيقي لا طقوسي. المجالات التسعة أعطتني خريطة لم أكن أملكها — صرت أفهم ليش هالآية هنا وليش ذيك هناك.", name: "عبدالله القحطاني", meta: "طالب دكتوراه، الدمام — من المختبرين الأوائل", initial: "ع" },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 100}>
                  <div className={`glass-card p-8 flex flex-col justify-between min-h-[300px] ${i === 1 ? "border-[#e9c176]/30" : ""}`}>
                    <p className="leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#c5a059]/20 flex items-center justify-center text-[#e9c176] font-bold">{t.initial}</div>
                      <div className="text-right">
                        <p className="font-bold">{t.name}</p>
                        <p className="text-xs text-[#9a8f80]">{t.meta}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-32 px-8">
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-12">
              <h2 className="text-4xl font-[family-name:var(--font-amiri)] italic mb-4">استثمر في وعيك</h2>
              <p className="text-[#d1c5b4]">اختر البوابة التي تناسب رحلتك</p>
            </Reveal>

            <Reveal>
              <div className="mb-12 py-4 px-8 border border-red-500/30 bg-red-500/5 rounded-2xl text-center">
                <p className="font-bold text-lg flex items-center justify-center gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  التجربة المجانية متاحة لأول ١٠٠ مسجّل فقط — لا تفوّت مقعدك
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Free Trial */}
              <Reveal><div className="glass-card p-10 text-center flex flex-col h-full bg-[#1c2025]">
                <h3 className="text-xl mb-2">تجربة مجانية</h3>
                <div className="my-6"><span className="text-5xl font-[family-name:var(--font-amiri)] italic text-[#e9c176]">مجاناً</span></div>
                <p className="text-[#d1c5b4] text-sm mb-4">٧ أيام — بدون بطاقة دفع</p>
                <ul className="text-right space-y-3 mb-10 flex-grow text-sm">
                  {["تجربة المجالات الأولى", "المرشد الذكي", "مجتمع تمعّن"].map(f => (
                    <li key={f} className="flex items-center gap-3"><span className="material-symbols-outlined text-[#e9c176] text-sm">check</span> {f}</li>
                  ))}
                </ul>
                <a href={WA_FREE} target="_blank" rel="noopener noreferrer" className="border border-[#c5a059]/40 py-3 font-bold text-[#e9c176] hover:bg-[#c5a059] hover:text-[#412d00] transition-all block text-center rounded-full">ابدأ مجاناً</a>
              </div></Reveal>

              {/* Quarterly */}
              <Reveal delay={100}><div className="glass-card p-10 text-center flex flex-col h-full bg-[#1c2025]">
                <h3 className="text-xl mb-2">ربع سنوي</h3>
                <div className="my-6">
                  <span className="text-5xl font-[family-name:var(--font-amiri)] italic">١٩٩</span>
                  <span className="text-[#9a8f80] mr-2">ر.س</span>
                </div>
                <p className="text-[#d1c5b4] text-sm mb-4">كل ٣ شهور — ٦٦ ر.س شهرياً</p>
                <ul className="text-right space-y-3 mb-10 flex-grow text-sm">
                  {["الوصول الكامل للمجالات التسعة", "تمارين تطبيقية يومية", "المرشد الذكي التفاعلي", "تحليلات رحلتك"].map(f => (
                    <li key={f} className="flex items-center gap-3"><span className="material-symbols-outlined text-[#e9c176] text-sm">check</span> {f}</li>
                  ))}
                </ul>
                <a href={WA_Q} target="_blank" rel="noopener noreferrer" className="border border-[#c5a059]/40 py-3 font-bold text-[#e9c176] hover:bg-[#c5a059] hover:text-[#412d00] transition-all block text-center rounded-full">اشترك الآن</a>
              </div></Reveal>

              {/* Yearly */}
              <Reveal delay={200}><div className="glass-card p-10 text-center flex flex-col h-full bg-[#1c2025] border-[#e9c176] relative overflow-hidden scale-105 shadow-[0_0_40px_rgba(197,160,89,0.15)]">
                <div className="absolute top-0 right-0 bg-[#e9c176] text-[#412d00] px-4 py-1 text-xs font-bold uppercase tracking-widest">وفّر ٤١٪</div>
                <h3 className="text-xl mb-2 text-[#e9c176]">سنوي</h3>
                <div className="my-6">
                  <span className="text-5xl font-[family-name:var(--font-amiri)] italic">٦٩٩</span>
                  <span className="text-[#9a8f80] mr-2">ر.س</span>
                </div>
                <p className="text-[#d1c5b4] text-sm mb-4">سنوياً — ٥٨ ر.س شهرياً</p>
                <ul className="text-right space-y-3 mb-10 flex-grow text-sm">
                  {["كل ميزات الربع سنوي", "توفير ٤ أشهر", "أولوية الدعم", "محتوى حصري إضافي"].map((f, j) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#e9c176] text-sm">{j === 0 ? "check" : "star"}</span>
                      <span className={j === 0 ? "font-bold" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={WA_Y} target="_blank" rel="noopener noreferrer" className="btn-gold py-3 font-bold block text-center">اشترك سنوياً</a>
              </div></Reveal>
            </div>

            {/* VIP */}
            <Reveal>
              <div className="mt-8 glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#e9c176]/20">
                <div className="text-right flex-grow">
                  <h3 className="text-2xl font-bold text-[#e9c176] mb-2">باقة VIP</h3>
                  <p className="text-[#d1c5b4]">٤ جلسات تدبّر خاصة شهرياً مع المرشد + مجتمع VIP مغلق + تحليل شخصي لرحلتك + أولوية مطلقة في الدعم</p>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-4xl font-[family-name:var(--font-amiri)] italic font-bold">٤,٩٩٩</span>
                  <span className="text-[#9a8f80]">ر.س / سنوياً</span>
                </div>
                <a href={WA_VIP} target="_blank" rel="noopener noreferrer" className="btn-gold py-3 px-8 font-bold shrink-0">انضم لـ VIP</a>
              </div>
            </Reveal>

            <p className="text-center mt-12 text-[#9a8f80] text-sm italic flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              ضمان استرداد كامل المبلغ خلال ٧ أيام — بدون شروط
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 px-8 bg-[#181c21]">
          <div className="max-w-3xl mx-auto">
            <Reveal><h2 className="text-4xl font-[family-name:var(--font-amiri)] italic mb-16 text-center">أسئلة شائعة</h2></Reveal>
            <div className="space-y-4">
              {FAQS.map(([q, a], i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="glass-card border-none bg-[#262a30]">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex justify-between items-center p-6 w-full text-right font-bold cursor-pointer"
                    >
                      <span>{q}</span>
                      <span className={`material-symbols-outlined transition-transform ${openFaq === i ? "rotate-180" : ""}`}>expand_more</span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-400 ${openFaq === i ? "max-h-60 pb-6 px-6" : "max-h-0"}`}>
                      <div className="text-[#d1c5b4] text-right leading-relaxed border-t border-[#4e4639]/10 pt-4">{a}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-40 px-8 text-center relative overflow-hidden">
          <div className="sacred-pattern absolute inset-0 -z-10 opacity-30" />
          <Reveal className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-7xl font-[family-name:var(--font-amiri)] italic mb-10 leading-tight">الحقيقة الوحيدة:<br />أنت أقرب مما تتخيّل</h2>
            <p className="text-xl text-[#d1c5b4] mb-12">لا تدع الفرصة تفوتك. مقعدك بانتظارك.</p>
            <a href={WA_FREE} target="_blank" rel="noopener noreferrer" className="btn-gold px-12 py-6 text-xl font-bold shadow-[0_0_30px_rgba(233,193,118,0.3)]">ابدأ رحلتك الآن</a>
          </Reveal>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#0a0e13] py-16 px-8 border-t border-[#e9c176]/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6 max-w-sm text-right">
              <div className="text-3xl font-[family-name:var(--font-amiri)] italic text-[#e9c176]">تمعّن</div>
              <p className="text-[#d1c5b4] leading-relaxed">منصة تُقرّب القرآن من حياتك اليومية — تدبّراً لا مجرد تلاوة.</p>
            </div>
            <div className="flex gap-16">
              <div className="space-y-4 text-right">
                <h4 className="font-bold text-[#e9c176]">الروابط</h4>
                <ul className="space-y-2 text-[#9a8f80]">
                  <li><a className="hover:text-[#e9c176] transition-colors" href="#">الرحلة</a></li>
                  <li><a className="hover:text-[#e9c176] transition-colors" href="#">عن تمعّن</a></li>
                  <li><a className="hover:text-[#e9c176] transition-colors" href="#">سياسة الخصوصية</a></li>
                </ul>
              </div>
              <div className="space-y-4 text-right">
                <h4 className="font-bold text-[#e9c176]">تواصل</h4>
                <ul className="space-y-2 text-[#9a8f80]">
                  <li><a className="hover:text-[#e9c176] transition-colors" href="#">تويتر (X)</a></li>
                  <li><a className="hover:text-[#e9c176] transition-colors" href="#">انستقرام</a></li>
                  <li><a className="hover:text-[#e9c176] transition-colors" href={WA_FREE} target="_blank" rel="noopener noreferrer">واتساب</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#4e4639]/10 text-center text-sm text-[#9a8f80]">
            © ٢٠٢٦ تمعّن. جميع الحقوق محفوظة.
          </div>
        </footer>

        {/* ── WhatsApp FAB ── */}
        <a
          className="fixed bottom-8 right-8 z-[100] bg-[#25D366] text-white rounded-full p-4 w-14 h-14 flex items-center justify-center shadow-[0_8px_32px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"
          href={WA_FREE}
          target="_blank"
          rel="noopener noreferrer"
          title="تواصل عبر واتساب"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </a>
      </div>
    </>
  );
}
