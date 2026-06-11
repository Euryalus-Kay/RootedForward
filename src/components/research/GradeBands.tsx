"use client";

/* ------------------------------------------------------------------ */
/*  GradeBands                                                         */
/*                                                                     */
/*  The HOLC legend as a scroll sequence. The four 1930s security      */
/*  grades draw themselves across the page in order, A through D,      */
/*  each with the wording the appraisal forms actually used. This is   */
/*  the one place the site lets the grading system speak for itself.   */
/* ------------------------------------------------------------------ */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

const GRADES = [
  { letter: "A", label: "Best", className: "bg-grade-a" },
  { letter: "B", label: "Still Desirable", className: "bg-grade-b" },
  { letter: "C", label: "Definitely Declining", className: "bg-grade-c" },
  { letter: "D", label: "Hazardous", className: "bg-grade-d" },
] as const;

function Band({
  grade,
  i,
  progress,
  reduced,
}: {
  grade: (typeof GRADES)[number];
  i: number;
  progress: MotionValue<number>;
  reduced: boolean | null;
}) {
  /* Each band draws across its own slice of the section's scroll. */
  const start = 0.1 + i * 0.16;
  const end = start + 0.3;
  const scaleX = useTransform(progress, [start, end], [0, 1]);
  const labelOpacity = useTransform(
    progress,
    [start + 0.12, end],
    [0, 1]
  );

  return (
    <div className="grid grid-cols-[2.5rem_1fr] items-center gap-4 md:grid-cols-[3.5rem_1fr] md:gap-6">
      <span className="index-numeral text-2xl text-cream/60 md:text-3xl">
        {grade.letter}
      </span>
      <div>
        <motion.div
          style={reduced ? undefined : { scaleX }}
          className={`h-3 w-full origin-left md:h-4 ${grade.className}`}
        />
        <motion.p
          style={reduced ? undefined : { opacity: labelOpacity }}
          className="ledger mt-2 text-cream/55"
        >
          &ldquo;{grade.label}&rdquo;
        </motion.p>
      </div>
    </div>
  );
}

export default function GradeBands() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.88", "end 0.72"],
  });

  return (
    <section
      ref={ref}
      className="grain relative overflow-hidden bg-forest-deep py-20 md:py-28"
      aria-label="The four HOLC security grades, A Best, B Still Desirable, C Definitely Declining, D Hazardous"
    >
      <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        <div className="md:flex md:items-end md:justify-between md:gap-12">
          <div className="max-w-md">
            <p className="ledger text-cream/50">The legend, 1935 to 1940</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-cream md:text-4xl">
              Four grades decided who could borrow
            </h2>
          </div>
          <p className="mt-5 max-w-sm font-body text-sm leading-relaxed text-cream/65 md:mt-0">
            Federal appraisers shaded every neighborhood on the map one of
            four colors. The wording below is the wording the forms used.
            Most of the papers in this archive trace what those four colors
            still predict.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-7 md:mt-16">
          {GRADES.map((g, i) => (
            <Band
              key={g.letter}
              grade={g}
              i={i}
              progress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
