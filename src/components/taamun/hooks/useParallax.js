import { useEffect, useRef, useState } from "react";

export default function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        const next = window.scrollY * speed;
        setOffset((prev) => (prev === next ? prev : next));
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
  }, [speed]);

  return offset;
}
