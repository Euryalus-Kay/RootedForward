"use client";

/* Viewport-triggered reveals. Two looks:
   - default: rise + fade with the house easing
   - mask: content wipes up from behind a clip edge (for headings,
     images, anything that should feel printed onto the page)
   Use `stagger` on a parent Reveal to cascade direct children. */

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  mask?: boolean;
  once?: boolean;
  amount?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  mask = false,
  once = true,
  amount = 0.25,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount, margin: "0px 0px -8% 0px" });

  if (mask) {
    return (
      <div ref={ref} className={cn("overflow-hidden", className)}>
        <motion.div
          initial={{ y: "104%" }}
          animate={inView ? { y: 0 } : { y: "104%" }}
          transition={{ duration: 0.9, delay, ease: EASE }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Cascades its direct children with a per-child delay. */
export function RevealGroup({
  children,
  className,
  step = 0.08,
  y = 24,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  y?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * step} y={y}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
