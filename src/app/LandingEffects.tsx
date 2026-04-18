"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * LandingEffects — client island for scroll effects on the landing page.
 * Handles: scroll progress bar, sticky header class, body background override.
 * All static content is rendered by the Server Component — this only adds interactivity.
 */
export function LandingEffects() {
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    const pct =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    setScrollPct(pct);
    setScrolled(window.scrollY > 80);
  }, []);

  useEffect(() => {
    // Body background override
    document.body.style.background = "#0A0908";

    // Scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Toggle header scrolled class
    const header = document.querySelector(".jl-header");
    const updateHeader = () => {
      if (header) {
        header.classList.toggle("scrolled", window.scrollY > 80);
      }
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();

    return () => {
      document.body.style.background = "";
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", updateHeader);
    };
  }, [handleScroll]);

  // Update scroll progress bar via DOM (no re-render of static content)
  useEffect(() => {
    const bar = document.querySelector(".jl-scroll-progress") as HTMLElement;
    if (bar) bar.style.height = `${scrollPct}%`;
  }, [scrollPct]);

  // Initialize reveal observers for below-fold sections
  useEffect(() => {
    const reveals = document.querySelectorAll(".jl-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        // Above fold — already visible
        el.classList.add("visible");
      } else {
        // Below fold — animate on scroll
        el.classList.add("jl-animate");
        obs.observe(el);
      }
    });

    return () => obs.disconnect();
  }, []);

  // This component renders nothing — it only adds side effects
  return null;
}
