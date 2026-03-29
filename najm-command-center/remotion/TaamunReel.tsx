import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";
import { Scene } from "./components/Scene";
import { ProgressBar } from "./components/ProgressBar";

const AMBIENT_AUDIO = staticFile("audio/arabic-ambient.wav");

/* ── Design tokens ── */
const COLORS = {
  black: "#0A0A0A",
  gold: "#C9A84C",
  goldDim: "rgba(201, 168, 76, 0.4)",
  goldGlow: "rgba(201, 168, 76, 0.15)",
  white: "#F2EDE4",
  whiteDim: "rgba(242, 237, 228, 0.5)",
  surface: "#111111",
};

const FONT_AMIRI = "'Amiri', 'Noto Naskh Arabic', serif";
const FONT_TAJAWAL = "'Tajawal', 'Noto Sans Arabic', sans-serif";

const FPS = 30;

/* ── Arabic numeral helpers ── */
const toArabicNum = (n: number): string => {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((d) => (d === "." ? "٫" : map[Number(d)] ?? d))
    .join("");
};

/* ════════════════════════════════════════
   Scene 1: Bold Question (0–3s)
   ════════════════════════════════════════ */
const Scene1BoldQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slamScale = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 200 } });
  const scale = interpolate(slamScale, [0, 1], [1.5, 1]);
  const opacity = interpolate(frame, [4, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(frame, [6, 10, 14], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Flash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(201,168,76,0.35) 0%, transparent 70%)`,
          opacity: flashOpacity,
        }}
      />
      <div
        style={{
          fontFamily: FONT_AMIRI,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.gold,
          textAlign: "center",
          lineHeight: 1.5,
          transform: `scale(${scale})`,
          opacity,
          direction: "rtl",
        }}
      >
        كم دقيقة
        <br />
        تعطي نفسك؟
      </div>
    </>
  );
};

/* ════════════════════════════════════════
   Scene 2: The Number 7 (3–7s)
   ════════════════════════════════════════ */
const Scene2TheNumber: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const counterProgress = interpolate(frame, [0, 24], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const numOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subSpring = spring({ frame: frame - 27, fps, config: { damping: 15 } });
  const sub2Opacity = interpolate(frame, [40, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ textAlign: "center", direction: "rtl" }}>
      <div
        style={{
          fontFamily: FONT_AMIRI,
          fontSize: 280,
          fontWeight: 700,
          color: COLORS.gold,
          lineHeight: 1,
          opacity: numOpacity,
          textShadow:
            "0 0 80px rgba(201,168,76,0.4), 0 0 160px rgba(201,168,76,0.15)",
        }}
      >
        {toArabicNum(Math.round(counterProgress))}
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 48,
          color: COLORS.white,
          marginTop: 16,
          opacity: subSpring,
          transform: `translateY(${interpolate(subSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        دقائق فقط
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 36,
          color: COLORS.whiteDim,
          marginTop: 12,
          opacity: sub2Opacity,
        }}
      >
        كل صباح
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 3: Feature Cards (7–12s)
   ════════════════════════════════════════ */
const FEATURES = [
  { icon: "🌬️", label: "تنفس واعي" },
  { icon: "📖", label: "آية للتأمل" },
  { icon: "✍️", label: "كتابة تأملية" },
  { icon: "📊", label: "تتبع وعيك" },
];

const Scene3Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayOpacity = interpolate(frame, [110, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ direction: "rtl" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          width: 700,
        }}
      >
        {FEATURES.map((f, i) => {
          const delay = i * 20;
          const slideIn = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, stiffness: 120 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                background: COLORS.surface,
                borderRight: `6px solid ${COLORS.gold}`,
                borderRadius: 20,
                padding: "28px 36px",
                opacity: slideIn,
                transform: `translateX(${interpolate(slideIn, [0, 1], [80, 0])}px)`,
              }}
            >
              <span style={{ fontSize: 48, width: 64, textAlign: "center" }}>
                {f.icon}
              </span>
              <span
                style={{
                  fontFamily: FONT_TAJAWAL,
                  fontSize: 40,
                  fontWeight: 500,
                  color: COLORS.white,
                }}
              >
                {f.label}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 32,
          color: COLORS.whiteDim,
          textAlign: "center",
          marginTop: 56,
          opacity: overlayOpacity,
          lineHeight: 1.6,
        }}
      >
        كل هذا… بدون إعلانات. بدون ضجيج.
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 4: Phone Mockup (12–18s)
   ════════════════════════════════════════ */
const PHONE_W = 560;
const PHONE_H = 1100;

const Scene4Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({ frame: frame - 3, fps, config: { damping: 12, stiffness: 80 } });
  const phoneY = interpolate(phoneSpring, [0, 1], [600, 0]);

  // Determine which screen (0–2) is active
  const screenIdx =
    frame < 45 ? 0 : frame < 90 ? 1 : 2;

  // Verse text for screen 2
  const verseOpacity = interpolate(frame, [48, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing effect for screen 3
  const journalText = "أشعر بسكينة غريبة اليوم…";
  const words = journalText.split(" ");
  const typingStart = 95;
  const visibleWords = Math.min(
    words.length,
    Math.max(0, Math.floor((frame - typingStart) / 6))
  );

  const overlaySpring = spring({ frame: frame - 18, fps, config: { damping: 15 } });

  // Breathing animation for screen 1
  const breathScale = interpolate(
    Math.sin((frame / fps) * Math.PI * 0.8),
    [-1, 1],
    [0.85, 1.15]
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          transform: `translateY(${phoneY}px)`,
          opacity: phoneSpring,
        }}
      >
        {/* Phone shell */}
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            background: "#000",
            borderRadius: 88,
            border: "6px solid #333",
            overflow: "hidden",
            position: "relative",
            boxShadow:
              "0 0 80px rgba(201,168,76,0.15), 0 40px 120px rgba(0,0,0,0.6)",
            margin: "0 auto",
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 240,
              height: 56,
              background: "#000",
              borderRadius: "0 0 36px 36px",
              zIndex: 5,
            }}
          />
          {/* Screen area */}
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              width: PHONE_W - 12,
              height: PHONE_H - 12,
              borderRadius: 80,
              overflow: "hidden",
              background: COLORS.black,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 40px",
            }}
          >
            {/* Screen 1: Breathing */}
            {screenIdx === 0 && (
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  border: `4px solid ${COLORS.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${breathScale})`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_TAJAWAL,
                    fontSize: 36,
                    color: COLORS.gold,
                  }}
                >
                  شهيق
                </span>
              </div>
            )}

            {/* Screen 2: Verse */}
            {screenIdx === 1 && (
              <div
                style={{
                  fontFamily: FONT_AMIRI,
                  fontSize: 36,
                  color: COLORS.white,
                  textAlign: "center",
                  lineHeight: 2,
                  opacity: verseOpacity,
                  direction: "rtl",
                }}
              >
                ﴿ أَفَلَا يَتَدَبَّرُونَ القُرآنَ
                <br />
                أَم عَلَىٰ قُلُوبٍ أَقفَالُهَا ﴾
              </div>
            )}

            {/* Screen 3: Journal */}
            {screenIdx === 2 && (
              <div
                style={{
                  width: "90%",
                  background: COLORS.surface,
                  borderRadius: 24,
                  padding: 32,
                  minHeight: 240,
                  direction: "rtl",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_TAJAWAL,
                    fontSize: 28,
                    color: COLORS.whiteDim,
                    marginBottom: 16,
                  }}
                >
                  تأملاتك اليوم…
                </div>
                <div
                  style={{
                    fontFamily: FONT_TAJAWAL,
                    fontSize: 30,
                    color: COLORS.white,
                    lineHeight: 1.8,
                  }}
                >
                  {words.slice(0, visibleWords).join(" ")}
                  {visibleWords < words.length && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 4,
                        height: 32,
                        background: COLORS.gold,
                        verticalAlign: "middle",
                        marginRight: 4,
                        opacity: frame % 24 < 12 ? 1 : 0,
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 36,
          color: COLORS.white,
          marginTop: 48,
          opacity: overlaySpring,
        }}
      >
        تجربة مصممة للعمق
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 5: Stats (18–24s)
   ════════════════════════════════════════ */
const STATS = [
  { target: 28, suffix: "+", label: "يوم من المحتوى", showAt: 0 },
  { target: 15, suffix: "", label: "دقيقة كل يوم", showAt: 60 },
  { target: 28, suffix: "", label: "ريال فقط — عيدية تمعّن", showAt: 120 },
];

const Scene5Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine which stat to show
  const activeIdx =
    frame < 60 ? 0 : frame < 120 ? 1 : 2;
  const stat = STATS[activeIdx];
  const localFrame = frame - stat.showAt;

  const counterProgress = interpolate(localFrame, [0, 24], [0, stat.target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fadeIn = spring({
    frame: localFrame,
    fps,
    config: { damping: 14 },
  });

  const displayNum = Number.isInteger(stat.target)
    ? Math.round(counterProgress)
    : Math.round(counterProgress * 10) / 10;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          opacity: fadeIn,
          transform: `scale(${interpolate(fadeIn, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_AMIRI,
            fontSize: 200,
            fontWeight: 700,
            color: COLORS.gold,
            lineHeight: 1,
            textShadow: "0 0 60px rgba(201,168,76,0.3)",
          }}
        >
          {stat.suffix === "+"
            ? stat.suffix + toArabicNum(displayNum)
            : toArabicNum(displayNum) + stat.suffix}
        </div>
        <div
          style={{
            fontFamily: FONT_TAJAWAL,
            fontSize: 44,
            color: COLORS.white,
            marginTop: 20,
            opacity: interpolate(localFrame, [20, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {stat.label}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 6: Testimonial (24–29s)
   ════════════════════════════════════════ */
const Scene6Testimonial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - 3,
    fps,
    config: { damping: 13, stiffness: 100 },
  });

  const quote = "أول مرة أحس إن التطبيق فاهمني… مو بس يعطيني محتوى";
  const words = quote.split(" ");

  const authorOpacity = interpolate(
    frame,
    [words.length * 8 + 20, words.length * 8 + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: 800,
        background: COLORS.surface,
        border: "2px solid rgba(201,168,76,0.2)",
        borderRadius: 32,
        padding: "64px 56px",
        textAlign: "center",
        boxShadow: "0 0 60px rgba(201,168,76,0.08)",
        opacity: cardSpring,
        transform: `scale(${interpolate(cardSpring, [0, 1], [0.9, 1])})`,
        direction: "rtl",
      }}
    >
      <div
        style={{
          fontFamily: FONT_AMIRI,
          fontSize: 44,
          color: COLORS.white,
          lineHeight: 1.8,
          minHeight: 220,
        }}
      >
        {words.map((word, i) => {
          const wordOpacity = interpolate(
            frame,
            [9 + i * 8, 14 + i * 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const wordY = interpolate(
            frame,
            [9 + i * 8, 14 + i * 8],
            [12, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: wordOpacity,
                transform: `translateY(${wordY}px)`,
                marginLeft: 10,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 28,
          color: COLORS.goldDim,
          marginTop: 40,
          opacity: authorOpacity,
        }}
      >
        — متمعّن منذ اليوم الأول
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 7: Brand Reveal (29–33s)
   ════════════════════════════════════════ */
const Scene7Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandLetters = "تمعّن".split("");

  const taglineSpring = spring({
    frame: frame - brandLetters.length * 6 - 12,
    fps,
    config: { damping: 15 },
  });

  return (
    <div style={{ textAlign: "center", direction: "rtl" }}>
      <div
        style={{
          fontFamily: FONT_AMIRI,
          fontSize: 160,
          fontWeight: 700,
          color: COLORS.gold,
          letterSpacing: 6,
          display: "flex",
          justifyContent: "center",
          direction: "rtl",
        }}
      >
        {brandLetters.map((letter, i) => {
          const letterOpacity = interpolate(
            frame,
            [i * 6, i * 6 + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <span key={i} style={{ opacity: letterOpacity }}>
              {letter}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 44,
          color: COLORS.white,
          marginTop: 24,
          opacity: taglineSpring,
        }}
      >
        رحلة الوعي تبدأ بخطوة
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Scene 8: CTA (33–36s)
   ════════════════════════════════════════ */
const Scene8CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulsing brand
  const pulseScale = 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.03;
  const pulseShadow =
    20 + Math.sin((frame / fps) * Math.PI * 2) * 20;

  const ctaSpring = spring({ frame: frame - 9, fps, config: { damping: 14 } });
  const freeSpring = spring({
    frame: frame - 24,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  const urlOpacity = interpolate(frame, [36, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ textAlign: "center", direction: "rtl" }}>
      <div
        style={{
          fontFamily: FONT_AMIRI,
          fontSize: 120,
          fontWeight: 700,
          color: COLORS.gold,
          transform: `scale(${pulseScale})`,
          textShadow: `0 0 ${pulseShadow}px rgba(201,168,76,0.5)`,
        }}
      >
        تمعّن
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.white,
          marginTop: 40,
          opacity: ctaSpring,
          transform: `translateY(${interpolate(ctaSpring, [0, 1], [40, 0])}px)`,
        }}
      >
        ابدأ رحلتك الآن
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 52,
          fontWeight: 700,
          color: COLORS.gold,
          marginTop: 20,
          opacity: freeSpring,
          transform: `scale(${interpolate(freeSpring, [0, 1], [0.5, 1])})`,
        }}
      >
        🎁 ٢٨ ريال فقط
      </div>
      <div
        style={{
          fontFamily: FONT_TAJAWAL,
          fontSize: 32,
          color: COLORS.whiteDim,
          marginTop: 28,
          opacity: urlOpacity,
        }}
      >
        taamun.com
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   Ambient background glow
   ════════════════════════════════════════ */
const AmbientGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.02) * 5;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${50 + drift}% 30%, ${COLORS.goldGlow} 0%, transparent 60%)`,
        opacity: 0.5,
        zIndex: 0,
      }}
    />
  );
};

/* ════════════════════════════════════════
   Main Composition
   ════════════════════════════════════════ */
export const TaamunReel: React.FC = () => {
  // Scene timings (in frames at 30fps)
  const S = {
    s1: { from: 0, dur: 3 * FPS },          // 0–3s
    s2: { from: 3 * FPS, dur: 4 * FPS },     // 3–7s
    s3: { from: 7 * FPS, dur: 5 * FPS },     // 7–12s
    s4: { from: 12 * FPS, dur: 6 * FPS },    // 12–18s
    s5: { from: 18 * FPS, dur: 6 * FPS },    // 18–24s
    s6: { from: 24 * FPS, dur: 5 * FPS },    // 24–29s
    s7: { from: 29 * FPS, dur: 4 * FPS },    // 29–33s
    s8: { from: 33 * FPS, dur: 3 * FPS },    // 33–36s
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {/* Ambient spiritual audio — full duration */}
      <Audio src={AMBIENT_AUDIO} volume={0.7} />

      <AmbientGlow />
      <ProgressBar />

      <Scene from={S.s1.from} duration={S.s1.dur}>
        <Scene1BoldQuestion />
      </Scene>

      <Scene from={S.s2.from} duration={S.s2.dur}>
        <Scene2TheNumber />
      </Scene>

      <Scene from={S.s3.from} duration={S.s3.dur}>
        <Scene3Features />
      </Scene>

      <Scene from={S.s4.from} duration={S.s4.dur}>
        <Scene4Phone />
      </Scene>

      <Scene from={S.s5.from} duration={S.s5.dur}>
        <Scene5Stats />
      </Scene>

      <Scene from={S.s6.from} duration={S.s6.dur}>
        <Scene6Testimonial />
      </Scene>

      <Scene from={S.s7.from} duration={S.s7.dur}>
        <Scene7Brand />
      </Scene>

      <Scene from={S.s8.from} duration={S.s8.dur}>
        <Scene8CTA />
      </Scene>
    </AbsoluteFill>
  );
};
