"use client";

/* Site-wide smooth scrolling via Lenis, plus a shared framer-motion
   config. Respects prefers-reduced-motion (no smoothing, instant
   reveals). Pauses itself whenever a modal locks body scroll. */

import { type ReactNode, useEffect } from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({ lerp: 0.115, wheelMultiplier: 1 });

    let rafId = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    });

    /* Modals on this site lock scroll by setting body.style.overflow.
       Lenis must stop while they are open or wheel events keep moving
       the page underneath. */
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") {
        lenis.stop();
      } else {
        lenis.start();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
