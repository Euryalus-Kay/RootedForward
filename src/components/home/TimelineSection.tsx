"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import Badge from "@/components/ui/Badge";

/* ------------------------------------------------------------------ */
/*  Timeline data                                                      */
/* ------------------------------------------------------------------ */

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

const TIMELINE_ITEMS: TimelineItem[] = [
  {
    date: "2024 Q1",
    title: "The Spark",
    description:
      "A group of students in Chicago notice redlining maps match modern disinvestment. They start asking: what if everyone could see this?",
  },
  {
    date: "2024 Q2",
    title: "First Walking Tour",
    description:
      "The first walking tour is piloted in Bronzeville, connecting historic HOLC maps to present-day infrastructure gaps.",
  },
  {
    date: "2024 Q3",
    title: "Podcast Launch",
    description:
      "\"The Lines They Drew\" airs its first episode, pairing archival recordings with interviews from lifelong residents.",
  },
  {
    date: "2024 Q4",
    title: "New York Chapter",
    description:
      "Students in New York establish the second Rooted Forward chapter, documenting urban renewal in the South Bronx.",
  },
  {
    date: "2025 Q1",
    title: "Dallas & San Francisco",
    description:
      "Two new chapters launch simultaneously, covering highway displacement in Dallas and Fillmore demolition in San Francisco.",
  },
  {
    date: "2025 Q2",
    title: "Website Launch",
    description:
      "The Rooted Forward website goes live with interactive maps, multimedia tour stops, and podcast episodes.",
  },
  {
    date: "2025 Q3",
    title: "100+ Participants",
    description:
      "Over one hundred people complete walking tours across four cities, sharing what they learn on social media and in classrooms.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TimelineSection() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        {/* Section header */}
        <ScrollReveal>
          <p className="text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Our Journey
          </p>
          <h2 className="mt-3 text-center font-display text-3xl text-forest md:text-4xl">
            How Rooted Forward Grew
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center font-body text-base leading-relaxed text-ink/70">
            From a classroom observation to a multi-city movement, here is the
            story so far.
          </p>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical connector line */}
          <div
            className="absolute left-5 top-0 hidden h-full w-px bg-border md:left-1/2 md:block md:-translate-x-px"
            aria-hidden="true"
          />

          {/* Mobile connector line */}
          <div
            className="absolute left-5 top-0 block h-full w-px bg-border md:hidden"
            aria-hidden="true"
          />

          {/* Items */}
          <div className="flex flex-col gap-12 md:gap-16">
            {TIMELINE_ITEMS.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <ScrollReveal
                  key={item.date}
                  direction={isEven ? "left" : "right"}
                  delay={index * 0.08}
                >
                  <div className="relative flex items-start gap-6 md:gap-0">
                    {/* ---- Mobile layout: dot + content ---- */}
                    <div className="flex flex-shrink-0 md:hidden">
                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-cream">
                        <div className="h-3 w-3 rounded-full bg-rust" />
                      </div>
                    </div>

                    {/* ---- Desktop layout: alternating sides ---- */}

                    {/* Left content (even items) */}
                    <div
                      className={`hidden md:flex md:w-1/2 ${
                        isEven ? "md:justify-end md:pr-10" : ""
                      } ${!isEven ? "md:justify-end md:pr-10" : ""}`}
                    >
                      {isEven ? (
                        <TimelineCard item={item} align="right" />
                      ) : (
                        <div aria-hidden="true" />
                      )}
                    </div>

                    {/* Center dot (desktop) */}
                    <div className="absolute left-1/2 z-10 hidden -translate-x-1/2 md:flex">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-cream shadow-sm">
                        <div className="h-3 w-3 rounded-full bg-rust" />
                      </div>
                    </div>

                    {/* Right content (odd items) */}
                    <div
                      className={`hidden md:flex md:w-1/2 ${
                        !isEven ? "md:pl-10" : ""
                      } ${isEven ? "md:pl-10" : ""}`}
                    >
                      {!isEven ? (
                        <TimelineCard item={item} align="left" />
                      ) : (
                        <div aria-hidden="true" />
                      )}
                    </div>

                    {/* Mobile content */}
                    <div className="flex-1 md:hidden">
                      <TimelineCard item={item} align="left" />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Card                                                      */
/* ------------------------------------------------------------------ */

interface TimelineCardProps {
  item: TimelineItem;
  align: "left" | "right";
}

function TimelineCard({ item, align }: TimelineCardProps) {
  return (
    <div
      className={`max-w-sm rounded-lg border border-border bg-cream p-5 shadow-sm ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <Badge variant="rust" size="sm">
        {item.date}
      </Badge>

      <h3 className="mt-3 font-display text-lg text-forest">
        {item.title}
      </h3>

      <p className="mt-2 font-body text-sm leading-relaxed text-ink/70">
        {item.description}
      </p>
    </div>
  );
}
