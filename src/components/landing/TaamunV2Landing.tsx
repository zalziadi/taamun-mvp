'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@/styles/taamun-v2.css';
import { loadLandingContent, type LandingContent } from '@/lib/supabase-landing-content';

/* ─── Soul icon SVGs ─── */
const SOUL_ICONS: Record<string, React.ReactNode> = {
  identity: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="16" r="7" stroke="#c4a882" strokeWidth="1" opacity="0.6"/><path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#c4a882" strokeWidth="1" opacity="0.35"/><circle cx="24" cy="16" r="2" fill="#f0e1c0" opacity="0.5"/><line x1="24" y1="1" x2="24" y2="6" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.4"/><line x1="24" y1="26" x2="24" y2="31" stroke="#c4a882" strokeWidth="0.8" opacity="0.3"/></svg>
  ),
  relationships: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><circle cx="16" cy="20" r="6" stroke="#c4a882" strokeWidth="1" opacity="0.5"/><circle cx="32" cy="20" r="6" stroke="#c4a882" strokeWidth="1" opacity="0.5"/><path d="M22 20 Q24 14 26 20" stroke="#f0e1c0" strokeWidth="0.8" fill="none" opacity="0.5"/><path d="M10 38c0-6 3-10 6-10M32 28c3 0 6 4 6 10" stroke="#c4a882" strokeWidth="1" opacity="0.3"/></svg>
  ),
  provision: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><path d="M24 6 L40 18 L34 40 H14 L8 18 Z" stroke="#c4a882" strokeWidth="1" opacity="0.45"/><path d="M24 6 L24 40" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.35"/><path d="M16 24 L32 24" stroke="#c4a882" strokeWidth="0.8" opacity="0.3"/><circle cx="24" cy="24" r="3" fill="none" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/></svg>
  ),
  growth: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><path d="M24 42 L24 10" stroke="#c4a882" strokeWidth="1" opacity="0.4"/><path d="M24 28 Q14 22 12 12 Q22 14 24 24" stroke="#f0e1c0" strokeWidth="0.8" fill="none" opacity="0.5"/><path d="M24 22 Q34 16 36 6 Q26 8 24 18" stroke="#c4a882" strokeWidth="0.8" fill="none" opacity="0.4"/><circle cx="24" cy="42" r="2" fill="#c4a882" opacity="0.4"/></svg>
  ),
  giving: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><path d="M24 38 L10 26 C6 22 6 16 10 12 C14 8 20 9 24 14 C28 9 34 8 38 12 C42 16 42 22 38 26 Z" stroke="#c4a882" strokeWidth="1" opacity="0.5" fill="none"/><path d="M24 14 L24 38" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.3"/><path d="M18 20 L30 20" stroke="#c4a882" strokeWidth="0.8" opacity="0.3"/></svg>
  ),
  beauty: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="14" stroke="#c4a882" strokeWidth="1" opacity="0.3"/><circle cx="24" cy="24" r="8" stroke="#c4a882" strokeWidth="0.8" opacity="0.4"/><circle cx="24" cy="24" r="2" fill="#f0e1c0" opacity="0.6"/><line x1="24" y1="8" x2="24" y2="12" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/><line x1="24" y1="36" x2="24" y2="40" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/><line x1="8" y1="24" x2="12" y2="24" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/><line x1="36" y1="24" x2="40" y2="24" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/></svg>
  ),
  family: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><path d="M24 8 L38 20 L38 40 L10 40 L10 20 Z" stroke="#c4a882" strokeWidth="1" opacity="0.45" fill="none"/><path d="M18 40 L18 28 L30 28 L30 40" stroke="#c4a882" strokeWidth="0.8" opacity="0.35"/><line x1="24" y1="8" x2="24" y2="14" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.4"/><circle cx="24" cy="7" r="2" fill="none" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.5"/></svg>
  ),
  building: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><rect x="10" y="28" width="28" height="12" stroke="#c4a882" strokeWidth="1" opacity="0.4"/><rect x="16" y="18" width="16" height="12" stroke="#c4a882" strokeWidth="0.8" opacity="0.4"/><rect x="20" y="10" width="8" height="10" stroke="#c4a882" strokeWidth="0.8" opacity="0.4"/><line x1="24" y1="6" x2="24" y2="10" stroke="#f0e1c0" strokeWidth="0.8" opacity="0.45"/><circle cx="24" cy="5" r="1.5" fill="#f0e1c0" opacity="0.5"/></svg>
  ),
  reflection: (
    <svg className="tv2-soul-icon" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="15" stroke="#c4a882" strokeWidth="1" opacity="0.35"/><path d="M24 9 A15 15 0 0 1 39 24" stroke="#f0e1c0" strokeWidth="1" opacity="0.6"/><path d="M36 20 L39 24 L42 20" stroke="#f0e1c0" strokeWidth="0.8" fill="none" opacity="0.5"/><line x1="24" y1="16" x2="24" y2="26" stroke="#c4a882" strokeWidth="0.8" opacity="0.5"/><line x1="24" y1="26" x2="30" y2="30" stroke="#c4a882" strokeWidth="0.8" opacity="0.4"/><circle cx="24" cy="24" r="1.5" fill="#f0e1c0" opacity="0.6"/></svg>
  ),
};

/* ─── Default domains ─── */
const DEFAULT_DOMAINS = [
  { order_index: 1, name_ar: 'الهوية',   name_en: 'Identity',      icon_key: 'identity' },
  { order_index: 2, name_ar: 'العلاقات', name_en: 'Relationships', icon_key: 'relationships' },
  { order_index: 3, name_ar: 'المال',    name_en: 'Provision',     icon_key: 'provision' },
  { order_index: 4, name_ar: 'النمو',    name_en: 'Growth',        icon_key: 'growth' },
  { order_index: 5, name_ar: 'العطاء',   name_en: 'Giving',        icon_key: 'giving' },
  { order_index: 6, name_ar: 'الجمال',   name_en: 'Beauty',        icon_key: 'beauty' },
  { order_index: 7, name_ar: 'الأسرة',   name_en: 'Family',        icon_key: 'family' },
  { order_index: 8, name_ar: 'البناء',   name_en: 'Building',      icon_key: 'building' },
  { order_index: 9, name_ar: 'المراجعة', name_en: 'Reflection',    icon_key: 'reflection' },
];

/* ─── Default section texts ─── */
const DEFAULT_SECTIONS: Record<string, string> = {
  metaphor_quote: 'ليس في الوجود إلا نور واحد، يتجلّى في صور شتى، كالعصا التي يسند إليها المسافر قلبه قبل جسده.',
  staff_meaning: 'تمعّن ليست أداة — هي كيان راسخ. لها ظِل لأنها قائمة بالفعل. تسند المسافر لا لأنها تحمله، بل لأنها تذكّره أنه لم يسقط.',
  shadow_meaning: 'لا تحتاج أن تصرخ — وجودك كافٍ لأن يكون لك انعكاس في الواقع. الظل هو الدليل الأصدق على أن النور وقع.',
  light_meaning: 'النور لا يأتي من تمعّن — يأتي من مكان أعلى. تمعّن هي ما يستقبله ويعكسه. القرآن هو المصدر؛ التأمل هو الانكسار.',
  stones_meaning: 'تسعة مجالات تحيط بالمحور — لكل حجر ثقله ووزنه وموضعه في الطريق. المسافر لا يحمل الحجارة — يمشي بينها.',
  journey_intro: 'كلما تقدّمت في رحلتك — تحوّل اللون من ذهبي الظل إلى أزرق أفضل الاحتمال.',
  domains_verse: 'كل حجر بابٌ — والعصا هي المحور الذي لا يتزعزع',
  icons_intro: 'تسعة أبواب. كل باب عالَم. لا تدخله بعقلك — بل بوجودك.',
};

/* ─── Journey color helpers ─── */
function progressToColor(p: number): string {
  const h = Math.round(42 + p * 168);
  const s = Math.round(76 - p * 30);
  const l = Math.round(81 - p * 30);
  return `hsl(${h},${s}%,${l}%)`;
}

function progressToWord(p: number): { ar: string; en: string } {
  if (p < 0.15) return { ar: 'ظِل', en: 'SHADOW STATE — البداية' };
  if (p < 0.33) return { ar: 'يقظة', en: 'AWAKENING — البصيرة تنبت' };
  if (p < 0.5)  return { ar: 'هِبَة', en: 'GIFT STATE — الموهبة تظهر' };
  if (p < 0.67) return { ar: 'نور', en: 'ILLUMINATION — حالة الاستنارة' };
  if (p < 0.85) return { ar: 'سَكينة', en: 'SERENITY — الطمأنينة' };
  return { ar: 'أفضل احتمال', en: 'BEST POTENTIAL — الذروة' };
}

/* ─── Orbital positions for 9 domain stones ─── */
const ORBITAL_POSITIONS: React.CSSProperties[] = [
  { top: 8, left: '50%', transform: 'translateX(-50%)' },
  { top: 46, right: 18 },
  { top: '50%', right: -8, transform: 'translateY(-50%)' },
  { bottom: 46, right: 18 },
  { bottom: 8, left: '50%', transform: 'translateX(-50%)' },
  { bottom: 46, left: 18 },
  { top: '50%', left: -8, transform: 'translateY(-50%)' },
  { top: 46, left: 18 },
  { top: 130, left: '50%', transform: 'translateX(-50%)' },
];

/* ─── Metaphor detail rows ─── */
const DETAIL_ROWS = [
  { label: 'العصا', title: 'الثبات في الطريق', key: 'staff_meaning' },
  { label: 'الظل', title: 'أثر الحضور', key: 'shadow_meaning' },
  { label: 'النور', title: 'الوعي من فوق', key: 'light_meaning' },
  { label: 'التسعة أحجار', title: 'مجالات الحياة', key: 'stones_meaning' },
];

/* ─── Palette ─── */
const PALETTE = [
  { name: 'Obsidian Night — الليل العقيقي', color: '#15130f', outline: true },
  { name: 'Aged Parchment — الرق العتيق', color: '#f0e1c0' },
  { name: 'Desert Sand — رمال الصحراء', color: '#c4a882' },
  { name: 'Best Potential Blue — أزرق أفضل الاحتمال', color: '#7ba7bc' },
];


/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */

export default function TaamunV2Landing() {
  /* ── State ── */
  const [progress, setProgressState] = useState(0);
  const [content, setContent] = useState<LandingContent | null>(null);

  /* ── Refs ── */
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const ringX = useRef(0);
  const ringY = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  /* ── Load Supabase content ── */
  useEffect(() => {
    loadLandingContent().then(setContent);
  }, []);

  /* ── Derive content with fallbacks ── */
  const heroVerse = content?.dailyVerse?.arabic ?? 'وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ';
  const heroTrans = content?.dailyVerse
    ? `${content.dailyVerse.translation} — ${content.dailyVerse.source}`
    : 'And rely upon the Ever-Living who does not die — Al-Furqan 58';
  const socialVerse = content?.socialVerse?.arabic ?? 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ';
  const socialTrans = content?.socialVerse?.translation ?? 'Be in this world as though you were a stranger';
  const domains = content?.domains?.length ? content.domains : DEFAULT_DOMAINS;
  const sec = { ...DEFAULT_SECTIONS, ...(content?.sections ?? {}) };

  /* ── Apply progress to CSS custom properties ── */
  const applyProgress = useCallback((p: number) => {
    setProgressState(p);
    const el = wrapperRef.current;
    if (!el) return;
    const color = progressToColor(p);
    el.style.setProperty('--journey', color);
    el.style.setProperty('--progress', String(p));
  }, []);

  /* ── Cursor tracking ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', onMove);

    const animLoop = () => {
      ringX.current += (mouseX.current - ringX.current) * 0.11;
      ringY.current += (mouseY.current - ringY.current) * 0.11;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = ringX.current + 'px';
        cursorRingRef.current.style.top = ringY.current + 'px';
      }
      rafRef.current = requestAnimationFrame(animLoop);
    };
    rafRef.current = requestAnimationFrame(animLoop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Cursor hover scale for interactive elements ── */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const selector = 'a, button, .tv2-icon-card, .tv2-dom-stone, .tv2-stone';
    const enter = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'translate(-50%,-50%) scale(2.5)';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0.7';
    };
    const leave = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'translate(-50%,-50%) scale(1)';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0.35';
    };
    const els = wrapper.querySelectorAll(selector);
    els.forEach(el => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave); });
    return () => {
      els.forEach(el => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); });
    };
  }, [content]); // re-bind after content loads

  /* ── Scroll progress ── */
  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollBarRef.current) scrollBarRef.current.style.height = (pct * 100) + 'vh';
      const p = Math.min(1, Math.max(0, pct * 1.3));
      applyProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [applyProgress]);

  /* ── Draggable journey track ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const getP = (e: MouseEvent | TouchEvent) => {
      const r = track.getBoundingClientRect();
      const x = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      return Math.min(1, Math.max(0, (x - r.left) / r.width));
    };
    const down = (e: MouseEvent | TouchEvent) => { draggingRef.current = true; applyProgress(getP(e)); };
    const move = (e: MouseEvent | TouchEvent) => { if (draggingRef.current) applyProgress(getP(e)); };
    const up = () => { draggingRef.current = false; };

    track.addEventListener('mousedown', down as EventListener);
    track.addEventListener('touchstart', down as EventListener, { passive: true });
    document.addEventListener('mousemove', move as EventListener);
    document.addEventListener('touchmove', move as EventListener, { passive: true });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    return () => {
      track.removeEventListener('mousedown', down as EventListener);
      track.removeEventListener('touchstart', down as EventListener);
      document.removeEventListener('mousemove', move as EventListener);
      document.removeEventListener('touchmove', move as EventListener);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchend', up);
    };
  }, [applyProgress]);

  /* ── Scroll reveal (IntersectionObserver) ── */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });

    const els = wrapper.querySelectorAll('.tv2-reveal, .tv2-detail-row');
    els.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = (i * 0.07) + 's';
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, [content]);

  /* ── Init progress ── */
  useEffect(() => { applyProgress(0); }, [applyProgress]);

  const color = progressToColor(progress);
  const labels = progressToWord(progress);

  return (
    <div ref={wrapperRef} className="tv2" dir="rtl" lang="ar">
      {/* Cursor */}
      <div ref={cursorRef} className="tv2-cursor" />
      <div ref={cursorRingRef} className="tv2-cursor-ring" />
      {/* Scroll bar */}
      <div ref={scrollBarRef} className="tv2-scroll-bar" />

      {/* ── HEADER ── */}
      <header className="tv2-header">
        <button className="tv2-nav-label">قائمة</button>
        <div className="tv2-logo">تمعّن</div>
        <div style={{ width: 50 }} />
      </header>

      {/* ── HERO ── */}
      <section className="tv2-hero">
        <div className="tv2-staff-scene">
          <div className="tv2-staff-glow" />
          <div className="tv2-staff-line">
            <div className="tv2-staff-diamond" />
          </div>
          <div className="tv2-staff-shadow-line" />
          <div className="tv2-sand-ground" />
          <div className="tv2-stones-arc">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="tv2-stone" />
            ))}
          </div>
        </div>

        <p className="tv2-hero-label">المسار الروحاني • العتبة الصامتة</p>
        <h1 className="tv2-hero-verse">{heroVerse}</h1>
        <p className="tv2-hero-trans">{heroTrans}</p>

        <a className="tv2-cta-btn" href="#journey">
          <span>ابدأ رحلتك</span>
          <span className="tv2-arrow">←</span>
        </a>

        <div className="tv2-progress-indicator">
          <div className="tv2-progress-dot" />
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── SOUL ICONS ── */}
      <section>
        <div className="tv2-section-icons tv2-reveal" id="sec-icons">
          <span className="tv2-sec-label">أيقونات الروح — لكل مجال حضوره</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 2, marginTop: '0.5rem', maxWidth: 480, textAlign: 'right' }}>
            {sec.icons_intro}
          </p>

          <div className="tv2-icons-grid">
            {domains.map(d => (
              <div key={d.icon_key} className="tv2-icon-card">
                {SOUL_ICONS[d.icon_key] ?? null}
                <div className="tv2-icon-name">{d.name_ar}</div>
                <div className="tv2-icon-sub">{d.name_en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── JOURNEY COLOR ── */}
      <section id="journey">
        <div className="tv2-section-journey tv2-reveal">
          <span className="tv2-sec-label">الرحلة الداخلية</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 2, marginTop: '0.5rem' }}>
            {sec.journey_intro}
          </p>

          <div className="tv2-journey-big" style={{ color }}>{labels.ar}</div>
          <div className="tv2-journey-state" style={{ color }}>{labels.en}</div>

          <div ref={trackRef} className="tv2-journey-track">
            <div className="tv2-journey-fill" style={{ width: (progress * 100) + '%', background: color }} />
            <div className="tv2-journey-thumb" style={{ left: (progress * 100) + '%', background: color }} />
          </div>
          <div className="tv2-journey-labels">
            <span>الظل</span>
            <span>الهدية</span>
            <span>أفضل احتمال</span>
          </div>

          {/* Nine stage dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
            {[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((val, i) => (
              <div key={i} className="tv2-dom-stone tv2-static" onClick={() => applyProgress(val)}>
                <span>{['١','٢','٣','٤','٥','٦','٧','٨','٩'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── METAPHOR ── */}
      <section>
        <div className="tv2-section-metaphor">
          <div className="tv2-metaphor-quote tv2-reveal">
            &ldquo;{sec.metaphor_quote}&rdquo;
            <span className="tv2-metaphor-quote-src">عصا السالك — The Wayfarer&apos;s Staff</span>
          </div>

          <div>
            {DETAIL_ROWS.map((row, i) => (
              <div key={row.key} className={`tv2-detail-row${i === DETAIL_ROWS.length - 1 ? '' : ''}`}>
                <span className="tv2-d-label">{row.label}</span>
                <h3 className="tv2-d-title">{row.title}</h3>
                <p className="tv2-d-body">{sec[row.key]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── DOMAINS ORBITAL ── */}
      <section>
        <div className="tv2-section-domains tv2-reveal">
          <span className="tv2-sec-label">التسعة المجالات</span>

          <div className="tv2-orbital">
            <div className="tv2-orbit-ring" />
            <div className="tv2-orbital-center">
              <div className="tv2-center-staff" />
            </div>
            {domains.map((d, i) => (
              <div key={d.icon_key} className="tv2-dom-stone" style={ORBITAL_POSITIONS[i]}>
                <span>{d.name_ar}</span>
              </div>
            ))}
          </div>

          <p className="tv2-domains-verse">{sec.domains_verse}</p>
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── SOCIAL CARD ── */}
      <section className="tv2-section-social">
        <span className="tv2-sec-label">قالب السوشل ميديا</span>
        <div className="tv2-social-card">
          <div className="tv2-social-verse">{socialVerse}</div>
          <p className="tv2-social-trans">{socialTrans}</p>
          <div className="tv2-social-mark">تمعّن</div>
        </div>
      </section>

      <div className="tv2-divider" />

      {/* ── PALETTE ── */}
      <section>
        <div className="tv2-section-palette tv2-reveal">
          <span className="tv2-sec-label">اللغة البصرية</span>
          <div style={{ height: '2rem' }} />
          {PALETTE.map(p => (
            <div key={p.name} className="tv2-pal-row">
              <span className="tv2-pal-name">{p.name}</span>
              <div
                className="tv2-pal-sw"
                style={{
                  background: p.color,
                  ...(p.outline ? { boxShadow: '0 0 0 1px rgba(196,168,130,0.15)' } : {}),
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="tv2-footer">
        <ul className="tv2-footer-links">
          <li><a href="#">صمت</a></li>
          <li><a href="#">تأمل</a></li>
          <li><a href="#">انعكاس</a></li>
        </ul>
        <div className="tv2-footer-tagline">تمعّن • العتبة الصامتة</div>
        <div className="tv2-footer-logo">تمعّن</div>
      </footer>

      {/* ── MOBILE NAV ── */}
      <nav className="tv2-mobile-nav">
        <div className="tv2-nav-item"><span style={{ fontSize: '1rem' }}>◎</span><span>رحلتي</span></div>
        <div className="tv2-nav-item active"><span style={{ fontSize: '1rem' }}>✦</span><span>تمعّن</span></div>
        <div className="tv2-nav-item"><span style={{ fontSize: '1rem' }}>◇</span><span>تأمل</span></div>
        <div className="tv2-nav-item"><span style={{ fontSize: '1rem' }}>△</span><span>روحي</span></div>
      </nav>
    </div>
  );
}
