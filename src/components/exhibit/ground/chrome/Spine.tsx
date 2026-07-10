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
    let raf = 0;
    /* redAt is recomputed on every frame (two cheap property reads),
       because client scenes keep expanding the document after mount
       and a once-at-mount measure fires the color turn acts early */
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
        el.style.setProperty("--gp", p.toFixed(4));
        /* document offset via the rect (offsetTop would be relative to
           the act's position:relative container); the ink turns when
           the ch6 head crosses the middle of the viewport, the same
           band that activates a step */
        const ch6 = document.getElementById("ch6");
        if (ch6) {
          const ch6Top = ch6.getBoundingClientRect().top + window.scrollY;
          el.dataset.red = window.scrollY + window.innerHeight * 0.5 >= ch6Top ? "on" : "off";
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    /* scenes hydrating below the fold change offsets without a scroll */
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="ground-spine" data-testid="ground-spine" aria-hidden="true">
      <div className="ground-spine-fill" />
    </div>
  );
}
