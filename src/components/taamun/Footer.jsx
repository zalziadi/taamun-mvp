export default function Footer() {
  return (
    <footer style={{ textAlign: "center", padding: "44px 24px 28px", borderTop: "1px solid rgba(160,148,128,0.08)", marginTop: 52 }}>
      <div style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "#2a2118", marginBottom: 12 }}>تمعُّن</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 22, marginBottom: 18 }}>
        {["الرئيسية", "الخصوصية"].map((l) => (
          <span key={l} style={{ color: "#a09480", fontSize: 12.5, cursor: "pointer" }}>
            {l}
          </span>
        ))}
        <a href="https://wa.me/966553930885" style={{ color: "#a09480", fontSize: 12.5, textDecoration: "none" }}>
          واتساب الدعم
        </a>
      </div>
      <p style={{ fontSize: 11.5, color: "#a09480", opacity: 0.45 }}>© ١٤٤٧ هـ — تمعُّن · مبني على روح مدينة المعنى</p>
    </footer>
  );
}
