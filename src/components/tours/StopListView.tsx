"use client";

import Link from "next/link";
import type { TourStop } from "@/lib/types/database";

interface StopListViewProps {
  stops: TourStop[];
  city: string;
}

export default function StopListView({ stops, city }: StopListViewProps) {
  if (stops.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-white/40 p-8 text-center">
        <p className="font-body text-warm-gray">
          No published stops for this city yet.
        </p>
      </div>
    );
  }

  return (
    <ol
      className="divide-y divide-border border border-border bg-white/40"
      role="list"
      aria-label={`Tour stops in ${city}`}
    >
      {stops.map((stop, index) => (
        <li key={stop.slug}>
          <Link
            href={`/tours/${city}/${stop.slug}`}
            className="group flex items-start gap-5 px-6 py-6 transition-colors hover:bg-cream-dark/50"
          >
            <span
              className="index-numeral pt-0.5 text-2xl text-rust/40 transition-colors group-hover:text-rust"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl leading-snug text-forest transition-colors group-hover:text-rust md:text-2xl">
                {stop.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/60">
                {stop.description.length > 120
                  ? `${stop.description.slice(0, 120)}...`
                  : stop.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-rust">
                <span>Visit this stop</span>
                <span aria-hidden="true" className="arrow-nudge">
                  &rarr;
                </span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
