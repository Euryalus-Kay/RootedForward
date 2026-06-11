"use client";

/* ------------------------------------------------------------------ */
/*  Home hero                                                          */
/*                                                                     */
/*  Full-screen archival photo with three depth layers that answer     */
/*  the cursor at different rates, a letterpress wordmark reveal,      */
/*  and a slow ticker of the neighborhoods the work is about. The      */
/*  depth effect is springs on pointer position; it degrades to a      */
/*  static composition for touch and reduced motion.                   */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import WordReveal from "@/components/motion/WordReveal";
import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import Marquee from "@/components/motion/Marquee";

const NEIGHBORHOODS = [
  "Bronzeville",
  "North Lawndale",
  "Englewood",
  "Woodlawn",
  "Austin",
  "Little Village",
  "Humboldt Park",
  "East Garfield Park",
  "Pilsen",
  "South Shore",
  "Logan Square",
  "Chatham",
];

const GRADE_COLORS = [
  "bg-grade-a",
  "bg-grade-b",
  "bg-grade-c",
  "bg-grade-d",
] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  /* Pointer-driven depth */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bgX = useSpring(useTransform(mx, [-0.5, 0.5], [10, -10]), {
    stiffness: 60,
    damping: 20,
  });
  const bgY = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 60,
    damping: 20,
  });
  const fgX = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), {
    stiffness: 70,
    damping: 22,
  });
  const fgY = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), {
    stiffness: 70,
    damping: 22,
  });

  /* Scroll-driven exit: photo eases down and dims as the page leaves */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgScrollY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "36%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  function onPointerMove(e: React.PointerEvent) {
    if (reduced || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="grain relative flex h-[100svh] flex-col overflow-hidden bg-ink"
    >
      {/* Photo layer */}
      <motion.div
        className="absolute -inset-[3%] will-change-transform"
        style={reduced ? undefined : { x: bgX, y: bgY }}
      >
        <motion.div
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-full"
          style={{ y: bgScrollY }}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/40 to-ink/80" />

      {/* Wordmark + dek, slightly counter-moving for depth */}
      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center will-change-transform"
        style={
          reduced
            ? undefined
            : { x: fgX, y: fgY, translateY: contentY, opacity: contentOpacity }
        }
      >
        <Reveal y={10}>
          <p className="ledger text-cream/65">
            A youth-led nonprofit &middot; Chicago
          </p>
        </Reveal>

        <h1 className="mt-6 font-display text-[17vw] leading-[0.86] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)] sm:text-[14vw] lg:text-[11rem]">
          <WordReveal text="Rooted" delay={0.1} className="block" />
          <WordReveal text="Forward" delay={0.22} className="block" />
        </h1>

        <Reveal delay={0.5} y={18}>
          <p className="mx-auto mt-8 max-w-xl font-body text-base leading-relaxed text-cream/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-lg">
            What redlining, urban renewal, and highway construction did to
            Chicago&rsquo;s neighborhoods, documented in the open, and what
            we&rsquo;re doing about it.
          </p>
        </Reveal>

        <Reveal delay={0.65} y={16}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Magnetic>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Read the research
              </Link>
            </Magnetic>
            <Link
              href="/tours"
              className="group inline-flex items-center gap-2 rounded-sm border border-cream/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream/70"
            >
              Walk a tour
              <span aria-hidden="true" className="arrow-nudge">
                &rarr;
              </span>
            </Link>
          </div>
        </Reveal>
      </motion.div>

      {/* Neighborhood ticker pinned to the bottom edge */}
      <div className="relative z-10 border-t border-cream/10 bg-ink/40 backdrop-blur-sm">
        <Marquee duration={70} className="py-3.5">
          {NEIGHBORHOODS.map((n, i) => (
            <span key={n} className="flex items-center">
              <span className="ledger px-5 text-cream/55">{n}</span>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 ${GRADE_COLORS[i % 4]}`}
              />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
