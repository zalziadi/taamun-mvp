"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export default function Journey() {
  const ref = useRef<HTMLElement | null>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const raw = (vh - rect.top) / (rect.height - vh);
        setP(clamp01(raw));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const s1 = p < 0.33;
  const s2 = p >= 0.33 && p < 0.66;
  const s3 = p >= 0.66;

  const topOpacity = 0.18 * (1 - p);
  const bg = `linear-gradient(
    rgba(17,17,17,${topOpacity}),
    rgba(248,244,237,1)
  )`;

  return (
    <section ref={ref} className="journey" style={{ background: bg }}>
      <div className="journey-inner">
        <div className="journey-head">
          <h2 className="journey-title">الرحلة</h2>
          <p className="journey-sub">مو كلام. هذا انتقال محسوس.</p>
        </div>

        <div className="track">
          <div className="track-line" />
          <div className="track-progress" style={{ width: `${p * 100}%` }} />
          <div className="nodes">
            <div className={`node ${s1 ? "active" : ""}`}>
              <div className="dot" />
              <div className="label">
                <div className="name">الظل</div>
                <div className="desc">شوف الواقع كما هو.</div>
              </div>
            </div>

            <div className={`node ${s2 ? "active" : ""}`}>
              <div className="dot" />
              <div className="label">
                <div className="name">الهدية</div>
                <div className="desc">استخرج المعنى بدل المقاومة.</div>
              </div>
            </div>

            <div className={`node ${s3 ? "active" : ""}`}>
              <div className="dot" />
              <div className="label">
                <div className="name">أفضل احتمال</div>
                <div className="desc">تصرف كنسختك الأعلى.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="journey-card">
          <div className="card-title">
            {s1 ? "سؤال الظل" : s2 ? "سؤال الهدية" : "سؤال أفضل احتمال"}
          </div>
          <div className="card-body">
            {s1
              ? "ما الذي أراه الآن… ولا أريد الاعتراف به؟"
              : s2
                ? "لو هذا الموقف يحمل رسالة… ما هي؟"
                : "ما أصغر خطوة تُثبت أني أعيش النور الآن؟"}
          </div>
        </div>

        <div className="journey-cta">
          <Link href="/day/1" className="journey-btn">
            ابدأ يومك الأول
          </Link>
          <span className="journey-hint">اسحب للأسفل… وخلك حاضر.</span>
        </div>
      </div>
    </section>
  );
}
