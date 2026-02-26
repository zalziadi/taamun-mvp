import useReveal from "./hooks/useReveal";

const sMarker = { fontSize: 11, color: "#c4a265", letterSpacing: 4, marginBottom: 14, fontWeight: 500 };
const sTitle = {
  fontFamily: "'Amiri', serif",
  fontSize: "clamp(26px, 4vw, 38px)",
  color: "#2a2118",
  fontWeight: 700,
  marginBottom: 14,
  lineHeight: 1.35,
};

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

export default function Account() {
  return (
    <section id="account" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>حسابي</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>مساحتك</h2>
      </Reveal>

      <Reveal delay={0.15}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginBottom: 32,
            marginTop: 28,
            padding: 28,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(160,148,128,0.15)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#2a2118",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Amiri', serif",
              fontSize: 22,
              color: "#f6f1e7",
              fontWeight: 700,
            }}
          >
            ز
          </div>
          <div>
            <h3 style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: "#2a2118", marginBottom: 2 }}>
              مرحباً بك في تمعُّن
            </h3>
            <p style={{ fontSize: 12.5, color: "#a09480" }}>متمعّن منذ رمضان ١٤٤٧</p>
            <div
              style={{
                display: "inline-block",
                marginTop: 5,
                padding: "3px 10px",
                borderRadius: 4,
                background: "#ede5d5",
                fontSize: 11,
                color: "#6b5d4a",
                fontWeight: 500,
              }}
            >
              ٧ أيام متتالية
            </div>
          </div>
        </div>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <Reveal delay={0.2}>
          <div style={{ padding: 22, borderRadius: 8, border: "1px solid rgba(160,148,128,0.15)", background: "rgba(255,255,255,0.55)" }}>
            <h4 style={{ fontSize: 13, color: "#2a2118", marginBottom: 14, fontWeight: 500 }}>التذكيرات</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>تذكير الفجر</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>مفعل</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>لحظة الحضور</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>مفعل</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 12.5, color: "#a09480" }}>
              <span>تذكير المساء</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>غير مفعل</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div style={{ padding: 22, borderRadius: 8, border: "1px solid rgba(160,148,128,0.15)", background: "rgba(255,255,255,0.55)" }}>
            <h4 style={{ fontSize: 13, color: "#2a2118", marginBottom: 14, fontWeight: 500 }}>الإحصائيات</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>أطول سلسلة</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>١٢ يوم</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>إجمالي التأملات</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>٤٨</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 12.5, color: "#a09480" }}>
              <span>الباقة</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>رحلة التمعُّن ✦</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div style={{ padding: 22, borderRadius: 8, border: "1px solid rgba(160,148,128,0.15)", background: "rgba(255,255,255,0.55)" }}>
            <h4 style={{ fontSize: 13, color: "#2a2118", marginBottom: 14, fontWeight: 500 }}>المظهر</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>اللغة</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>العربية</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 12.5, color: "#a09480" }}>
              <span>حجم الخط</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>متوسط</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.35}>
          <div style={{ padding: 22, borderRadius: 8, border: "1px solid rgba(160,148,128,0.15)", background: "rgba(255,255,255,0.55)" }}>
            <h4 style={{ fontSize: 13, color: "#2a2118", marginBottom: 14, fontWeight: 500 }}>الدعم</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>واتساب</span>
              <a href="https://wa.me/966553930885" style={{ color: "#2a2118", textDecoration: "none", fontWeight: 500 }}>
                تواصل ←
              </a>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(160,148,128,0.05)", fontSize: 12.5, color: "#a09480" }}>
              <span>الخصوصية</span>
              <span style={{ color: "#2a2118", fontWeight: 500 }}>اقرأ ←</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 12.5, color: "#a09480" }}>
              <span>خروج</span>
              <span style={{ color: "#b44", cursor: "pointer", fontWeight: 500 }}>تسجيل الخروج</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
