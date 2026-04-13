"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ParallaxSectionProps {
  /** Content to render inside the parallax container. */
  children: ReactNode;
  /**
   * Parallax intensity — a value between 0 and 1.
   * 0 = no effect, 1 = very pronounced.
   * Default is 0.3 which gives a subtle, comfortable feel.
   */
  speed?: number;
  /** Additional class names for the outer wrapper. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ParallaxSection({
  children,
  speed = 0.3,
  className,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Map scroll progress to a vertical translation.
  // A speed of 0.3 means the content shifts between -30px and +30px
  // relative to the normal scroll position.
  const yRange = 100 * speed;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [yRange, -yRange]
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
