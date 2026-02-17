import useReveal from "./hooks/useReveal";

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

export default function Daily() {
  const steps = [
    { time: "قبل الفجر", title: "نية اليوم", desc: "اسأل نفسك: ماذا يحدث في داخلي الآن؟ اقرأ آية اليوم. اكتب نيتك في جملة واحدة." },
    { time: "بعد الظهر", title: "لحظة الحضور", desc: "توقّف. لاحظ الغضب دون أن تحاول أن تكون هادئاً. لاحظ الخوف دون أن تحاول أن تكون شجاعاً. فقط لاحظ." },
    { time: "بعد التراويح", title: "تمرين التدبّر", desc: "لم يعد السؤال: ما معنى الآية؟ بل: ماذا يحدث داخلي عندما أقرأ هذه الآية؟" },
    { time: "قبل النوم", title: "الختم والشكر", desc: "سجّل ملاحظة واحدة: ما الذي بقي من الآية في حياتك بعد أن أغلقت المصحف؟" },
  ];

  return (
    <section id="daily" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>الطقس اليومي</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>كيف يبدو يومك التأملي؟</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>كل يوم مصمّم كمسار انتقال: ملاحظة، إدراك، تمعُّن.</p>
      </Reveal>

      <div style={{ marginTop: 36 }}>
        {steps.map((s, i) => (
          <Reveal key={i} delay={0.15 + i * 0.08}>
            <div
              style={{
                display: "flex",
                gap: 22,
                alignItems: "flex-start",
                padding: "24px 0",
                borderBottom: i < steps.length - 1 ? "1px solid rgba(160,148,128,0.07)" : "none",
                transition: "padding 0.3s",
              }}
            >
              <div style={{ minWidth: 72, fontSize: 11, color: "#c4a265", fontWeight: 500, paddingTop: 3 }}>{s.time}</div>
              <div>
                <h3 style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "#2a2118", marginBottom: 5 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: "#a09480", lineHeight: 1.85, fontWeight: 300 }}>{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
