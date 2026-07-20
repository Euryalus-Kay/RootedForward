"use client";

// ------------------------------------------------------------------
// One stop of the walking tour. Used by both modes: walk mode shows
// a single active stop next to the map, browse mode stacks all of
// them. Styled like a catalog plate: a hand-drawn vignette over the
// title, matted photographs, engraved frames, one quiet Directions
// ticket. Content first, no badges, no stamps.
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
  /** true when the focused tour chrome is around this stop; the top
      bar and transport bar then carry stop count and play control on
      phones, so this panel drops its own duplicates there */
  focusChrome?: boolean;
}

const gmapsWalkingUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

/** render `**bold**` spans inside a transcript paragraph */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
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
  focusChrome = false,
}: StopDetailProps) {
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <article aria-label={`Stop ${stop.number}. ${stop.title}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`font-body text-sm font-semibold text-rust ${
            focusChrome ? "hidden md:block" : ""
          }`}
        >
          Stop {stop.number} of {totalStops}
        </p>
        <div className="ml-auto flex items-center gap-3">
          {typeof distanceMeters === "number" && distanceMeters > 45 && (
            <span className="font-body text-sm text-ink/70">
              {formatWalkDistance(distanceMeters)} away
            </span>
          )}
          {typeof distanceMeters === "number" && distanceMeters <= 45 && (
            <span className="font-body text-sm font-semibold text-forest">
              You are here
            </span>
          )}
          {/* no point in directions to a stop the walker is standing at */}
          {!(typeof distanceMeters === "number" && distanceMeters <= 45) && (
            <a
              href={gmapsWalkingUrl(stop.lat, stop.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-ink/25 bg-white px-4 py-2 font-body text-sm font-medium text-forest transition-colors hover:border-forest/60"
            >
              <PinIcon className="text-rust" />
              Directions
            </a>
          )}
        </div>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl leading-tight text-forest outline-none md:text-4xl"
      >
        {stop.title}
      </h2>
      <p className="mt-2 font-body text-lg text-ink/70">{stop.dek}</p>

      {stop.images.map((image) => (
        <motion.figure key={image.src} className="mt-6" {...reveal}>
          <div className="walk-plate rounded-[3px] p-2 md:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
          <figcaption className="mt-2.5 px-1 font-display text-[13px] italic leading-relaxed text-ink/60">
            {image.credit}
          </figcaption>
        </motion.figure>
      ))}

      <div className="mt-6">
        {stop.audioSrc ? (
          <AudioPlayer
            src={stop.audioSrc}
            seconds={stop.audioSeconds}
            playerId={stop.id}
            label={`Play stop ${stop.number}, ${stop.title}`}
            onEnded={onAudioEnded}
            compact={focusChrome}
          />
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {stop.transcript.map((para, i) => (
          <p key={i} className="font-body text-base leading-relaxed text-ink/80">
            <RichText text={para} />
          </p>
        ))}
      </div>

      {/* worth a look */}
      <motion.p
        className="walk-plate-brass mt-6 rounded-[3px] px-5 py-4 font-body text-base leading-relaxed text-ink/90"
        {...reveal}
      >
        <strong className="font-semibold text-ink">Worth a look.</strong>{" "}
        {stop.lookFor}
      </motion.p>

      {stop.toNext && (
        <motion.div className="walk-plate mt-6 rounded-[3px] p-5" {...reveal}>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-body text-base font-semibold text-ink">
              {nextStop ? nextStop.title : "Next stop"}
            </p>
            <p className="shrink-0 font-body text-sm text-ink/60">
              {stop.toNext.minutes} min walk &middot;{" "}
              {formatWalkDistance(stop.toNext.distanceMeters)}
            </p>
          </div>
          <p className="mt-2 font-body text-base leading-relaxed text-ink/75">
            {stop.toNext.text}
          </p>
          {nextStop && (
            <a
              href={gmapsWalkingUrl(nextStop.lat, nextStop.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-ink/25 bg-white px-4 py-2 font-body text-sm font-medium text-forest transition-colors hover:border-forest/60"
            >
              <PinIcon className="text-rust" />
              Open this leg in Google Maps
            </a>
          )}
        </motion.div>
      )}

      {showNav && (
        <div
          className={`mt-8 items-center justify-between gap-4 border-t border-border/60 pt-6 ${
            focusChrome ? "hidden md:flex" : "flex"
          }`}
        >
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-[3px] border border-ink/25 bg-white px-6 py-3 font-body text-sm font-medium text-ink/70 transition-colors enabled:hover:border-forest/60 enabled:hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-[3px] bg-rust px-7 py-3 font-body text-sm font-semibold text-white shadow-[4px_4px_0_0_rgba(27,58,45,0.15)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-rust-dark motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next stop
          </button>
        </div>
      )}
    </article>
  );
}
