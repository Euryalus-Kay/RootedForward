"use client";

// ------------------------------------------------------------------
// A place worth going that is not on the route.
//
// Harlem needed this and Hyde Park did not. New York's racial
// covenants were taken to court in Queens rather than Manhattan, so
// the legal half of the Harlem story sits an hour away in St. Albans
// and cannot be walked to. It gets its own narrated piece, printed
// after the practical cards and outside the numbered stops so nobody
// mistakes it for a stop they missed.
// ------------------------------------------------------------------
import type { WalkDayTrip } from "@/lib/tours/walk-types";
import AudioPlayer from "./AudioPlayer";
import { marked } from "./Marked";

export default function DayTripCard({ dayTrip }: { dayTrip: WalkDayTrip }) {
  return (
    <section
      id="day-trip"
      aria-label={dayTrip.title}
      className="scroll-mt-16 border-t border-border bg-cream py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Not on the route
        </p>
        <h2 className="walk-title mt-3 text-3xl font-semibold text-forest md:text-4xl">
          {dayTrip.title}
        </h2>
        <p className="mt-3 max-w-[58ch] font-display text-lg italic text-ink/65">
          {dayTrip.dek}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-[62ch] space-y-4 font-body text-base leading-relaxed text-ink/80">
            {dayTrip.body.map((para, i) => (
              <p key={i}>{marked(para, `daytrip-${i}`)}</p>
            ))}
          </div>

          <div className="md:pt-1">
            <div className="walk-plate rounded-[3px] p-5">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-ink/55">
                Listen
              </p>
              <div className="mt-3">
                <AudioPlayer
                  src={dayTrip.audioSrc}
                  seconds={dayTrip.audioSeconds}
                  playerId="day-trip"
                  label={`Play ${dayTrip.title}`}
                />
              </div>
            </div>

            {dayTrip.sources && dayTrip.sources.length > 0 && (
              <div className="mt-6">
                <p className="font-body text-sm font-semibold text-ink/80">
                  Sources
                </p>
                <ul className="mt-1.5">
                  {dayTrip.sources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block py-1 font-body text-sm text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
                      >
                        {src.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
