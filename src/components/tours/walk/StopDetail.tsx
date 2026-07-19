"use client";

// ------------------------------------------------------------------
// One stop of the walking tour. Used by both modes: walk mode shows
// a single active stop next to the map, browse mode stacks all of
// them. The transcript is the narration text itself, so listening
// and reading are the same content. Styled like a museum wall panel:
// oversized ghost numeral, key-fact chips, a gold "what to look for"
// plate, and offset-plate frames instead of soft shadows.
// ------------------------------------------------------------------
import type { Ref } from "react";
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
  return (
    <article aria-label={`Stop ${stop.number}. ${stop.title}`} className="relative">
      {/* oversized ghost numeral, museum-wall style */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 right-0 select-none font-display text-[7rem] leading-none text-forest/[0.07] md:-top-10 md:text-[10rem]"
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

      {/* bolded key facts */}
      <ul className="mt-4 flex flex-wrap gap-2">
        {stop.keyFacts.map((fact) => (
          <li
            key={fact}
            className="rounded-sm border border-border bg-cream px-3 py-1.5 font-body text-xs font-bold text-forest shadow-[3px_3px_0_rgba(27,58,45,0.08)]"
          >
            {fact}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {typeof distanceMeters === "number" && distanceMeters > 45 && (
          <p className="inline-flex items-center gap-2 rounded-sm border border-border bg-cream-dark/60 px-3 py-1.5 font-body text-xs font-semibold text-ink/70">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="#4A6B8A" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="2" fill="#4A6B8A" />
            </svg>
            {formatWalkDistance(distanceMeters)} from you
          </p>
        )}
        {typeof distanceMeters === "number" && distanceMeters <= 45 && (
          <p className="inline-flex items-center gap-2 rounded-sm border border-forest/30 bg-forest/10 px-3 py-1.5 font-body text-xs font-semibold text-forest">
            You are here
          </p>
        )}
        <a
          href={gmapsWalkingUrl(stop.lat, stop.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1C3.9 1 2.25 2.6 2.25 4.65 2.25 7.4 6 11 6 11s3.75-3.6 3.75-6.35C9.75 2.6 8.1 1 6 1Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="6" cy="4.7" r="1.3" fill="currentColor" />
          </svg>
          Walking directions in Google Maps
        </a>
      </div>

      {stop.images.map((image) => (
        <figure key={image.src} className="mt-7">
          <div className="overflow-hidden rounded-sm border border-border bg-cream shadow-[6px_6px_0_rgba(27,58,45,0.07)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
          <figcaption className="mt-2 font-body text-xs leading-relaxed text-ink/70">
            {image.credit}
          </figcaption>
        </figure>
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
      <div className="mt-7 rounded-sm border border-[#C9A227]/45 border-l-4 border-l-[#C9A227] bg-[#C9A227]/10 px-4 py-3.5">
        <p className="flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z" stroke="#A8811C" strokeWidth="1.3" />
            <circle cx="7" cy="7" r="1.9" fill="#A8811C" />
          </svg>
          What to look for
        </p>
        <p className="mt-1.5 font-body text-sm font-medium leading-relaxed text-ink/85">
          {stop.lookFor}
        </p>
      </div>

      {stop.toNext && (
        <div className="mt-7 rounded-sm border border-border bg-cream-dark/60 p-5">
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
              className="mt-3 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1C3.9 1 2.25 2.6 2.25 4.65 2.25 7.4 6 11 6 11s3.75-3.6 3.75-6.35C9.75 2.6 8.1 1 6 1Z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="6" cy="4.7" r="1.3" fill="currentColor" />
              </svg>
              Guide me there in Google Maps
            </a>
          )}
        </div>
      )}

      {showNav && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-sm border border-border bg-cream px-5 py-3 font-body text-xs font-semibold uppercase tracking-widest text-ink/70 transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-forest enabled:hover:text-forest motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-sm bg-rust px-6 py-3 font-body text-xs font-semibold uppercase tracking-widest text-white shadow-[4px_4px_0_rgba(168,70,42,0.25)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-rust-dark motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next stop
          </button>
        </div>
      )}
    </article>
  );
}
