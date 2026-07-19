"use client";

// ------------------------------------------------------------------
// One stop of the walking tour. Used by both modes: walk mode shows
// a single active stop next to the map, browse mode stacks all of
// them. The transcript is the narration text itself, so listening
// and reading are the same content. Glass-and-gradient styling in
// the site palette: frosted pills, soft depth, pill buttons, and a
// prominent Google Maps handoff.
// ------------------------------------------------------------------
import type { Ref } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { WalkStop } from "@/lib/tours/walk-types";
import { formatWalkDistance } from "@/lib/tours/walk-utils";
import AudioPlayer from "./AudioPlayer";

interface StopDetailProps {
  stop: WalkStop;
  totalStops: number;
  /** live distance from the visitor to this stop, meters, if located */
  distanceMeters?: number | null;
  /** walk mode focuses the heading after a stop change */
  headingRef?: Ref<HTMLHeadingElement>;
  /** coordinates of the following stop, for the Google Maps handoff */
  nextStop?: { lat: number; lng: number; title: string };
  onAudioEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** walk mode shows prev/next rail; browse mode hides it */
  showNav?: boolean;
}

const gmapsWalkingUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 1C3.9 1 2.25 2.6 2.25 4.65 2.25 7.4 6 11 6 11s3.75-3.6 3.75-6.35C9.75 2.6 8.1 1 6 1Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="6" cy="4.7" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function StopDetail({
  stop,
  totalStops,
  distanceMeters,
  headingRef,
  nextStop,
  onAudioEnded,
  onPrev,
  onNext,
  showNav = true,
}: StopDetailProps) {
  const reduceMotion = useReducedMotion();
  // initial stays constant so server and client markup agree; reduced
  // motion collapses the animation to an instant reveal instead
  const reveal = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <article aria-label={`Stop ${stop.number}. ${stop.title}`} className="relative">
      {/* soft ghost numeral */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 right-0 select-none bg-gradient-to-b from-forest/10 to-forest/0 bg-clip-text font-display text-[7rem] leading-none text-transparent md:-top-10 md:text-[10rem]"
      >
        {stop.number}
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Stop {stop.number} of {totalStops}
        </p>
        <p className="font-ledger text-[11px] tracking-wide text-ink/70">
          {stop.lat.toFixed(4)}&deg; N &middot; {Math.abs(stop.lng).toFixed(4)}&deg; W
        </p>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl leading-tight text-forest outline-none md:text-4xl"
      >
        {stop.title}
      </h2>
      <p className="mt-2 font-body text-base text-ink/70">{stop.dek}</p>

      {/* bolded key facts as frosted pills */}
      <ul className="mt-5 flex flex-wrap gap-2">
        {stop.keyFacts.map((fact) => (
          <li
            key={fact}
            className="rounded-full border border-white/70 bg-white/50 px-4 py-2 font-body text-xs font-bold text-forest shadow-sm backdrop-blur-md"
          >
            {fact}
          </li>
        ))}
      </ul>

      {/* location row with a real Google Maps button */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={gmapsWalkingUrl(stop.lat, stop.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-br from-forest to-forest-light px-5 py-2.5 font-body text-xs font-bold uppercase tracking-widest text-cream shadow-lg shadow-forest/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/25 motion-reduce:transition-none"
        >
          <PinIcon />
          Take me here
          <span aria-hidden="true" className="text-cream/70">&#8599;</span>
        </a>
        {typeof distanceMeters === "number" && distanceMeters > 45 && (
          <p className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 font-body text-xs font-semibold text-ink/70 shadow-sm backdrop-blur-md">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="#4A6B8A" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="2" fill="#4A6B8A" />
            </svg>
            {formatWalkDistance(distanceMeters)} from you
          </p>
        )}
        {typeof distanceMeters === "number" && distanceMeters <= 45 && (
          <p className="inline-flex items-center gap-2 rounded-full border border-forest/25 bg-forest/10 px-4 py-2 font-body text-xs font-semibold text-forest shadow-sm backdrop-blur-md">
            You are here
          </p>
        )}
      </div>

      {stop.images.map((image) => (
        <motion.figure key={image.src} className="mt-7" {...reveal}>
          <div className="overflow-hidden rounded-2xl border border-white/60 shadow-xl shadow-forest/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
          <figcaption className="mt-2.5 px-1 font-body text-xs leading-relaxed text-ink/70">
            {image.credit}
          </figcaption>
        </motion.figure>
      ))}

      <div className="mt-7">
        {stop.audioSrc ? (
          <AudioPlayer
            src={stop.audioSrc}
            seconds={stop.audioSeconds}
            playerId={stop.id}
            label={`Play stop ${stop.number}, ${stop.title}`}
            onEnded={onAudioEnded}
          />
        ) : null}
      </div>

      <div className="mt-7 space-y-4">
        {stop.transcript.map((para, i) => (
          <p key={i} className="font-body text-base leading-relaxed text-ink/80">
            {para}
          </p>
        ))}
      </div>

      {/* what to look for */}
      <motion.div
        className="mt-7 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-[#C9A227]/15 via-white/40 to-white/30 p-5 shadow-lg shadow-forest/5 backdrop-blur-md"
        {...reveal}
      >
        <p className="flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#A8811C] text-cream shadow-md shadow-[#C9A227]/30">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 7s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="7" cy="7" r="1.9" fill="currentColor" />
            </svg>
          </span>
          What to look for
        </p>
        <p className="mt-2.5 font-body text-sm font-medium leading-relaxed text-ink/85">
          {stop.lookFor}
        </p>
      </motion.div>

      {stop.toNext && (
        <motion.div
          className="mt-7 rounded-2xl border border-white/60 bg-white/40 p-5 shadow-lg shadow-forest/5 backdrop-blur-md"
          {...reveal}
        >
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">
            Walk to the next stop &middot; {formatWalkDistance(stop.toNext.distanceMeters)} &middot; about{" "}
            {stop.toNext.minutes} min
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
            {stop.toNext.text}
          </p>
          {nextStop && (
            <a
              href={gmapsWalkingUrl(nextStop.lat, nextStop.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/25 bg-white/60 px-5 py-2.5 font-body text-xs font-bold uppercase tracking-widest text-forest shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md motion-reduce:transition-none"
            >
              <PinIcon className="text-rust" />
              Guide me there in Google Maps
              <span aria-hidden="true" className="text-forest/60">&#8599;</span>
            </a>
          )}
        </motion.div>
      )}

      {showNav && (
        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-full border border-border bg-white/50 px-6 py-3 font-body text-xs font-semibold uppercase tracking-widest text-ink/70 shadow-sm backdrop-blur-md transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-forest/40 enabled:hover:text-forest motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-full bg-gradient-to-br from-rust to-rust-dark px-7 py-3 font-body text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-rust/25 transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl enabled:hover:shadow-rust/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next stop
          </button>
        </div>
      )}
    </article>
  );
}
