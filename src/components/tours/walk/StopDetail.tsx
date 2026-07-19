"use client";

// ------------------------------------------------------------------
// One stop of the walking tour. Used by both modes: walk mode shows
// a single active stop next to the map, browse mode stacks all of
// them. The transcript is the narration text itself, so listening
// and reading are the same content.
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
  onAudioEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** walk mode shows prev/next rail; browse mode hides it */
  showNav?: boolean;
}

export default function StopDetail({
  stop,
  totalStops,
  distanceMeters,
  headingRef,
  onAudioEnded,
  onPrev,
  onNext,
  showNav = true,
}: StopDetailProps) {
  return (
    <article aria-label={`Stop ${stop.number}. ${stop.title}`}>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
        Stop {stop.number} of {totalStops}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl leading-tight text-forest outline-none md:text-4xl"
      >
        {stop.title}
      </h2>
      <p className="mt-2 font-body text-base text-ink/70">{stop.dek}</p>

      {typeof distanceMeters === "number" && distanceMeters > 45 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-sm border border-border bg-cream-dark/60 px-3 py-1.5 font-body text-xs font-semibold text-ink/70">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="#4A6B8A" strokeWidth="1.5" />
            <circle cx="6" cy="6" r="2" fill="#4A6B8A" />
          </svg>
          {formatWalkDistance(distanceMeters)} from you
        </p>
      )}
      {typeof distanceMeters === "number" && distanceMeters <= 45 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-sm border border-forest/30 bg-forest/10 px-3 py-1.5 font-body text-xs font-semibold text-forest">
          You are here
        </p>
      )}

      {stop.images.map((image) => (
        <figure key={image.src} className="mt-6">
          <div className="overflow-hidden rounded-sm border border-border">
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
            {para}
          </p>
        ))}
      </div>

      {stop.toNext && (
        <div className="mt-8 rounded-sm border border-border bg-cream-dark/60 p-5">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">
            Walk to the next stop &middot; {formatWalkDistance(stop.toNext.distanceMeters)} &middot; about{" "}
            {stop.toNext.minutes} min
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
            {stop.toNext.text}
          </p>
        </div>
      )}

      {showNav && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-sm border border-border bg-cream px-5 py-3 font-body text-xs font-semibold uppercase tracking-widest text-ink/70 transition-colors enabled:hover:border-forest enabled:hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-sm bg-rust px-6 py-3 font-body text-xs font-semibold uppercase tracking-widest text-white transition-colors enabled:hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next stop
          </button>
        </div>
      )}
    </article>
  );
}
