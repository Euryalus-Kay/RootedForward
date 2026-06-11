"use client";

/* Headline reveal: each word rises out of its own clip box with a
   slight stagger. Reads as letterpress, not as a web animation. */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function WordReveal({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  step = 0.045,
  once = true,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  step?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, amount: 0.6 });
  const words = text.split(" ");

  return (
    <Tag ref={ref as never} className={cn(className)} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "110%" }}
            animate={inView ? { y: 0 } : { y: "110%" }}
            transition={{ duration: 0.85, delay: delay + i * step, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? <span>&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}
