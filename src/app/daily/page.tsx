import Link from "next/link";
import { getDayIndexForToday } from "@/lib/ramadan-28";
import { getTaamunDailyByDay, TAAMUN_DAYS_COUNT } from "@/lib/taamun-daily";

interface DailyPageProps {
  searchParams?: {
    day?: string;
  };
}

export default function DailyPage({ searchParams }: DailyPageProps) {
  const dayFromQuery = Number(searchParams?.day ?? "");
  const day = Number.isInteger(dayFromQuery) && dayFromQuery >= 1 && dayFromQuery <= TAAMUN_DAYS_COUNT
    ? dayFromQuery
    : getDayIndexForToday();

  const entry = getTaamunDailyByDay(day) ?? getTaamunDailyByDay(1);
  if (!entry) return null;

  const prevDay = day > 1 ? day - 1 : null;
  const nextDay = day < TAAMUN_DAYS_COUNT ? day + 1 : null;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f8f4ed",
        color: "#1d1a15",
        padding: "48px 20px",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          border: "1px solid rgba(160,148,128,0.14)",
          background: "rgba(255,255,255,0.55)",
          borderRadius: 16,
          padding: "clamp(18px, 4vw, 34px)",
        }}
      >
        <p style={{ fontSize: 12, color: "#c4a265", letterSpacing: 2, marginBottom: 10 }}>
          الصفحة اليومية · اليوم {entry.day}
        </p>
        <h1 style={{ margin: 0, marginBottom: 8, fontFamily: "'Amiri', serif", fontSize: "clamp(28px, 4vw, 38px)" }}>
          {entry.title}
        </h1>
        <p style={{ margin: 0, color: "#a09480", fontSize: 14, marginBottom: 24 }}>
          {entry.theme} · الأسبوع {entry.week}
        </p>

        <div style={{ padding: "20px 16px", borderRadius: 12, background: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
          <p style={{ margin: 0, fontFamily: "'Amiri', serif", fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 2 }}>
            {entry.verse.arabic}
          </p>
          <p style={{ marginTop: 8, marginBottom: 0, color: "#a09480", fontSize: 13 }}>
            سورة {entry.verse.surah} — آية {entry.verse.ayah}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>سؤال اليوم</h2>
          <p style={{ margin: 0, lineHeight: 2, color: "#4a3f34" }}>{entry.question}</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>التمرين العملي</h2>
          <p style={{ margin: 0, lineHeight: 2, color: "#4a3f34" }}>{entry.exercise}</p>
        </div>

        <blockquote
          style={{
            margin: 0,
            padding: "14px 14px",
            borderRight: "2px solid rgba(196,162,101,0.35)",
            color: "#6b5d4a",
            background: "rgba(255,255,255,0.35)",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, lineHeight: 2 }}>{entry.whisper.text}</p>
          <footer style={{ marginTop: 6, fontSize: 12, color: "#a09480" }}>{entry.whisper.source}</footer>
        </blockquote>

        <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          {prevDay ? (
            <Link
              href={`/daily?day=${prevDay}`}
              style={{
                padding: "10px 16px",
                border: "1px solid #d9cdb8",
                borderRadius: 8,
                color: "#6b5d4a",
                textDecoration: "none",
              }}
            >
              اليوم السابق
            </Link>
          ) : null}

          {nextDay ? (
            <Link
              href={`/daily?day=${nextDay}`}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: 8,
                color: "#f8f4ed",
                background: "#1d1a15",
                textDecoration: "none",
              }}
            >
              اليوم التالي
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
