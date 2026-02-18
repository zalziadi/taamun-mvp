import useReveal from "./hooks/useReveal";
import { APP_NAME } from "@/lib/appConfig";

const sMarker = { fontSize: 11, color: "#c4a265", letterSpacing: 4, marginBottom: 14, fontWeight: 500 };
const sTitle = { fontFamily: "'Amiri', serif", fontSize: "clamp(26px, 4vw, 38px)", color: "#2a2118", fontWeight: 700, marginBottom: 14, lineHeight: 1.35 };
const sLead = { fontSize: 15, color: "#a09480", maxWidth: 500, lineHeight: 2, marginBottom: 44, fontWeight: 300 };

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Book() {
  const chapters = [
    "القرآن كنظام انتقال في الوعي",
    "حالات الوعي الثلاث",
    "كيف نقرأ آية بوصفها تجربة",
    `المراقبة، الإدراك، ${APP_NAME}`,
    "الفاتحة: خريطة الوعي",
    "الصلاة: إعادة ضبط الوعي",
    "الهوية بلغة القرآن",
    "العلاقات: من نحتاج ومن نلتقي",
    "التوسع: النمو أم الهروب",
    "البناء: الالتزام كطمأنينة",
    "الجمال والسفر",
    "العائلة والمسؤولية",
    "التفكر والروح",
    "المال والقوة",
    "العطاء: اكتمال الدائرة",
  ];

  return (
    <section id="book" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>المرجع</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>مدينة المعنى: بلغة القرآن</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>ليس تفسيراً، ولا وعظاً — بل رحلة من القراءة الآلية إلى القراءة الحيّة.</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div style={{ marginTop: 44, padding: "clamp(28px, 5vw, 48px)", background: "#2a2118", borderRadius: 14, color: "#f6f1e7", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 280, height: 280, background: "radial-gradient(circle, rgba(196,162,101,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div className="book-header" style={{ display: "flex", gap: "clamp(20px, 4vw, 36px)", alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap" }}>
            <div
              style={{
                minWidth: 120,
                width: 120,
                height: 164,
                borderRadius: 5,
                background: "linear-gradient(135deg, #3d3226, #2a2118)",
                border: "1px solid rgba(196,162,101,0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "16px 10px",
                position: "relative",
                boxShadow: "4px 4px 18px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, background: "#a08850", borderRadius: "0 2px 2px 0" }} />
              <div style={{ fontFamily: "'Amiri', serif", fontSize: 15, color: "#c4a265", lineHeight: 1.4, marginBottom: 6 }}>
                مدينة
                <br />
                المعنى
              </div>
              <div style={{ fontSize: 9, color: "rgba(196,162,101,0.5)", letterSpacing: 1 }}>بلغة القرآن</div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontFamily: "'Amiri', serif", fontSize: "clamp(20px, 3vw, 26px)", color: "#f6f1e7", marginBottom: 10, lineHeight: 1.35 }}>
                من الآية كنص... إلى الآية كمرآة
              </h3>
              <p style={{ fontSize: 14, color: "rgba(246,241,231,0.5)", lineHeight: 2, fontWeight: 300, marginBottom: 20 }}>
                يعيد ترتيب علاقتك بالقرآن من الداخل إلى الخارج، ومن الفهم إلى العيش. إذا كنت تقرأ القرآن وتشعر أن شيئاً ما لم يكتمل بعد... فهذا الكتاب كتب لك.
              </p>
              <div
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: 15,
                  fontStyle: "italic",
                  color: "rgba(196,162,101,0.5)",
                  lineHeight: 1.9,
                  paddingRight: 18,
                  borderRight: "2px solid rgba(196,162,101,0.18)",
                }}
              >
                «حين تقرأ آية بصدق، لا تكشف لك فقط ما تقوله الآية... بل تكشف لك أيضاً من أنت حين تسمعها.»
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px 20px", paddingTop: 24, borderTop: "1px solid rgba(246,241,231,0.05)" }}>
            {chapters.map((ch, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  padding: "7px 0",
                  fontSize: 12.5,
                  color: "rgba(246,241,231,0.35)",
                  fontWeight: 300,
                  transition: "color 0.3s",
                  cursor: "default",
                }}
                className="book-chapter-row"
              >
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 13, color: "rgba(196,162,101,0.3)", minWidth: 22 }}>{i < 15 ? i + 1 : "✦"}</span>
                {ch}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "7px 0", fontSize: 12.5, color: "rgba(246,241,231,0.35)", fontWeight: 300 }}>
              <span style={{ fontFamily: "'Amiri', serif", fontSize: 13, color: "rgba(196,162,101,0.3)", minWidth: 22 }}>✦</span>
              القرآن كمدينة تسكن
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
