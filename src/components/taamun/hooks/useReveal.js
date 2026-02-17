import { useEffect, useRef, useState } from "react";

let sharedRevealObserver = null;
const revealCallbacks = new WeakMap();

function getSharedRevealObserver(threshold) {
  if (sharedRevealObserver) return sharedRevealObserver;
  sharedRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const cb = revealCallbacks.get(entry.target);
        if (cb) cb();
      });
    },
    { threshold, rootMargin: "0px 0px -40px 0px" }
  );
  return sharedRevealObserver;
}

export default function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const obs = getSharedRevealObserver(threshold);
    const onVisible = () => {
      setVisible(true);
      revealCallbacks.delete(el);
      obs.unobserve(el);
    };

    revealCallbacks.set(el, onVisible);
    obs.observe(el);

    return () => {
      revealCallbacks.delete(el);
      obs.unobserve(el);
    };
  }, [visible, threshold]);

  return [ref, visible];
}
