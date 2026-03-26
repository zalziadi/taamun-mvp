"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════
   أسماء الله الحسنى — قابلة للتعديل
   ═══════════════════════════════════════ */
const NAMES = [
  "الرَّحْمَن","الرَّحِيم","المَلِك","القُدُّوس","السَّلَام",
  "المُؤْمِن","المُهَيْمِن","العَزِيز","الجَبَّار","المُتَكَبِّر",
  "الخَالِق","البَارِئ","المُصَوِّر","الغَفَّار","القَهَّار",
  "الوَهَّاب","الرَّزَّاق","الفَتَّاح","العَلِيم","القَابِض",
  "البَاسِط","الخَافِض","الرَّافِع","المُعِزّ","المُذِلّ",
  "السَّمِيع","البَصِير","الحَكَم","العَدْل","اللَّطِيف",
  "الخَبِير","الحَلِيم","العَظِيم","الغَفُور","الشَّكُور",
  "العَلِيّ","الكَبِير","الحَفِيظ","المُقِيت","الحَسِيب",
  "الجَلِيل","الكَرِيم","الرَّقِيب","المُجِيب","الوَاسِع",
  "الحَكِيم","الوَدُود","المَجِيد","البَاعِث","الشَّهِيد",
  "الحَقّ","الوَكِيل","القَوِيّ","المَتِين","الوَلِيّ",
  "الحَمِيد","المُحْصِي","المُبْدِئ","المُعِيد","المُحْيِي",
  "المُمِيت","الحَيّ","القَيُّوم","الوَاجِد","المَاجِد",
  "الوَاحِد","الصَّمَد","القَادِر","المُقْتَدِر","المُقَدِّم",
  "المُؤَخِّر","الأَوَّل","الآخِر","الظَّاهِر","البَاطِن",
  "الوَالِي","المُتَعَالِي","البَرّ","التَّوَّاب","المُنْتَقِم",
  "العَفُوّ","الرَّؤُوف","مَالِكُ المُلْك","ذُو الجَلَالِ وَالإِكْرَام","المُقْسِط",
  "الجَامِع","الغَنِيّ","المُغْنِي","المَانِع","الضَّارّ",
  "النَّافِع","النُّور","الهَادِي","البَدِيع","البَاقِي",
  "الوَارِث","الرَّشِيد","الصَّبُور",
];
const N = NAMES.length;

const STORAGE_KEY = "taamun_tasbeeh";

function toAr(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

function distAttr(i: number, cur: number): string {
  const d = Math.abs(i - cur);
  if (d === 0) return "0";
  if (d === 1) return "1";
  if (d === 2) return "2";
  if (d === 3) return "3";
  return "far";
}

interface SavedState {
  cur: number;
  total: number;
  rounds: number;
  counted: number[];
}

export function TasbeehExperience() {
  const [cur, setCur] = useState(0);
  const [total, setTotal] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [counted, setCounted] = useState<Set<number>>(new Set());
  const [showCompletion, setShowCompletion] = useState(false);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [magRipple, setMagRipple] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const [hintHidden, setHintHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const animatingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchYRef = useRef(0);
  const touchMovedRef = useRef(false);
  const rippleIdRef = useRef(0);

  // ═══ Load saved state ═══
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s: SavedState = JSON.parse(raw);
        setCur(s.cur ?? 0);
        setTotal(s.total ?? 0);
        setRounds(s.rounds ?? 0);
        setCounted(new Set(s.counted ?? []));
        if ((s.total ?? 0) > 0) setHintHidden(true);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // ═══ Save state ═══
  const save = useCallback(
    (c: number, t: number, r: number, ct: Set<number>) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ cur: c, total: t, rounds: r, counted: [...ct] })
        );
      } catch {
        /* ignore */
      }
    },
    []
  );

  // ═══ Spawn ripple ═══
  const spawnRipple = useCallback(() => {
    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev, id]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r !== id)), 1300);
  }, []);

  // ═══ Move to bead ═══
  const moveTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= N) return;
      animatingRef.current = true;
      setCur(i);
      setMagRipple(true);
      setTimeout(() => setMagRipple(false), 600);
      setTimeout(() => {
        animatingRef.current = false;
      }, 550);
    },
    []
  );

  // ═══ Count current bead ═══
  const countCur = useCallback(() => {
    if (animatingRef.current) return;

    setCounted((prev) => {
      if (prev.has(cur)) return prev;
      const next = new Set(prev);
      next.add(cur);

      const newTotal = total + 1;
      setTotal(newTotal);
      setFlashIndex(cur);
      setTimeout(() => setFlashIndex(null), 500);
      spawnRipple();
      setMagRipple(true);
      setTimeout(() => setMagRipple(false), 600);
      setHintHidden(true);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }

      if (next.size === N) {
        const newRounds = rounds + 1;
        setRounds(newRounds);
        save(cur, newTotal, newRounds, next);
        setTimeout(() => setShowCompletion(true), 800);
        return next;
      }

      save(cur, newTotal, rounds, next);

      // Auto-advance after count
      setTimeout(() => {
        if (cur < N - 1) {
          moveTo(cur + 1);
        }
      }, 400);

      return next;
    });
  }, [cur, total, rounds, save, spawnRipple, moveTo]);

  // ═══ Advance ═══
  const advance = useCallback(() => {
    if (animatingRef.current) return;
    if (!counted.has(cur)) {
      countCur();
      return;
    }
    let next = cur + 1;
    while (next < N && counted.has(next)) next++;
    if (next < N) moveTo(next);
  }, [cur, counted, countCur, moveTo]);

  // ═══ Go back ═══
  const goBack = useCallback(() => {
    if (!animatingRef.current && cur > 0) moveTo(cur - 1);
  }, [cur, moveTo]);

  // ═══ Reset ═══
  const resetAll = useCallback(() => {
    if (total === 0) return;
    if (!window.confirm("إعادة العداد؟")) return;
    setCur(0);
    setTotal(0);
    setRounds(0);
    setCounted(new Set());
    setHintHidden(false);
    localStorage.removeItem(STORAGE_KEY);
  }, [total]);

  // ═══ New round ═══
  const newRound = useCallback(() => {
    setShowCompletion(false);
    setCounted(new Set());
    setCur(0);
    save(0, total, rounds, new Set());
  }, [total, rounds, save]);

  // ═══ Touch / wheel ═══
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY;
      touchMovedRef.current = false;
    };
    const onTouchMove = () => {
      touchMovedRef.current = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchYRef.current;
      if (!touchMovedRef.current || Math.abs(dy) < 25) return;
      if (dy < -25) {
        advance();
      } else if (dy > 25) {
        goBack();
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;
      if (e.deltaY > 0) advance();
      else if (e.deltaY < 0) goBack();
    };

    vp.addEventListener("touchstart", onTouchStart, { passive: true });
    vp.addEventListener("touchmove", onTouchMove, { passive: true });
    vp.addEventListener("touchend", onTouchEnd, { passive: true });
    vp.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove", onTouchMove);
      vp.removeEventListener("touchend", onTouchEnd);
      vp.removeEventListener("wheel", onWheel);
    };
  }, [advance, goBack]);

  // ═══ Keyboard ═══
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowDown") {
        e.preventDefault();
        advance();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        goBack();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [advance, goBack]);

  // ═══ Bead height ═══
  const beadH = 110;

  if (!loaded) return null;

  const trackOffset =
    viewportRef.current
      ? viewportRef.current.offsetHeight / 2 - (cur * beadH + beadH / 2)
      : 200;

  return (
    <>
      <style>{tasbeehStyles}</style>
      <div className="tsb-ambient" />
      <div className="tsb-app">
        {/* Header */}
        <div className="tsb-header">
          <div className="tsb-logo">تمعّن</div>
          <h1 className="tsb-title">مسبحة أسماء الله الحسنى</h1>
        </div>

        {/* Counter */}
        <div className="tsb-counter-strip">
          <div className="tsb-counter-item">
            <div className="tsb-counter-value">{toAr(total)}</div>
            <div className="tsb-counter-label">تسبيحة</div>
          </div>
          <div className="tsb-counter-divider" />
          <div className="tsb-counter-item">
            <div className="tsb-counter-value">{toAr(cur + 1)}</div>
            <div className="tsb-counter-label">من ٩٩</div>
          </div>
          <div className="tsb-counter-divider" />
          <div className="tsb-counter-item">
            <div className="tsb-counter-value">{toAr(rounds)}</div>
            <div className="tsb-counter-label">دورة</div>
          </div>
        </div>

        {/* Progress */}
        <div className="tsb-progress-track">
          <div
            className="tsb-progress-fill"
            style={{ width: `${(counted.size / N) * 100}%` }}
          />
        </div>

        {/* Viewport */}
        <div className="tsb-viewport" ref={viewportRef}>
          <div className="tsb-string-line" />

          {/* Particles */}
          <div className="tsb-particles">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="tsb-particle tsb-particle-drift"
                style={{
                  left: `${20 + ((i * 37) % 60)}%`,
                  top: `${10 + ((i * 53) % 80)}%`,
                  width: `${1 + (i % 3) * 0.5}px`,
                  height: `${1 + (i % 3) * 0.5}px`,
                  // @ts-expect-error CSS custom properties
                  "--dur": `${6 + (i % 5) * 2}s`,
                  "--delay": `${(i % 7) * 0.8}s`,
                  "--peak": `${0.05 + (i % 4) * 0.02}`,
                  "--dy": `${-20 - (i % 5) * 8}px`,
                  "--dx": `${-10 + (i % 7) * 3}px`,
                }}
              />
            ))}
          </div>

          {/* Magnifier */}
          <div className="tsb-magnifier">
            <div className="tsb-magnifier-ring" />
            <div className="tsb-magnifier-glass" />
            <div className="tsb-magnifier-content">
              <div className={`tsb-mag-name${magRipple ? " tsb-mag-ripple" : ""}`}>
                {total === 0 && !hintHidden ? "بسم الله" : NAMES[cur]}
              </div>
              <div className="tsb-mag-index">
                {total === 0 && !hintHidden
                  ? "اسحب للبدء"
                  : `${toAr(cur + 1)} من ٩٩`}
              </div>
            </div>
          </div>

          {/* Ripple waves */}
          {ripples.map((id) => (
            <div key={id} className="tsb-ripple-wave tsb-ripple-animate" />
          ))}

          {/* Bead track */}
          <div
            className="tsb-bead-track"
            style={{ transform: `translateY(${trackOffset}px)` }}
          >
            {NAMES.map((name, i) => {
              const dist = distAttr(i, cur);
              const isCounted = counted.has(i);
              const isFlash = flashIndex === i;
              return (
                <div
                  key={i}
                  className={`tsb-bead${isCounted ? " tsb-counted" : ""}${isFlash ? " tsb-flash" : ""}`}
                  data-dist={dist}
                  onClick={() => {
                    if (i === cur) countCur();
                  }}
                >
                  <div className="tsb-stone">
                    <span className="tsb-stone-name">{name}</span>
                  </div>
                  <div className="tsb-knot" />
                </div>
              );
            })}
          </div>

          {/* Swipe hint */}
          <div className={`tsb-swipe-hint${hintHidden ? " tsb-hint-hidden" : ""}`}>
            <span className="tsb-swipe-arrow">↓</span>
            <span className="tsb-swipe-text">اسحب للتسبيح</span>
          </div>
        </div>

        {/* Footer */}
        <div className="tsb-footer">
          <button className="tsb-btn tsb-btn-icon" onClick={resetAll} title="إعادة">
            ↻
          </button>
          <button className="tsb-btn tsb-btn-count" onClick={advance}>
            سبّح
          </button>
          <button className="tsb-btn tsb-btn-icon" onClick={goBack} title="رجوع">
            ↑
          </button>
        </div>
      </div>

      {/* Completion overlay */}
      {showCompletion && (
        <div className="tsb-completion tsb-completion-show">
          <div className="tsb-completion-ornament">✦</div>
          <h2 className="tsb-completion-title">تمّت الدورة</h2>
          <p className="tsb-completion-sub">سبحانك اللهم وبحمدك</p>
          <div className="tsb-completion-round">الدورة {toAr(rounds)}</div>
          <button className="tsb-btn tsb-btn-count" onClick={newRound}>
            دورة جديدة
          </button>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   Styles — scoped with tsb- prefix
   ═══════════════════════════════════════ */
const tasbeehStyles = `
  .tsb-ambient {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background:radial-gradient(ellipse at 50% 40%, rgba(212,168,85,0.03) 0%, transparent 55%);
  }
  .tsb-app {
    position:relative; z-index:1;
    height:100vh; height:100dvh;
    display:flex; flex-direction:column;
    max-width:480px; margin:0 auto; overflow:hidden;
    font-family:'Amiri','Noto Naskh Arabic',serif;
    background:#07070c; color:#e8e0d0;
    -webkit-tap-highlight-color:transparent;
    user-select:none; -webkit-user-select:none;
  }
  .tsb-header { text-align:center; padding:16px 16px 6px; flex-shrink:0; z-index:10; }
  .tsb-logo { font-size:0.65rem; color:#b8922e; letter-spacing:0.2em; opacity:0.7; }
  .tsb-title { font-size:1rem; font-weight:700; color:#d4a855; opacity:0.85; margin:0; }

  .tsb-counter-strip {
    display:flex; align-items:center; justify-content:center;
    gap:18px; padding:6px 16px 8px; flex-shrink:0; z-index:10;
  }
  .tsb-counter-item { text-align:center; }
  .tsb-counter-value { font-size:1.2rem; font-weight:700; color:#f0d78c; line-height:1; }
  .tsb-counter-label { font-size:0.55rem; color:#5a5244; margin-top:1px; }
  .tsb-counter-divider { width:1px; height:22px; background:rgba(212,168,85,0.1); }

  .tsb-progress-track { height:1px; background:rgba(212,168,85,0.06); flex-shrink:0; z-index:10; }
  .tsb-progress-fill {
    height:100%; width:0%;
    background:linear-gradient(90deg,#b8922e,#d4a855);
    transition:width 0.5s ease;
  }

  .tsb-viewport {
    flex:1; position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center;
  }
  .tsb-string-line {
    position:absolute; left:50%; top:0; bottom:0; width:1px;
    background:linear-gradient(to bottom,transparent 0%,rgba(212,168,85,0.12) 20%,rgba(212,168,85,0.12) 80%,transparent 100%);
    transform:translateX(-50%); z-index:1;
  }

  .tsb-magnifier {
    position:absolute; left:50%; top:50%;
    width:160px; height:160px;
    transform:translate(-50%,-50%);
    z-index:20; pointer-events:none;
  }
  .tsb-magnifier-ring {
    position:absolute; inset:0; border-radius:50%;
    border:1px solid rgba(212,168,85,0.2);
    animation:tsb-breathe 4s ease-in-out infinite;
  }
  .tsb-magnifier-ring::before {
    content:''; position:absolute; inset:-10px; border-radius:50%;
    border:1px solid rgba(212,168,85,0.06);
    animation:tsb-breathe 4s ease-in-out infinite reverse;
  }
  .tsb-magnifier-ring::after {
    content:''; position:absolute; inset:6px; border-radius:50%;
    border:1px solid rgba(212,168,85,0.1);
  }
  @keyframes tsb-breathe {
    0%,100% { transform:scale(1); opacity:0.6; }
    50% { transform:scale(1.04); opacity:1; }
  }
  .tsb-magnifier-glass {
    position:absolute; inset:12px; border-radius:50%;
    background:radial-gradient(circle,rgba(212,168,85,0.06) 0%,rgba(212,168,85,0.02) 50%,transparent 70%);
    backdrop-filter:blur(0.5px);
  }
  .tsb-magnifier-content {
    position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }
  .tsb-mag-name {
    font-size:1.8rem; font-weight:700; color:#f0d78c;
    text-align:center; line-height:1.2;
    transition:all 0.4s ease;
    text-shadow:0 0 30px rgba(212,168,85,0.15);
  }
  .tsb-mag-ripple { animation:tsb-nameRipple 0.6s ease; }
  @keyframes tsb-nameRipple {
    0% { transform:scale(1); }
    20% { transform:scale(1.08); }
    40% { transform:scale(0.97); }
    60% { transform:scale(1.03); }
    100% { transform:scale(1); }
  }
  .tsb-mag-index { font-size:0.6rem; color:#5a5244; margin-top:4px; opacity:0.6; }

  .tsb-ripple-wave {
    position:absolute; left:50%; top:50%;
    width:140px; height:140px; border-radius:50%;
    border:1px solid rgba(212,168,85,0.25);
    transform:translate(-50%,-50%) scale(0);
    opacity:0; pointer-events:none; z-index:19;
  }
  .tsb-ripple-animate { animation:tsb-rippleOut 1.2s ease-out forwards; }
  @keyframes tsb-rippleOut {
    0% { transform:translate(-50%,-50%) scale(0.5); opacity:0.5; }
    100% { transform:translate(-50%,-50%) scale(2.5); opacity:0; }
  }

  .tsb-bead-track {
    position:absolute; left:0; right:0; z-index:5;
    transition:transform 0.55s cubic-bezier(0.22,0.85,0.32,1);
    will-change:transform;
  }
  .tsb-bead {
    display:flex; align-items:center; justify-content:center;
    width:100%; height:110px; position:relative; cursor:pointer;
  }
  .tsb-stone {
    width:52px; height:52px; border-radius:50%;
    border:1px solid rgba(212,168,85,0.12);
    background:#0f0f18;
    display:flex; align-items:center; justify-content:center;
    position:relative; z-index:2;
    transition:all 0.55s cubic-bezier(0.22,0.85,0.32,1);
    box-shadow:0 1px 8px rgba(0,0,0,0.3);
  }
  .tsb-stone-name {
    font-size:0.55rem; font-weight:700;
    color:rgba(232,224,208,0.25);
    text-align:center; line-height:1.15;
    transition:all 0.55s ease; padding:0 3px;
  }

  .tsb-bead[data-dist="0"] { opacity:1; }
  .tsb-bead[data-dist="0"] .tsb-stone {
    width:62px; height:62px;
    border-color:rgba(212,168,85,0.35);
    box-shadow:0 0 20px rgba(212,168,85,0.08);
  }
  .tsb-bead[data-dist="0"] .tsb-stone-name { font-size:0.65rem; color:rgba(212,168,85,0.6); }
  .tsb-bead[data-dist="1"] { opacity:0.6; }
  .tsb-bead[data-dist="1"] .tsb-stone { width:50px; height:50px; }
  .tsb-bead[data-dist="1"] .tsb-stone-name { color:rgba(232,224,208,0.2); }
  .tsb-bead[data-dist="2"] { opacity:0.35; }
  .tsb-bead[data-dist="2"] .tsb-stone { width:44px; height:44px; }
  .tsb-bead[data-dist="3"] { opacity:0.18; }
  .tsb-bead[data-dist="3"] .tsb-stone { width:38px; height:38px; }
  .tsb-bead[data-dist="3"] .tsb-stone-name { opacity:0; }
  .tsb-bead[data-dist="far"] { opacity:0.08; }
  .tsb-bead[data-dist="far"] .tsb-stone { width:32px; height:32px; }
  .tsb-bead[data-dist="far"] .tsb-stone-name { opacity:0; }

  .tsb-counted .tsb-stone {
    background:linear-gradient(145deg,rgba(212,168,85,0.1),rgba(212,168,85,0.04));
    border-color:rgba(212,168,85,0.2);
  }
  .tsb-counted[data-dist="0"] .tsb-stone {
    border-color:#b8922e;
    background:linear-gradient(145deg,rgba(212,168,85,0.14),rgba(212,168,85,0.06));
  }
  .tsb-knot {
    position:absolute; left:50%;
    width:3px; height:3px; border-radius:50%;
    background:rgba(212,168,85,0.08);
    transform:translateX(-50%); z-index:1; bottom:-2px;
  }
  .tsb-flash .tsb-stone { animation:tsb-stoneFlash 0.5s ease; }
  @keyframes tsb-stoneFlash {
    0% { box-shadow:0 0 0 0 rgba(212,168,85,0.4); }
    50% { box-shadow:0 0 25px 6px rgba(212,168,85,0.15); }
    100% { box-shadow:0 0 20px rgba(212,168,85,0.08); }
  }

  .tsb-particles { position:absolute; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .tsb-particle {
    position:absolute; border-radius:50%; background:#d4a855; opacity:0;
  }
  .tsb-particle-drift {
    animation:tsb-particleDrift var(--dur) ease-in-out infinite;
    animation-delay:var(--delay);
  }
  @keyframes tsb-particleDrift {
    0% { transform:translateY(0) translateX(0); opacity:0; }
    20% { opacity:var(--peak); }
    80% { opacity:var(--peak); }
    100% { transform:translateY(var(--dy)) translateX(var(--dx)); opacity:0; }
  }

  .tsb-swipe-hint {
    position:absolute; bottom:10px; left:50%;
    transform:translateX(-50%); text-align:center;
    z-index:15; pointer-events:none; transition:opacity 1.5s ease;
  }
  .tsb-hint-hidden { opacity:0; }
  .tsb-swipe-arrow {
    display:block; font-size:1rem; color:#b8922e;
    animation:tsb-hintFloat 2.5s ease-in-out infinite; opacity:0.4;
  }
  @keyframes tsb-hintFloat {
    0%,100% { transform:translateY(0); opacity:0.3; }
    50% { transform:translateY(6px); opacity:0.6; }
  }
  .tsb-swipe-text { font-size:0.5rem; color:#5a5244; }

  .tsb-footer {
    flex-shrink:0; padding:10px 20px 22px;
    display:flex; align-items:center; justify-content:center;
    gap:10px; z-index:10;
  }
  .tsb-btn {
    font-family:'Noto Naskh Arabic',serif;
    border:none; cursor:pointer; border-radius:50px;
    font-weight:600; transition:all 0.2s ease;
    display:flex; align-items:center; justify-content:center; gap:5px;
  }
  .tsb-btn:active { transform:scale(0.93); }
  .tsb-btn-count {
    background:linear-gradient(135deg,#b8922e,#d4a855);
    color:#07070c; padding:13px 34px;
    font-size:0.9rem; flex:1; max-width:190px;
  }
  .tsb-btn-icon {
    width:42px; height:42px;
    background:rgba(212,168,85,0.06);
    border:1px solid rgba(212,168,85,0.1);
    color:#d4a855; font-size:1rem; padding:0;
  }

  .tsb-completion {
    position:fixed; inset:0;
    background:rgba(7,7,12,0.97);
    z-index:100; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    text-align:center; padding:40px;
  }
  .tsb-completion-show { animation:tsb-fadeIn 0.6s ease; }
  @keyframes tsb-fadeIn { from{opacity:0} to{opacity:1} }
  .tsb-completion-ornament {
    font-size:2.5rem; margin-bottom:16px; color:#d4a855;
    animation:tsb-gentlePulse 3s ease-in-out infinite;
  }
  @keyframes tsb-gentlePulse {
    0%,100% { transform:scale(1);opacity:0.7; }
    50% { transform:scale(1.06);opacity:1; }
  }
  .tsb-completion-title {
    font-size:1.4rem; color:#f0d78c; margin:0 0 4px;
    font-family:'Amiri',serif;
  }
  .tsb-completion-sub { font-size:0.8rem; color:#5a5244; margin:0 0 4px; }
  .tsb-completion-round { font-size:0.95rem; color:#d4a855; margin-bottom:28px; }

  @media (max-height:650px) {
    .tsb-bead { height:90px; }
    .tsb-magnifier { width:130px; height:130px; }
    .tsb-mag-name { font-size:1.4rem; }
  }
  @media (min-height:800px) {
    .tsb-bead { height:130px; }
    .tsb-magnifier { width:180px; height:180px; }
    .tsb-mag-name { font-size:2rem; }
  }
`;
