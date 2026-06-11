"use client";

/* Scroll-linked parallax shift. Wrap any block; it drifts `range`
   pixels over its scroll-through. Positive range moves slower than
   the page (background feel), negative moves faster (foreground). */

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Parallax({
  children,
  range = 60,
  className,
}: {
  children: ReactNode;
  range?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
