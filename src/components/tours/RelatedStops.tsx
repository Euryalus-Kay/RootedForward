"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import type { TourStop } from "@/lib/types/database";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface RelatedStopsProps {
  currentStopId: string;
  city: string;
  allStops: TourStop[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

function cityDisplayName(slug: string): string {
  const map: Record<string, string> = {
    chicago: "Chicago",
    "new-york": "New York",
    dallas: "Dallas",
    "san-francisco": "San Francisco",
  };
  return map[slug] ?? slug;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RelatedStops({
  currentStopId,
  city,
  allStops,
}: RelatedStopsProps) {
  // Filter out the current stop
  const otherStops = allStops.filter((s) => s.id !== currentStopId);

  // Prefer stops from the same city
  const sameCityStops = otherStops.filter((s) => s.city === city);
  const otherCityStops = otherStops.filter((s) => s.city !== city);

  // Build the display list: up to 3 stops, preferring same city
  let displayStops: TourStop[] = [];

  if (sameCityStops.length >= 2) {
    displayStops = sameCityStops.slice(0, 3);
  } else {
    displayStops = [...sameCityStops, ...otherCityStops].slice(0, 3);
  }

  if (displayStops.length === 0) return null;

  return (
    <section className="border-t border-border bg-cream-dark py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal y={16}>
          <p className="eyebrow text-warm-gray">Keep walking</p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Continue exploring
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayStops.map((stop, index) => (
            <Reveal key={stop.id} delay={index * 0.08} y={20}>
              <Link
                href={`/tours/${stop.city}/${stop.slug}`}
                className="group block h-full"
              >
                <article className="card-lift flex h-full flex-col border border-border bg-white/40 p-7">
                  {/* Ledger meta row */}
                  <div className="flex items-baseline justify-between">
                    <span className="ledger text-warm-gray">Tour stop</span>
                    <span className="ledger text-warm-gray">
                      {cityDisplayName(stop.city)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 font-display text-xl leading-snug text-forest transition-colors group-hover:text-rust">
                    {stop.title}
                  </h3>

                  {/* Description excerpt */}
                  <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-ink/70">
                    {truncate(stop.description, 110)}
                  </p>

                  {/* Hairline footer */}
                  <div className="mt-6 border-t border-border pt-4">
                    <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-rust">
                      <span>Visit this stop</span>
                      <span aria-hidden="true" className="arrow-nudge">
                        &rarr;
                      </span>
                    </span>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
