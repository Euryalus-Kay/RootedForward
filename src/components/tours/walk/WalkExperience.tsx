"use client";

// ------------------------------------------------------------------
// Client root for the self-paced audio walking tour. Two ways in:
// walk mode (one stop at a time beside the map, with live location
// and distances if the visitor shares it) and browse mode (every
// stop on the page at once, readable from anywhere).
// ------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { WalkTour } from "@/lib/tours/walk-types";
import { formatClock, haversineMeters, isNearFrame } from "@/lib/tours/walk-utils";
import { subscribeAudioState, toggleAudio } from "./audio-bus";
import StopDetail from "./StopDetail";
import WalkMap from "./WalkMap";

const STORAGE_KEY = "rf-walk-jackson-park-v1";

type Mode = "walk" | "browse";

interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface StoredProgress {
  visited: string[];
  lastIndex: number;
}

function loadProgress(): StoredProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visited: [], lastIndex: 0 };
    const parsed = JSON.parse(raw) as StoredProgress;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      lastIndex: typeof parsed.lastIndex === "number" ? parsed.lastIndex : 0,
    };
  } catch {
    return { visited: [], lastIndex: 0 };
  }
}

export default function WalkExperience({ tour }: { tour: WalkTour }) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("walk");
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<string>>(new Set());
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);

  const [locationOn, setLocationOn] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState<UserPosition | null>(null);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const detailRef = useRef<HTMLDivElement | null>(null);
  const walkRef = useRef<HTMLDivElement | null>(null);
  const [tourInView, setTourInView] = useState(true);
  const stops = tour.stops;

  // the mobile mini-player only pins while the tour itself is on screen
  useEffect(() => {
    const el = walkRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setTourInView(entry.isIntersecting),
      { rootMargin: "80px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  // restore progress and honor #stop-N deep links; deferred a frame so
  // hydration completes against the server-rendered initial state
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const stored = loadProgress();
      setVisited(new Set(stored.visited));
      const m = window.location.hash.match(/^#stop-(\d+)$/);
      if (m) {
        const idx = Number(m[1]) - 1;
        if (idx >= 0 && idx < stops.length) {
          setActiveIndex(idx);
          return;
        }
      }
      if (stored.lastIndex > 0 && stored.lastIndex < stops.length) {
        setResumeIndex(stored.lastIndex);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [stops.length]);

  const persist = useCallback(
    (nextVisited: ReadonlySet<string>, lastIndex: number) => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ visited: [...nextVisited], lastIndex })
        );
      } catch {
        // private browsing; progress just won't stick
      }
    },
    []
  );

  const markVisited = useCallback(
    (id: string, lastIndex: number) => {
      setVisited((prev) => {
        if (prev.has(id)) {
          persist(prev, lastIndex);
          return prev;
        }
        const next = new Set(prev);
        next.add(id);
        persist(next, lastIndex);
        return next;
      });
    },
    [persist]
  );

  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const goTo = useCallback(
    (index: number, scroll = true) => {
      const clamped = Math.max(0, Math.min(stops.length - 1, index));
      setActiveIndex(clamped);
      setResumeIndex(null);
      persist(visited, clamped);
      window.history.replaceState(null, "", `#stop-${clamped + 1}`);
      // announce the new stop to keyboard and screen-reader users
      requestAnimationFrame(() => {
        headingRef.current?.focus({ preventScroll: true });
      });
      if (scroll) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        detailRef.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      }
    },
    [stops.length, persist, visited]
  );

  const handleNext = useCallback(() => {
    markVisited(stops[activeIndex].id, Math.min(activeIndex + 1, stops.length - 1));
    if (activeIndex < stops.length - 1) goTo(activeIndex + 1);
  }, [activeIndex, goTo, markVisited, stops]);

  // ---- geolocation ----
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocationOn(false);
    setLocating(false);
    setUserPos(null);
  }, []);

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoNote("This browser does not share location.");
      return;
    }
    setLocating(true);
    setGeoNote(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocating(false);
        setLocationOn(true);
        const { latitude, longitude, accuracy } = pos.coords;
        if (!isNearFrame(latitude, longitude)) {
          setUserPos(null);
          setGeoNote(
            "You are outside the Jackson Park area right now, so the map will not show your dot. The tour still works read-along."
          );
          return;
        }
        setGeoNote(null);
        setUserPos({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => {
        setLocating(false);
        setLocationOn(false);
        setGeoNote(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was declined. You can still follow the written directions between stops."
            : "Location is not available right now. The written directions between stops cover the same ground."
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  useEffect(() => () => stopWatching(), [stopWatching]);

  const activeStop = stops[activeIndex];
  const distanceToActive = useMemo(() => {
    if (!userPos || !activeStop) return null;
    return haversineMeters(userPos.lat, userPos.lng, activeStop.lat, activeStop.lng);
  }, [userPos, activeStop]);

  // if the visitor is standing at a different stop than the one on
  // screen, offer a one-tap jump
  const nearbyOtherIndex = useMemo(() => {
    if (!userPos) return null;
    let best: number | null = null;
    let bestDist = 60;
    stops.forEach((s, i) => {
      if (i === activeIndex) return;
      const d = haversineMeters(userPos.lat, userPos.lng, s.lat, s.lng);
      if (d < bestDist) {
        best = i;
        bestDist = d;
      }
    });
    return best;
  }, [userPos, stops, activeIndex]);

  // mirror playback state for the mini-player; derived, so switching
  // stops needs no reset
  const [playingId, setPlayingId] = useState<string | null>(null);
  useEffect(
    () => subscribeAudioState((id, playing) => setPlayingId(playing ? id : null)),
    []
  );
  const miniPlaying = playingId === activeStop.id;

  const visitedCount = stops.filter((s) => visited.has(s.id)).length;

  const renderStopRow = (stop: (typeof stops)[number], i: number) => (
    <li key={stop.id}>
      <button
        type="button"
        onClick={() => goTo(i, false)}
        aria-current={i === activeIndex ? "true" : undefined}
        aria-label={`Stop ${stop.number}. ${stop.title}.${
          visited.has(stop.id) ? " Visited." : ""
        }`}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          i === activeIndex ? "bg-cream-dark/70" : "hover:bg-cream-dark/40"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-body text-[11px] font-bold ${
            i === activeIndex
              ? "bg-rust text-white"
              : visited.has(stop.id)
                ? "bg-forest text-cream"
                : "border border-forest/50 text-forest"
          }`}
        >
          {stop.number}
        </span>
        <span className="min-w-0 flex-1 truncate font-body text-sm text-ink/80">
          {stop.title}
        </span>
        <span className="shrink-0 font-body text-[11px] tabular-nums text-ink/70">
          {formatClock(stop.audioSeconds)}
        </span>
      </button>
    </li>
  );

  return (
    <div>
      {/* mode toggle */}
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div
            role="group"
            aria-label="Tour mode"
            className="inline-flex rounded-full border border-white/70 bg-white/50 p-1 shadow-sm backdrop-blur-md"
          >
            {(
              [
                { key: "walk" as const, label: "Walk it" },
                { key: "browse" as const, label: "All stops" },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className="relative rounded-full px-6 py-2.5 font-body text-sm font-medium"
              >
                {mode === key && (
                  <motion.span
                    layoutId="walk-mode-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-forest to-forest-light shadow-md shadow-forest/25"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", bounce: 0.18, duration: 0.5 }
                    }
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    mode === key ? "text-cream" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {visitedCount > 0 && (
              <p className="font-body text-sm text-ink/70">
                {visitedCount} of {stops.length} visited
              </p>
            )}
            {resumeIndex !== null && mode === "walk" && (
              <button
                type="button"
                onClick={() => goTo(resumeIndex, false)}
                className="rounded-full border border-rust/40 bg-rust/10 px-5 py-2.5 font-body text-sm font-medium text-rust backdrop-blur-md transition-colors hover:bg-rust hover:text-white"
              >
                Resume at stop {resumeIndex + 1}
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === "walk" ? (
        <div ref={walkRef} className="mx-auto max-w-6xl px-6 pb-32 pt-10 md:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
            {/* map column */}
            <div className="md:sticky md:top-24 md:self-start">
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-xl shadow-forest/10 backdrop-blur-md">
                {/* cartouche, like the title block of a printed map */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-white/60 bg-white/40 px-4 py-2.5">
                  <p className="font-display text-lg leading-none text-forest">Jackson Park</p>
                  <p className="font-body text-xs text-ink/70">
                    2.5 miles &middot; 9 stops
                  </p>
                </div>
                <WalkMap
                  stops={stops}
                  route={tour.route}
                  activeIndex={activeIndex}
                  visitedIds={visited}
                  userPos={userPos}
                  onSelectStop={(i) => goTo(i)}
                />
                <div
                  aria-hidden="true"
                  className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/60 bg-white/40 px-4 py-2"
                >
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-ink/70">
                    <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
                      <line x1="1" y1="3" x2="21" y2="3" stroke="#C45D3E" strokeWidth="2.4" strokeDasharray="1 5" strokeLinecap="round" />
                    </svg>
                    Route
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-ink/70">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <circle cx="6" cy="6" r="4.5" fill="#F5F0E8" stroke="#1B3A2D" strokeWidth="1.6" />
                    </svg>
                    Stop
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-ink/70">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <circle cx="6" cy="6" r="4" fill="#4A6B8A" stroke="#FFFFFF" strokeWidth="1.6" />
                    </svg>
                    You
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={locationOn || locating ? stopWatching : startWatching}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 font-body text-sm font-medium backdrop-blur-md transition-colors ${
                    locationOn
                      ? "border-forest/50 bg-gradient-to-br from-forest to-forest-light text-cream"
                      : "border-white/70 bg-white/50 text-ink/70 hover:text-forest"
                  }`}
                  aria-pressed={locationOn}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="6" cy="6" r="1.8" fill="currentColor" />
                  </svg>
                  {locating ? "Finding you…" : locationOn ? "Location on" : "Find me on the map"}
                </button>
              </div>
              <div role="status">
                {geoNote && (
                  <p className="mt-2 rounded-sm border border-border bg-cream-dark/60 px-3 py-2 font-body text-xs leading-relaxed text-ink/70">
                    {geoNote}
                  </p>
                )}
              </div>

              {/* quick-jump stop list: always open on desktop, folded
                  behind a summary on phones */}
              <ol className="mt-5 hidden divide-y divide-border/50 overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-lg shadow-forest/5 backdrop-blur-md md:block">
                {stops.map((stop, i) => renderStopRow(stop, i))}
              </ol>
              <details className="mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-lg shadow-forest/5 backdrop-blur-md md:hidden">
                <summary className="cursor-pointer list-none px-5 py-3.5 font-body text-sm font-medium text-ink/80 [&::-webkit-details-marker]:hidden">
                  All {stops.length} stops
                </summary>
                <ol className="divide-y divide-border/50 border-t border-white/60">
                  {stops.map((stop, i) => renderStopRow(stop, i))}
                </ol>
              </details>
            </div>

            {/* stop column */}
            <div ref={detailRef} className="scroll-mt-24">
              <div role="status">
                {nearbyOtherIndex !== null && (
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-sm border border-forest/30 bg-forest/10 px-4 py-3">
                    <p className="font-body text-sm text-forest">
                      You are standing near stop {stops[nearbyOtherIndex].number},{" "}
                      {stops[nearbyOtherIndex].title}.
                    </p>
                    <button
                      type="button"
                      onClick={() => goTo(nearbyOtherIndex, false)}
                      className="shrink-0 rounded-sm bg-forest px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light"
                    >
                      Jump there
                    </button>
                  </div>
                )}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  <StopDetail
                    stop={activeStop}
                    totalStops={stops.length}
                    distanceMeters={distanceToActive}
                    headingRef={headingRef}
                    nextStop={
                      activeIndex < stops.length - 1
                        ? {
                            lat: stops[activeIndex + 1].lat,
                            lng: stops[activeIndex + 1].lng,
                            title: stops[activeIndex + 1].title,
                          }
                        : undefined
                    }
                    onAudioEnded={() => markVisited(activeStop.id, activeIndex)}
                    onPrev={activeIndex > 0 ? () => goTo(activeIndex - 1) : undefined}
                    onNext={activeIndex < stops.length - 1 ? handleNext : undefined}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* mobile mini-player, pinned while walking */}
          <div
            inert={!tourInView}
            aria-hidden={!tourInView}
            className={`fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/70 bg-cream/80 shadow-2xl shadow-forest/20 backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none md:hidden ${
              tourInView ? "translate-y-0" : "translate-y-[calc(100%+1rem)]"
            }`}
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleAudio(activeStop.id)}
                aria-label={
                  miniPlaying
                    ? `Pause stop ${activeStop.number}`
                    : `Play stop ${activeStop.number}, ${activeStop.title}`
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rust to-rust-dark text-white shadow-lg shadow-rust/30 transition-transform hover:scale-105 motion-reduce:transition-none"
              >
                {miniPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="2.5" y="2" width="4" height="12" rx="0.5" />
                    <rect x="9.5" y="2" width="4" height="12" rx="0.5" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4 2.3v11.4c0 .5.55.8.98.53l9.02-5.7a.62.62 0 0 0 0-1.06L4.98 1.77A.62.62 0 0 0 4 2.3Z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex)}
                aria-label={`Back to stop ${activeStop.number} on the page`}
                className="min-w-0 flex-1 text-left"
              >
                <p className="font-body text-xs text-ink/70">
                  Stop {activeStop.number} of {stops.length}
                </p>
                <p className="truncate font-body text-sm font-semibold text-ink">
                  {activeStop.title}
                </p>
              </button>
              {activeIndex < stops.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="shrink-0 rounded-full bg-gradient-to-br from-forest to-forest-light px-5 py-2.5 font-body text-sm font-medium text-cream shadow-md shadow-forest/25 transition-transform hover:scale-105 motion-reduce:transition-none"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <div className="space-y-16">
            {stops.map((stop, i) => (
              <div key={stop.id} className="border-b border-border pb-16 last:border-b-0">
                <StopDetail
                  stop={stop}
                  totalStops={stops.length}
                  showNav={false}
                  nextStop={
                    i < stops.length - 1
                      ? {
                          lat: stops[i + 1].lat,
                          lng: stops[i + 1].lng,
                          title: stops[i + 1].title,
                        }
                      : undefined
                  }
                  onAudioEnded={() => markVisited(stop.id, activeIndex)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
