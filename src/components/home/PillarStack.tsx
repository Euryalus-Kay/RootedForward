"use client";

/* ------------------------------------------------------------------ */
/*  Pillar stack                                                       */
/*                                                                     */
/*  The three pillars as full-screen panels that stack: each one       */
/*  pins to the viewport and the next slides over it while the         */
/*  covered panel settles back slightly. Index numerals, a line        */
/*  icon per pillar, and the program list with grade-colored marks.    */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import WordReveal from "@/components/motion/WordReveal";

const ICON_PATHS: Record<string, string> = {
  // open book — learning
  book: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
  // megaphone — advocacy
  megaphone:
    "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46",
  // magnifying glass — investigation
  search:
    "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
};

const PILLARS = [
  {
    index: "01",
    icon: "book",
    title: "Education",
    href: "/education",
    bg: "bg-forest",
    desc: "The story of how American cities got segregated does not fit in one form, so we tell it in three. Walking tours you take on foot, a podcast with the people who lived it, and a free curriculum built for the classroom.",
    items: ["Walking tours", "Podcast", "Curriculum"],
    cta: "See how we teach it",
  },
  {
    index: "02",
    icon: "megaphone",
    title: "Policy",
    href: "/policy",
    bg: "bg-ink",
    desc: "Once you can see how the patterns formed, the question is what to do about the parts still running. We organize that response in Chicago. Sign onto active campaigns, add your name to public comment drives, read the briefs, or send us a proposal of your own.",
    items: [
      "Active campaigns",
      "Public comment drives",
      "Policy briefs",
      "Community proposals",
    ],
    cta: "See active campaigns",
  },
  {
    index: "03",
    icon: "search",
    title: "Research",
    href: "/research",
    bg: "bg-forest-deep",
    desc: "All of it stands on the research. Our team works through the archives, namely HOLC redlining maps, city planning records, and oral history collections, and pairs them with housing, school, and zoning data. We publish the papers and release every dataset so anyone can check the work.",
    items: [
      "Published papers",
      "Primary source archives",
      "Public datasets",
      "Replication files",
    ],
    cta: "Read the research",
  },
];

const GRADE_TEXT = [
  "text-grade-a",
  "text-grade-b",
  "text-grade-c",
  "text-grade-d",
] as const;

function Panel({
  pillar,
  i,
  progress,
}: {
  pillar: (typeof PILLARS)[number];
  i: number;
  progress: MotionValue<number>;
}) {
  /* While the next panel slides over this one, settle it back. */
  const n = PILLARS.length;
  const scale = useTransform(progress, [i / n, (i + 1) / n], [1, 0.94]);
  const radius = useTransform(progress, [i / n, (i + 1) / n], [0, 20]);
  const dim = useTransform(progress, [i / n, (i + 1) / n], [0, 0.35]);
  const isLast = i === n - 1;

  return (
    <div className="sticky top-0 h-[100svh]">
      <motion.section
        style={isLast ? undefined : { scale, borderRadius: radius }}
        className={`grain relative flex h-full items-center overflow-hidden ${pillar.bg} will-change-transform`}
      >
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />

        {/* Oversized index numeral bleeding off the edge */}
        <span
          aria-hidden="true"
          className="index-numeral pointer-events-none absolute -right-6 top-8 select-none text-[11rem] leading-none text-cream/[0.05] md:text-[18rem]"
        >
          {pillar.index}
        </span>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-y-10 px-6 py-20 md:grid-cols-12 md:gap-x-16 lg:px-8">
          <div
            className={`flex flex-col items-start md:col-span-4 ${
              i % 2 === 0 ? "md:order-1" : "md:order-2 md:items-end"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="h-20 w-20 text-rust-light md:h-28 md:w-28"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={ICON_PATHS[pillar.icon]}
              />
            </svg>
            <div className="mt-6 flex items-center gap-3">
              <span className="index-numeral text-sm text-rust-light/80">
                {pillar.index}
              </span>
              <div className="h-px w-12 bg-rust/50" aria-hidden="true" />
            </div>
          </div>

          <div
            className={`md:col-span-8 ${i % 2 === 0 ? "md:order-2" : "md:order-1"}`}
          >
            <WordReveal
              as="h2"
              text={pillar.title}
              className="font-display text-5xl leading-[0.95] text-cream md:text-7xl"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-cream/75 md:text-lg">
                {pillar.desc}
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <ul className="mt-8 grid max-w-lg grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {pillar.items.map((it, j) => (
                  <li
                    key={it}
                    className="flex items-center gap-2.5 font-body text-sm text-cream/85"
                  >
                    <span aria-hidden="true" className={GRADE_TEXT[j % 4]}>
                      &#9632;
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.35}>
              <Link
                href={pillar.href}
                className="group/cta mt-10 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream"
              >
                <span>{pillar.cta}</span>
                <span aria-hidden="true" className="arrow-nudge">
                  &rarr;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Dim veil while being covered */}
        {!isLast && (
          <motion.div
            aria-hidden="true"
            style={{ opacity: dim }}
            className="pointer-events-none absolute inset-0 bg-black"
          />
        )}
      </motion.section>
    </div>
  );
}

export default function PillarStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} className="relative">
      {PILLARS.map((p, i) => (
        <Panel key={p.title} pillar={p} i={i} progress={scrollYProgress} />
      ))}
    </div>
  );
}
