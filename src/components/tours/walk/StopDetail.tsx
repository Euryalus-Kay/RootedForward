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
import Marked from "./Marked";
import YouTubeEmbed from "@/components/ui/YouTubeEmbed";

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

export const gmapsWalkingUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

/** render `**bold**` and `*italic*` inside a transcript paragraph */
function RichText({ text }: { text: string }) {
  return <Marked text={text} />;
}

/** plates anchored to a given paragraph index */
function platesAfter(interrupts: WalkStop["interrupts"], index: number) {
  return (interrupts ?? []).filter((box) => box.after === index);
}

/** every photograph on a stop, in one list, so anchoring can sort
 *  them into the top of the page or into the middle of the story */
function allImages(stop: WalkStop) {
  return stop.nowImage ? [...stop.images, stop.nowImage] : stop.images;
}

/** plates with no anchor, or one pointing past the last paragraph */
function trailingPlates(interrupts: WalkStop["interrupts"], count: number) {
  return (interrupts ?? []).filter(
    (box) => box.after === undefined || box.after >= count
  );
}

/** one red instrument plate, labeled by the mechanism it explains */
function RedPlate({
  box,
  reveal,
}: {
  box: NonNullable<WalkStop["interrupts"]>[number];
  reveal: Record<string, unknown>;
}) {
  return (
    <motion.aside
      aria-label={box.title}
      className="walk-plate-red mt-6 rounded-[3px] px-5 py-5 md:px-6"
      {...reveal}
    >
      <p className="walk-title text-xl font-semibold text-[#7A2416] md:text-2xl">
        {box.title}
      </p>
      <div className="mt-3 space-y-3">
        {box.body.map((para, i) => (
          <p key={i} className="font-body text-[15px] leading-relaxed text-ink/85">
            <RichText text={para} />
          </p>
        ))}
      </div>
    </motion.aside>
  );
}

/** one photograph, matted and captioned */
function SinglePlate({
  image,
  reveal,
}: {
  image: WalkStop["images"][number];
  reveal: Record<string, unknown>;
}) {
  return (
    <motion.figure className="mt-6" {...reveal}>
      <div className="walk-plate rounded-[3px] p-2 md:p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="h-auto w-full object-cover"
        />
        {image.label && (
          <p className="pb-0.5 pt-2 text-center font-display text-[12px] italic tracking-wide text-ink/60">
            {image.label}
          </p>
        )}
      </div>
      <figcaption className="mt-2.5 px-1 font-display text-[13px] italic leading-relaxed text-ink/60">
        {image.credit}
      </figcaption>
    </motion.figure>
  );
}

/** then and now: two photographs of the same ground mounted side by
 *  side like a comparison plate */
function PairPlate({
  images,
  reveal,
}: {
  images: WalkStop["images"];
  reveal: Record<string, unknown>;
}) {
  return (
    <motion.figure className="mt-6" {...reveal}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        {images.map((image) => (
          <div key={image.src} className="walk-plate rounded-[3px] p-2 md:p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
            {image.label && (
              <p className="pb-0.5 pt-2 text-center font-display text-[12px] italic tracking-wide text-ink/60">
                {image.label}
              </p>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-2.5 px-1 font-display text-[13px] italic leading-relaxed text-ink/60">
        {images.map((image) => (
          <span key={image.src} className="block">
            {image.credit}
          </span>
        ))}
      </figcaption>
    </motion.figure>
  );
}

/** a run of photographs anchored to one place on the page. Exactly
 *  two get the side-by-side comparison mat; anything else stacks. */
function Plates({
  images,
  reveal,
}: {
  images: WalkStop["images"];
  reveal: Record<string, unknown>;
}) {
  if (images.length === 0) return null;
  if (images.length === 2) return <PairPlate images={images} reveal={reveal} />;
  return (
    <>
      {images.map((image) => (
        <SinglePlate key={image.src} image={image} reveal={reveal} />
      ))}
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

  // Photographs sort into two places. Anything carrying an `after`
  // index waits for its paragraph; everything else mats up top, with
  // the first historic view paired against the same ground today.
  const imagesAfter = (index: number) =>
    allImages(stop).filter((image) => image.after === index);
  const loose = stop.images.filter((image) => image.after === undefined);
  const looseNow =
    stop.nowImage && stop.nowImage.after === undefined ? stop.nowImage : null;
  const frontPair = looseNow && loose.length > 0 ? [loose[0], looseNow] : null;
  const frontRest = frontPair
    ? loose.slice(1)
    : looseNow
      ? [...loose, looseNow]
      : loose;

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
      {/* in the focused tour the sticky stop bar above carries the
          number, arrows, and Directions, so this header slims down */}
      {!focusChrome && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm font-semibold text-rust">
            {stop.optional
              ? "Optional detour"
              : `Stop ${stop.number} of ${totalStops}`}
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
      )}

      <h2
        ref={headingRef}
        tabIndex={-1}
        className={`walk-title text-3xl font-semibold leading-tight text-forest outline-none md:text-4xl ${
          focusChrome ? "mt-0" : "mt-3"
        }`}
      >
        {stop.title}
      </h2>
      <p className="mt-2 font-body text-lg text-ink/70">{stop.dek}</p>

      {/* Where a stop has a film, it opens the stop. The written and
          spoken versions of the same ground follow underneath, so
          nothing is only available by video. */}
      {stop.video && (
        <div className="mt-6">
          <h3 className="walk-title inline-block bg-forest px-5 py-3 text-2xl font-semibold text-cream">
            Watch this stop
          </h3>
          <div className="mt-3 overflow-hidden rounded-[2px] border border-border">
            <YouTubeEmbed
              id={stop.video.youtubeId}
              title={stop.video.title}
              poster={stop.video.poster}
              tone="light"
            />
          </div>
          <p className="walk-title mt-4 inline-block bg-forest px-5 py-3 text-2xl font-semibold text-cream">
            Read more in depth below
          </p>
        </div>
      )}

      {/* photographs with no paragraph anchor stay at the top of the
          stop, the historic view paired with the same ground today */}
      {frontPair && <PairPlate images={frontPair} reveal={reveal} />}
      {frontRest.map((image) => (
        <SinglePlate key={image.src} image={image} reveal={reveal} />
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

      {/* the story, with each red plate and each anchored photograph
          set after the paragraph that sets it up, so nothing stacks
          back to back and no picture arrives before its sentence */}
      <div className="mt-6 space-y-4">
        {stop.transcript.map((para, i) => (
          <div key={i} className="space-y-4">
            <p className="font-body text-base leading-relaxed text-ink/80">
              <RichText text={para} />
            </p>
            <Plates images={imagesAfter(i)} reveal={reveal} />
            {platesAfter(stop.interrupts, i).map((box) => (
              <RedPlate key={box.title} box={box} reveal={reveal} />
            ))}
          </div>
        ))}
      </div>

      {/* plates without a paragraph anchor keep the older behavior and
          land after the whole story */}
      {trailingPlates(stop.interrupts, stop.transcript.length).map((box) => (
        <RedPlate key={box.title} box={box} reveal={reveal} />
      ))}

      {/* one plate carries the whole hand-off: where you are going,
          how to walk there, the maps link, and the controls */}
      {stop.toNext ? (
        <motion.div className="walk-plate mt-8 rounded-[3px] p-5" {...reveal}>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            Next stop
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-body text-lg font-semibold text-ink">
              {nextStop ? nextStop.title : ""}
            </p>
            <p className="shrink-0 font-body text-sm text-ink/60">
              {stop.toNext.minutes} min walk &middot;{" "}
              {formatWalkDistance(stop.toNext.distanceMeters)}
            </p>
          </div>
          <p className="mt-2 font-body text-base leading-relaxed text-ink/75">
            {stop.toNext.text}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/15 pt-4">
            {showNav && onNext && (
              <button
                type="button"
                onClick={onNext}
                className="rounded-[3px] bg-rust px-7 py-3 font-body text-sm font-semibold text-white shadow-[4px_4px_0_0_rgba(27,58,45,0.15)] transition-all hover:-translate-y-0.5 hover:bg-rust-dark motion-reduce:transition-none"
              >
                Next stop
              </button>
            )}
            {nextStop && (
              <a
                href={gmapsWalkingUrl(nextStop.lat, nextStop.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-ink/25 bg-white px-4 py-2.5 font-body text-sm font-medium text-forest transition-colors hover:border-forest/60"
              >
                <PinIcon className="text-rust" />
                Open in Google Maps
              </a>
            )}
            {showNav && onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="ml-auto rounded-[3px] px-3 py-2.5 font-body text-sm font-medium text-ink/60 transition-colors hover:text-forest"
              >
                Back
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        showNav &&
        onPrev && (
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/60 pt-6">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-[3px] border border-ink/25 bg-white px-6 py-3 font-body text-sm font-medium text-ink/70 transition-colors hover:border-forest/60 hover:text-forest"
            >
              Previous stop
            </button>
            <p className="font-display text-sm italic text-ink/60">
              End of the walk
            </p>
          </div>
        )
      )}
    </article>
  );
}
