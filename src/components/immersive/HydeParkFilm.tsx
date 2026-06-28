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
interface Manifest {
  video: string;
  poster: string;
  duration: number;
  chapters: Chapter[];
}

const TEST_PANO: Media360 = {
  kind: "photo360",
  src: "/media/360/test-pano.jpg",
  poster: "/media/360/test-pano-poster.jpg",
  initialYawDeg: 0,
  note: "Test capture. Replace with your on-site 360 / 3D footage.",
};

// Short, single-line labels for the timeline so they never wrap into the
// header or each other. The big label is the year; this is the line beneath.
const SHORT_LABEL: Record<string, string> = {
  opening: "",
  intro: "The neighborhood",
  formation: "Cornell's bet",
  university: "The University",
  "worlds-fair": "The World's Fair",
  "color-line": "The color line",
  "urban-renewal": "Urban renewal",
  present: "The Obama Center",
};

// Where the owner films a real-time 360 / 3D look-around, keyed to a chapter.
const REVEAL_SPOTS = [
  { id: "intro", location: "57th Street Beach", framing: "Face the skyline across the lakefront." },
  { id: "university", location: "The Main Quadrangles", framing: "Turn slowly across the Gothic courts." },
  { id: "worlds-fair", location: "Jackson Park", framing: "Over the lagoon by the Wooded Island." },
  { id: "urban-renewal", location: "55th Street", framing: "The rebuilt corridor, east and west." },
  { id: "present", location: "The Obama Center site", framing: "A full turn from the park lawn." },
];

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
  const [man, setMan] = useState<Manifest | null>(manifest ?? null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [active, setActive] = useState(0);
  const [reveal, setReveal] = useState(0);

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
    const el = videoRef.current;
    if (!el) return;
    // iOS Safari uses the proprietary method
    type FSVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    const v = el as FSVideo;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
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
          A Rooted Forward film
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-forest md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-ink/70 md:text-lg">
          {dek}
        </p>
      </div>

      {/* The film, full width, fullscreen-able */}
      <div className="mx-auto mt-8 max-w-6xl px-6">
        <div
          ref={wrapRef}
          className="overflow-hidden rounded-sm border border-border bg-ink shadow-sm"
        >
          <video
            ref={videoRef}
            className="block aspect-video w-full bg-black"
            src={man?.video}
            poster={man?.poster}
            controls
            playsInline
            preload="metadata"
            onTimeUpdate={onTime}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          />
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
        <div className="relative mt-10 h-[132px] select-none">
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
                    seek(c.startSec);
                  }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
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
                    className={`absolute w-40 whitespace-nowrap ${labelPos} ${
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
              Drag the frame to look around. These are placeholder captures. Your
              on-site 360 and 3D clips drop into the same five spots, and the flat
              MP4 keeps a labeled placeholder for each.
            </p>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="overflow-hidden rounded-sm border border-border">
              <PanoViewer media={TEST_PANO} label={REVEAL_SPOTS[reveal].location} />
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
