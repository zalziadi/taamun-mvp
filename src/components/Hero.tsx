"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TaamunLogo from "@/components/TaamunLogo";

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const maxScroll = 500;
  const progress = Math.min(scrollY / maxScroll, 1);
  const textOpacity = Math.max(0, 1 - progress * 1.2);

  return (
    <section
      className="hero"
      style={{
        background: `linear-gradient(
          rgba(226, 219, 207, ${1 - progress * 0.4}),
          rgba(248, 244, 237, 1)
        )`,
      }}
    >
      <div
        className="logo-parallax"
        style={{ transform: `translateY(${scrollY * -0.1}px)` }}
      >
        <TaamunLogo shadowScale={1 + progress * 0.4} />
      </div>

      <h1
        className="hero-title"
        style={{
          opacity: textOpacity,
          transform: `translateY(${progress * 40}px)`,
        }}
      >
        تمعّن
      </h1>
      <p
        className="hero-sub"
        style={{
          opacity: textOpacity,
        }}
      >
        ٢٨ يوم. آية في اليوم. انتقال واعٍ من الظل إلى أفضل احتمال.
      </p>

      <Link
        href="/day/1"
        className="hero-btn"
        style={{
          opacity: textOpacity,
        }}
      >
        ابدأ التجربة المجانية
      </Link>
    </section>
  );
}
