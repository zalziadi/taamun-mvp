import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "./track";

function toFriendlyError(raw) {
  if (raw === "unauthorized") return "سجّل دخولك للمتابعة";
  if (raw === "network") return "تعذر الاتصال — حاول مرة أخرى";
  return "حدث خطأ غير متوقع";
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctaState, setCtaState] = useState({ loading: false, success: "", error: "" });
  const ctaTimerRef = useRef(0);
  const rafRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        const next = window.scrollY > 50;
        setScrolled((prev) => (prev === next ? prev : next));
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      tickingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => window.clearTimeout(ctaTimerRef.current), []);

  const go = useCallback((id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const runCta = useCallback(
    (id) => {
      if (id === "pricing") track("pricing_cta_click", { source: "nav" });
      setCtaState({ loading: true, success: "", error: "" });
      window.clearTimeout(ctaTimerRef.current);
      requestAnimationFrame(() => {
        try {
          go(id);
          setCtaState({ loading: false, success: "تم", error: "" });
          ctaTimerRef.current = window.setTimeout(
            () => setCtaState({ loading: false, success: "", error: "" }),
            3000
          );
        } catch {
          setCtaState({ loading: false, success: "", error: toFriendlyError("generic") });
        }
      });
    },
    [go]
  );

  const links = [
    ["hero", "الرئيسية"],
    ["states", "الحالات"],
    ["journey", "الرحلة"],
    ["daily", "اليوم"],
    ["progress", "التقدم"],
    ["book", "الكتاب"],
    ["pricing", "اشتراك"],
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "12px 24px" : "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backdropFilter: "blur(20px) saturate(1.3)",
          background: scrolled ? "rgba(246,241,231,0.94)" : "rgba(246,241,231,0.8)",
          borderBottom: "1px solid rgba(160,148,128,0.08)",
          boxShadow: scrolled ? "0 2px 20px rgba(42,33,24,0.04)" : "none",
          transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          style={{ fontFamily: "'Amiri', serif", fontSize: 24, color: "#2a2118", fontWeight: 700, cursor: "pointer" }}
          onClick={() => go("hero")}
        >
          تمعُّن
        </div>

        <div className="nav-desktop" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {links.map(([id, label]) => (
            <span
              key={id}
              onClick={() => go(id)}
              className="nav-link"
              style={{ color: "#a09480", fontSize: 13.5, cursor: "pointer", transition: "color 0.3s", fontWeight: 400 }}
            >
              {label}
            </span>
          ))}
          <button
            onClick={() => {
              track("nav_pricing_click");
              go("pricing-full");
            }}
            style={{
              padding: "8px 18px",
              background: "transparent",
              color: "#6b5d4a",
              border: "1px solid #d9cdb8",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            ابدأ الآن
          </button>
          <button
            onClick={() => runCta("pricing-full")}
            disabled={ctaState.loading}
            style={{
              padding: "8px 22px",
              background: "#2a2118",
              color: "#f6f1e7",
              border: "none",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: ctaState.loading ? "not-allowed" : "pointer",
              fontFamily: "'Tajawal', sans-serif",
              letterSpacing: "0.02em",
              opacity: ctaState.loading ? 0.7 : 1,
              minWidth: 78,
            }}
          >
            {ctaState.loading ? "جارٍ..." : "ابدأ"}
          </button>
        </div>

        <button
          className="nav-mobile-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="فتح القائمة"
          aria-expanded={menuOpen}
          aria-controls="taamun-mobile-menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              display: "block",
              width: 20,
              height: 1.5,
              background: "#2a2118",
              transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
              transition: "0.3s",
            }}
          />
          <span
            style={{
              display: "block",
              width: 20,
              height: 1.5,
              background: "#2a2118",
              opacity: menuOpen ? 0 : 1,
              transition: "0.3s",
            }}
          />
          <span
            style={{
              display: "block",
              width: 20,
              height: 1.5,
              background: "#2a2118",
              transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
              transition: "0.3s",
            }}
          />
        </button>
      </nav>

      <div
        id="taamun-mobile-menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
          background: "rgba(246,241,231,0.97)",
          backdropFilter: "blur(24px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.4s ease",
        }}
      >
        {links.map(([id, label], i) => (
          <span
            key={id}
            onClick={() => go(id)}
            style={{
              fontFamily: "'Amiri', serif",
              fontSize: 24,
              color: "#2a2118",
              cursor: "pointer",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.06}s`,
            }}
          >
            {label}
          </span>
        ))}
        <button
          onClick={() => runCta("pricing")}
          disabled={ctaState.loading}
          style={{
            marginTop: 12,
            padding: "14px 48px",
            background: "#2a2118",
            color: "#f6f1e7",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 500,
            cursor: ctaState.loading ? "not-allowed" : "pointer",
            fontFamily: "'Tajawal', sans-serif",
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s cubic-bezier(0.22,1,0.36,1) 0.6s",
            minWidth: 142,
          }}
        >
          {ctaState.loading ? "جارٍ..." : "ابدأ الآن"}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
