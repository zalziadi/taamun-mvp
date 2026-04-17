import Link from "next/link";
import "./JourneyLanding.css";
import { LandingEffects } from "./LandingEffects";

/**
 * JourneyLanding — Server Component.
 * All content is static HTML rendered on the server (instant LCP).
 * LandingEffects client island adds scroll animations after hydration.
 */

const STEPS = [
  { num: "١", name: "لحظة صمت", time: "الاستعداد", desc: "لا تبدأ بالآية. ابدأ بالسكون. الشاشة فارغة تماما — فقط سؤال واحد: ماذا يحدث في داخلي الآن؟ لا يظهر شيء آخر حتى تكتب كلمة واحدة على الأقل.", hasLine: true },
  { num: "٢", name: "آية واحدة", time: "الاستقبال", desc: "آية واحدة فقط — بسيطة وواضحة دون تشتيت. ليست المسألة أن تقرأ كثيرا، بل أن تقرأ بوعي.", hasLine: true },
  { num: "٣", name: "طبقة أعمق", time: "الانكشاف", desc: "معنى مخفي يكشف عن نفسه حين تكون مستعدا. سؤالان: السؤال الظاهري من سطح الآية، والسؤال المرآوي — ماذا تكشف الآية عنك؟", hasLine: true },
  { num: "٤", name: "تأمل شخصي", time: "الحوار", desc: "دفترك الخاص. تدوّن ما شعرت به وما لاحظته. حوار بينك وبين الآية. الصدق مع النفس أهم من الكمال.", hasLine: true },
  { num: "٥", name: "قياس الوعي", time: "الملاحظة", desc: "تتبّع حالة وعيك ونموك — ليس بأرقام مثالية، بل بملاحظة حركتك بين الحالات. المشهد واضح. الآن طبّق في يومك الحالي.", hasLine: false },
];

const TONES = [
  { emoji: "🌑", name: "نبرة الظل", desc: "\u00ABاليوم أشعر بثقل\u00BB", msg: "لاحظ فقط. لا تحاول أن تتغيّر اليوم." },
  { emoji: "✦", name: "نبرة الهدية", desc: "\u00ABاليوم فيّ انفتاح\u00BB", msg: "سؤال أعمق. مساحة أكبر للكتابة." },
  { emoji: "◈", name: "نبرة التمعّن", desc: "\u00ABاليوم أبحث عن وضوح\u00BB", msg: "تمرين عملي مرتبط بحياتك اليومية." },
];

const FEATURES = [
  { icon: "📖", name: "البرنامج", desc: "28 يوم من التمعّن المتدرج. من بوابة الصمت إلى المدينة. كل يوم مبني على ما قبله." },
  { icon: "🪞", name: "الدفتر", desc: "مساحتك الشخصية. في نهاية كل أسبوع ترى ما كتبته جنبا إلى جنب — لا تحليل، فقط مرآة." },
  { icon: "🏙️", name: "المدينة", desc: "بعد اليوم 28 — القرآن كمدينة تسكن لا كتاب يُغلق. كل يوم آية وسؤال ومساحة كتابة." },
  { icon: "🧭", name: "المرشد", desc: "مرشد تمعّن يساعدك تختار خطوتك القادمة بوضوح — بلغة التجربة لا الوعظ." },
  { icon: "📊", name: "تحليلات الرحلة", desc: "ملاحظة حركتك بين الحالات الثلاث. ليس تقييما — بل وعي بالمسار." },
  { icon: "📿", name: "المسبحة", desc: "أداة ذكر رقمية تصاحبك في لحظات الصمت والعودة إلى المركز." },
];

export function JourneyLanding() {
  return (
    <div className="jl-root">
      {/* Client island — scroll effects, reveal observer, body bg */}
      <LandingEffects />

      {/* Scroll progress (controlled by LandingEffects via DOM) */}
      <div className="jl-scroll-progress" />

      {/* Header */}
      <header className="jl-header">
        <Link href="/auth" className="jl-header-cta">ابدأ مجانا</Link>
        <span className="jl-logo">تمعّن</span>
      </header>

      {/* ════════ HERO ════════ */}
      <section className="jl-hero">
        <span className="jl-hero-badge">برنامج 28 يوم</span>
        <p className="jl-hero-tagline">رحلة تأمل قرآنية تعيد ضبط علاقتك بالآيات — من القراءة إلى التجربة</p>
        <h1 className="jl-hero-title">من الظل...<br />إلى الهدية...<br />إلى أفضل احتمال</h1>
        <p className="jl-hero-subtitle">تمعّن ليس تطبيق قرآن. هو رحلة تغيّر الموضع الذي تقرأ منه.<br />٢٨ يوما تعيد ضبط علاقتك بالآيات — من سطح المعنى إلى عمق التجربة.</p>
        <Link href="#pricing" className="jl-hero-cta">
          <span>ابدأ رحلتك مجانا</span>
          <span style={{ fontSize: "0.9rem" }}>&#8592;</span>
        </Link>
        <p className="jl-hero-note">٧ أيام مجانية — بدون بطاقة دفع</p>
      </section>

      <div className="jl-divider" />

      {/* ════════ THE PROBLEM ════════ */}
      <div className="jl-reveal">
        <section className="jl-problem">
          <span className="jl-section-label">المشكلة</span>
          <p className="jl-problem-quote">&laquo;المشكلة ليست في النص، بل في المكان الذي نقف فيه حين نقرأه.&raquo;</p>
          <p className="jl-problem-text">نقرأ القرآن كل يوم. نحفظ. نفسّر. نسمع. لكن شيئاً ما لا يتغيّر.<br />لأن السؤال الذي نسأله خاطئ. لم يعد الأهم: <strong>ما معنى الآية؟</strong><br />السؤال الأصدق: <strong>ماذا يحدث داخلي عندما أقرأ هذه الآية؟</strong></p>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ 3 TRANSFORMATION PHASES ════════ */}
      <section className="jl-phases">
        <div className="jl-reveal"><span className="jl-section-label">مسار التحوّل</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">ثلاث بوابات تعبرها في ٢٨ يوم</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">كل موضوع في حياتك — الهوية، العلاقات، المال، الجمال — يمرّ بنفس المراحل الثلاث.</p></div>

        <div className="jl-phases-track">
          <div className="jl-reveal">
            <div className="jl-phase-card">
              <span className="jl-phase-num">١</span><span className="jl-phase-icon">🌑</span>
              <h3 className="jl-phase-name">الظل</h3>
              <span className="jl-phase-en">The Shadow — Observation</span>
              <p className="jl-phase-body">أن ترى ما يحدث فيك دون أن تحاول تغييره. ليس تمريناً ذهنياً — بل لحظة صدق. الظل ليس خطأ أخلاقياً ولا ضعف إيمان. الظل يختفي حين يُرى.</p>
              <p className="jl-phase-question">&laquo;ماذا يحدث في داخلي الآن؟&raquo;</p>
            </div>
          </div>
          <div className="jl-phase-arrow">&#8594;</div>
          <div className="jl-reveal">
            <div className="jl-phase-card">
              <span className="jl-phase-num">٢</span><span className="jl-phase-icon">&#10022;</span>
              <h3 className="jl-phase-name">الهدية</h3>
              <span className="jl-phase-en">The Gift — Awareness</span>
              <p className="jl-phase-body">يحدث فجأة... كأنه انكشاف داخلي. لا يمكن التخطيط له، لكن يمكن خلق بيئة يحدث فيها. اللحظة التي ينتقل فيها المعنى من فكرة إلى تجربة.</p>
              <p className="jl-phase-question">&laquo;ماذا يحدث داخلي وأنا أقرأها؟&raquo;</p>
            </div>
          </div>
          <div className="jl-phase-arrow">&#8594;</div>
          <div className="jl-reveal">
            <div className="jl-phase-card">
              <span className="jl-phase-num">٣</span><span className="jl-phase-icon">&#9672;</span>
              <h3 className="jl-phase-name">أفضل احتمال</h3>
              <span className="jl-phase-en">Highest Potential — Contemplation</span>
              <p className="jl-phase-body">أن تبقى مع المعنى حتى يصبح حالة تعيش منها لا فكرة تزورها. القرآن كمدينة تسكن — لا كتاب يُغلق.</p>
              <p className="jl-phase-question">&laquo;ما الذي بقي من الآية في حياتك بعد أن أغلقت المصحف؟&raquo;</p>
            </div>
          </div>
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ DAILY 5 STEPS ════════ */}
      <section className="jl-daily">
        <div className="jl-reveal"><span className="jl-section-label">الرحلة اليومية</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">خمس خطوات كل يوم</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">كل يوم يعكس مسار التحوّل بشكل مصغّر — من الصمت إلى الوعي.</p></div>
        <div className="jl-steps-list">
          {STEPS.map((step) => (
            <div className="jl-reveal" key={step.num}>
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
            </div>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ DUAL QUESTION ════════ */}
      <section className="jl-dual-question">
        <div className="jl-reveal"><span className="jl-section-label">الآلية المركزية</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">السؤال الذي يغيّر كل شيء</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">تمعّن يحوّل سؤالا واحدا — من البحث عن الإجابة إلى الإصغاء للتجربة.</p></div>
        <div className="jl-reveal">
          <div className="jl-dual-grid">
            <div className="jl-dual-card"><span className="jl-dual-card-label">السؤال القديم</span><p className="jl-dual-card-q">ما معنى الآية؟</p></div>
            <div className="jl-dual-vs">&#10236;</div>
            <div className="jl-dual-card active"><span className="jl-dual-card-label">السؤال الأصدق</span><p className="jl-dual-card-q">ماذا يحدث داخلي<br />عندما أقرأ هذه الآية؟</p></div>
          </div>
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ THREE TONES ════════ */}
      <section className="jl-tone">
        <div className="jl-reveal"><span className="jl-section-label">تطبيق حي</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">يتغيّر مع حالتك</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">كل صباح — سؤال واحد خفيف. والتطبيق يتكيّف مع إجابتك.</p></div>
        <div className="jl-tone-cards">
          {TONES.map((tone) => (
            <div className="jl-reveal" key={tone.name}>
              <div className="jl-tone-card">
                <span className="jl-tone-emoji">{tone.emoji}</span>
                <h3 className="jl-tone-name">{tone.name}</h3>
                <p className="jl-tone-desc">{tone.desc}</p>
                <p className="jl-tone-msg">{tone.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ FEATURES ════════ */}
      <section className="jl-features">
        <div className="jl-reveal"><span className="jl-section-label">ماذا يحتوي تمعّن</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">أدوات الرحلة</h2></div>
        <div className="jl-features-grid">
          {FEATURES.map((f) => (
            <div className="jl-reveal" key={f.name}>
              <div className="jl-feature-card">
                <span className="jl-feature-icon">{f.icon}</span>
                <h3 className="jl-feature-name">{f.name}</h3>
                <p className="jl-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="jl-divider" />

      {/* ════════ WHAT MAKES US DIFFERENT ════════ */}
      <div className="jl-reveal">
        <section className="jl-different">
          <span className="jl-section-label">ما يميّز تمعّن</span>
          <p className="jl-different-quote">&laquo;لا توبيخ أبدا. لا إشعارات فاتك يوم! ولا لم تكمل تمرينك.&raquo;</p>
          <p className="jl-problem-text">إذا غبت — لا نعيدك من البداية. نقول: <strong>&laquo;أنت عدت. هذا يكفي. استمر من هنا.&raquo;</strong><br />عدم إكمال يوم ليس فشلا. التحول يبدأ من أن ترى نفسك وأنت تتحرك بين الحالات.</p>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ AFTER 28 ════════ */}
      <div className="jl-reveal">
        <section className="jl-after28">
          <span className="jl-section-label">بعد اليوم ٢٨</span>
          <h2 className="jl-section-title">الرحلة لا تنتهي</h2>
          <p className="jl-section-desc">تحديات أسبوعية جديدة، دورات إضافية بآيات مختلفة، ومرشد تمعّن يرافقك كصديق. ودفترك يبقى كاملا كسجل لرحلتك.</p>
          <p className="jl-after28-quote">&laquo;القرآن كمدينة تسكن لا كتاب يُغلق.&raquo;</p>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ PRICING ════════ */}
      <section className="jl-pricing" id="pricing">
        <div className="jl-reveal"><span className="jl-section-label">الباقات</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">اختر رحلتك</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">ابدأ مجانا. ثم قرّر متى تريد أن تعمّق.</p></div>

        <div className="jl-pricing-grid">
          <div className="jl-reveal">
            <div className="jl-price-card">
              <h3 className="jl-price-name">مجانية</h3>
              <p className="jl-price-period">7 أيام كاملة</p>
              <div className="jl-price-amount">0 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">بدون بطاقة دفع</p>
              <ul className="jl-price-features"><li>بوابة الصمت والتمعّن</li><li>الدفتر الشخصي</li><li>7 أيام كاملة بدون التزام</li></ul>
              <Link href="/auth" className="jl-price-btn">ابدأ مجانا</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card">
              <h3 className="jl-price-name">ربع سنوية</h3>
              <p className="jl-price-period">90 يوم</p>
              <div className="jl-price-amount">199 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">66 ر.س / شهر</p>
              <ul className="jl-price-features"><li>جميع مميزات التمعّن</li><li>المدينة التفاعلية</li><li>مرشد تمعّن</li><li>تحليلات الرحلة</li></ul>
              <Link href="/pricing" className="jl-price-btn">اشترك الآن</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card featured">
              <div className="jl-price-badge">الأفضل قيمة</div>
              <h3 className="jl-price-name">سنوية</h3>
              <p className="jl-price-period">365 يوم</p>
              <div className="jl-price-amount">699 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">58 ر.س / شهر — توفير 41%</p>
              <ul className="jl-price-features"><li>جميع مميزات الربع سنوي</li><li>توفير 4 أشهر</li><li>أولوية في الدعم</li><li>محتوى إضافي حصري</li></ul>
              <Link href="/pricing" className="jl-price-btn">اشترك الآن</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card">
              <h3 className="jl-price-name">VIP</h3>
              <p className="jl-price-period">365 يوم</p>
              <div className="jl-price-amount">4,999 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">للجادين في رحلتهم</p>
              <ul className="jl-price-features"><li>جميع مميزات السنوي</li><li>جلسات تمعّن خاصة</li><li>دعم مباشر ومخصص</li><li>مجتمع VIP حصري</li></ul>
              <Link href="/pricing" className="jl-price-btn">اشترك الآن</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Payment */}
      <div className="jl-reveal">
        <div className="jl-payment-note">
          <p>الدفع عبر تحويل بنكي أو STC Pay — أرسل الإيصال عبر واتساب واحصل على كود التفعيل خلال دقائق</p>
          <div className="jl-payment-methods">
            <span className="jl-payment-method">STC Bank</span>
            <span className="jl-payment-method">STC Pay</span>
            <span className="jl-payment-method">واتساب</span>
          </div>
        </div>
      </div>

      <div className="jl-divider" />

      {/* ════════ GUARANTEE ════════ */}
      <div className="jl-reveal">
        <section className="jl-guarantee">
          <div className="jl-guarantee-box">
            <span className="jl-guarantee-icon">🤲</span>
            <span>ابدأ بـ 7 أيام مجانية. إذا لم تلاحظ فرقا في طريقة قراءتك للقرآن — لا تكمل. بدون أي التزام.</span>
          </div>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ FINAL CTA ════════ */}
      <section className="jl-final-cta">
        <div className="jl-reveal"><h2 className="jl-final-verse">وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ</h2></div>
        <div className="jl-reveal"><p className="jl-final-text">لا يتغير النص. الذي يتغير هو القارئ.<br />ابدأ رحلتك — واكتشف من تكون حين تقرأ.</p></div>
        <div className="jl-reveal">
          <Link href="#pricing" className="jl-hero-cta-static">
            <span>ابدأ رحلتك مجانا</span>
            <span style={{ fontSize: "0.9rem" }}>&#8592;</span>
          </Link>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="jl-footer">
        <ul className="jl-footer-links">
          <li><Link href="/program">صمت</Link></li>
          <li><Link href="/reflection">تأمل</Link></li>
          <li><Link href="/progress">انعكاس</Link></li>
        </ul>
        <div className="jl-footer-center">تمعّن &copy; 2026</div>
        <div className="jl-footer-logo">تمعّن</div>
      </footer>
    </div>
  );
}
