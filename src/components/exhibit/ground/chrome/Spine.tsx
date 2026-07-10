"use client";
/* ------------------------------------------------------------------ */
/*  The Spine, a 3px rule at the left screen edge doubling as scroll   */
/*  progress. Surveyor ink from 1832; it turns D-red for the rest of   */
/*  the read at the scroll position where the federal letterhead       */
/*  appears (the ch6 chapter head). One rAF-throttled passive scroll   */
/*  listener; everything else is CSS.                                  */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";

export default function Spine() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let redAt = 0.55;
    const measure = () => {
      const ch6 = document.getElementById("ch6");
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (ch6 && total > 0) {
        redAt = Math.min(0.98, Math.max(0.02, ch6.offsetTop / total));
      }
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
        el.style.setProperty("--gp", p.toFixed(4));
        el.dataset.red = p >= redAt ? "on" : "off";
      });
    };
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="ground-spine" data-testid="ground-spine" aria-hidden="true">
      <div className="ground-spine-fill" />
    </div>
  );
}
