"use client";

/* Scroll-linked statement: each word inks in as it crosses the
   reading band, so the mission reads at the pace of the scroll.
   One paragraph, one effect, nothing else competing with it. */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const STATEMENT =
  "Rooted Forward is a youth-led nonprofit in Chicago. We trace what redlining, urban renewal, and highway construction did to the neighborhoods people live in now, and we organize the response. The work runs on three pillars.";

function FillWord({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

export default function MissionStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const words = STATEMENT.split(" ");

  return (
    <section className="grain relative overflow-hidden bg-ink py-24 md:py-36">
      <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
      <div ref={ref} className="relative z-10 mx-auto max-w-4xl px-6">
        <p className="ledger text-rust-light">What we do</p>
        <p className="mt-8 font-display text-[1.7rem] leading-[1.45] text-cream md:text-[2.4rem] md:leading-[1.4]">
          {words.map((word, i) => (
            <FillWord
              key={i}
              word={word}
              progress={scrollYProgress}
              range={[i / words.length, Math.min(1, (i + 6) / words.length)]}
            />
          ))}
        </p>
      </div>
    </section>
  );
}
