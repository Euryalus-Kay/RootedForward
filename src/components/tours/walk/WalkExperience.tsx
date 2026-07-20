"use client";

// ------------------------------------------------------------------
// Client root for the self-paced audio walking tour. Two ways in:
// walk mode (one stop at a time beside the map, with live location
// and distances if the visitor shares it) and browse mode (every
// stop on the page at once, readable from anywhere).
// ------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import type { WalkTour } from "@/lib/tours/walk-types";
import { formatClock, haversineMeters, isNearFrame } from "@/lib/tours/walk-utils";
import { getAudioState, subscribeAudioState, toggleAudio } from "./audio-bus";
import StopDetail from "./StopDetail";
import WalkMap from "./WalkMap";

const STORAGE_KEY = "rf-walk-jackson-park-v1";

type Mode = "walk" | "browse";

const SHARE_URL = "https://rooted-forward.org/tours";

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const data = {
      title: "Walk Jackson Park",
      text: "A free self-guided audio walking tour of Jackson Park, starting at the Obama Presidential Center.",
      url: SHARE_URL,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
      } catch {
        // user closed the share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; nothing sensible to do
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-[3px] border border-ink/25 bg-white px-4 py-2 font-body text-sm font-medium text-ink/80 transition-colors hover:border-forest/60 hover:text-forest"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1v8M7 1 4.2 3.8M7 1l2.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6.5H2v6h10v-6h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

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
  const [focusMode, setFocusMode] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
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
  const sheetDrag = useDragControls();
  const stops = tour.stops;

  // "Start the tour" links to #start, which opens the focused,
  // app-like tour view; Escape or Exit leaves it. The plate index on
  // the landing page links to #stop-N, which jumps straight to that
  // stop in walk mode.
  useEffect(() => {
    const check = () => {
      const hash = window.location.hash;
      if (hash === "#start") {
        setMode("walk");
        setFocusMode(true);
        return;
      }
      const m = hash.match(/^#stop-(\d+)$/);
      if (m) {
        const idx = Number(m[1]) - 1;
        if (idx >= 0 && idx < stops.length) {
          setMode("walk");
          setActiveIndex(idx);
          setResumeIndex(null);
          requestAnimationFrame(() => {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            detailRef.current?.scrollIntoView({
              behavior: reduce ? "auto" : "smooth",
              block: "start",
            });
          });
        }
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [stops.length]);

  const exitFocus = useCallback(() => {
    setFocusMode(false);
    setMapOpen(false);
    window.history.replaceState(null, "", "#tour");
  }, []);

  useEffect(() => {
    if (!focusMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else exitFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [focusMode, exitFocus, mapOpen]);

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
      setMapOpen(false);
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
            "You are outside the Jackson Park area right now, so the map will not show your dot. You can still read and listen from here."
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

  // live progress for the transport bar's thin track
  const [audioProgress, setAudioProgress] = useState(0);
  useEffect(() => {
    const read = () => {
      const st = getAudioState(activeStop.id);
      setAudioProgress(st && st.duration > 0 ? st.currentTime / st.duration : 0);
    };
    read();
    if (!miniPlaying) return;
    const timer = setInterval(read, 500);
    return () => clearInterval(timer);
  }, [miniPlaying, activeStop.id]);

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
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-semibold ${
            i === activeIndex
              ? "bg-rust text-white"
              : visited.has(stop.id)
                ? "bg-forest text-cream"
                : "border border-forest/60 text-forest ring-1 ring-inset ring-[#C9A227]/60"
          }`}
        >
          {stop.number}
        </span>
        <span className="min-w-0 flex-1 truncate font-body text-sm text-ink/80">
          {stop.title}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-body text-[11px] tabular-nums text-ink/70">
          {/* narration length, not walking time */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1.5 3.5v3h1.8L6 8.6V1.4L3.3 3.5H1.5Z" fill="currentColor" fillOpacity="0.7" />
            <path d="M7.4 3.4a2.4 2.4 0 0 1 0 3.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {formatClock(stop.audioSeconds)}
        </span>
      </button>
    </li>
  );

  const mapPanel = (
    <>
      <div className="walk-plate overflow-hidden rounded-[3px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-ink/15 px-4 py-2.5">
          <p className="font-display text-lg leading-none text-forest">Jackson Park</p>
          <p className="font-display text-[13px] italic text-ink/60">
            {tour.distanceMiles} miles &middot; {stops.length} stops
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
          className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-ink/15 px-4 py-2"
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
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] border px-5 py-2.5 font-body text-sm font-medium transition-colors ${
            locationOn
              ? "border-forest bg-forest text-cream"
              : "border-ink/25 bg-white text-ink/70 hover:border-forest/60 hover:text-forest"
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
          <p className="mt-2 rounded-[3px] border border-border bg-cream-dark/60 px-3 py-2 font-body text-xs leading-relaxed text-ink/70">
            {geoNote}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div
      className={
        focusMode
          ? "fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-cream"
          : undefined
      }
    >
      {/* focused-tour top bar */}
      {focusMode && (
        <div
          className="sticky top-0 z-20 border-b border-ink/15 bg-cream"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={exitFocus}
              className="inline-flex items-center gap-1 rounded-[3px] px-3 py-2 font-body text-sm font-medium text-ink/70 transition-colors hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exit
            </button>
            <div className="min-w-0 flex-1 px-2">
              <div className="mx-auto max-w-[220px] md:hidden">
                <p className="text-center font-body text-xs font-medium text-ink/70">
                  Stop {activeIndex + 1} of {stops.length}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border/70">
                  <div
                    className="h-full rounded-full bg-rust transition-all duration-500 motion-reduce:transition-none"
                    style={{ width: `${((activeIndex + 1) / stops.length) * 100}%` }}
                  />
                </div>
              </div>
              <p className="hidden truncate text-center font-display text-lg leading-none text-forest md:block">
                Walk Jackson Park
              </p>
            </div>
            <ShareButton />
          </div>
        </div>
      )}

      {/* mode toggle */}
      {!focusMode && (
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div
            role="group"
            aria-label="Tour mode"
            className="inline-flex rounded-[3px] border border-ink/25 bg-white p-1"
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
                className="relative rounded-[2px] px-6 py-2.5 font-body text-sm font-medium"
              >
                {mode === key && (
                  <motion.span
                    layoutId="walk-mode-pill"
                    className="absolute inset-0 rounded-[2px] bg-forest"
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
                className="rounded-[3px] border border-rust/50 bg-white px-5 py-2.5 font-body text-sm font-medium text-rust transition-colors hover:bg-rust hover:text-white"
              >
                Resume at stop {resumeIndex + 1}
              </button>
            )}
            <ShareButton />
          </div>
        </div>
      </div>
      )}

      {focusMode || mode === "walk" ? (
        <div
          ref={walkRef}
          className={`mx-auto max-w-6xl px-6 pb-32 ${
            focusMode ? "pt-6 md:pt-8" : "pt-10 md:py-14"
          }`}
        >
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
            {/* map column: on phones in the focused tour, the map
                lives behind the floating Map button instead; on the
                scrolling page, the stop reads first and the map
                follows it */}
            <div
              className={`${
                focusMode ? "hidden md:block" : "order-2 md:order-none"
              } md:sticky md:top-24 md:self-start`}
            >
              {mapPanel}

              {/* quick-jump stop list: always open on desktop, folded
                  behind a summary on phones */}
              <ol className="walk-plate-flush mt-5 hidden divide-y divide-border/50 overflow-hidden rounded-[3px] md:block">
                {stops.map((stop, i) => renderStopRow(stop, i))}
              </ol>
              <details className="walk-plate-flush mt-4 overflow-hidden rounded-[3px] md:hidden">
                <summary className="cursor-pointer list-none px-5 py-3.5 font-body text-sm font-medium text-ink/80 [&::-webkit-details-marker]:hidden">
                  All {stops.length} stops
                </summary>
                <ol className="divide-y divide-border/50 border-t border-ink/15">
                  {stops.map((stop, i) => renderStopRow(stop, i))}
                </ol>
              </details>
            </div>

            {/* stop column */}
            <div ref={detailRef} className="order-1 scroll-mt-24 md:order-none">
              <div role="status">
                {nearbyOtherIndex !== null && (
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-[3px] border border-forest/30 bg-forest/10 px-4 py-3">
                    <p className="font-body text-sm text-forest">
                      You are standing near stop {stops[nearbyOtherIndex].number},{" "}
                      {stops[nearbyOtherIndex].title}.
                    </p>
                    <button
                      type="button"
                      onClick={() => goTo(nearbyOtherIndex, false)}
                      className="shrink-0 rounded-[3px] bg-forest px-4 py-2.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
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
                    focusChrome={focusMode}
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

          {/* floating map button, focused tour on phones */}
          {focusMode && (
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="fixed bottom-28 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 font-body text-sm font-semibold text-cream shadow-[3px_3px_0_0_rgba(26,26,26,0.3)] ring-1 ring-inset ring-cream/25 md:hidden"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M5.5 2 1.5 3.5v9L5.5 11l4 1.5 4-1.5v-9L9.5 3.5 5.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M5.5 2v9M9.5 3.5v9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Map
            </button>
          )}

          {/* slide-up map sheet */}
          <AnimatePresence>
            {focusMode && mapOpen && (
              <motion.div
                key="map-sheet"
                className="fixed inset-0 z-[90] flex flex-col bg-cream md:hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0.12, duration: 0.5 }
                }
                drag="y"
                dragListener={false}
                dragControls={sheetDrag}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 600) setMapOpen(false);
                }}
              >
                {/* the header doubles as the drag handle: pull it
                    down to put the map away */}
                <div
                  className="relative flex touch-none items-center justify-between border-b border-ink/15 bg-cream px-5 py-3"
                  style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
                  onPointerDown={(e) => sheetDrag.start(e)}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink/20"
                    style={{ top: "calc(env(safe-area-inset-top) + 5px)" }}
                  />
                  <p className="font-display text-lg leading-none text-forest">Map</p>
                  <button
                    type="button"
                    onClick={() => setMapOpen(false)}
                    className="rounded-[3px] bg-forest px-5 py-2 font-body text-sm font-medium text-cream"
                  >
                    Done
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-12 pt-4">
                  {mapPanel}
                  <ol className="walk-plate-flush mt-5 divide-y divide-border/50 overflow-hidden rounded-[3px]">
                    {stops.map((stop, i) => renderStopRow(stop, i))}
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* transport bar, the focused tour's player controls */}
          {focusMode && (
          <div
            className="walk-chrome fixed inset-x-3 bottom-3 z-40 overflow-hidden rounded-[6px] md:hidden"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* thin live audio progress */}
            <div aria-hidden="true" className="h-1 w-full bg-border/50">
              <div
                className="h-full bg-rust transition-[width] duration-500 ease-linear motion-reduce:transition-none"
                style={{ width: `${Math.round(audioProgress * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <button
                type="button"
                onClick={() => goTo(activeIndex)}
                aria-label={`Back to stop ${activeStop.number} on the page`}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-body text-sm font-semibold text-ink">
                  {activeStop.title}
                </p>
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Previous stop"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:text-ink disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => toggleAudio(activeStop.id)}
                aria-label={
                  miniPlaying
                    ? `Pause stop ${activeStop.number}`
                    : `Play stop ${activeStop.number}, ${activeStop.title}`
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rust text-white ring-1 ring-inset ring-white/30 transition-transform hover:scale-105 hover:bg-rust-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-cream motion-reduce:transition-none"
              >
                {miniPlaying ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="2.5" y="2" width="4" height="12" rx="0.5" />
                    <rect x="9.5" y="2" width="4" height="12" rx="0.5" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4 2.3v11.4c0 .5.55.8.98.53l9.02-5.7a.62.62 0 0 0 0-1.06L4.98 1.77A.62.62 0 0 0 4 2.3Z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex >= stops.length - 1}
                aria-label="Next stop"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:text-ink disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          )}
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
