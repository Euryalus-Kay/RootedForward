"use client";

/* Thin reading-progress rule pinned under the navbar on long-form
   article pages. Spring-smoothed; invisible until the reader has
   actually started (avoids a stub of rust on page load). */

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      data-print-hide="true"
      style={{ scaleX, opacity }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-rust"
    />
  );
}
