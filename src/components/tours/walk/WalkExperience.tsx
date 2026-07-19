"use client";

// ------------------------------------------------------------------
// Client root for the self-paced audio walking tour. Two ways in:
// walk mode (one stop at a time beside the map, with live location
// and distances if the visitor shares it) and browse mode (every
// stop on the page at once, readable from anywhere).
// ------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WalkTour } from "@/lib/tours/walk-types";
import { haversineMeters, isNearFrame } from "@/lib/tours/walk-utils";
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
  const stops = tour.stops;

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

  const goTo = useCallback(
    (index: number, scroll = true) => {
      const clamped = Math.max(0, Math.min(stops.length - 1, index));
      setActiveIndex(clamped);
      setResumeIndex(null);
      persist(visited, clamped);
      window.history.replaceState(null, "", `#stop-${clamped + 1}`);
      if (scroll) {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const visitedCount = stops.filter((s) => visited.has(s.id)).length;

  return (
    <div>
      {/* mode toggle */}
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div
            role="tablist"
            aria-label="Tour mode"
            className="inline-flex rounded-sm border border-border bg-cream-dark/50 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "walk"}
              onClick={() => setMode("walk")}
              className={`rounded-sm px-5 py-2 font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "walk" ? "bg-forest text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              Walk it
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "browse"}
              onClick={() => setMode("browse")}
              className={`rounded-sm px-5 py-2 font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
                mode === "browse" ? "bg-forest text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              All stops
            </button>
          </div>

          <div className="flex items-center gap-4">
            {visitedCount > 0 && (
              <p className="font-body text-xs font-semibold text-ink/60">
                {visitedCount} of {stops.length} stops visited
              </p>
            )}
            {resumeIndex !== null && mode === "walk" && (
              <button
                type="button"
                onClick={() => goTo(resumeIndex, false)}
                className="rounded-sm border border-rust/40 bg-rust/10 px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:bg-rust hover:text-white"
              >
                Resume at stop {resumeIndex + 1}
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === "walk" ? (
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
            {/* map column */}
            <div className="md:sticky md:top-24 md:self-start">
              <div className="overflow-hidden rounded-sm border border-border bg-cream-dark/40">
                <WalkMap
                  stops={stops}
                  route={tour.route}
                  activeIndex={activeIndex}
                  visitedIds={visited}
                  userPos={userPos}
                  onSelectStop={(i) => goTo(i)}
                />
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={locationOn || locating ? stopWatching : startWatching}
                  className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
                    locationOn
                      ? "border-forest bg-forest text-cream"
                      : "border-border bg-cream text-ink/70 hover:border-forest hover:text-forest"
                  }`}
                  aria-pressed={locationOn}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="6" cy="6" r="1.8" fill="currentColor" />
                  </svg>
                  {locating ? "Finding you…" : locationOn ? "Location on" : "Show me on the map"}
                </button>
                <p className="font-body text-[11px] leading-snug text-ink/50">
                  Your location stays on your phone. Nothing is sent anywhere.
                </p>
              </div>
              {geoNote && (
                <p className="mt-2 rounded-sm border border-border bg-cream-dark/60 px-3 py-2 font-body text-xs leading-relaxed text-ink/70">
                  {geoNote}
                </p>
              )}
            </div>

            {/* stop column */}
            <div ref={detailRef} className="scroll-mt-24">
              <StopDetail
                stop={activeStop}
                totalStops={stops.length}
                distanceMeters={distanceToActive}
                onAudioEnded={() => markVisited(activeStop.id, activeIndex)}
                onPrev={activeIndex > 0 ? () => goTo(activeIndex - 1) : undefined}
                onNext={activeIndex < stops.length - 1 ? handleNext : undefined}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <div className="space-y-16">
            {stops.map((stop) => (
              <div key={stop.id} className="border-b border-border pb-16 last:border-b-0">
                <StopDetail
                  stop={stop}
                  totalStops={stops.length}
                  showNav={false}
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
