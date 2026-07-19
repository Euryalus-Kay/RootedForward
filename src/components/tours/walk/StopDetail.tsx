"use client";

// ------------------------------------------------------------------
// One stop of the walking tour. Used by both modes: walk mode shows
// a single active stop next to the map, browse mode stacks all of
// them. Content-first: a clear title, the photo, the player, the
// narration with key details bolded inline, one quiet Directions
// button, and a short "worth a look" note. No badges, no stamps.
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
        <p className="font-body text-sm font-semibold text-rust">
          Stop {stop.number} of {totalStops}
        </p>
        <div className="flex items-center gap-3">
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
          <a
            href={gmapsWalkingUrl(stop.lat, stop.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2 font-body text-sm font-medium text-forest backdrop-blur-md transition-colors hover:border-forest/40 hover:bg-white/80"
          >
            <PinIcon className="text-rust" />
            Directions
          </a>
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

      <div className="mt-6">
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

      <div className="mt-6 space-y-4">
        {stop.transcript.map((para, i) => (
          <p key={i} className="font-body text-base leading-relaxed text-ink/80">
            <RichText text={para} />
          </p>
        ))}
      </div>

      {/* worth a look */}
      <motion.p
        className="mt-6 rounded-2xl border-l-4 border-[#C9A227] bg-[#C9A227]/15 px-5 py-4 font-body text-base leading-relaxed text-ink/90 shadow-sm"
        {...reveal}
      >
        <strong className="font-semibold text-ink">Worth a look.</strong>{" "}
        {stop.lookFor}
      </motion.p>

      {stop.toNext && (
        <motion.div
          className="mt-6 rounded-2xl border border-white/60 bg-white/40 p-5 shadow-lg shadow-forest/5 backdrop-blur-md"
          {...reveal}
        >
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
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2 font-body text-sm font-medium text-forest backdrop-blur-md transition-colors hover:border-forest/40 hover:bg-white/80"
            >
              <PinIcon className="text-rust" />
              Open this leg in Google Maps
            </a>
          )}
        </motion.div>
      )}

      {showNav && (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/60 pt-6">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-full border border-border bg-white/50 px-6 py-3 font-body text-sm font-medium text-ink/70 backdrop-blur-md transition-colors enabled:hover:border-forest/40 enabled:hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-full bg-gradient-to-br from-rust to-rust-dark px-7 py-3 font-body text-sm font-semibold text-white shadow-lg shadow-rust/25 transition-all enabled:hover:-translate-y-0.5 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next stop
          </button>
        </div>
      )}
    </article>
  );
}
