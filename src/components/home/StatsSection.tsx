"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import CountUp from "@/components/ui/CountUp";

/* ------------------------------------------------------------------ */
/*  Stats data                                                         */
/* ------------------------------------------------------------------ */

interface Stat {
  /** The numeric value to count up to. */
  value: number;
  /** Optional suffix displayed after the number (e.g. "+" or "%"). */
  suffix?: string;
  /** Short label shown below the number. */
  label: string;
  /** A one-line description providing context. */
  description: string;
}

const STATS: Stat[] = [
  {
    value: 4,
    label: "Cities",
    description:
      "Walking tours across Chicago, New York, Dallas, and San Francisco",
  },
  {
    value: 9,
    suffix: "+",
    label: "Tour Stops",
    description:
      "Documented sites tracing the physical legacy of structural racism",
  },
  {
    value: 4,
    label: "Podcast Episodes",
    description:
      "Long-form audio pairing community voices with archival research",
  },
  {
    value: 100,
    suffix: "%",
    label: "Youth-Led",
    description:
      "Every tour, episode, and investigation created by young people",
  },
];

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  stat: Stat;
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
  return (
    <ScrollReveal
      delay={index * 0.12}
      direction="up"
    >
      <div className="flex h-full flex-col items-center bg-cream px-6 py-10 text-center">
        {/* Animated number */}
        <span className="font-display text-4xl leading-none text-rust md:text-5xl">
          <CountUp
            end={stat.value}
            duration={2}
            suffix={stat.suffix}
          />
        </span>

        {/* Label */}
        <span className="mt-3 font-body text-sm font-semibold uppercase tracking-wider text-ink">
          {stat.label}
        </span>

        {/* Description */}
        <p className="mt-2 max-w-[18rem] font-body text-sm leading-relaxed text-warm-gray">
          {stat.description}
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function StatsSection() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <p className="text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            By the Numbers
          </p>
          <h2 className="mt-3 text-center font-display text-3xl text-forest md:text-4xl">
            Our Impact So Far
          </h2>
        </ScrollReveal>

        {/* Stats grid — 1px border trick via gap-px on colored bg */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {STATS.map((stat, index) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
