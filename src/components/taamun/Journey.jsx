import useReveal from "./hooks/useReveal";

const sMarker = { fontSize: 11, color: "#c4a265", letterSpacing: 4, marginBottom: 14, fontWeight: 500 };
const sTitle = { fontFamily: "'Amiri', serif", fontSize: "clamp(26px, 4vw, 38px)", color: "#2a2118", fontWeight: 700, marginBottom: 14, lineHeight: 1.35 };
const sLead = { fontSize: 15, color: "#a09480", maxWidth: 500, lineHeight: 2, marginBottom: 44, fontWeight: 300 };
const jCard = {
  padding: 28,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(160,148,128,0.15)",
  borderRadius: 10,
  transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
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

export default function Journey() {
  const weeks = [
    { label: "الأسبوع الأول", name: "التنقية", days: "اليوم ١ — ٧", desc: "تطهير الحواس والنية. تمارين الصمت الواعي. هنا تبدأ المراقبة: أن ترى ما فيك دون أن تهرب." },
    { label: "الأسبوع الثاني", name: "التدبّر", days: "اليوم ٨ — ١٤", desc: "كل يوم آية واحدة تعيش معها. ليست المسألة أن تختم القرآن، بل أن تسمح لآية واحدة أن تغيّرك." },
    { label: "الأسبوع الثالث", name: "الاتصال", days: "اليوم ١٥ — ٢١", desc: "بناء جسر بين القلب والروح. هنا يأتي الإدراك: لحظة صافية ترى فيها الحقيقة دون جهد." },
    { label: "الأسبوع الرابع", name: "التجلّي", days: "اليوم ٢٢ — ٢٨", desc: "حصاد الرحلة. التمعُّن: أن تبقى مع المعنى حتى يصبح حالة تعيش منها لا فكرة تزورها." },
  ];

  return (
    <section id="journey" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>الأسابيع الأربعة</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>رحلة من الظل إلى النور</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>كل أسبوع يمثّل مرحلة في تصاعد الوعي.</p>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 36 }}>
        {weeks.map((w, i) => (
          <Reveal key={i} delay={0.2 + i * 0.08}>
            <div className="journey-hover-card" style={jCard}>
              <div style={{ fontSize: 10, color: "#c4a265", letterSpacing: 2, marginBottom: 8, fontWeight: 500 }}>{w.label}</div>
              <h3 style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: "#2a2118", marginBottom: 4 }}>{w.name}</h3>
              <div style={{ fontSize: 12, color: "#a09480", marginBottom: 10 }}>{w.days}</div>
              <p style={{ fontSize: 13.5, color: "#a09480", lineHeight: 1.85, fontWeight: 300 }}>{w.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
