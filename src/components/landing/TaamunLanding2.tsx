"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/styles/taamun-landing-2.css";

const DOMAINS = [
  { ar: "الهوية", en: "Identity" },
  { ar: "العلاقات", en: "Relationships" },
  { ar: "المال", en: "Provision" },
  { ar: "النمو", en: "Growth" },
  { ar: "العطاء", en: "Giving" },
  { ar: "الجمال", en: "Beauty" },
  { ar: "الأسرة", en: "Family" },
  { ar: "البناء", en: "Building" },
  { ar: "المراجعة", en: "Reflection" },
];

const METAPHORS = [
  { label: "العصا", title: "الثبات في الطريق", body: "تمعّن ليست أداة — هي كيان راسخ. لها ظِل لأنها قائمة بالفعل. تسند المسافر لا لأنها تحمله، بل لأنها تذكّره أنه لم يسقط." },
  { label: "الظل", title: "أثر الحضور", body: "لا تحتاج أن تصرخ — وجودك كافٍ لأن يكون لك انعكاس في الواقع. الظل هو الدليل الأصدق على أن النور وقع." },
  { label: "النور", title: "الوعي من فوق", body: "النور لا يأتي من تمعّن — يأتي من مكان أعلى. تمعّن هي ما يستقبله ويعكسه. القرآن هو المصدر؛ التأمل هو الانكسار." },
  { label: "التسعة أحجار", title: "مجالات الحياة", body: "تسعة مجالات تحيط بالمحور — لكل حجر ثقله ووزنه وموضعه في الطريق. المسافر لا يحمل الحجارة — يمشي بينها." },
];

const PALETTE = [
  { name: "Obsidian Night — الليل العقيقي", color: "#15130f", border: true },
  { name: "Aged Parchment — الرق العتيق", color: "#f0e1c0" },
  { name: "Desert Sand — رمال الصحراء", color: "#c4a882" },
  { name: "Best Potential Blue — أزرق أفضل الاحتمال", color: "#7ba7bc" },
];

function progressToColor(p: number) {
  const h = Math.round(42 + p * 168);
  const s = Math.round(76 - p * 30);
  const l = Math.round(81 - p * 30);
  return `hsl(${h},${s}%,${l}%)`;
}

function progressToWord(p: number) {
  if (p < 0.15) return { ar: "ظِل", en: "SHADOW STATE — البداية" };
  if (p < 0.33) return { ar: "يقظة", en: "AWAKENING — البصيرة تنبت" };
  if (p < 0.5) return { ar: "هِبَة", en: "GIFT STATE — الموهبة تظهر" };
  if (p < 0.67) return { ar: "نور", en: "ILLUMINATION — حالة الاستنارة" };
  if (p < 0.85) return { ar: "سَكينة", en: "SERENITY — الطمأنينة" };
  return { ar: "أفضل احتمال", en: "BEST POTENTIAL — الذروة" };
}

function StonesSVG({ domain }: { domain: string }) {
  return <span style={{ fontFamily: "var(--font-amiri), Amiri, serif", fontSize: "0.7rem", color: "#c4a882", opacity: 0.7 }}>{domain}</span>;
}

export function TaamunLanding2() {
  const [progress, setProgress] = useState(0);
  const [journeyColor, setJourneyColor] = useState("#f0e1c0");
  const [journeyWord, setJourneyWord] = useState({ ar: "ظِل", en: "SHADOW STATE — البداية" });
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const applyProgress = useCallback((p: number) => {
    const clamped = Math.min(1, Math.max(0, p));
    setProgress(clamped);
    setJourneyColor(progressToColor(clamped));
    setJourneyWord(progressToWord(clamped));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, pct * 1.3));
      if (!draggingRef.current) applyProgress(p);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [applyProgress]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".l2-reveal").forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${(i * 0.07).toFixed(2)}s`;
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const handleTrackInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const r = trackRef.current.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      applyProgress(p);
    },
    [applyProgress]
  );

  useEffect(() => {
    const up = () => { draggingRef.current = false; };
    document.addEventListener("mouseup", up);
    document.addEventListener("touchend", up);
    return () => { document.removeEventListener("mouseup", up); document.removeEventListener("touchend", up); };
  }, []);

  const orbitalPositions = [
    { top: "8px", left: "50%", transform: "translateX(-50%)" },
    { top: "46px", right: "18px" },
    { top: "50%", right: "-8px", transform: "translateY(-50%)" },
    { bottom: "46px", right: "18px" },
    { bottom: "8px", left: "50%", transform: "translateX(-50%)" },
    { bottom: "46px", left: "18px" },
    { top: "50%", left: "-8px", transform: "translateY(-50%)" },
    { top: "46px", left: "18px" },
    { top: "130px", left: "50%", transform: "translateX(-50%)" },
  ];

  return (
    <div dir="rtl" lang="ar" className="landing2" style={{ background: "#15130f", color: "#e8e1da", fontWeight: 300, overflowX: "hidden" }}>

      <div className="l2-scroll-bar" style={{ height: `${progress * 100}vh`, background: journeyColor }} />

      {/* HEADER */}
      <header className="l2-header">
        <div style={{ width: 50 }} />
        <div className="l2-logo" style={{ fontFamily: "var(--font-amiri), Amiri, serif", color: journeyColor }}>تمعّن</div>
        <div style={{ width: 50 }} />
      </header>

      {/* HERO */}
      <section className="l2-hero">
        <div className="l2-staff-scene">
          <div className="l2-staff-glow" />
          <div className="l2-staff-line">
            <div className="l2-staff-diamond" style={{ background: journeyColor, boxShadow: `0 0 18px ${journeyColor}, 0 0 40px rgba(240,225,192,0.4)` }} />
          </div>
          <div className="l2-staff-shadow-line" />
          <div className="l2-sand-ground" />
          <div className="l2-stones-arc">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="l2-stone" />)}
          </div>
        </div>

        <p className="l2-hero-label">المسار الروحاني • العتبة الصامتة</p>
        <h1 className="l2-hero-verse" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>
          وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ
        </h1>
        <p className="l2-hero-trans">And rely upon the Ever-Living who does not die — Al-Furqan 58</p>

        <Link href="/" className="l2-cta-btn" style={{ fontFamily: "var(--font-amiri), Amiri, serif", color: journeyColor }}>
          <span>ابدأ رحلتك</span>
          <span className="arrow">←</span>
        </Link>

        <div className="l2-progress-indicator" style={{ position: "absolute", bottom: "2.5rem" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: journeyColor }} />
        </div>
      </section>

      <div className="l2-divider" />

      {/* SOUL ICONS */}
      <section className="l2-section">
        <div className="l2-icons-section l2-reveal">
          <span className="l2-sec-label">أيقونات الروح — لكل مجال حضوره</span>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 2, marginTop: "0.5rem", maxWidth: 480, textAlign: "right" }}>
            تسعة أبواب. كل باب عالَم. لا تدخله بعقلك — بل بوجودك.
          </p>
          <div className="l2-icons-grid">
            {DOMAINS.map((d) => (
              <div key={d.en} className="l2-icon-card">
                <div className="l2-icon-name" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>{d.ar}</div>
                <div className="l2-icon-sub">{d.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="l2-divider" />

      {/* JOURNEY COLOR */}
      <section className="l2-section" id="journey">
        <div className="l2-journey-section l2-reveal">
          <span className="l2-sec-label">الرحلة الداخلية</span>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 2, marginTop: "0.5rem" }}>
            كلما تقدّمت في رحلتك — تحوّل اللون من ذهبي الظل إلى أزرق أفضل الاحتمال.
          </p>

          <div className="l2-journey-big" style={{ fontFamily: "var(--font-amiri), Amiri, serif", color: journeyColor }}>{journeyWord.ar}</div>
          <div className="l2-journey-state" style={{ color: journeyColor }}>{journeyWord.en}</div>

          <div
            ref={trackRef}
            className="l2-journey-track"
            onMouseDown={(e) => { draggingRef.current = true; handleTrackInteraction(e.clientX); }}
            onMouseMove={(e) => { if (draggingRef.current) handleTrackInteraction(e.clientX); }}
            onTouchStart={(e) => { draggingRef.current = true; handleTrackInteraction(e.touches[0].clientX); }}
            onTouchMove={(e) => { if (draggingRef.current) handleTrackInteraction(e.touches[0].clientX); }}
          >
            <div className="l2-journey-fill" style={{ width: `${progress * 100}%`, background: journeyColor }} />
            <div className="l2-journey-thumb" style={{ left: `${progress * 100}%`, transform: "translateY(-50%) translateX(-50%)", background: journeyColor }} />
          </div>
          <div className="l2-journey-labels"><span>الظل</span><span>الهدية</span><span>أفضل احتمال</span></div>
        </div>
      </section>

      <div className="l2-divider" />

      {/* METAPHOR */}
      <section className="l2-section">
        <div className="l2-metaphor-section">
          <div className="l2-metaphor-quote l2-reveal" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>
            &ldquo;ليس في الوجود إلا نور واحد، يتجلّى في صور شتى، كالعصا التي يسند إليها المسافر قلبه قبل جسده.&rdquo;
            <span className="l2-metaphor-quote-src">عصا السالك — The Wayfarer&apos;s Staff</span>
          </div>
          <div>
            {METAPHORS.map((m, i) => (
              <div key={i} className="l2-detail-row l2-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <span className="l2-d-label">{m.label}</span>
                <h3 className="l2-d-title" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>{m.title}</h3>
                <p className="l2-d-body">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="l2-divider" />

      {/* SOCIAL CARD */}
      <section className="l2-section l2-social-section">
        <span className="l2-sec-label">قالب السوشل ميديا</span>
        <div className="l2-social-card">
          <div className="l2-social-verse" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>
            كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ
          </div>
          <p className="l2-social-trans">Be in this world as though you were a stranger</p>
          <div className="l2-social-mark" style={{ fontFamily: "var(--font-amiri), Amiri, serif" }}>تمعّن</div>
        </div>
      </section>

      <div className="l2-divider" />

      {/* PALETTE */}
      <section className="l2-section">
        <div className="l2-palette-section l2-reveal">
          <span className="l2-sec-label">اللغة البصرية</span>
          <div style={{ height: "2rem" }} />
          {PALETTE.map((p) => (
            <div key={p.name} className="l2-pal-row">
              <span className="l2-pal-name">{p.name}</span>
              <div className="l2-pal-sw" style={{ background: p.color, boxShadow: p.border ? "0 0 0 1px rgba(196,168,130,0.15)" : undefined }} />
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l2-footer">
        <ul className="l2-footer-links">
          <li><Link href="/reflection">صمت</Link></li>
          <li><Link href="/journal">تأمل</Link></li>
          <li><Link href="/journey">انعكاس</Link></li>
        </ul>
        <div className="l2-footer-tagline">تمعّن • العتبة الصامتة</div>
        <div className="l2-footer-logo" style={{ fontFamily: "var(--font-amiri), Amiri, serif", color: journeyColor }}>تمعّن</div>
      </footer>
    </div>
  );
}
