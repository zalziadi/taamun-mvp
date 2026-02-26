import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import useReveal from "./hooks/useReveal";
import { track } from "./track";

const btnInk = {
  padding: "14px 38px",
  background: "#2a2118",
  color: "#f6f1e7",
  border: "none",
  borderRadius: 6,
  fontFamily: "'Tajawal', sans-serif",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.4s",
  letterSpacing: "0.02em",
};

const btnGhost = {
  padding: "14px 38px",
  background: "transparent",
  color: "#6b5d4a",
  border: "1px solid #d9cdb8",
  borderRadius: 6,
  fontFamily: "'Tajawal', sans-serif",
  fontSize: 15,
  fontWeight: 400,
  cursor: "pointer",
  transition: "all 0.4s",
};

const sMarker = { fontSize: 11, color: "#c4a265", letterSpacing: 4, marginBottom: 14, fontWeight: 500 };
const sTitle = { fontFamily: "'Amiri', serif", fontSize: "clamp(26px, 4vw, 38px)", color: "#2a2118", fontWeight: 700, marginBottom: 14, lineHeight: 1.35 };
const sLead = { fontSize: 15, color: "#a09480", maxWidth: 500, lineHeight: 2, marginBottom: 44, fontWeight: 300 };
const priceCardBase = {
  padding: "36px 28px",
  borderRadius: 10,
  border: "1px solid rgba(160,148,128,0.15)",
  background: "rgba(255,255,255,0.55)",
  transition: "all 0.5s",
};
const priceTag = {
  display: "inline-block",
  padding: "3px 12px",
  borderRadius: 4,
  background: "rgba(0,0,0,0.025)",
  fontSize: 10,
  color: "#a09480",
  marginBottom: 18,
  fontWeight: 500,
  letterSpacing: 1,
};
const priceFeature = {
  padding: "7px 0",
  fontSize: 13.5,
  color: "#a09480",
  fontWeight: 300,
  borderBottom: "1px solid rgba(160,148,128,0.05)",
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

export default function Pricing() {
  const router = useRouter();
  const [freeLoading, setFreeLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);

  const runPricingAction = useCallback((type) => {
    track("pricing_cta_click", { type });
    if (type === "free") {
      setFreeLoading(true);
      router.push("/activate");
      return;
    }
    setPaidLoading(true);
    router.push("/subscribe?reason=pricing");
  }, [router]);

  return (
    <section id="pricing" style={{ padding: "72px 24px", maxWidth: 840, margin: "0 auto" }}>
      <Reveal>
        <p style={sMarker}>المسار</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 style={sTitle}>اختر طريقك</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={sLead}>ما تحتاجه فقط هو الصدق مع نفسك.</p>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 44 }}>
        <Reveal delay={0.2} className="trial-plan-reveal">
          <div style={priceCardBase}>
            <div style={priceTag}>مجاني</div>
            <h3 style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "#2a2118", marginBottom: 6 }}>المسار الأساسي</h3>
            <div style={{ fontFamily: "'Amiri', serif", fontSize: 40, color: "#2a2118", fontWeight: 700, lineHeight: 1, marginBottom: 14 }}>
              ٠ <span style={{ fontSize: 15, color: "#a09480", fontWeight: 400 }}>ر.س</span>
            </div>
            {["آية اليوم وسؤال التأمل", "تمرين المراقبة اليومي", "متابعة التقدم", "دعاء المساء"].map((f, i) => (
              <div key={i} style={priceFeature}>
                {f}
              </div>
            ))}
            <button
              style={{
                ...btnGhost,
                width: "100%",
                marginTop: 8,
                opacity: freeLoading ? 0.7 : 1,
                cursor: freeLoading ? "not-allowed" : "pointer",
              }}
              disabled={freeLoading}
              onClick={() => runPricingAction("free")}
            >
              {freeLoading ? "جارٍ..." : "ابدأ مجاناً"}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.3} className="full-plan-reveal">
          <div id="pricing-full" style={{ ...priceCardBase, borderColor: "rgba(42,33,24,0.16)", background: "rgba(255,255,255,0.75)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, right: 0, left: 0, height: 2, background: "#2a2118", borderRadius: "10px 10px 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <div style={{ ...priceTag, marginBottom: 0 }}>✦ المسار الكامل</div>
              <span style={{ fontSize: 10, color: "#6b5d4a", border: "1px solid rgba(160,148,128,0.25)", borderRadius: 4, padding: "2px 8px" }}>الأنسب لرمضان</span>
            </div>
            <h3 style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "#2a2118", marginBottom: 6 }}>رحلة التمعُّن</h3>
            <div style={{ fontFamily: "'Amiri', serif", fontSize: 40, color: "#2a2118", fontWeight: 700, lineHeight: 1, marginBottom: 14 }}>
              ٤٩ <span style={{ fontSize: 15, color: "#a09480", fontWeight: 400 }}>ر.س</span>
            </div>
            {["كل مزايا المسار الأساسي", "تمارين الإدراك المتقدمة", "مقاطع صوتية تأملية", "دفتر التأمل الرقمي", "فصول من مدينة المعنى"].map((f, i) => (
              <div key={i} style={priceFeature}>
                {f}
              </div>
            ))}
            <button
              style={{
                ...btnInk,
                width: "100%",
                marginTop: 8,
                opacity: paidLoading ? 0.7 : 1,
                cursor: paidLoading ? "not-allowed" : "pointer",
              }}
              disabled={paidLoading}
              onClick={() => runPricingAction("paid")}
            >
              {paidLoading ? "جارٍ..." : "اشترك الآن"}
            </button>
          </div>
        </Reveal>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .full-plan-reveal { order: -1; }
        }
      `}</style>
    </section>
  );
}
