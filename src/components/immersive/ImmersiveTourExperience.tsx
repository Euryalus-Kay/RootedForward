"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import PanoViewer from "./PanoViewer";
import TimelinePlayer from "./TimelinePlayer";
import StopMap from "./StopMap";
import type { ImmersiveTour } from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  ImmersiveTourExperience: the 2D/3D hybrid tour reader.             */
/*                                                                     */
/*  Mostly 2D: each stop is a written chapter with facts and sources,  */
/*  navigated by a depth rail. Stops that carry 360 media open a       */
/*  look-around moment inline; stops with a Studio sequence play the   */
/*  edited hybrid cut.                                                 */
/* ------------------------------------------------------------------ */

const MEDIUM_LABEL: Record<ImmersiveTour["medium"], string> = {
  underwater: "Underwater",
  street: "Street level",
  aerial: "Aerial",
};

const railLabel =
  "font-body text-[11px] font-semibold uppercase tracking-[0.2em]";

export default function ImmersiveTourExperience({
  tour,
}: {
  tour: ImmersiveTour;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = sections.indexOf(entry.target as HTMLElement);
          if (idx >= 0) setActiveIndex(idx);
        }
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [tour.stops.length]);

  const scrollTo = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const lookAroundCount = useMemo(
    () => tour.stops.filter((s) => s.media).length,
    [tour.stops]
  );

  return (
    <div className="bg-cream">
      {/* Provenance note */}
      {tour.heroNote && (
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <div className="rounded-sm border-l-4 border-rust bg-cream-dark px-5 py-3">
            <p className="font-body text-sm leading-relaxed text-ink/70">
              {tour.heroNote}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[250px_1fr] lg:gap-14">
          {/* Depth rail */}
          <nav
            aria-label="Tour stops"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            {/* Mobile: horizontal chips */}
            <ol className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {tour.stops.map((stop, i) => (
                <li key={stop.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollTo(i)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-wider transition-colors",
                      i === activeIndex
                        ? "border-rust bg-rust text-white"
                        : "border-border bg-cream text-ink/70 hover:border-rust/50"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                </li>
              ))}
            </ol>

            {/* Desktop: interactive stop map + vertical depth gauge */}
            <div className="hidden lg:block">
              <div className="mb-5">
                <StopMap
                  stops={tour.stops.map((s) => ({
                    id: s.id,
                    title: s.title,
                    lat: s.lat,
                    lng: s.lng,
                    kicker: s.kicker,
                  }))}
                  activeIndex={activeIndex}
                  onSelect={scrollTo}
                />
              </div>
              <div className="flex items-baseline justify-between border-b border-border pb-3">
                <span className={cn(railLabel, "text-warm-gray")}>Route</span>
                <span className={cn(railLabel, "text-warm-gray")}>
                  {MEDIUM_LABEL[tour.medium]}
                </span>
              </div>
              <ol className="relative mt-4 space-y-1 border-l border-border pl-5">
                {tour.stops.map((stop, i) => {
                  const active = i === activeIndex;
                  return (
                    <li key={stop.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-[23px] top-3 h-[7px] w-[7px] rounded-full border transition-colors",
                          active
                            ? "border-rust bg-rust"
                            : "border-warm-gray/50 bg-cream"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => scrollTo(i)}
                        className={cn(
                          "block w-full rounded-sm px-2 py-2 text-left transition-colors hover:bg-cream-dark/70",
                          active && "bg-cream-dark/70"
                        )}
                      >
                        <span
                          className={cn(
                            "block font-body text-[13px] font-semibold leading-snug",
                            active ? "text-rust" : "text-forest"
                          )}
                        >
                          {String(i + 1).padStart(2, "0")} &middot;{" "}
                          {stop.title}
                        </span>
                        {stop.depthLabel && (
                          <span
                            className={cn(
                              railLabel,
                              "mt-0.5 block text-warm-gray"
                            )}
                          >
                            {stop.depthLabel}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 border-t border-border pt-4">
                <p className={cn(railLabel, "text-warm-gray")}>
                  {tour.stops.length} stops &middot; {lookAroundCount}{" "}
                  look-around
                </p>
              </div>
            </div>
          </nav>

          {/* Stops */}
          <div className="min-w-0">
            {tour.stops.map((stop, i) => (
              <section
                key={stop.id}
                id={stop.id}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className={cn(
                  "scroll-mt-24",
                  i > 0 && "mt-16 border-t border-border pt-14 md:mt-20"
                )}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className={cn(railLabel, "text-warm-gray")}>
                    Stop {String(i + 1).padStart(2, "0")}
                    {stop.kicker ? ` / ${stop.kicker}` : ""}
                  </p>
                  {stop.depthLabel && (
                    <p className={cn(railLabel, "text-rust")}>
                      {stop.depthLabel}
                    </p>
                  )}
                </div>

                <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-forest md:text-4xl">
                  {stop.title}
                </h2>

                <p className="mt-6 max-w-[62ch] font-body text-lg leading-relaxed text-ink/80">
                  {stop.body}
                </p>

                {/* Look-around moment */}
                {stop.media && (
                  <div className="mt-10">
                    <PanoViewer media={stop.media} label={stop.title} />
                    <p className={cn(railLabel, "mt-3 text-warm-gray")}>
                      Look around / drag the frame
                      {stop.media.kind === "video360"
                        ? ", 360 video"
                        : ", 360 photo"}
                    </p>
                  </div>
                )}

                {/* Studio sequence */}
                {stop.sequence && stop.sequence.segments.length > 0 && (
                  <div className="mt-10">
                    <TimelinePlayer doc={stop.sequence} />
                    <p className={cn(railLabel, "mt-3 text-warm-gray")}>
                      Edited sequence / {stop.sequence.title}
                    </p>
                  </div>
                )}

                {/* Facts */}
                {stop.facts && stop.facts.length > 0 && (
                  <div className="mt-10 rounded-sm border border-border bg-cream-dark/50">
                    <div className="border-b border-border px-5 py-3">
                      <span className={cn(railLabel, "text-warm-gray")}>
                        On the record
                      </span>
                    </div>
                    <ul className="divide-y divide-border">
                      {stop.facts.map((fact, fi) => (
                        <li
                          key={fi}
                          className="flex items-baseline gap-4 px-5 py-3"
                        >
                          <span
                            className={cn(railLabel, "shrink-0 text-rust")}
                          >
                            {String(fi + 1).padStart(2, "0")}
                          </span>
                          <span className="font-body text-sm leading-relaxed text-ink/75">
                            {fact}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {stop.sources.length > 0 && (
                  <div className="mt-8">
                    <p
                      className={cn(
                        "font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray"
                      )}
                    >
                      Sources
                    </p>
                    <ol className="mt-3 space-y-2">
                      {stop.sources.map((source, si) => (
                        <li
                          key={si}
                          className="flex items-baseline gap-3 font-body text-sm leading-relaxed text-ink/60"
                        >
                          <span
                            className={cn(
                              railLabel,
                              "shrink-0 text-warm-gray"
                            )}
                          >
                            {String(si + 1).padStart(2, "0")}
                          </span>
                          <span>{source}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Closer: cross-link to the street-level tours */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-4 px-6 py-10">
          <p className="font-body text-base text-ink/70">
            The same history runs at street level. Walk it stop by stop.
          </p>
          <Link
            href="/tours"
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            <span>All tours</span>
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
