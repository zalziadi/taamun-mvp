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

export default function Progress() {
  const done = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const today = 13;

  return (
    <section id="progress" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>رحلتك</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>تابع تقدمك</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>كل خلية مضيئة يوم عشته بوعي.</p>
      </Reveal>

      <Reveal delay={0.2}>
        <div style={{ padding: "clamp(20px, 4vw, 36px)", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(160,148,128,0.15)", borderRadius: 12, marginTop: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "clamp(4px, 1vw, 7px)", marginBottom: 28 }}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                style={{
                  aspectRatio: "1",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Amiri', serif",
                  fontSize: "clamp(12px, 1.5vw, 15px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  background: d === today ? "#2a2118" : done.includes(d) ? "#ede5d5" : "rgba(255,255,255,0.4)",
                  color: d === today ? "#f6f1e7" : done.includes(d) ? "#6b5d4a" : "#a09480",
                  border: d === today ? "1px solid #2a2118" : done.includes(d) ? "1px solid #d9cdb8" : "1px solid rgba(160,148,128,0.06)",
                  boxShadow: d === today ? "0 2px 10px rgba(42,33,24,0.15)" : "none",
                }}
                className="progress-day-node"
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
            {[["١٢", "يوم مكتمل"], ["٧", "أيام متتالية"], ["٤٣٪", "نسبة الإنجاز"]].map(([n, l], i) => (
              <div key={i} style={{ textAlign: "center", padding: 18, background: "rgba(255,255,255,0.4)", borderRadius: 8 }}>
                <div style={{ fontFamily: "'Amiri', serif", fontSize: 28, color: "#2a2118", fontWeight: 700, lineHeight: 1, marginBottom: 3 }}>{n}</div>
                <div style={{ fontSize: 12, color: "#a09480" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
