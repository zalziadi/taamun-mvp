"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTodayTaamunDaily } from "@/lib/taamun-daily";

function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible] = useState(true);

  useEffect(() => {
    void threshold;
  }, [threshold]);

  return [ref, visible];
}

function Fade({ children, delay = 0, style = {} }) {
  const [ref, visible] = useVisible();

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `all 1.1s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const font = "'Amiri', serif";
const bodyFont = "'Tajawal', sans-serif";
const ink = "#1d1a15";
const quiet = "#8d7f6d";
const warmBg = "#f8f4ed";
const sand = "#e8e0d2";

function Gate({ onEnter }) {
  const [ready] = useState(true);

  const a = (d) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(14px)",
    transition: `all 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${d}s`,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        background: warmBg,
      }}
    >
      <div style={{ ...a(0.2), width: 180, height: 180, marginBottom: 0, position: "relative" }}>
        <Image
          src="/images/taamun-hero.jpg"
          alt="تمعّن"
          fill
          sizes="180px"
          style={{
            objectFit: "cover",
            borderRadius: "50%",
            WebkitMaskImage: "radial-gradient(circle, black 35%, transparent 70%)",
            maskImage: "radial-gradient(circle, black 35%, transparent 70%)",
          }}
        />
      </div>

      <h1
        style={{
          ...a(0.5),
          fontFamily: font,
          fontSize: "clamp(44px, 7vw, 72px)",
          color: ink,
          fontWeight: 700,
          lineHeight: 1,
          marginTop: -28,
          position: "relative",
          zIndex: 2,
          letterSpacing: "-0.02em",
        }}
      >
        تمعُّن
      </h1>

      <p style={{ ...a(0.8), fontFamily: font, fontSize: "clamp(20px, 2.4vw, 24px)", color: quiet, fontStyle: "italic", marginTop: 16, marginBottom: 48 }}>
        ٢٨ يوما في رحلة رمضان
      </p>

      <button
        onClick={onEnter}
        style={{
          ...a(1.1),
          padding: "16px 52px",
          background: ink,
          color: warmBg,
          border: "none",
          borderRadius: 6,
          fontFamily: bodyFont,
          fontSize: 20,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.02em",
        }}
      >
        ابدأ
      </button>
    </div>
  );
}

function Question({ onAnswer }) {
  const [ready] = useState(true);
  const [selected, setSelected] = useState(null);

  const a = (d) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(14px)",
    transition: `all 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${d}s`,
  });

  const choices = [
    { id: "shadow", text: "أقرأ لكن شيئا ما لا يكتمل", sub: "كأن الكلمات تمر دون أن تلمسني" },
    { id: "gift", text: "أحيانا أشعر بشيء عميق... ثم يختفي", sub: "لحظات إدراك لا تدوم" },
    { id: "best", text: "أبحث عن طريقة أعمق للعيش مع القرآن", sub: "أريد أن يصبح الوعي يوميا" },
  ];

  const handleSelect = (id) => {
    setSelected(id);
    window.setTimeout(() => onAnswer(id), 800);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", background: warmBg }}>
      <p style={{ ...a(0.2), fontSize: 16, color: quiet, letterSpacing: 2, marginBottom: 20, fontWeight: 500 }}>قبل أن نبدأ</p>
      <h2 style={{ ...a(0.4), fontFamily: font, fontSize: "clamp(24px, 4vw, 34px)", color: ink, fontWeight: 700, lineHeight: 1.4, marginBottom: 40, maxWidth: 500 }}>
        كيف تشعر عادة وأنت تقرأ القرآن؟
      </h2>
      <div style={{ ...a(0.6), display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 440 }}>
        {choices.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            style={{
              padding: "20px 24px",
              background: selected === c.id ? ink : "rgba(255,255,255,0.6)",
              color: selected === c.id ? warmBg : ink,
              border: selected === c.id ? `1px solid ${ink}` : "1px solid rgba(160,148,128,0.12)",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "right",
              fontFamily: bodyFont,
              transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, lineHeight: 1.7 }}>{c.text}</div>
            <div style={{ fontSize: 17, opacity: 0.75, fontWeight: 400 }}>{c.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TodaysExperience({ userState, daily, onExplore, onOpenDaily }) {
  const [ready] = useState(true);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [showWhisper, setShowWhisper] = useState(false);

  useEffect(() => {
    const b = window.setTimeout(() => setShowWhisper(true), 4000);
    return () => {
      window.clearTimeout(b);
    };
  }, []);

  useEffect(() => {
    try {
      const key = `taamun-journal-day-${daily.day}`;
      const saved = window.localStorage.getItem(key) ?? "";
      setJournalText(saved);
      if (saved.trim()) {
        setJournalOpen(true);
      }
    } catch {
      // Ignore storage read issues in private mode or restricted environments.
    }
  }, [daily.day]);

  function handleSaveJournal() {
    try {
      const key = `taamun-journal-day-${daily.day}`;
      window.localStorage.setItem(key, journalText);
      setSaveMessage("تم حفظ ملاحظتك");
    } catch {
      setSaveMessage("تعذر الحفظ على هذا المتصفح");
    }
  }

  const messages = {
    shadow: "رحلتك تبدأ من هنا: أن تلاحظ ما يحدث فيك دون أن تحاول تغييره.",
    gift: "أنت تعرف اللحظة. الآن نتعلم كيف نبقى فيها.",
    best: "الوعي اليومي يبدأ بسؤال صادق واحد.",
  };

  const a = (d) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(12px)",
    transition: `all 1.3s cubic-bezier(0.22, 1, 0.36, 1) ${d}s`,
  });

  return (
    <div style={{ minHeight: "100vh", background: warmBg }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(248,244,237,0.9)", backdropFilter: "blur(16px)" }}>
        <span style={{ fontFamily: font, fontSize: 20, color: ink, fontWeight: 700 }}>تمعُّن</span>
        <span onClick={onOpenDaily} style={{ fontSize: 16, color: quiet, cursor: "pointer", fontWeight: 500 }}>
          أنت في يومك {daily.day}
        </span>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px", textAlign: "center", maxWidth: 540, margin: "0 auto" }}>
        <p style={{ ...a(0.2), fontSize: 18, color: quiet, letterSpacing: 1, marginBottom: 24, fontWeight: 500 }}>{messages[userState]}</p>
        <div style={{ ...a(0.5), marginBottom: 40 }}>
          <p style={{ fontFamily: font, fontSize: "clamp(26px, 4vw, 36px)", color: ink, lineHeight: 2.15, marginBottom: 12 }}>{daily.verse.arabic}</p>
          <p style={{ fontSize: 16, color: quiet, fontWeight: 500 }}>
            سورة {daily.verse.surah} — {daily.verse.ayah}
          </p>
        </div>

        <div style={{ ...a(0.8), padding: "28px 32px", background: "rgba(255,255,255,0.5)", borderRadius: 12, border: "1px solid rgba(160,148,128,0.08)", marginBottom: 36, width: "100%" }}>
          <p style={{ fontSize: 16, color: "#a88951", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>سؤال اليوم</p>
          <p style={{ fontFamily: font, fontSize: "clamp(22px, 3vw, 27px)", color: ink, lineHeight: 1.9 }}>{daily.question}</p>
        </div>

        {!journalOpen ? (
          <button onClick={() => setJournalOpen(true)} style={{ ...a(1.1), padding: "14px 36px", background: "transparent", color: quiet, border: `1px solid ${sand}`, borderRadius: 6, fontFamily: bodyFont, fontSize: 18, fontWeight: 500, cursor: "pointer" }}>
            اكتب ملاحظتك
          </button>
        ) : (
          <div style={{ width: "100%" }}>
            <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="لاحظ... ماذا يحدث فيك الآن؟" style={{ width: "100%", minHeight: 120, padding: 20, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(160,148,128,0.1)", borderRadius: 10, fontFamily: bodyFont, fontSize: 19, color: ink, lineHeight: 2, resize: "vertical", direction: "rtl", outline: "none" }} />
            <button onClick={handleSaveJournal} style={{ marginTop: 12, padding: "12px 32px", background: ink, color: warmBg, border: "none", borderRadius: 6, fontFamily: bodyFont, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
              حفظ
            </button>
            {saveMessage ? <p style={{ marginTop: 8, marginBottom: 0, fontSize: 16, color: quiet, fontWeight: 500 }}>{saveMessage}</p> : null}
          </div>
        )}

        <div style={{ marginTop: 56, opacity: showWhisper ? 1 : 0, transform: showWhisper ? "translateY(0)" : "translateY(10px)", transition: "all 1.5s cubic-bezier(0.22,1,0.36,1)" }}>
          <p style={{ fontFamily: font, fontSize: 18, fontStyle: "italic", color: quiet, lineHeight: 2, opacity: 0.75 }}>{daily.whisper.text}</p>
          <p style={{ fontSize: 15, color: quiet, opacity: 0.65, marginTop: 6, fontWeight: 500 }}>{daily.whisper.source}</p>
        </div>

        <div style={{ marginTop: 60, opacity: showWhisper ? 0.4 : 0, transition: "opacity 2s ease 1s" }}>
          <span onClick={onExplore} style={{ fontSize: 16, color: quiet, cursor: "pointer", fontWeight: 500 }}>
            استكشف الرحلة الكاملة ↓
          </span>
        </div>
      </div>
    </div>
  );
}

function FullJourney({ currentDay, onBack, onSubscribe, onContinue }) {
  const weeks = [
    { name: "التنقية", days: "١ — ٧", line: "أن ترى ما فيك دون أن تهرب" },
    { name: "التدبّر", days: "٨ — ١٤", line: "أن تسمح لآية واحدة أن تغيّرك" },
    { name: "الاتصال", days: "١٥ — ٢١", line: "لحظة صافية ترى فيها الحقيقة" },
    { name: "التجلّي", days: "٢٢ — ٢٨", line: "أن يصبح الوعي طبيعتك اليومية" },
  ];

  const done = Array.from({ length: Math.max(currentDay - 1, 0) }, (_, i) => i + 1);

  return (
    <div style={{ background: warmBg, minHeight: "100vh" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(248,244,237,0.9)", backdropFilter: "blur(16px)" }}>
        <span style={{ fontFamily: font, fontSize: 20, color: ink, fontWeight: 700 }}>تمعُّن</span>
        <span onClick={onBack} style={{ fontSize: 17, color: quiet, cursor: "pointer", fontWeight: 500 }}>← العودة ليومك</span>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Fade>
          <h2 style={{ fontFamily: font, fontSize: "clamp(26px, 4vw, 34px)", color: ink, marginBottom: 8 }}>أنت في الأسبوع الثاني</h2>
          <p style={{ fontSize: 18, color: quiet, lineHeight: 2, marginBottom: 48, fontWeight: 500 }}>
            أنت في يومك {currentDay}. {Math.max(currentDay - 1, 0)} يوما عشتها بوعي.
          </p>
        </Fade>

        <Fade delay={0.15}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "clamp(5px, 1.2vw, 8px)", marginBottom: 56 }}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <div key={d} style={{ aspectRatio: "1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: 700, background: d === currentDay ? ink : done.includes(d) ? "rgba(237,229,213,0.8)" : "rgba(255,255,255,0.35)", color: d === currentDay ? warmBg : done.includes(d) ? "#6b5d4a" : "rgba(160,148,128,0.4)" }}>
                {d}
              </div>
            ))}
          </div>
        </Fade>

        {weeks.map((w, i) => (
          <Fade key={w.name} delay={0.2 + i * 0.1}>
            <div style={{ display: "flex", gap: 20, alignItems: "baseline", padding: "24px 0", borderBottom: i < 3 ? "1px solid rgba(160,148,128,0.06)" : "none", opacity: i < 2 ? 1 : 0.45 }}>
              <div style={{ fontFamily: font, fontSize: 28, color: sand, fontWeight: 700, minWidth: 36 }}>{["١", "٢", "٣", "٤"][i]}</div>
              <div>
                <h3 style={{ fontFamily: font, fontSize: 19, color: ink, marginBottom: 2 }}>{w.name}</h3>
                <p style={{ fontSize: 16, color: quiet, marginBottom: 4, fontWeight: 500 }}>اليوم {w.days}</p>
                <p style={{ fontSize: 18, color: quiet, fontWeight: 400, lineHeight: 1.7 }}>{w.line}</p>
              </div>
            </div>
          </Fade>
        ))}

        <Fade delay={0.7}>
          <div style={{ marginTop: 48, textAlign: "center" }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onSubscribe} style={{ padding: "13px 36px", background: ink, color: warmBg, border: "none", borderRadius: 6, fontFamily: bodyFont, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
                المسار الكامل · ٤٩ ر.س
              </button>
              <button onClick={onContinue} style={{ padding: "13px 36px", background: "transparent", color: quiet, border: `1px solid ${sand}`, borderRadius: 6, fontFamily: bodyFont, fontSize: 18, fontWeight: 500, cursor: "pointer" }}>
                إنشاء حساب وتفعيله
              </button>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}

export default function TaamunEssential() {
  const router = useRouter();
  const daily = getTodayTaamunDaily();
  const [phase, setPhase] = useState("gate");
  const [userState, setUserState] = useState("shadow");

  const transition = (next, data) => {
    if (data) setUserState(data);
    setPhase(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: bodyFont,
        fontWeight: 400,
        lineHeight: 1.9,
        background: warmBg,
        minHeight: "100vh",
      }}
    >
      {phase === "gate" && <Gate onEnter={() => transition("question")} />}
      {phase === "question" && <Question onAnswer={(id) => transition("experience", id)} />}
      {phase === "experience" && (
        <TodaysExperience
          userState={userState}
          daily={daily}
          onExplore={() => transition("explore")}
          onOpenDaily={() => router.push(`/daily?day=${daily.day}`)}
        />
      )}
      {phase === "explore" && (
        <FullJourney
          currentDay={daily.day}
          onBack={() => transition("experience")}
          onSubscribe={() => router.push("/subscribe?reason=pricing")}
          onContinue={() => router.push("/auth?next=%2Factivate")}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@200;300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
