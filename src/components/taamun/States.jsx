import useReveal from "./hooks/useReveal";

const sMarker = { fontSize: 11, color: "#c4a265", letterSpacing: 4, marginBottom: 14, fontWeight: 500 };
const sTitle = { fontFamily: "'Amiri', serif", fontSize: "clamp(26px, 4vw, 38px)", color: "#2a2118", fontWeight: 700, marginBottom: 14, lineHeight: 1.35 };
const sLead = { fontSize: 15, color: "#a09480", maxWidth: 500, lineHeight: 2, marginBottom: 44, fontWeight: 300 };
const stateCard = {
  padding: "36px 24px",
  background: "rgba(255,255,255,0.55)",
  textAlign: "center",
  transition: "all 0.5s",
  cursor: "default",
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

export default function States() {
  const states = [
    { num: "١", word: "المراقبة", name: "الظل", desc: "أن تعيش من داخل أفكارك ومشاعرك دون أن تراها. الظل يختفي حين يُرى." },
    { num: "٢", word: "الإدراك", name: "الهدية", desc: "لحظة تقول فيها: كنت أعيش من خوف لا من حقيقة. انكشاف داخلي مفاجئ." },
    { num: "٣", word: "التمعُّن", name: "أفضل احتمال", desc: "أن يصبح الوعي الذي لمسته في لحظة الإدراك... طبيعتك اليومية." },
  ];

  return (
    <section id="states" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>المراقبة · الإدراك · التمعُّن</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>حالات الوعي الثلاث</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>لا أحد يبقى دائماً في أفضل احتمال. ولا أحد يبقى دائماً في الظل. نحن جميعاً نتحرك بين هذه الحالات.</p>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2, marginTop: 44, borderRadius: 10, overflow: "hidden" }}>
        {states.map((s, i) => (
          <Reveal key={i} delay={0.2 + i * 0.1}>
            <div className="state-hover-card" style={stateCard}>
              <div style={{ fontFamily: "'Amiri', serif", fontSize: 36, color: "#d9cdb8", fontWeight: 700, lineHeight: 1, marginBottom: 14 }}>{s.num}</div>
              <div style={{ fontSize: 10, color: "#c4a265", letterSpacing: 2, marginBottom: 10, fontWeight: 500 }}>{s.word}</div>
              <div style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: "#2a2118", marginBottom: 8 }}>{s.name}</div>
              <p style={{ fontSize: 13.5, color: "#a09480", lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
