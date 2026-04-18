import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System · Ta'ammun",
  description: "معاينة نظام تمعّن التصميمي — Ta\u2019ammun design tokens, typography, and component primitives.",
  robots: { index: false, follow: false },
};

/**
 * /design-system — ADDITIVE preview of the Ta'ammun design system.
 *
 * This page opts in to .theme-taamun scope. Existing pages are unaffected.
 * Safe to visit in production — excluded from search via `robots` metadata.
 */
export default function DesignSystemPreview() {
  return (
    <div className="theme-taamun min-h-screen" dir="rtl">
      <main
        style={{
          maxWidth: "var(--container-md)",
          margin: "0 auto",
          padding: "var(--s-16) var(--s-6)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">نظام التصميم · v1</div>
          <h1 className="display-2" style={{ marginTop: "var(--s-3)" }}>
            تمعّن · Ta&rsquo;ammun
          </h1>
          <p className="body-lg" style={{ color: "var(--fg-muted)", marginTop: "var(--s-4)" }}>
            دير رقمي بحس fintech سعودي. هذا المعاينة إضافية — لا تمس الصفحات الحية.
          </p>
        </div>

        {/* Colors */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">الألوان · Palette</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>الحبر والذهب</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--s-3)", marginTop: "var(--s-6)" }}>
            {[
              { name: "ink-900", token: "--ink-900", hex: "#0A0908" },
              { name: "ink-700", token: "--ink-700", hex: "#1C1916" },
              { name: "ink-500", token: "--ink-500", hex: "#3D3832" },
              { name: "ink-300", token: "--ink-300", hex: "#807A72" },
              { name: "ink-100", token: "--ink-100", hex: "#D6D1C8" },
            ].map((c) => (
              <div key={c.name} className="card" style={{ padding: "var(--s-4)" }}>
                <div style={{ height: 56, background: `var(${c.token})`, borderRadius: "var(--radius-sm)", border: "var(--hairline)" }} />
                <div className="caption" style={{ marginTop: "var(--s-3)" }}>{c.name}</div>
                <div className="num caption" style={{ color: "var(--fg-faint)" }}>{c.hex}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s-3)", marginTop: "var(--s-4)" }}>
            {[
              { name: "gold-600", token: "--gold-600", hex: "#8B7332" },
              { name: "gold-500", token: "--gold-500", hex: "#C9A84C" },
              { name: "gold-400", token: "--gold-400", hex: "#D9BC6B" },
              { name: "gold-300", token: "--gold-300", hex: "#E6CF92" },
            ].map((c) => (
              <div key={c.name} className="card" style={{ padding: "var(--s-4)" }}>
                <div style={{ height: 56, background: `var(${c.token})`, borderRadius: "var(--radius-sm)" }} />
                <div className="caption" style={{ marginTop: "var(--s-3)" }}>{c.name}</div>
                <div className="num caption" style={{ color: "var(--fg-faint)" }}>{c.hex}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s-3)", marginTop: "var(--s-4)" }}>
            {[
              { name: "sage (success)", token: "--sage-500", hex: "#6E7866" },
              { name: "copper (warning)", token: "--copper-500", hex: "#88685A" },
              { name: "sand (info)", token: "--sand-500", hex: "#7A7366" },
              { name: "ember (error)", token: "--ember-500", hex: "#8E5A52" },
            ].map((c) => (
              <div key={c.name} className="card" style={{ padding: "var(--s-4)" }}>
                <div style={{ height: 40, background: `var(${c.token})`, borderRadius: "var(--radius-sm)" }} />
                <div className="caption" style={{ marginTop: "var(--s-3)" }}>{c.name}</div>
                <div className="num caption" style={{ color: "var(--fg-faint)" }}>{c.hex}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Typography */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">الطباعة · Typography</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>حروف كلاسيكية لروح تأملية</h2>

          <div className="display-1" style={{ marginTop: "var(--s-8)" }}>Display 1 · ٨٤px</div>
          <div className="display-2" style={{ marginTop: "var(--s-6)" }}>Display 2 · ٦٤px</div>
          <h1 className="unstyled" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", color: "var(--fg-display)", marginTop: "var(--s-6)" }}>H1 · Amiri ٤٨px</h1>
          <h2 className="unstyled" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", color: "var(--fg-display)", marginTop: "var(--s-4)" }}>H2 · Amiri ٤٠px</h2>
          <h3 className="unstyled" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--fg-display)", marginTop: "var(--s-4)" }}>H3 · Amiri ٢٦px</h3>

          <p className="body-lg" style={{ marginTop: "var(--s-8)" }}>
            النص الأساسي Tajawal ١٩px بمسافة سطرية ١٫٦٥ — العربية تحتاج فسحةً أعمق من اللاتينية.
            الأرقام <span className="num">١٢٤٫٥٠</span> تظهر بخط Space Grotesk لدقة fintech.
          </p>
          <p className="body">النص العادي Tajawal ١٧px. تُودع وتسحب في هدوء.</p>
          <p className="body-sm">نص مكتوم Tajawal ١٥px — للتعليقات الجانبية.</p>
          <p className="caption">Caption ١٣px</p>

          <div className="verse" style={{ marginTop: "var(--s-8)", textAlign: "center" }}>
            وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
          </div>
          <div className="verse-attribution u-center">الذاريات · ٥٦</div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Buttons */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">الأزرار · Buttons</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>ثلاثة فقط — لا أكثر</h2>
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-6)", flexWrap: "wrap" }}>
            <button className="btn btn-primary">زر أساسي</button>
            <button className="btn btn-secondary">زر ثانوي</button>
            <button className="btn btn-ghost">زر شفاف</button>
            <button className="btn btn-primary" disabled>معطّل</button>
          </div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Cards */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">البطاقات · Cards</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>هدوء وخطوط رفيعة</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-4)", marginTop: "var(--s-6)" }}>
            <div className="card">
              <div className="eyebrow">بطاقة عادية</div>
              <h3 className="unstyled" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--fg-display)", margin: "var(--s-3) 0" }}>
                آية اليوم
              </h3>
              <p className="body-sm" style={{ margin: 0 }}>
                تأمّل اليوم في آية سبأ — السكون قبل المعنى.
              </p>
            </div>

            <div className="card card-active">
              <div className="eyebrow">بطاقة فعّالة · gold-inset</div>
              <h3 className="unstyled" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--fg-display)", margin: "var(--s-3) 0" }}>
                اليوم ٧
              </h3>
              <p className="body-sm" style={{ margin: 0 }}>
                ميلاد عادة — إشارة ذهبية واحدة لكل منظر.
              </p>
            </div>
          </div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Inputs */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">الحقول · Inputs</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>radius ٨px · ink-800 · تركيز ذهبي</h2>

          <div style={{ display: "grid", gap: "var(--s-4)", marginTop: "var(--s-6)", maxWidth: 480 }}>
            <input className="input" placeholder="بريدك الإلكتروني" />
            <textarea className="textarea" rows={3} placeholder="تأمّلك اليوم..." />
            <select className="select" defaultValue="">
              <option value="" disabled>اختر الدورة</option>
              <option>الدورة الأولى</option>
              <option>الدورة الثانية</option>
              <option>الدورة الثالثة</option>
            </select>
          </div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Badges */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">الشارات · Badges</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>إشارات هامسة لا تصرخ</h2>

          <div style={{ display: "flex", gap: "var(--s-2)", marginTop: "var(--s-6)", flexWrap: "wrap" }}>
            <span className="badge">حيادي</span>
            <span className="badge badge-gold">ذهبي · نشط</span>
            <span className="badge badge-sage">مكتمل</span>
            <span className="badge badge-copper">تنبيه</span>
            <span className="badge badge-sand">معلومة</span>
            <span className="badge badge-ember">خطأ</span>
          </div>
        </section>

        <hr className="hairline" style={{ marginBottom: "var(--s-16)" }} />

        {/* Spacing / radii / motion */}
        <section style={{ marginBottom: "var(--s-16)" }}>
          <div className="eyebrow">النظام · System</div>
          <h2 style={{ marginTop: "var(--s-3)" }}>المسافات والزوايا والحركة</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-4)", marginTop: "var(--s-6)" }}>
            <div className="card">
              <div className="eyebrow">Spacing · 4px grid</div>
              <div className="body-sm" style={{ marginTop: "var(--s-3)" }}>4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96</div>
            </div>
            <div className="card">
              <div className="eyebrow">Radii</div>
              <div className="body-sm" style={{ marginTop: "var(--s-3)" }}>btn ٦px · input ٨px · card ١٠px</div>
            </div>
            <div className="card">
              <div className="eyebrow">Motion</div>
              <div className="body-sm" style={{ marginTop: "var(--s-3)" }}>١٢٠ · ٢٠٠ · ٣٦٠ · ٦٠٠ ms · ease-out</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <hr className="hairline-gold" style={{ marginBottom: "var(--s-6)" }} />
        <p className="caption u-center" style={{ margin: 0 }}>
          Ta&rsquo;ammun Design System · معاينة إضافية · <span className="num">v1</span>
        </p>
      </main>
    </div>
  );
}
