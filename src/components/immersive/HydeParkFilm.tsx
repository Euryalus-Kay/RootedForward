"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PanoViewer from "./PanoViewer";
import type { Media360 } from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  HydeParkFilm: a single, full-screen-able film with a big clickable */
/*  timeline beneath it. Press an event on the timeline and the video  */
/*  jumps there. A 360 / 3D look-around is embedded below as a slot    */
/*  for the owner's on-site capture. The flat MP4 carries placeholders */
/*  for the same moments.                                              */
/* ------------------------------------------------------------------ */

interface Chapter {
  id: string;
  title: string;
  era: string;
  year: number | null;
  startSec: number;
}
interface Pano {
  cid: string;
  startSec: number;
  endSec: number;
}
interface Manifest {
  video: string;
  poster: string;
  duration: number;
  chapters: Chapter[];
  panos?: Pano[];
}

// Real on-site 360 captures (Insta360), keyed to the chapter they live in.
const PANO_MEDIA: Record<string, Media360> = {
  land: {
    kind: "photo360",
    src: "/media/hyde-park/360/founding-rock.jpg",
    poster: "/media/hyde-park/360/founding-rock-poster.jpg",
    initialYawDeg: 0,
    note: "The lakefront where the neighborhood began.",
  },
  university: {
    kind: "photo360",
    src: "/media/hyde-park/360/cobb-hall.jpg",
    poster: "/media/hyde-park/360/cobb-hall-poster.jpg",
    initialYawDeg: 0,
    note: "Outside Cobb Hall, the first building of the University of Chicago.",
  },
  present: {
    kind: "photo360",
    src: "/media/hyde-park/360/modern-quad.jpg",
    poster: "/media/hyde-park/360/modern-quad-poster.jpg",
    initialYawDeg: 0,
    note: "The University of Chicago Gothic quadrangle today.",
  },
};

// Short, single-line labels for the timeline so they never wrap.
const SHORT_LABEL: Record<string, string> = {
  opening: "",
  intro: "The neighborhood",
  land: "The land before",
  formation: "Cornell's bet",
  university: "The University",
  "worlds-fair": "The World's Fair",
  "color-line": "The color line",
  redlining: "Redlining",
  "urban-renewal": "Urban renewal",
  present: "Hyde Park now",
};

// The 360 look-around spots, in film order (each maps to a real capture above).
const REVEAL_SPOTS = [
  { id: "land", location: "Where it began", framing: "Promontory Point and the lakefront." },
  { id: "university", location: "Outside Cobb Hall", framing: "The first building of the University of Chicago." },
  { id: "present", location: "The University of Chicago now", framing: "The Gothic main quadrangle, today." },
];

// One-line context for the clickable timeline's info panel, per chapter.
const CHAPTER_INFO: Record<string, string> = {
  opening: "A South Side neighborhood that powerful institutions kept reshaping, and the people left to wonder who it was for.",
  intro: "Seven miles south of the Loop, Hyde Park runs to Lake Michigan. Almost none of it was here a hundred and seventy years ago.",
  land: "Before Hyde Park, the lakefront was Potawatomi land. After the 1832 Black Hawk War, the U.S. pressed the Three Fires nations into the 1833 Treaty of Chicago, and removal followed.",
  formation: "In 1853 Paul Cornell bought 300 acres, dealt land to the Illinois Central, and sold the new suburb as selective, sorted from the start.",
  university: "Rockefeller's University of Chicago rose in 1890. By 1901 the neighborhood held its value, people said, protected by the parks, the lake, and the university.",
  "worlds-fair": "The 1893 World's Fair built the White City in Jackson Park, staged a racial hierarchy as science, and raised the tracks that split the neighborhood in two.",
  "color-line": "From 1908, a homeowners' club and racially restrictive covenants walled Black families out, with more than $83,000 of the university's money behind them.",
  redlining: "A University of Chicago economist ranked races by their effect on land values. The logic became federal redlining, and spread across the country.",
  "urban-renewal": "In 1958 the university drove an 856-acre renewal that marked 638 buildings to fall and pushed out about 4,000 families.",
  present: "The Obama Center opened in 2026 on the old fairgrounds, as the wealth gap that began with the covenants endures, more than six to one.",
};

// The per-chapter DEEP-DIVE films. The overview is the main film; each of these
// is a separate, longer film (about 10 to 12 minutes) on that one chapter, in
// the same style. `video` is set once a deep-dive has been produced and hosted;
// until then the chapter shows an "in production" state with this intro.
interface DeepDive {
  title: string;
  blurb: string;
  runtime: string;
  video?: string;
  poster?: string;
}
const DEEP_DIVES: Record<string, DeepDive> = {
  land: {
    title: "The Ground Before Hyde Park",
    blurb:
      "Before Paul Cornell, this lakefront was Potawatomi ground, part of the Council of Three Fires. The detailed film traces the 1832 Black Hawk War, the 1833 Treaty of Chicago, the cession of some five million acres, and the removal that cleared the land the suburb would rise on.",
    runtime: "~11 min",
  },
  formation: {
    title: "Paul Cornell's Lakefront Bet",
    blurb:
      "How a young lawyer turned prairie into a selective suburb. The detailed film follows Cornell's 1853 purchase, the sixty acres he handed the Illinois Central for a station and six trains a day, and the price map that sorted the neighborhood from its first decade.",
    runtime: "~11 min",
  },
  university: {
    title: "Rockefeller's University Rises",
    blurb:
      "The University of Chicago rose from John D. Rockefeller's money in 1890. The detailed film covers the founding, Marshall Field's land gift, William Rainey Harper's research university, and how an institution built to last began to shape who could live around it.",
    runtime: "~12 min",
  },
  "worlds-fair": {
    title: "The White City and the Color Line",
    blurb:
      "For six months in 1893 Jackson Park was the White City. The detailed film looks at Burnham and Olmsted's fair, the racial hierarchy it staged as science along the Midway, and the raised Illinois Central embankment that split the neighborhood into Hyde Park East.",
    runtime: "~12 min",
  },
  "color-line": {
    title: "The Color Line Comes to Hyde Park",
    blurb:
      "How the color line was drawn block by block. The detailed film covers the 1908 Hyde Park Improvement Protective Club, the racially restrictive covenants, the more than eighty-three thousand dollars the University of Chicago spent defending them, and the Black Belt those walls created.",
    runtime: "~12 min",
  },
  redlining: {
    title: "The Idea That Redlined a Nation",
    blurb:
      "An idea built in a Hyde Park classroom that walled off the country. The detailed film follows the University of Chicago economist Homer Hoyt, the racial land-value hierarchy he ranked, its journey to Washington as federal redlining, and the 1948 Shelley v. Kraemer ruling.",
    runtime: "~12 min",
  },
  "urban-renewal": {
    title: "The University Rebuilds the Neighborhood",
    blurb:
      "When the university remade the neighborhood. The detailed film traces the 1952 South East Chicago Commission, the 856-acre plan, the 638 buildings marked to fall, the roughly four thousand families displaced, and who was able to come back.",
    runtime: "~12 min",
  },
  present: {
    title: "Hyde Park Now",
    blurb:
      "Hyde Park today, and the ground still moving under it. The detailed film looks at the Obama Presidential Center on the old fairgrounds, the rising prices in Woodlawn, and the wealth gap, more than six to one, that the covenants and contract selling left behind.",
    runtime: "~12 min",
  },
};

// The deep-dive films live as assets on the same public GitHub Release as the
// overview. A chapter's detailed film lights up the moment its id is added to
// DD_AVAILABLE (set once the film has rendered and uploaded).
const DD_RELEASE =
  "https://github.com/Euryalus-Kay/RootedForward/releases/download/hyde-park-film/";
const DD_AVAILABLE = new Set<string>([]);
const ddVideo = (id: string) =>
  DD_AVAILABLE.has(id) ? `${DD_RELEASE}deepdive-${id}.mp4` : undefined;
const ddPoster = (id: string) =>
  DD_AVAILABLE.has(id) ? `/media/hyde-park/video/deepdive-${id}-poster.jpg` : undefined;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function HydeParkFilm({
  title,
  dek,
  heroNote,
  manifest,
}: {
  title: string;
  dek: string;
  heroNote?: string;
  manifest?: Manifest | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const diveRef = useRef<HTMLDivElement>(null);
  const [man, setMan] = useState<Manifest | null>(manifest ?? null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [active, setActive] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [open3d, setOpen3d] = useState(false);
  // which chapter's deep-dive film is open/playing (null = none)
  const [openDive, setOpenDive] = useState<string | null>(null);

  const open3D = useCallback((i?: number) => {
    if (typeof i === "number") setReveal(i);
    videoRef.current?.pause();
    setOpen3d(true);
  }, []);
  const close3D = useCallback(() => {
    setOpen3d(false);
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (man) return; // already provided by the server
    let alive = true;
    fetch("/media/hyde-park/video/chapters.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((m: Manifest) => alive && setMan(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [man]);

  const chapters = man?.chapters ?? [];
  // prefer the manifest duration so marker positions don't shift when the
  // video metadata loads in
  const total = man?.duration || dur || 1;

  // the 360 windows in the film. The "View in 3D" button only appears while one
  // of these is actually on screen, and opens that exact look-around spot.
  const panos = man?.panos ?? [];
  const activePano =
    panos.find((p) => t >= p.startSec - 0.15 && t < p.endSec - 0.05) ?? null;
  const revealForCid = useCallback((cid: string) => {
    const i = REVEAL_SPOTS.findIndex((s) => s.id === cid);
    return i >= 0 ? i : 0;
  }, []);

  const seek = useCallback((sec: number, play = true) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, sec + 0.04);
    if (play) v.play().catch(() => {});
  }, []);

  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    setT(v.currentTime);
    if (chapters.length) {
      let i = 0;
      chapters.forEach((c, idx) => {
        if (v.currentTime >= c.startSec - 0.15) i = idx;
      });
      setActive(i);
    }
  };

  const fullscreen = () => {
    // fullscreen the WRAPPER, not the bare video, so the 3D popup can render
    // over the video while in fullscreen
    const el = wrapRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
      return;
    }
    const v = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  const trackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    seek(frac * total);
  };

  // alternate event labels above / below so they never collide
  const placed = useMemo(
    () =>
      (man?.chapters ?? []).map((c, i) => ({
        ...c,
        leftPct: Math.min(98, Math.max(0, (c.startSec / total) * 100)),
        above: i % 2 === 0,
      })),
    [man, total]
  );

  return (
    <div className="bg-cream">
      {/* Title */}
      <div className="mx-auto max-w-6xl px-6 pt-10 md:pt-14">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          A Rooted Forward film &middot; The overview
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-forest md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-ink/70 md:text-lg">
          {dek}
        </p>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-ink/55">
          Start here. This film tells the whole story in about twelve minutes.
          Then press any chapter on the timeline and scroll down to open its own
          detailed film, a deeper, longer look at that single moment, in the same
          style.
        </p>
      </div>

      {/* The film, full width, fullscreen-able */}
      <div className="mx-auto mt-8 max-w-6xl px-6">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-sm border border-border bg-ink shadow-sm"
        >
          <video
            ref={videoRef}
            className="block aspect-video w-full bg-black"
            src={man?.video}
            poster={man?.poster}
            controls
            controlsList="nofullscreen"
            disablePictureInPicture
            playsInline
            preload="metadata"
            onTimeUpdate={onTime}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          />

          {/* "View in 3D" appears only while a 360 beat is actually on screen,
              and opens that look-around spot. It fades in and out with the beat. */}
          {!open3d && (
            <button
              type="button"
              onClick={() => activePano && open3D(revealForCid(activePano.cid))}
              aria-hidden={!activePano}
              tabIndex={activePano ? 0 : -1}
              className={`absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full bg-rust px-3 py-1.5 font-body text-[11px] font-bold uppercase tracking-widest text-white shadow-lg ring-2 ring-white/30 transition-all duration-500 hover:scale-105 sm:right-3 sm:top-3 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs ${
                activePano
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <span aria-hidden="true" className="rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] leading-none sm:text-[10px]">360&deg;</span>
              View in 3D
            </button>
          )}

          {/* 3D popup, rendered inside the wrapper so it shows in fullscreen */}
          {open3d && (
            <div className="absolute inset-0 z-30 flex flex-col bg-ink/95 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-rust">
                  Look around in 3D &middot; {REVEAL_SPOTS[reveal].location}
                </p>
                <button
                  type="button"
                  onClick={close3D}
                  aria-label="Close 3D view"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white transition-colors hover:bg-white/20"
                >
                  ×
                </button>
              </div>
              <div className="relative min-h-0 flex-1">
                <PanoViewer media={PANO_MEDIA[REVEAL_SPOTS[reveal].id] ?? PANO_MEDIA.land} label={REVEAL_SPOTS[reveal].location} />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
                <span className="mr-1 font-body text-[11px] uppercase tracking-wider text-white/50">
                  Jump to
                </span>
                {REVEAL_SPOTS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setReveal(i)}
                    className={`rounded-full px-3 py-1 font-body text-xs transition-colors ${
                      i === reveal
                        ? "bg-rust text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {s.location}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border bg-cream-dark/60 px-4 py-3">
            <p className="font-body text-sm text-ink/70">
              {chapters[active] ? (
                <>
                  <span className="font-semibold text-forest">
                    {chapters[active].year ?? chapters[active].era}
                  </span>{" "}
                  &middot; {chapters[active].title}
                </>
              ) : (
                "Press play, or jump to any moment on the timeline below"
              )}
            </p>
            <button
              type="button"
              onClick={fullscreen}
              className="inline-flex items-center gap-2 rounded-sm border border-rust px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:bg-rust hover:text-white"
            >
              Watch fullscreen
            </button>
          </div>
        </div>
      </div>

      {/* The big clickable timeline */}
      <div className="mx-auto max-w-6xl px-6 pb-4 pt-12">
        <div className="flex items-baseline justify-between">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            The timeline
          </p>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
            Press a moment to jump there &middot; {fmt(t)} / {fmt(total)}
          </p>
        </div>

        {/* the labels live above and below the track inside this reserved
            height, so they never wrap up into the header */}
        <div className="relative mt-8 h-16 select-none sm:mt-10 sm:h-[132px]">
          <div
            className="group absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 cursor-pointer rounded-full bg-border"
            onClick={trackClick}
            role="slider"
            aria-label="Film timeline"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(t)}
            tabIndex={0}
          >
            {/* progress */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-rust/70"
              style={{ width: `${Math.min(100, (t / total) * 100)}%` }}
            />
            {/* playhead */}
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rust bg-cream shadow"
              style={{ left: `${Math.min(100, (t / total) * 100)}%` }}
            />
            {/* event markers */}
            {placed.map((c, i) => {
              // keep the first and last labels from clipping off the edges
              const edge = c.leftPct <= 6 ? "left" : c.leftPct >= 82 ? "right" : "center";
              const labelPos =
                edge === "left"
                  ? "left-0 text-left"
                  : edge === "right"
                    ? "right-0 text-right"
                    : "left-1/2 -translate-x-1/2 text-center";
              const big = c.year ?? (c.era === "Begin" ? "Start" : "Today");
              const sub = SHORT_LABEL[c.id] ?? c.era;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(i);
                    setOpenDive(null);
                    seek(c.startSec);
                  }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 sm:p-0"
                  style={{ left: `${c.leftPct}%` }}
                  aria-label={`Jump to ${c.title}`}
                >
                  <span
                    className={`block rounded-full border transition-all ${
                      i === active
                        ? "h-4 w-4 border-rust bg-rust"
                        : "h-3 w-3 border-warm-gray/70 bg-cream hover:border-rust hover:bg-rust/30"
                    }`}
                  />
                  <span
                    className={`absolute hidden w-40 whitespace-nowrap sm:block ${labelPos} ${
                      c.above ? "bottom-6" : "top-6"
                    }`}
                  >
                    <span
                      className={`block font-display text-lg leading-none ${
                        i === active ? "text-rust" : "text-forest"
                      }`}
                    >
                      {big}
                    </span>
                    {sub && (
                      <span className="mt-1 block font-body text-[11px] leading-tight text-ink/55">
                        {sub}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* the selected chapter opens its own detailed film here, below the
            timeline, with a short intro. Updates as the playhead crosses
            chapters and on a marker tap. */}
        {chapters[active] && (() => {
          const ch = chapters[active];
          const dive = DEEP_DIVES[ch.id];
          const video = ddVideo(ch.id);
          const poster = ddPoster(ch.id);
          const playing = openDive === ch.id && !!video;
          return (
            <div ref={diveRef} className="mt-8 scroll-mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  {dive ? "Go deeper into this chapter" : "On the timeline"}
                  {ch.year ? ` · ${ch.year}` : ""}
                </p>
                <p className="font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  {dive ? `A detailed film · ${dive.runtime}` : "Part of the overview"}
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                {dive?.title ?? ch.title}
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-[1.5fr_1fr] md:items-start">
                {/* the detailed film, or a poster with its state */}
                <div className="overflow-hidden rounded-sm border border-border bg-ink">
                  {playing ? (
                    <video
                      key={ch.id}
                      className="block aspect-video w-full bg-black"
                      src={video}
                      poster={poster}
                      controls
                      controlsList="nofullscreen"
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!video) return;
                        videoRef.current?.pause();
                        setOpenDive(ch.id);
                      }}
                      className="group relative block w-full cursor-default"
                      aria-label={video ? `Play the detailed film on ${dive.title}` : "Detailed film in production"}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={poster ?? `/media/hyde-park/video/thumbs/${ch.id}.jpg`}
                        alt=""
                        loading="lazy"
                        className="block aspect-video w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = "0";
                        }}
                      />
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-ink/50">
                        {video ? (
                          <>
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rust pl-1 text-2xl leading-none text-white shadow-lg transition-transform group-hover:scale-105">
                              &#9658;
                            </span>
                            <span className="font-body text-xs font-semibold uppercase tracking-widest text-white">
                              Watch the detailed film &middot; {dive.runtime}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="rounded-full border border-white/45 px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-widest text-white/90">
                              {dive ? "Detailed film in production" : "Covered in the overview"}
                            </span>
                            {dive && (
                              <span className="font-body text-xs text-white/65">
                                Planned runtime {dive.runtime}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </button>
                  )}
                </div>

                {/* the intro + actions */}
                <div className="min-w-0">
                  <p className="font-body text-sm leading-relaxed text-ink/75 md:text-base">
                    {dive?.blurb ?? CHAPTER_INFO[ch.id]}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDive(null);
                        seek(ch.startSec);
                        wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-opacity hover:opacity-70"
                    >
                      Watch this in the overview
                      <span aria-hidden="true">&uarr;</span>
                    </button>
                    {playing && (
                      <button
                        type="button"
                        onClick={() => setOpenDive(null)}
                        className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:text-rust"
                      >
                        Close the detailed film
                      </button>
                    )}
                  </div>
                  {dive && !video && (
                    <p className="mt-4 font-body text-xs leading-relaxed text-ink/45">
                      The detailed films are produced one chapter at a time, in the
                      same style as the overview. This one is on the way.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {!man && (
          <p className="mt-2 font-body text-sm text-warm-gray">
            Loading the film and its timeline.
          </p>
        )}
      </div>

      {/* Embedded 3D / 360 reveal */}
      <div className="border-t border-border bg-cream-dark/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                Look around &middot; 360 and 3D
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Stand on the ground the film is about
              </h2>
            </div>
            <p className="max-w-sm font-body text-sm leading-relaxed text-ink/60">
              Drag the frame to look around. These are real 360 captures from
              three spots the film visits, where it began on the lakefront,
              outside Cobb Hall, and the University of Chicago today.
            </p>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="overflow-hidden rounded-sm border border-border">
              <PanoViewer media={PANO_MEDIA[REVEAL_SPOTS[reveal].id] ?? PANO_MEDIA.land} label={REVEAL_SPOTS[reveal].location} />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border bg-cream-dark/60 px-4 py-3">
                <p className="font-body text-sm font-semibold text-forest">
                  {REVEAL_SPOTS[reveal].location}
                </p>
                <p className="font-body text-xs text-ink/55">
                  {REVEAL_SPOTS[reveal].framing}
                </p>
              </div>
            </div>
            <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible">
              {REVEAL_SPOTS.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setReveal(i)}
                    className={`w-full rounded-sm border px-4 py-3 text-left transition-colors ${
                      i === reveal
                        ? "border-rust bg-rust/10"
                        : "border-border bg-cream hover:border-rust/50"
                    }`}
                  >
                    <span className="block font-body text-[11px] font-semibold uppercase tracking-wider text-rust">
                      Reveal {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-0.5 block font-body text-sm leading-snug text-forest">
                      {s.location}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {heroNote && (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="font-body text-xs leading-relaxed text-ink/45">{heroNote}</p>
        </div>
      )}
    </div>
  );
}
