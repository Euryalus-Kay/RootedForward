"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PanoViewer from "./PanoViewer";
import type { Media360 } from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  HydeParkFilm: the overview film and its clickable timeline, staged */
/*  as a "projection room", a near-black warm-charcoal cinema dropped  */
/*  into the cream site. One rust accent, a graphic Baskerville-year    */
/*  timeline, and one shared pop-out vitrine that the 360 look-around   */
/*  and every per-chapter deep-dive film rise into over the dimmed page.*/
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
const DD_AVAILABLE = new Set<string>(["land", "formation", "university", "worlds-fair", "color-line", "redlining", "urban-renewal", "present"]);
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
  manifest,
}: {
  title: string;
  dek: string;
  // heroNote is still accepted from the page but no longer shown (it disclosed
  // the placeholder host clips + scratch VO, which undercut the finished film)
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
  // which chapter's deep-dive film is open in the pop-out vitrine (null = none)
  const [popoutDive, setPopoutDive] = useState<string | null>(null);
  // drives the vitrine rise-and-settle entrance
  const [mounted, setMounted] = useState(false);
  // true only while the wrapper itself is the native fullscreen element, so the
  // 3D look-around can stay inline over the video inside theater mode
  const [isFs, setIsFs] = useState(false);

  const open3D = useCallback((i?: number) => {
    if (typeof i === "number") setReveal(i);
    videoRef.current?.pause();
    setOpen3d(true);
  }, []);
  const close3D = useCallback(() => {
    setOpen3d(false);
    videoRef.current?.play().catch(() => {});
  }, []);

  // the 360 look-around (outside fullscreen) and every deep-dive share one
  // fixed vitrine that rises over the dimmed page
  const vitrineOpen = (open3d && !isFs) || !!popoutDive;
  const closeVitrine = useCallback(() => {
    setMounted(false);
    setOpen3d(false);
    setPopoutDive(null);
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

  // track when the wrapper enters / leaves native fullscreen
  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // while the vitrine is open: lock page scroll, run the entrance, close on Esc
  useEffect(() => {
    if (!vitrineOpen) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVitrine();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false); // reset so the next open replays the entrance
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [vitrineOpen, closeVitrine]);

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

  const enterTheater = () => {
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
  // only the dated history chapters get a marker; the title + orientation
  // (no year) would crowd the left edge, so they are left off the spine while
  // still seekable by scrubbing. `idx` keeps each marker's true chapter index.
  const placed = useMemo(() => {
    let vi = 0;
    return (man?.chapters ?? [])
      .map((c, idx) => ({
        ...c,
        idx,
        leftPct: Math.min(98, Math.max(0, (c.startSec / total) * 100)),
      }))
      .filter((c) => c.year != null)
      .map((c) => ({ ...c, above: vi++ % 2 === 0 }));
  }, [man, total]);

  const pct = Math.min(100, (t / total) * 100);
  const popDive = popoutDive ? DEEP_DIVES[popoutDive] : null;
  const popVideo = popoutDive ? ddVideo(popoutDive) : undefined;
  const popChapter = popoutDive ? chapters.find((c) => c.id === popoutDive) : null;

  return (
    <div className="relative bg-[#0E0F0D] pb-20 text-[#E8E2D6]">
      {/* the lights go down: the one place cream touches the room */}
      <div aria-hidden className="h-16 w-full bg-gradient-to-b from-cream to-[#0E0F0D]" />

      {/* Title */}
      <div className="mx-auto max-w-6xl px-6 pt-6 md:pt-10">
        <div className="flex items-center gap-4">
          <span className="h-6 w-6 shrink-0 bg-[#C45A33]" aria-hidden />
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C45A33]">
            A Rooted Forward film &middot; The overview
          </p>
          <span className="hidden h-px flex-1 bg-[#3A2018] sm:block" aria-hidden />
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight text-[#E8E2D6] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-[#E8E2D6]/65 md:text-lg">
          {dek}
        </p>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-[#E8E2D6]/45">
          Start here. This film tells the whole story in about twelve minutes.
          Then press any chapter on the timeline and open its own detailed film,
          a deeper, longer look at that single moment, in the same style.
        </p>
      </div>

      {/* The film, framed like a projected plate, fullscreen-able */}
      <div className="mx-auto mt-8 max-w-5xl px-6">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-[2px] border border-[#3A2018] bg-[#141512] p-2 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] fullscreen:flex fullscreen:items-center fullscreen:justify-center fullscreen:border-0 fullscreen:bg-[#0A0B09] fullscreen:p-0"
        >
          <video
            ref={videoRef}
            className="block aspect-video w-full rounded-[1px] bg-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.6)] fullscreen:aspect-auto fullscreen:h-auto fullscreen:max-h-screen fullscreen:w-auto fullscreen:max-w-full fullscreen:rounded-none fullscreen:shadow-none"
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

          {/* soft projection vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-2 rounded-[1px] [box-shadow:inset_0_0_120px_24px_rgba(0,0,0,0.55)] fullscreen:hidden"
          />

          {/* "View in 3D" appears only while a 360 beat is actually on screen,
              and opens that look-around spot. It fades in and out with the beat. */}
          {!open3d && (
            <button
              type="button"
              onClick={() => activePano && open3D(revealForCid(activePano.cid))}
              aria-hidden={!activePano}
              tabIndex={activePano ? 0 : -1}
              className={`absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-[2px] border border-[#C45A33]/50 bg-[#0E0F0D]/70 px-3 py-1.5 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#C45A33] shadow-[0_0_20px_rgba(196,90,51,0.35)] backdrop-blur transition-all duration-500 hover:bg-[#C45A33] hover:text-[#0E0F0D] ${
                activePano
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <span aria-hidden="true" className="rounded-[2px] bg-[#C45A33]/20 px-1.5 py-0.5 text-[9px] leading-none">360&deg;</span>
              View in 3D
            </button>
          )}

          {/* 3D popup, rendered inside the wrapper ONLY in native fullscreen so
              the look-around works inside theater mode. Outside fullscreen the
              same 360 opens in the shared vitrine below. */}
          {open3d && isFs && (
            <div className="absolute inset-0 z-30 flex flex-col bg-[#0A0B09]/95 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-[#26231E] px-4 py-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C45A33]">
                  Look around &middot; {REVEAL_SPOTS[reveal].location}
                </p>
                <button
                  type="button"
                  onClick={close3D}
                  aria-label="Close 3D view"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A352E] text-lg leading-none text-[#E8E2D6] transition-colors hover:border-[#C45A33] hover:text-[#C45A33]"
                >
                  ×
                </button>
              </div>
              <div className="relative min-h-0 flex-1">
                <PanoViewer media={PANO_MEDIA[REVEAL_SPOTS[reveal].id] ?? PANO_MEDIA.land} label={REVEAL_SPOTS[reveal].location} heightClass="h-full" />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#26231E] px-4 py-3">
                <span className="mr-1 font-body text-[11px] uppercase tracking-wider text-[#8A8276]">
                  Jump to
                </span>
                {REVEAL_SPOTS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setReveal(i)}
                    className={`rounded-[2px] px-3 py-1 font-body text-xs transition-colors ${
                      i === reveal
                        ? "bg-[#C45A33] text-[#0E0F0D]"
                        : "border border-[#3A352E] text-[#8A8276] hover:border-[#C45A33] hover:text-[#E8E2D6]"
                    }`}
                  >
                    {s.location}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* slate caption + theater control, hidden in fullscreen */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#26231E] bg-[#141512] px-4 py-3 fullscreen:hidden">
            <div className="flex items-baseline gap-2">
              {chapters[active] ? (
                <>
                  <span className="font-display text-2xl leading-none text-[#E8E2D6] md:text-3xl">
                    {chapters[active].year ?? chapters[active].era}
                  </span>
                  <span className="font-body text-sm text-[#8A8276]">
                    &middot; {chapters[active].title}
                  </span>
                </>
              ) : (
                <span className="font-body text-sm text-[#8A8276]">
                  Press play, or jump to any moment on the timeline below
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={enterTheater}
              className="inline-flex items-center gap-2 rounded-[2px] border border-[#C45A33]/40 px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.25em] text-[#C45A33] transition-colors hover:bg-[#C45A33] hover:text-[#0E0F0D]"
            >
              Enter the theater
            </button>
          </div>
        </div>
      </div>

      {/* The graphic timeline spine */}
      <div className="mx-auto max-w-6xl px-6 pb-4 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 bg-[#C45A33] shadow-[0_0_14px_rgba(196,90,51,0.6)]" aria-hidden />
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C45A33]">
              The timeline &middot; scrub the reel
            </p>
          </div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-[#A89F90]">
            Press a moment to jump &middot; {fmt(t)} / {fmt(total)}
          </p>
        </div>

        {/* the milled spine band (desktop): ruler texture, a seekable rail, a
            glowing playhead, and oversized Baskerville year-numerals as stations.
            Hidden on phones, where 8 stations are too tight to tap; see the
            tappable list below. */}
        <div className="relative mt-8 hidden h-[168px] select-none overflow-hidden rounded-[2px] border border-[#3A352E] bg-gradient-to-b from-[#17120E] to-[#0B0C09] shadow-[inset_0_1px_0_rgba(196,90,51,0.18),inset_0_0_70px_rgba(0,0,0,0.55)] sm:block">
          {/* warm ember bloom behind the rail, so nothing reads cold */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 [background:radial-gradient(60%_120%_at_50%_50%,rgba(224,106,58,0.14),transparent_70%)]"
          />
          {/* a pool of warm light travelling with the playhead */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-[120px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C45A33]/12 blur-2xl"
            style={{ left: `${pct}%` }}
          />
          {/* faint baseline graduation, reads as an engraved rail, sits under the action */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 opacity-45 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_calc(8.333%-1px),#241F1A_calc(8.333%-1px),#241F1A_8.333%)]"
          />

          {/* the seekable rail, a carved channel */}
          <div
            className="group absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 cursor-pointer rounded-full bg-[#2A2622] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
            onClick={trackClick}
            role="slider"
            aria-label="Film timeline"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(t)}
            tabIndex={0}
          >
            {/* the traveled span, burning from deep ember to a bright leading edge */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#A8431F] via-[#C45A33] to-[#E0703F] shadow-[0_0_10px_rgba(196,90,51,0.85),0_0_22px_rgba(224,106,58,0.4)]"
              style={{ width: `${pct}%` }}
            >
              <span
                aria-hidden
                className="absolute right-0 top-0 h-full w-px bg-[#F0A878] shadow-[0_0_6px_rgba(240,168,120,0.9)]"
              />
            </div>
            {/* the playhead: a vertical beam, a pulsing halo, and a bone-hot diamond */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-[64px] w-[2px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#C45A33]/55 to-transparent"
              style={{ left: `${pct}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#C45A33]/25 blur-[6px]"
              style={{ left: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-[#F4D9CC] ring-1 ring-[#7A2E16] shadow-[0_0_0_4px_rgba(196,90,51,0.22),0_0_14px_rgba(224,116,74,0.95),0_0_30px_rgba(196,90,51,0.55)]"
              style={{ left: `${pct}%` }}
            />
          </div>

          {/* the chapter stations: oversized year-numerals, alternating above /
              below, with a tick rising from the rail */}
          {placed.map((c) => {
            const isActive = c.idx === active;
            const edge = c.leftPct <= 6 ? "left" : c.leftPct >= 82 ? "right" : "center";
            const labelPos =
              edge === "left"
                ? "left-0 items-start text-left"
                : edge === "right"
                  ? "right-0 items-end text-right"
                  : "left-1/2 -translate-x-1/2 items-center text-center";
            const big = c.year ?? (c.era === "Begin" ? "Start" : "Today");
            const sub = SHORT_LABEL[c.id] ?? c.era;
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(c.idx);
                  setPopoutDive(null);
                  seek(c.startSec);
                }}
                className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${c.leftPct}%` }}
                aria-label={`Jump to ${c.title}`}
              >
                {/* the tick through the rail */}
                <span
                  className={`block transition-colors ${
                    isActive
                      ? "h-8 w-[3px] rounded-full bg-gradient-to-t from-[#E0703F] to-[#C45A33] shadow-[0_0_10px_rgba(224,106,58,0.75)]"
                      : "h-7 w-px bg-[#6A4A36] group-hover:bg-[#C45A33]"
                  }`}
                />
                {/* the year-numeral + sub, above or below the rail. The active
                    year is stamped into a solid rust block, the single hottest
                    thing on the page; the rest recede to quiet warm engraving. */}
                <span
                  className={`absolute flex w-40 flex-col ${labelPos} ${
                    c.above ? "bottom-6" : "top-6"
                  }`}
                >
                  <span
                    className={`font-display leading-none transition-all ${
                      isActive
                        ? "inline-block rounded-[3px] bg-[#C45A33] px-3 py-1 text-[28px] font-semibold text-[#FBEFE0] shadow-[0_0_26px_rgba(196,90,51,0.5),inset_0_1px_0_rgba(255,233,221,0.4)] [filter:drop-shadow(0_0_10px_rgba(224,106,58,0.35))] md:text-[38px]"
                        : "relative inline-block text-xl text-[#D9C2A8] group-hover:-translate-y-0.5 group-hover:text-[#F0E6D6] md:text-[26px]"
                    }`}
                  >
                    {big}
                  </span>
                  {sub && (
                    <span
                      className={`mt-1.5 hidden font-body text-[10px] uppercase tracking-[0.22em] transition-colors sm:block ${
                        isActive
                          ? "font-semibold text-[#E8E2D6]"
                          : "text-[#B89A7E] group-hover:text-[#E8D8C4]"
                      }`}
                    >
                      {sub}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* the timeline as a tappable chapter list on phones: full-width rows are
            easy to press, where the spine's stations are not */}
        <ol className="mt-6 divide-y divide-[#26231E] overflow-hidden rounded-[2px] border border-[#2A2622] bg-gradient-to-b from-[#141512] to-[#101109] sm:hidden">
          {placed.map((c) => {
            const isActive = c.idx === active;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(c.idx);
                    setPopoutDive(null);
                    seek(c.startSec);
                  }}
                  className={`flex w-full items-center gap-4 border-l-[3px] px-4 py-4 text-left transition-colors active:bg-[#1c1d16] ${
                    isActive
                      ? "border-[#C45A33] bg-[#C45A33]/[0.10]"
                      : "border-transparent"
                  }`}
                  aria-label={`Jump to ${c.title}`}
                >
                  <span
                    className={`w-16 shrink-0 font-display text-2xl leading-none ${
                      isActive ? "text-[#FBEFE0]" : "text-[#D9C2A8]"
                    }`}
                  >
                    {c.year}
                  </span>
                  <span
                    className={`flex-1 font-body text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      isActive ? "text-[#E8E2D6]" : "text-[#B89A7E]"
                    }`}
                  >
                    {SHORT_LABEL[c.id] ?? c.era}
                  </span>
                  {isActive ? (
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rotate-45 bg-[#C45A33] shadow-[0_0_10px_rgba(196,90,51,0.6)]"
                    />
                  ) : (
                    <span className="shrink-0 font-body text-[10px] uppercase tracking-[0.2em] text-[#6B645A]">
                      {fmt(c.startSec)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {/* When the active chapter has its OWN film, a clearly separate feature
            card invites you to open it in the theater. It is deliberately framed
            and worded so it does not read as more of the timeline. Chapters with
            no deep-dive (the title + orientation) show nothing here. */}
        {chapters[active] && DEEP_DIVES[chapters[active].id] && (() => {
          const ch = chapters[active];
          const dive = DEEP_DIVES[ch.id];
          if (!dive) return null;
          const video = ddVideo(ch.id);
          const poster = ddPoster(ch.id);
          const openDive = () => {
            if (!video) return;
            videoRef.current?.pause();
            setPopoutDive(ch.id);
          };
          return (
            <div ref={diveRef} className="mt-12 scroll-mt-6">
              <div className="overflow-hidden rounded-[3px] border border-[#3A2018] bg-gradient-to-b from-[#17160F] to-[#100F0A] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)]">
                {/* header: what this is, stated plainly against the timeline */}
                <div className="border-b border-[#26231E] px-5 py-4 md:px-7">
                  <div className="flex flex-wrap items-center justify-between gap-y-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C45A33] pl-0.5 text-[11px] leading-none text-[#0E0F0D]">
                        &#9658;
                      </span>
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C45A33]">
                        Go deeper &middot; the full film on this chapter
                      </p>
                    </div>
                    <p className="font-body text-xs uppercase tracking-[0.2em] text-[#A89F90]">
                      A separate film &middot; {dive.runtime}
                    </p>
                  </div>
                  <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-[#C7BFB0]">
                    The timeline above scrubs the twelve minute overview. This is a
                    separate, longer film on {ch.year ? `${ch.year}, ` : ""}this one
                    chapter, and it opens in the theater.
                  </p>
                </div>

                <div className="p-5 md:p-7">
                  <h2 className="font-display text-2xl text-[#E8E2D6] md:text-3xl">
                    {dive.title}
                  </h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-[1.5fr_1fr] md:items-start">
                    {/* the poster, which rises into the theater vitrine on play */}
                    <button
                      type="button"
                      onClick={openDive}
                      className="group relative block w-full overflow-hidden rounded-[2px] border border-[#3A2018] bg-[#0A0B09]"
                      aria-label={`Play the full film on ${dive.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={poster ?? `/media/hyde-park/video/thumbs/${ch.id}.jpg`}
                        alt=""
                        loading="lazy"
                        className="block aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = "0";
                        }}
                      />
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A0B09]/55 transition-colors group-hover:bg-[#0A0B09]/35">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C45A33] pl-1 text-2xl leading-none text-[#0E0F0D] shadow-[0_0_28px_rgba(196,90,51,0.55)] transition-transform group-hover:scale-105">
                          &#9658;
                        </span>
                        <span className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-[#E8E2D6]">
                          Play the full film &middot; {dive.runtime}
                        </span>
                      </span>
                    </button>

                    {/* the synopsis + the secondary "jump in the overview" link */}
                    <div className="min-w-0">
                      <p className="font-body text-sm leading-relaxed text-[#E8E2D6]/80 md:text-base">
                        {dive.blurb}
                      </p>
                      <div className="mt-5 flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={openDive}
                          className="inline-flex w-fit items-center gap-2 rounded-[2px] bg-[#C45A33] px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#0E0F0D] transition-colors hover:bg-[#d56a42]"
                        >
                          <span aria-hidden="true">&#9658;</span>
                          Open in the theater
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPopoutDive(null);
                            seek(ch.startSec);
                            wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className="inline-flex w-fit items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#A89F90] transition-colors hover:text-[#E8E2D6]"
                        >
                          Or jump to this moment in the overview
                          <span aria-hidden="true">&uarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {!man && (
          <p className="mt-2 font-body text-sm text-[#8A8276]">
            Loading the film and its timeline.
          </p>
        )}
      </div>

      {/* The standalone "Look around" 360 section was removed at the owner's
          request; the 3D look-around still lives in the film itself via the
          "View in 3D" button, which opens the shared vitrine below. */}

      {/* step back up into the cream lobby */}
      <div aria-hidden className="h-16 w-full bg-gradient-to-b from-[#0E0F0D] to-cream" />

      {/* ONE shared vitrine: the 360 look-around (outside fullscreen) and every
          deep-dive film rise into it over the dimmed page */}
      {vitrineOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0A0B09]/92 p-4 backdrop-blur-md sm:p-8"
          onClick={closeVitrine}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-[94vw] max-w-6xl origin-center overflow-hidden rounded-[3px] border border-[#3A2018] bg-[#141512] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)] transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mounted ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.985] opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* top cartouche */}
            <div className="relative flex items-center justify-between border-b border-[#26231E] px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-5 w-5 shrink-0 bg-[#C45A33]" aria-hidden />
                <p className="truncate font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C45A33]">
                  {popoutDive
                    ? `The detailed film · ${popDive?.runtime ?? ""}`
                    : `Look around · ${REVEAL_SPOTS[reveal].location}`}
                </p>
              </div>
              {popoutDive && popChapter?.year != null && (
                <span aria-hidden className="pointer-events-none absolute right-16 top-1 hidden font-display text-4xl text-[#C45A33]/25 sm:block">
                  {popChapter.year}
                </span>
              )}
              <button
                type="button"
                onClick={closeVitrine}
                aria-label="Close"
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A352E] text-lg leading-none text-[#E8E2D6] transition-colors hover:border-[#C45A33] hover:text-[#C45A33]"
              >
                ×
              </button>
            </div>

            {/* the mat + stage */}
            <div className="p-2">
              {popoutDive ? (
                <div className="overflow-hidden rounded-[1px] md:grid md:grid-cols-[1.65fr_1fr]">
                  <video
                    key={popoutDive}
                    className="block aspect-video w-full bg-black"
                    src={popVideo}
                    poster={ddPoster(popoutDive)}
                    controls
                    controlsList="nofullscreen"
                    autoPlay
                    playsInline
                  />
                  <div className="border-t border-[#26231E] bg-[#0E0F0D] px-5 py-4 md:border-l md:border-t-0">
                    <h3 className="font-display text-xl text-[#E8E2D6]">{popDive?.title}</h3>
                    <p className="mt-3 font-body text-sm leading-relaxed text-[#E8E2D6]/70">
                      {popDive?.blurb}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1px] bg-[#0A0B09]">
                  <PanoViewer
                    media={PANO_MEDIA[REVEAL_SPOTS[reveal].id] ?? PANO_MEDIA.land}
                    label={REVEAL_SPOTS[reveal].location}
                    heightClass="h-[52vh] max-h-[620px] min-h-[320px]"
                  />
                </div>
              )}
            </div>

            {/* bottom action rail */}
            <div className="flex flex-wrap items-center gap-2 border-t border-[#26231E] px-5 py-3">
              {popoutDive ? (
                <button
                  type="button"
                  onClick={() => {
                    const s = popChapter?.startSec ?? 0;
                    closeVitrine();
                    seek(s);
                    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="rounded-[2px] border border-[#3A352E] px-3 py-1 font-body text-xs uppercase tracking-[0.18em] text-[#8A8276] transition-colors hover:border-[#C45A33] hover:text-[#E8E2D6]"
                >
                  Back to the overview
                </button>
              ) : (
                <>
                  <span className="mr-1 font-body text-[11px] uppercase tracking-wider text-[#8A8276]">
                    Jump to
                  </span>
                  {REVEAL_SPOTS.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setReveal(i)}
                      className={`rounded-[2px] px-3 py-1 font-body text-xs transition-colors ${
                        i === reveal
                          ? "bg-[#C45A33] text-[#0E0F0D]"
                          : "border border-[#3A352E] text-[#8A8276] hover:border-[#C45A33] hover:text-[#E8E2D6]"
                      }`}
                    >
                      {s.location}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
