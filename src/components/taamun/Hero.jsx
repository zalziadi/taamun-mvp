import { useCallback, useEffect, useRef, useState } from "react";
import useParallax from "./hooks/useParallax";
import { track } from "./track";
import { APP_NAME, APP_SLUG } from "@/lib/appConfig";

const HERO_IMAGE_SRC = `/images/${APP_SLUG}-hero.jpg`;

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

function toFriendlyError(raw) {
  if (raw === "unauthorized") return "سجّل دخولك للمتابعة";
  if (raw === "network") return "تعذر الاتصال — حاول مرة أخرى";
  return "حدث خطأ غير متوقع";
}

export default function Hero() {
  const parallax = useParallax(0.15);
  const [loaded, setLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [ctaState, setCtaState] = useState({ loading: false, success: "", error: "" });
  const ctaTimerRef = useRef(0);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => () => window.clearTimeout(ctaTimerRef.current), []);

  const stagger = (d) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(22px)",
    transition: `all 1.2s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  });

  const runCta = useCallback((target) => {
    if (target === "states") track("hero_cta_click");
    setCtaState({ loading: true, success: "", error: "" });
    requestAnimationFrame(() => {
      try {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
        setCtaState({ loading: false, success: "تم", error: "" });
        window.clearTimeout(ctaTimerRef.current);
        ctaTimerRef.current = window.setTimeout(
          () => setCtaState({ loading: false, success: "", error: "" }),
          3000
        );
      } catch {
        setCtaState({ loading: false, success: "", error: toFriendlyError("generic") });
      }
    });
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "100px 24px 80px",
        position: "relative",
      }}
    >
      <div
        style={{
          ...stagger(0.1),
          width: 220,
          height: 220,
          marginBottom: 0,
          position: "relative",
          transform: loaded ? `translateY(${parallax * -0.3}px)` : "translateY(22px)",
        }}
      >
        {imageFailed ? (
          <div
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "rgba(42,33,24,0.08)",
              WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 72%)",
              maskImage: "radial-gradient(circle, black 40%, transparent 72%)",
              animation: "heroBreath 8s ease-in-out infinite",
            }}
          />
        ) : (
          <img
            src={HERO_IMAGE_SRC}
            alt={APP_NAME}
            loading="eager"
            decoding="async"
            onError={() => setImageFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
              WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 72%)",
              maskImage: "radial-gradient(circle, black 40%, transparent 72%)",
              animation: "heroBreath 8s ease-in-out infinite",
            }}
          />
        )}
      </div>

      <h1
        style={{
          ...stagger(0.3),
          fontFamily: "'Amiri', serif",
          fontSize: "clamp(50px, 8vw, 82px)",
          fontWeight: 700,
          color: "#2a2118",
          lineHeight: 1,
          marginTop: -36,
          position: "relative",
          zIndex: 2,
          letterSpacing: "-0.02em",
        }}
      >
        {APP_NAME}
      </h1>

      <p
        style={{
          ...stagger(0.45),
          fontFamily: "'Amiri', serif",
          fontSize: "clamp(17px, 2.3vw, 21px)",
          color: "#6b5d4a",
          fontStyle: "italic",
          marginTop: 12,
          marginBottom: 20,
        }}
      >
        ٢٨ يوماً في رحلة رمضان
      </p>

      <p
        style={{
          ...stagger(0.6),
          fontSize: 15,
          color: "#a09480",
          maxWidth: 420,
          lineHeight: 2,
          marginBottom: 40,
          fontWeight: 300,
        }}
      >
        ليست المسألة أن تقرأ كثيراً، بل أن تقرأ بوعي.
        <br />
        رحلة من القراءة الآلية إلى القراءة الحيّة.
      </p>

      <div style={{ ...stagger(0.75), display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => runCta("pricing-full")}
          disabled={ctaState.loading}
          style={{
            ...btnInk,
            opacity: ctaState.loading ? 0.7 : 1,
            cursor: ctaState.loading ? "not-allowed" : "pointer",
            minWidth: 112,
          }}
        >
          {ctaState.loading ? "جارٍ..." : "ابدأ اليوم"}
        </button>
        <button onClick={() => document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" })} style={btnGhost}>
          شاهد الرحلة
        </button>
      </div>

      <div style={{ ...stagger(0.82), minHeight: 18, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: "#a09480" }}>تجربة 24 ساعة — بدون بطاقة — تفعيل فوري</p>
        <button
          onClick={() => {
            track("secondary_link_click");
            document.getElementById("daily")?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginTop: 6,
            fontSize: 12,
            color: "#6b5d4a",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          شاهد كيف تعمل خلال دقيقة
        </button>
        <div style={{ marginTop: 8, fontSize: 11.5, color: "#a09480", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span>28 يوم</span>
          <span>·</span>
          <span>3 أسئلة يوميًا</span>
          <span>·</span>
          <span>تقدم محفوظ</span>
        </div>
        {ctaState.error && <p style={{ fontSize: 12, color: "#a09480" }}>{ctaState.error}</p>}
        {ctaState.success && <p style={{ fontSize: 12, color: "#a09480" }}>{ctaState.success}</p>}
      </div>

      <div
        style={{
          ...stagger(1.2),
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, color: "#a09480", letterSpacing: 4 }}>لاحظ</span>
        <div
          style={{
            width: 1,
            height: 28,
            background: "linear-gradient(to bottom, #d9cdb8, transparent)",
            animation: "scrollPulse 2.5s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
