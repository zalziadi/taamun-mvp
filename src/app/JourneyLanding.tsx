import Link from "next/link";
import "./JourneyLanding.css";
import { LandingEffects } from "./LandingEffects";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * JourneyLanding — Server Component.
 * All content is static HTML rendered on the server (instant LCP).
 * LandingEffects client island adds scroll animations after hydration.
 */

const STEPS = [
  { num: "١", name: "لحظة صمت", time: "الاستعداد", desc: "تبدأ بما يحدث داخلك الآن، لا بما يجب أن تشعر به. الشاشة فارغة — فقط سؤال واحد: ماذا يحدث في داخلي الآن؟", hasLine: true },
  { num: "٢", name: "آية واحدة", time: "الاستقبال", desc: "آية بسيطة وواضحة، بلا تشتيت أو كثرة. ليست المسألة أن تقرأ كثيرا، بل أن تقرأ بوعي.", hasLine: true },
  { num: "٣", name: "سؤال مرآوي", time: "الانكشاف", desc: "ليس فقط ما معنى الآية، بل ماذا تكشف عنك؟ السؤال الذي يحوّل النص من معلومة إلى مرآة.", hasLine: true },
  { num: "٤", name: "كتابة شخصية", time: "الحوار", desc: "مساحة صادقة بينك وبين الآية. تدوّن ما شعرت به وما لاحظته — الصدق مع النفس أهم من الكمال.", hasLine: true },
  { num: "٥", name: "ملاحظة الحالة", time: "الانعكاس", desc: "ترى حركتك بين الظل والهدية وأفضل احتمال — ليس تقييما، بل وعيا بالمسار.", hasLine: false },
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
        <Link href="/auth" className="jl-header-cta">ابدأ ٧ أيام مجاناً</Link>
        <span className="jl-logo" aria-label="تمعّن">
          <BrandLogo variant="mark" size={44} />
        </span>
      </header>

      {/* ════════ HERO ════════ */}
      <section className="jl-hero">
        <span className="jl-hero-badge">رحلة تأمل قرآنية من ٢٨ يوم</span>
        <h1 className="jl-hero-title">اقرأ آية واحدة<br />كأنها تحدث فيك الآن.</h1>
        <p className="jl-hero-subtitle">تمعّن رحلة ٢٨ يوم تعيد علاقتك بالقرآن من القراءة إلى التجربة.<br />كل يوم: لحظة صمت، آية واحدة، سؤال مرآوي، كتابة شخصية، وملاحظة لما يتحرك داخلك.</p>
        <div className="jl-hero-actions">
          <Link href="/auth" className="jl-hero-cta">
            <span>ابدأ ٧ أيام مجاناً</span>
            <span style={{ fontSize: "0.9rem" }}>&#8592;</span>
          </Link>
          <Link href="#daily" className="jl-hero-cta-secondary">
            <span>شاهد كيف تعمل الرحلة</span>
          </Link>
        </div>
        <p className="jl-hero-note">بدون بطاقة دفع. بدون توبيخ. إذا غبت، تعود من حيث أنت.</p>
      </section>

      <div className="jl-divider" />

      {/* ════════ THE PROBLEM ════════ */}
      <div className="jl-reveal">
        <section className="jl-problem">
          <span className="jl-section-label">المشكلة</span>
          <p className="jl-problem-quote">&laquo;أحياناً نقرأ كثيراً… ولا يتحرك شيء.&raquo;</p>
          <p className="jl-problem-text">قد تقرأ، تحفظ، تسمع، وتفهم. ومع ذلك تشعر أن الآية لم تصبح تجربة داخلك.<br />ليست المشكلة في النص. المشكلة غالباً في <strong>الموضع الذي تقرأ منه</strong>.<br />تمعّن لا يزيد عليك واجباً جديداً. هو يبطئ اللحظة حتى ترى ما يحدث فيك أمام الآية.</p>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ 3 TRANSFORMATION PHASES ════════ */}
      <section className="jl-phases">
        <div className="jl-reveal"><span className="jl-section-label">الرحلة</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">٢٨ يوم عبر ثلاث بوابات</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">كل بوابة طبقة من التمعّن. تعبرها بهدوء، خطوة كل يوم.</p></div>

        <div className="jl-phases-track">
          <div className="jl-reveal">
            <div className="jl-phase-card">
              <span className="jl-phase-num">١</span><span className="jl-phase-icon">🌑</span>
              <h3 className="jl-phase-name">الظل</h3>
              <span className="jl-phase-en">The Shadow — Observation</span>
              <p className="jl-phase-body">أن ترى ما يحدث فيك دون أن تهرب أو تحكم. الظل ليس خطأ أخلاقياً ولا ضعف إيمان — الظل يختفي حين يُرى.</p>
              <p className="jl-phase-question">&laquo;ماذا يحدث في داخلي الآن؟&raquo;</p>
            </div>
          </div>
          <div className="jl-phase-arrow">&#8594;</div>
          <div className="jl-reveal">
            <div className="jl-phase-card">
              <span className="jl-phase-num">٢</span><span className="jl-phase-icon">&#10022;</span>
              <h3 className="jl-phase-name">الهدية</h3>
              <span className="jl-phase-en">The Gift — Awareness</span>
              <p className="jl-phase-body">أن يبدأ المعنى في الانكشاف كوعي لا كمعلومة. لا يمكن التخطيط لها، لكن يمكن خلق بيئة تحدث فيها.</p>
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
      <section className="jl-daily" id="daily">
        <div className="jl-reveal"><span className="jl-section-label">كيف يعمل اليوم الواحد</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">خمس خطوات هادئة كل يوم</h2></div>
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
          <p className="jl-different-quote">&laquo;تمعّن ليس تطبيق قراءة. هو مساحة عودة.&raquo;</p>
          <ul className="jl-different-list">
            <li>لا يوبّخك إذا انقطعت.</li>
            <li>لا يعيدك من البداية إذا غبت.</li>
            <li>لا يطلب منك أن تكون مثالياً.</li>
            <li>لا يشرح الآية فقط، بل يعيدك إلى تجربتك معها.</li>
          </ul>
          <p className="jl-problem-text">إذا غبت — نقول: <strong>&laquo;أنت عدت. هذا يكفي. استمر من هنا.&raquo;</strong></p>
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

      {/* ════════ OFFER PATH ════════ */}
      <section className="jl-pricing" id="pricing">
        <div className="jl-reveal"><span className="jl-section-label">العرض</span></div>
        <div className="jl-reveal"><h2 className="jl-section-title">ابدأ بسيطاً. ثم عمّق الرحلة عندما تكون جاهزاً.</h2></div>
        <div className="jl-reveal"><p className="jl-section-desc">أربع مراحل تصعد بهدوء — لا خيارات متنافسة، بل مسار واحد.</p></div>

        <div className="jl-pricing-grid">
          <div className="jl-reveal">
            <div className="jl-price-card">
              <span className="jl-path-step">المرحلة ١</span>
              <h3 className="jl-price-name">٧ أيام مجانية</h3>
              <p className="jl-price-period">جرّب بوابة الصمت</p>
              <div className="jl-price-amount">0 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">بدون بطاقة دفع</p>
              <ul className="jl-price-features"><li>بوابة الصمت والتمعّن</li><li>الدفتر الشخصي</li><li>٧ أيام كاملة بدون التزام</li></ul>
              <Link href="/auth" className="jl-price-btn">ابدأ ٧ أيام مجاناً</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card featured">
              <div className="jl-price-badge">الأكثر اختياراً</div>
              <span className="jl-path-step">المرحلة ٢</span>
              <h3 className="jl-price-name">رحلة ٢٨ يوم</h3>
              <p className="jl-price-period">من القراءة إلى التجربة</p>
              <div className="jl-price-amount">199 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">المسار اليومي الكامل</p>
              <ul className="jl-price-features"><li>المسار اليومي عبر الثلاث بوابات</li><li>مرشد تمعّن</li><li>تحليلات الرحلة</li><li>الدفتر الشخصي الكامل</li></ul>
              <Link href="/pricing" className="jl-price-btn">اشترك في الرحلة</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card">
              <span className="jl-path-step">المرحلة ٣</span>
              <h3 className="jl-price-name">المدينة</h3>
              <p className="jl-price-period">بعد الرحلة</p>
              <div className="jl-price-amount">699 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">٥٨ ر.س / شهر — سنوي</p>
              <ul className="jl-price-features"><li>كل يوم: آية، سؤال، مساحة كتابة</li><li>تحديات أسبوعية</li><li>أولوية في الدعم</li><li>محتوى إضافي حصري</li></ul>
              <Link href="/pricing" className="jl-price-btn">اسكن المدينة</Link>
            </div>
          </div>
          <div className="jl-reveal">
            <div className="jl-price-card">
              <span className="jl-path-step">المرحلة ٤</span>
              <h3 className="jl-price-name">VIP</h3>
              <p className="jl-price-period">للجادين في رحلة أعمق</p>
              <div className="jl-price-amount">4,999 <small style={{ fontSize: "0.7rem" }}>ر.س</small></div>
              <p className="jl-price-unit">دعم مباشر وجلسات خاصة</p>
              <ul className="jl-price-features"><li>جميع مميزات المدينة</li><li>جلسات تمعّن خاصة</li><li>دعم مباشر ومخصص</li><li>مجتمع VIP حصري</li></ul>
              <Link href="/pricing" className="jl-price-btn">انضم لـ VIP</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Payment */}
      <div className="jl-reveal">
        <div className="jl-payment-note">
          <p>الدفع عبر تحويل بنكي أو STC Pay — أرسل الإيصال عبر واتساب واحصل على كود التفعيل خلال دقائق</p>
          <div className="jl-payment-methods">
            <Link href="/pricing" className="jl-payment-method">STC Bank</Link>
            <Link href="/pricing" className="jl-payment-method">STC Pay</Link>
            <a href="https://wa.me/966553930885?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%AA%D9%85%D8%B9%D9%91%D9%86" target="_blank" rel="noopener noreferrer" className="jl-payment-method">واتساب</a>
          </div>
        </div>
      </div>

      <div className="jl-divider" />

      {/* ════════ GUARANTEE ════════ */}
      <div className="jl-reveal">
        <section className="jl-guarantee">
          <div className="jl-guarantee-box">
            <span className="jl-guarantee-icon">🤲</span>
            <span>ابدأ بـ ٧ أيام مجانية. إذا لم تلاحظ فرقاً في طريقة قراءتك للقرآن — لا تكمل. بدون بطاقة دفع وبدون التزام.</span>
          </div>
        </section>
      </div>

      <div className="jl-divider" />

      {/* ════════ FINAL CTA ════════ */}
      <section className="jl-final-cta">
        <div className="jl-reveal"><h2 className="jl-final-verse">وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ</h2></div>
        <div className="jl-reveal"><p className="jl-final-text">لا يتغير النص. الذي يتغير هو المكان الذي تقرأ منه.<br />خذ أول خطوة بهدوء. آية واحدة تكفي.</p></div>
        <div className="jl-reveal">
          <Link href="/auth" className="jl-hero-cta-static">
            <span>ابدأ ٧ أيام مجاناً</span>
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
        <div className="jl-footer-center">&copy; 2026</div>
        <div className="jl-footer-logo" aria-label="تمعّن">
          <BrandLogo variant="mark" size={40} />
        </div>
      </footer>
    </div>
  );
}
