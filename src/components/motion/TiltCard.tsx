"use client";

/* Pointer-tracking 3D tilt. Subtle by design: max 6deg, spring-settled,
   with a faint moving sheen. Disabled for touch and reduced motion. */

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export default function TiltCard({
  children,
  className,
  max = 6,
  sheen = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 22 });
  const sy = useSpring(py, { stiffness: 160, damping: 22 });

  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const sheenX = useTransform(sx, [0, 1], ["-40%", "140%"]);

  function onPointerMove(e: React.PointerEvent) {
    if (reduced || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }
  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div style={{ perspective: 900 }} className={cn(className)}>
      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={reduced ? undefined : { rotateX, rotateY }}
        className="relative h-full will-change-transform [transform-style:preserve-3d]"
      >
        {children}
        {sheen && !reduced && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ transform: "translateZ(1px)" }}
          >
            <motion.div
              className="absolute top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
              style={{ left: sheenX }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
