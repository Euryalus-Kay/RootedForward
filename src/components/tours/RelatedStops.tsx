"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Badge from "@/components/ui/Badge";
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
  return text.slice(0, maxLength).trimEnd() + "\u2026";
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
  let showCityLabel = false;

  if (sameCityStops.length >= 2) {
    displayStops = sameCityStops.slice(0, 3);
  } else {
    displayStops = [...sameCityStops, ...otherCityStops].slice(0, 3);
    showCityLabel = otherCityStops.length > 0 && sameCityStops.length < 2;
  }

  if (displayStops.length === 0) return null;

  return (
    <section className="border-t border-border bg-cream py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="font-display text-2xl text-forest md:text-3xl">
            Continue Exploring
          </h2>
          <p className="mt-2 font-body text-base text-warm-gray">
            More stops to discover on your tour.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayStops.map((stop, index) => {
            const isSameCity = stop.city === city;

            return (
              <ScrollReveal
                key={stop.id}
                delay={index * 0.1}
                direction="up"
              >
                <Link
                  href={`/tours/${stop.city}/${stop.slug}`}
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col rounded-lg border border-border bg-cream p-6 transition-shadow hover:shadow-md">
                    {/* City badge when mixing cities */}
                    {showCityLabel && !isSameCity && (
                      <div className="mb-3">
                        <Badge variant="outline" size="sm">
                          More from {cityDisplayName(stop.city)}
                        </Badge>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-display text-lg leading-snug text-forest">
                      {stop.title}
                    </h3>

                    {/* Description excerpt */}
                    <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-ink/65">
                      {truncate(stop.description, 80)}
                    </p>

                    {/* Link hint */}
                    <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-semibold text-rust transition-transform group-hover:translate-x-1">
                      View Stop
                      <ArrowRight size={14} />
                    </span>
                  </article>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
