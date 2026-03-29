'use client';

import React, { useEffect, useRef } from 'react';
import { loadLandingContent, type LandingContent } from '@/lib/supabase-landing-content';

/* ─── Default sections (fallback) ─── */
const DEFAULT_SECTIONS: Record<string, string> = {
  staff_meaning: 'رمز الثبات والاتكاء. في "تمعّن"، العصا هي القاعدة المنهجية التي تستند إليها في كل خطوة تأملية لتفادي التشتت.',
  shadow_meaning: 'المساحة التي نتركها للأسرار. ليس كل معنى يجب أن يخرج للنور فوراً؛ بعض الثمار تنضج في عتمة الظل.',
  light_meaning: 'الإشراقة التي تلي التعب. لحظة الفهم العميق التي تبدد ضباب الحيرة في صدر السالك.',
  stones_meaning: 'محطات الرحلة الأساسية. كل حجر يمثل ثقلاً نضعه جانباً لنخفف من حمل الروح في مسيرها.',
  metaphor_quote: 'ليس كل ما يُرى يُفهم، وليس كل ما يُفهم يُحكى. تمعّن في الرمز، تجد الطريق.',
};

/* ─── Domain data ─── */
const DOMAINS = [
  { name: 'الهوية', icon: 'fingerprint', desc: 'إعادة اكتشاف الذات في ضوء النص الإلهي.' },
  { name: 'العلاقات', icon: 'diversity_3', desc: 'بناء الجسور الروحية مع الآخرين.' },
  { name: 'المال', icon: 'payments', desc: 'فلسفة الرزق والاستخلاف المادي.' },
  { name: 'النمو', icon: 'trending_up', desc: 'تزكية النفس في رحلة الـ ٢٨ يوماً.' },
  { name: 'العطاء', icon: 'volunteer_activism', desc: 'ممارسات الإحسان الخفية والظاهرة.' },
  { name: 'الجمال', icon: 'auto_awesome', desc: 'استشعار اللطائف الجمالية في الكون.' },
  { name: 'الأسرة', icon: 'home', desc: 'السكينة والمودة تحت سقف واحد.' },
  { name: 'البناء', icon: 'foundation', desc: 'إرساء قواعد العمل الصالح المستدام.' },
  { name: 'المراجعة', icon: 'history_edu', desc: 'وقفة تأملية في مخرجات الرحلة.' },
];

/* ─── Metaphor items ─── */
const METAPHOR_ITEMS = [
  { label: 'الأداة الأولى', title: 'العصا', key: 'staff_meaning' },
  { label: 'الأداة الثانية', title: 'الظل', key: 'shadow_meaning' },
  { label: 'الأداة الثالثة', title: 'النور', key: 'light_meaning' },
  { label: 'الأداة الرابعة', title: 'الأحجار التسعة', key: 'stones_meaning' },
];

/* ═══════════════════════════════════════════════════ */
export default function StitchLanding() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = React.useState(DEFAULT_SECTIONS);

  /* ── Load Supabase content ── */
  useEffect(() => {
    loadLandingContent().then((data: LandingContent) => {
      if (data.sections && Object.keys(data.sections).length > 0) {
        setSections(prev => ({ ...prev, ...data.sections }));
      }
    });
  }, []);

  /* ── Cursor tracking ── */
  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e: MouseEvent) => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      ring.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 12}px)`;
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  /* ── Cursor hover ── */
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const targets = document.querySelectorAll('a, button, .group');
    const enter = () => {
      ring.style.width = '64px';
      ring.style.height = '64px';
      ring.style.backgroundColor = 'rgba(240, 225, 192, 0.08)';
    };
    const leave = () => {
      ring.style.width = '32px';
      ring.style.height = '32px';
      ring.style.backgroundColor = 'transparent';
    };
    targets.forEach(el => {
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
    });
    return () => {
      targets.forEach(el => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#15130f',
        color: '#e8e1da',
        overflowX: 'hidden',
        cursor: 'none',
        fontFamily: 'var(--font-manrope, "Manrope", sans-serif)',
        fontWeight: 300,
      }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999, opacity: 0.03, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }}
      />

      {/* Custom cursor */}
      <div ref={dotRef} className="hidden md:block fixed pointer-events-none rounded-full" style={{ width: 8, height: 8, background: '#f0e1c0', zIndex: 10000, transition: 'transform 0.1s ease' }} />
      <div ref={ringRef} className="hidden md:block fixed pointer-events-none rounded-full" style={{ width: 32, height: 32, border: '1px solid rgba(240,225,192,0.3)', zIndex: 9999, transition: 'all 0.15s ease-out' }} />

      {/* Header */}
      <header className="fixed top-0 w-full z-[100]" style={{ background: 'rgba(21,19,15,0.6)', backdropFilter: 'blur(40px)' }}>
        <nav className="flex flex-row-reverse justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
          <span className="text-3xl drop-shadow-[0_0_10px_rgba(196,168,130,0.3)]" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#d5c6a7' }}>تمعّن</span>
          <div className="hidden md:flex flex-row-reverse items-center gap-10">
            {['المسار', 'المجالات', 'الرؤية'].map((link, i) => (
              <a key={i} href="#" className="text-2xl tracking-wide hover:opacity-100 transition-colors" style={{
                fontFamily: 'var(--font-amiri, "Amiri", serif)',
                color: i === 0 ? '#f0e1c0' : '#d0c5b8',
                lineHeight: 1.8,
                cursor: 'none',
                ...(i === 0 ? { borderBottom: '1px solid rgba(224,194,154,0.3)', paddingBottom: 4 } : {}),
              }}>
                {link}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'rgba(213,198,167,0.1)' }} />
          </div>

          {/* Staff */}
          <div className="flex flex-col items-center mb-16">
            <div className="mb-4" style={{ width: 8, height: 8, background: '#d5c6a7', transform: 'rotate(45deg)', boxShadow: '0 0 15px rgba(213,198,167,0.6)' }} />
            <div style={{ width: 1, height: 120, background: 'linear-gradient(to bottom, transparent, #d5c6a7, transparent)' }} />
          </div>

          {/* Text */}
          <div className="max-w-4xl text-center z-10">
            <h1 className="text-5xl md:text-7xl mb-8" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', lineHeight: 1.4, color: '#e8e1da' }}>
              وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ
            </h1>
            <p className="text-sm md:text-base tracking-[0.2em] uppercase mb-12" style={{ color: '#d0c5b8' }}>
              AND RELY UPON THE EVER-LIVING WHO DOES NOT DIE
            </p>
            <button
              className="group relative px-10 py-4 overflow-hidden transition-all"
              style={{
                border: '1px solid rgba(77,70,60,0.3)',
                color: '#e0c29a',
                fontFamily: 'var(--font-amiri, "Amiri", serif)',
                fontSize: '1.25rem',
                letterSpacing: '0.1em',
                cursor: 'none',
              }}
            >
              <span className="relative z-10">ابدأ رحلتك اليوم</span>
              <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: 'rgba(213,198,167,0.05)' }} />
            </button>
          </div>

          {/* Stones arc */}
          <div className="mt-24 flex items-center justify-center gap-6">
            {[20,30,50,80,100,80,50,30,20].map((op, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === 4 ? 6 : i === 3 || i === 5 ? 5 : 4,
                  height: i === 4 ? 6 : i === 3 || i === 5 ? 5 : 4,
                  opacity: op / 100,
                  background: i === 4 ? '#d5c6a7' : i === 3 || i === 5 ? '#e0c29a' : '#4d463c',
                  boxShadow: i === 4 ? '0 0 8px rgba(213,198,167,0.5)' : 'none',
                }}
              />
            ))}
          </div>
        </section>

        {/* ── Journey Bar ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg opacity-60" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#d0c5b8' }}>ظِل</span>
            <span className="text-lg" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#d5c6a7' }}>أفضل احتمال</span>
          </div>
          <div className="relative h-px w-full" style={{ background: 'rgba(77,70,60,0.2)' }}>
            <div className="absolute right-0 top-0 h-full w-1/3" style={{ background: 'linear-gradient(to left, rgba(213,198,167,0.6), transparent)' }} />
            <div className="absolute -top-1 rounded-full" style={{ right: '33%', width: 8, height: 8, background: '#d5c6a7', boxShadow: '0 0 10px rgba(213,198,167,0.8)' }} />
          </div>
        </section>

        {/* ── 3x3 Domains Grid ── */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl text-center mb-24 opacity-40 tracking-widest" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)' }}>
            مجالات التدبّر
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 1, background: 'rgba(77,70,60,0.1)' }}>
            {DOMAINS.map((d, i) => (
              <div
                key={i}
                className="group flex flex-col items-center text-center transition-colors duration-700"
                style={{ background: '#15130f', padding: '3rem 2.5rem', cursor: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d1b17')}
                onMouseLeave={e => (e.currentTarget.style.background = '#15130f')}
              >
                <span
                  className="material-symbols-outlined text-4xl mb-6 transition-colors"
                  style={{ color: '#4d463c', fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 24' }}
                  data-icon={d.icon}
                >
                  {d.icon}
                </span>
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#e8e1da' }}>{d.name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#d0c5b8' }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Metaphor Section ── */}
        <section className="py-40 px-6 max-w-7xl mx-auto flex flex-col md:flex-row-reverse gap-20">
          {/* Sticky right */}
          <div className="md:w-1/2 md:sticky md:top-40 h-fit">
            <div style={{ borderRight: '2px solid rgba(213,198,167,0.2)', paddingRight: '3rem' }}>
              <h2 className="text-4xl md:text-5xl leading-tight mb-8" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#e8e1da' }}>
                أدوات العتبة الصامتة
              </h2>
              <p className="text-lg leading-relaxed italic" style={{ color: '#d0c5b8' }}>
                &ldquo;{sections.metaphor_quote}&rdquo;
              </p>
            </div>
          </div>

          {/* Left items */}
          <div className="md:w-1/2" style={{ display: 'flex', flexDirection: 'column', gap: '8rem' }}>
            {METAPHOR_ITEMS.map((item, i) => (
              <div key={i} className="flex flex-col gap-6">
                <span className="text-sm tracking-widest uppercase" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: 'rgba(213,198,167,0.4)' }}>
                  {item.label}
                </span>
                <h3 className="text-3xl" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#e8e1da' }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: '#d0c5b8' }}>
                  {sections[item.key] || DEFAULT_SECTIONS[item.key]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social Card ── */}
        <section className="py-40 px-6 flex justify-center">
          <div className="relative group" style={{ cursor: 'none' }}>
            <div className="absolute -inset-1 blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" style={{ background: 'linear-gradient(to top right, rgba(213,198,167,0.2), transparent, rgba(224,194,154,0.2))' }} />
            <div className="relative w-full flex flex-col items-center justify-center p-12 text-center" style={{ maxWidth: 512, aspectRatio: '1', background: '#221f1b' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #d5c6a7 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <p className="text-3xl leading-relaxed mb-8 relative z-10" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#e8e1da' }}>
                وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا
              </p>
              <p className="text-xs tracking-widest uppercase relative z-10" style={{ color: '#d0c5b8' }}>
                SURAH AT-TUR • AYAH 48
              </p>
              <div className="mt-12 relative z-10" style={{ height: 1, width: 48, background: '#4d463c' }} />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-20" style={{ borderTop: '1px solid rgba(77,70,60,0.15)', background: '#15130f' }}>
        <div className="flex flex-col items-center justify-center gap-8 px-4 text-center">
          <div className="text-3xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-amiri, "Amiri", serif)', color: '#d5c6a7' }}>تمعّن</div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {['الخصوصية', 'الشروط', 'تواصل معنا'].map((link, i) => (
              <a key={i} href="#" className="text-sm tracking-widest uppercase transition-opacity duration-500 hover:opacity-100" style={{ color: 'rgba(208,197,184,0.5)', cursor: 'none' }}>
                {link}
              </a>
            ))}
          </div>
          <div className="pt-8 opacity-40">
            <p className="text-xs tracking-widest" style={{ color: '#e0c29a' }}>تمعّن • العتبة الصامتة • ١٤٤٧</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
