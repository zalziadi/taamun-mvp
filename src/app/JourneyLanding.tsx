"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./JourneyLanding.css";

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`jl-reveal ${visible ? "visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─── Main component ─── */
export function JourneyLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const pct =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
      100;
    setScrollPct(pct);
    setScrolled(window.scrollY > 80);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* Override body background while this landing is mounted */
  useEffect(() => {
    document.body.style.background = "#15130f";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  return (
    <div className="jl-root" ref={rootRef}>
      {/* Scroll progress */}
      <div
        className="jl-scroll-progress"
        style={{ height: `${scrollPct}%` }}
      />

      {/* Header */}
      <header className={`jl-header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/auth" className="jl-header-cta">
          ابدأ مجانا
        </Link>
        <span className="jl-logo">تمعّن</span>
      </header>

      {/* ════════ HERO ════════ */}
      <section className="jl-hero">
        <span className="jl-hero-badge">برنامج 28 يوم</span>

        <h1 className="jl-hero-title">
          من الظل...
          <br />
          إلى الهدية...
          <br />
          إلى أفضل احتمال
        </h1>

        <p className="jl-hero-subtitle">
          تمعّن ليس تطبيق قرآن. هو رحلة تغيّر الموضع الذي تقرأ منه.
          <br />
          ٢٨ يوما تعيد ضبط علاقتك بالآيات — من سطح المعنى إلى عمق التجربة.
        </p>

        <Link href="#pricing" className="jl-hero-cta">
          <span>ابدأ رحلتك مجانا</span>
          <span style={{ fontSize: "0.9rem" }}>&#8592;</span>
        </Link>

        <p className="jl-hero-note">٧ أيام مجانية — بدون بطاقة دفع</p>
      </section>

      <div className="jl-divider" />

      {/* ════════ THE PROBLEM ════════ */}
      <Reveal>
        <section className="jl-problem">
          <span className="jl-section-label">المشكلة</span>

          <p className="jl-problem-quote">
            &laquo;المشكلة ليست في النص، بل في المكان الذي نقف فيه حين
            نقرأه.&raquo;
          </p>

          <p className="jl-problem-text">
            نقرأ القرآن كل يوم. نحفظ. نفسّر. نسمع. لكن شيئاً ما لا يتغيّر.
            <br />
            لأن السؤال الذي نسأله خاطئ. لم يعد الأهم:{" "}
            <strong>ما معنى الآية؟</strong>
            <br />
            السؤال الأصدق:{" "}
            <strong>ماذا يحدث داخلي عندما أقرأ هذه الآية؟</strong>
          </p>
        </section>
      </Reveal>

      <div className="jl-divider" />

      {/* ════════ 3 TRANSFORMATION PHASES ════════ */}
      <section className="jl-phases">
        <Reveal>
          <span className="jl-section-label">مسار التحوّل</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">ثلاث بوابات تعبرها في ٢٨ يوم</h2>
        </Reveal>
        <Reveal>
          <p className="jl-section-desc">
            كل موضوع في حياتك — الهوية، العلاقات، المال، الجمال — يمرّ بنفس
            المراحل الثلاث.
          </p>
        </Reveal>

        <div className="jl-phases-track">
          <Reveal>
            <div className="jl-phase-card">
              <span className="jl-phase-num">١</span>
              <span className="jl-phase-icon">🌑</span>
              <h3 className="jl-phase-name">الظل</h3>
              <span className="jl-phase-en">
                The Shadow — Observation
              </span>
              <p className="jl-phase-body">
                أن ترى ما يحدث فيك دون أن تحاول تغييره. ليس تمريناً ذهنياً — بل
                لحظة صدق. الظل ليس خطأ أخلاقياً ولا ضعف إيمان. الظل يختفي حين
                يُرى.
              </p>
              <p className="jl-phase-question">
                &laquo;ماذا يحدث في داخلي الآن؟&raquo;
              </p>
            </div>
          </Reveal>

          <div className="jl-phase-arrow">&#8594;</div>

          <Reveal>
            <div className="jl-phase-card">
              <span className="jl-phase-num">٢</span>
              <span className="jl-phase-icon">&#10022;</span>
              <h3 className="jl-phase-name">الهدية</h3>
              <span className="jl-phase-en">
                The Gift — Awareness
              </span>
              <p className="jl-phase-body">
                يحدث فجأة... كأنه انكشاف داخلي. لا يمكن التخطيط له، لكن يمكن
                خلق بيئة يحدث فيها. اللحظة التي ينتقل فيها المعنى من فكرة إلى
                تجربة.
              </p>
              <p className="jl-phase-question">
                &laquo;ماذا يحدث داخلي وأنا أقرأها؟&raquo;
              </p>
            </div>
          </Reveal>

          <div className="jl-phase-arrow">&#8594;</div>

          <Reveal>
            <div className="jl-phase-card">
              <span className="jl-phase-num">٣</span>
              <span className="jl-phase-icon">&#9672;</span>
              <h3 className="jl-phase-name">أفضل احتمال</h3>
              <span className="jl-phase-en">
                Highest Potential — Contemplation
              </span>
              <p className="jl-phase-body">
                أن تبقى مع المعنى حتى يصبح حالة تعيش منها لا فكرة تزورها.
                القرآن كمدينة تسكن — لا كتاب يُغلق.
              </p>
              <p className="jl-phase-question">
                &laquo;ما الذي بقي من الآية في حياتك بعد أن أغلقت
                المصحف؟&raquo;
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ DAILY 5 STEPS ════════ */}
      <section className="jl-daily">
        <Reveal>
          <span className="jl-section-label">الرحلة اليومية</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">خمس خطوات كل يوم</h2>
        </Reveal>
        <Reveal>
          <p className="jl-section-desc">
            كل يوم يعكس مسار التحوّل بشكل مصغّر — من الصمت إلى الوعي.
          </p>
        </Reveal>

        <div className="jl-steps-list">
          {[
            {
              num: "١",
              name: "لحظة صمت",
              time: "الاستعداد",
              desc: "لا تبدأ بالآية. ابدأ بالسكون. الشاشة فارغة تماما — فقط سؤال واحد: ماذا يحدث في داخلي الآن؟ لا يظهر شيء آخر حتى تكتب كلمة واحدة على الأقل.",
              hasLine: true,
            },
            {
              num: "٢",
              name: "آية واحدة",
              time: "الاستقبال",
              desc: "آية واحدة فقط — بسيطة وواضحة دون تشتيت. ليست المسألة أن تقرأ كثيرا، بل أن تقرأ بوعي.",
              hasLine: true,
            },
            {
              num: "٣",
              name: "طبقة أعمق",
              time: "الانكشاف",
              desc: "معنى مخفي يكشف عن نفسه حين تكون مستعدا. سؤالان: السؤال الظاهري من سطح الآية، والسؤال المرآوي — ماذا تكشف الآية عنك؟",
              hasLine: true,
            },
            {
              num: "٤",
              name: "تأمل شخصي",
              time: "الحوار",
              desc: "دفترك الخاص. تدوّن ما شعرت به وما لاحظته. حوار بينك وبين الآية. الصدق مع النفس أهم من الكمال.",
              hasLine: true,
            },
            {
              num: "٥",
              name: "قياس الوعي",
              time: "الملاحظة",
              desc: "تتبّع حالة وعيك ونموك — ليس بأرقام مثالية، بل بملاحظة حركتك بين الحالات. المشهد واضح. الآن طبّق في يومك الحالي.",
              hasLine: false,
            },
          ].map((step) => (
            <Reveal key={step.num}>
              <div className="jl-step">
                <div className="jl-step-marker">
                  <div className="jl-step-num">{step.num}</div>
                  {step.hasLine && <div className="jl-step-line" />}
                </div>
                <div>
                  <h3 className="jl-step-name">{step.name}</h3>
                  <span className="jl-step-time">{step.time}</span>
                  <p className="jl-step-desc">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ DUAL QUESTION ════════ */}
      <section className="jl-dual-question">
        <Reveal>
          <span className="jl-section-label">الآلية المركزية</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">السؤال الذي يغيّر كل شيء</h2>
        </Reveal>
        <Reveal>
          <p className="jl-section-desc">
            تمعّن يحوّل سؤالا واحدا — من البحث عن الإجابة إلى الإصغاء للتجربة.
          </p>
        </Reveal>

        <Reveal>
          <div className="jl-dual-grid">
            <div className="jl-dual-card">
              <span className="jl-dual-card-label">السؤال القديم</span>
              <p className="jl-dual-card-q">ما معنى الآية؟</p>
            </div>
            <div className="jl-dual-vs">&#10236;</div>
            <div className="jl-dual-card active">
              <span className="jl-dual-card-label">السؤال الأصدق</span>
              <p className="jl-dual-card-q">
                ماذا يحدث داخلي
                <br />
                عندما أقرأ هذه الآية؟
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="jl-divider" />

      {/* ════════ THREE TONES ════════ */}
      <section className="jl-tone">
        <Reveal>
          <span className="jl-section-label">تطبيق حي</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">يتغيّر مع حالتك</h2>
        </Reveal>
        <Reveal>
          <p className="jl-section-desc">
            كل صباح — سؤال واحد خفيف. والتطبيق يتكيّف مع إجابتك.
          </p>
        </Reveal>

        <div className="jl-tone-cards">
          {[
            {
              emoji: "🌑",
              name: "نبرة الظل",
              desc: "\u00ABاليوم أشعر بثقل\u00BB",
              msg: "لاحظ فقط. لا تحاول أن تتغيّر اليوم.",
            },
            {
              emoji: "✦",
              name: "نبرة الهدية",
              desc: "\u00ABاليوم فيّ انفتاح\u00BB",
              msg: "سؤال أعمق. مساحة أكبر للكتابة.",
            },
            {
              emoji: "◈",
              name: "نبرة التمعّن",
              desc: "\u00ABاليوم أبحث عن وضوح\u00BB",
              msg: "تمرين عملي مرتبط بحياتك اليومية.",
            },
          ].map((tone) => (
            <Reveal key={tone.name}>
              <div className="jl-tone-card">
                <span className="jl-tone-emoji">{tone.emoji}</span>
                <h3 className="jl-tone-name">{tone.name}</h3>
                <p className="jl-tone-desc">{tone.desc}</p>
                <p className="jl-tone-msg">{tone.msg}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ FEATURES ════════ */}
      <section className="jl-features">
        <Reveal>
          <span className="jl-section-label">ماذا يحتوي تمعّن</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">أدوات الرحلة</h2>
        </Reveal>

        <div className="jl-features-grid">
          {[
            {
              icon: "📖",
              name: "البرنامج",
              desc: "28 يوم من التمعّن المتدرج. من بوابة الصمت إلى المدينة. كل يوم مبني على ما قبله.",
            },
            {
              icon: "🪞",
              name: "الدفتر",
              desc: "مساحتك الشخصية. في نهاية كل أسبوع ترى ما كتبته جنبا إلى جنب — لا تحليل، فقط مرآة.",
            },
            {
              icon: "🏙️",
              name: "المدينة",
              desc: "بعد اليوم 28 — القرآن كمدينة تسكن لا كتاب يُغلق. كل يوم آية وسؤال ومساحة كتابة.",
            },
            {
              icon: "🧭",
              name: "المرشد",
              desc: "مرشد تمعّن يساعدك تختار خطوتك القادمة بوضوح — بلغة التجربة لا الوعظ.",
            },
            {
              icon: "📊",
              name: "تحليلات الرحلة",
              desc: "ملاحظة حركتك بين الحالات الثلاث. ليس تقييما — بل وعي بالمسار.",
            },
            {
              icon: "📿",
              name: "المسبحة",
              desc: "أداة ذكر رقمية تصاحبك في لحظات الصمت والعودة إلى المركز.",
            },
          ].map((f) => (
            <Reveal key={f.name}>
              <div className="jl-feature-card">
                <span className="jl-feature-icon">{f.icon}</span>
                <h3 className="jl-feature-name">{f.name}</h3>
                <p className="jl-feature-desc">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ WHAT MAKES US DIFFERENT ════════ */}
      <Reveal>
        <section className="jl-different">
          <span className="jl-section-label">ما يميّز تمعّن</span>

          <p className="jl-different-quote">
            &laquo;لا توبيخ أبدا. لا إشعارات فاتك يوم! ولا لم تكمل
            تمرينك.&raquo;
          </p>

          <p className="jl-problem-text">
            إذا غبت — لا نعيدك من البداية. نقول:{" "}
            <strong>
              &laquo;أنت عدت. هذا يكفي. استمر من هنا.&raquo;
            </strong>
            <br />
            عدم إكمال يوم ليس فشلا. التحول يبدأ من أن ترى نفسك وأنت تتحرك بين
            الحالات.
          </p>
        </section>
      </Reveal>

      <div className="jl-divider" />

      {/* ════════ AFTER 28 ════════ */}
      <Reveal>
        <section className="jl-after28">
          <span className="jl-section-label">بعد اليوم ٢٨</span>
          <h2 className="jl-section-title">لا شاشة احتفال. لا مبروك.</h2>
          <p className="jl-section-desc">
            تظهر جملة واحدة. ثم يتحول التطبيق إلى وضع &laquo;المدينة&raquo; —
            بدون هيكل أسابيع، بدون تسلسل. تختار تعيد الرحلة أو تبقى في المدينة.
            ودفترك يبقى كاملا كسجل لرحلتك.
          </p>
          <p className="jl-after28-quote">
            &laquo;القرآن كمدينة تسكن لا كتاب يُغلق.&raquo;
          </p>
        </section>
      </Reveal>

      <div className="jl-divider" />

      {/* ════════ PRICING ════════ */}
      <section className="jl-pricing" id="pricing">
        <Reveal>
          <span className="jl-section-label">الباقات</span>
        </Reveal>
        <Reveal>
          <h2 className="jl-section-title">اختر رحلتك</h2>
        </Reveal>
        <Reveal>
          <p className="jl-section-desc">
            ابدأ مجانا. ثم قرّر متى تريد أن تعمّق.
          </p>
        </Reveal>

        <div className="jl-pricing-grid">
          {/* Free */}
          <Reveal>
            <div className="jl-price-card">
              <h3 className="jl-price-name">مجانية</h3>
              <p className="jl-price-period">7 أيام كاملة</p>
              <div className="jl-price-amount">
                0 <small style={{ fontSize: "0.7rem" }}>ر.س</small>
              </div>
              <p className="jl-price-unit">بدون بطاقة دفع</p>
              <ul className="jl-price-features">
                <li>بوابة الصمت والتأمل</li>
                <li>الدفتر الشخصي</li>
                <li>7 أيام كاملة بدون التزام</li>
              </ul>
              <Link href="/auth" className="jl-price-btn">
                ابدأ مجانا
              </Link>
            </div>
          </Reveal>

          {/* Quarterly */}
          <Reveal>
            <div className="jl-price-card">
              <h3 className="jl-price-name">ربع سنوية</h3>
              <p className="jl-price-period">90 يوم</p>
              <div className="jl-price-amount">
                199 <small style={{ fontSize: "0.7rem" }}>ر.س</small>
              </div>
              <p className="jl-price-unit">66 ر.س / شهر</p>
              <ul className="jl-price-features">
                <li>جميع مميزات التمعّن</li>
                <li>المدينة التفاعلية</li>
                <li>مرشد تمعّن</li>
                <li>تحليلات الرحلة</li>
              </ul>
              <Link href="/pricing" className="jl-price-btn">
                اشترك الآن
              </Link>
            </div>
          </Reveal>

          {/* Annual — featured */}
          <Reveal>
            <div className="jl-price-card featured">
              <div className="jl-price-badge">الأفضل قيمة</div>
              <h3 className="jl-price-name">سنوية</h3>
              <p className="jl-price-period">365 يوم</p>
              <div className="jl-price-amount">
                699 <small style={{ fontSize: "0.7rem" }}>ر.س</small>
              </div>
              <p className="jl-price-unit">58 ر.س / شهر — توفير 41%</p>
              <ul className="jl-price-features">
                <li>جميع مميزات الربع سنوي</li>
                <li>توفير 4 أشهر</li>
                <li>أولوية في الدعم</li>
                <li>محتوى إضافي حصري</li>
              </ul>
              <Link href="/pricing" className="jl-price-btn">
                اشترك الآن
              </Link>
            </div>
          </Reveal>

          {/* VIP */}
          <Reveal>
            <div className="jl-price-card">
              <h3 className="jl-price-name">VIP</h3>
              <p className="jl-price-period">365 يوم</p>
              <div className="jl-price-amount">
                4,999 <small style={{ fontSize: "0.7rem" }}>ر.س</small>
              </div>
              <p className="jl-price-unit">للجادين في رحلتهم</p>
              <ul className="jl-price-features">
                <li>جميع مميزات السنوي</li>
                <li>جلسات تمعّن خاصة</li>
                <li>دعم مباشر ومخصص</li>
                <li>مجتمع VIP حصري</li>
              </ul>
              <Link href="/pricing" className="jl-price-btn">
                اشترك الآن
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Payment */}
      <Reveal>
        <div className="jl-payment-note">
          <p>
            الدفع عبر تحويل بنكي أو STC Pay — أرسل الإيصال عبر واتساب واحصل
            على كود التفعيل خلال دقائق
          </p>
          <div className="jl-payment-methods">
            <span className="jl-payment-method">STC Bank</span>
            <span className="jl-payment-method">STC Pay</span>
            <span className="jl-payment-method">واتساب</span>
          </div>
        </div>
      </Reveal>

      <div className="jl-divider" />

      {/* ════════ GUARANTEE ════════ */}
      <Reveal>
        <section className="jl-guarantee">
          <div className="jl-guarantee-box">
            <span className="jl-guarantee-icon">🤲</span>
            <span>
              ابدأ بـ 7 أيام مجانية. إذا لم تلاحظ فرقا في طريقة قراءتك للقرآن
              — لا تكمل. بدون أي التزام.
            </span>
          </div>
        </section>
      </Reveal>

      <div className="jl-divider" />

      {/* ════════ FINAL CTA ════════ */}
      <section className="jl-final-cta">
        <Reveal>
          <h2 className="jl-final-verse">
            وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ
          </h2>
        </Reveal>

        <Reveal>
          <p className="jl-final-text">
            لا يتغير النص. الذي يتغير هو القارئ.
            <br />
            ابدأ رحلتك — واكتشف من تكون حين تقرأ.
          </p>
        </Reveal>

        <Reveal>
          <Link href="#pricing" className="jl-hero-cta-static">
            <span>ابدأ رحلتك مجانا</span>
            <span style={{ fontSize: "0.9rem" }}>&#8592;</span>
          </Link>
        </Reveal>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="jl-footer">
        <ul className="jl-footer-links">
          <li>
            <Link href="/program">صمت</Link>
          </li>
          <li>
            <Link href="/reflection">تأمل</Link>
          </li>
          <li>
            <Link href="/progress">انعكاس</Link>
          </li>
        </ul>
        <div className="jl-footer-center">تمعّن &copy; 2026</div>
        <div className="jl-footer-logo">تمعّن</div>
      </footer>
    </div>
  );
}
