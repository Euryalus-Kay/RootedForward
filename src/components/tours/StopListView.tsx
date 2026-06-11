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
      <div className="rounded-lg border border-border bg-cream-dark p-8 text-center">
        <p className="font-body text-warm-gray">
          No published stops for this city yet.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-0" role="list" aria-label={`Tour stops in ${city}`}>
      {stops.map((stop, index) => (
        <li key={stop.slug} className="border-l-4 border-rust pl-6 py-6 md:pl-8">
          <div className="flex items-start gap-4">
            {/* Stop number */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust/10 font-body text-sm font-semibold text-rust"
              aria-hidden="true"
            >
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={`/tours/${city}/${stop.slug}`}
                className="group block"
              >
                <h3 className="font-display text-xl text-forest transition-colors group-hover:text-forest-light md:text-2xl">
                  {stop.title}
                </h3>
                <p className="mt-2 font-body leading-relaxed text-ink/65">
                  {stop.description.length > 120
                    ? `${stop.description.slice(0, 120)}...`
                    : stop.description}
                </p>
                <span className="mt-3 inline-block font-body text-sm font-semibold text-rust transition-transform group-hover:translate-x-1">
                  View Stop &rarr;
                </span>
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
