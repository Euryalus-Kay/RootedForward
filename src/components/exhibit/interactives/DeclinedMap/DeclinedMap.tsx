"use client";
/* ------------------------------------------------------------------ */
/*  Declined, the CH0 cold open (reused as configured in CH6). The     */
/*  citywide 1940 HOLC map on the plat stage; every tap files an       */
/*  application and lands an ink DECLINED stamp at that area's         */
/*  centroid. Three taps, or twelve seconds after the first, reveal    */
/*  the caption card and complete the beat. If the map data has not    */
/*  been generated yet the stage shows the quiet placeholder and the   */
/*  first tap anywhere completes, so the tour never dead-ends.         */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState } from "react";
import { makeRng, motionMs } from "@/lib/exhibit/debug";
import { useHolcFrames, type HolcArea } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import HolcLayer from "@/components/exhibit/map/layers/HolcLayer";
import { useInteractive } from "../InteractiveContext";
import Stamp from "../../shared/Stamp";
import FactValue from "../../shared/FactValue";

const MAX_STAMPS = 12;
const DWELL_MS = 12000;
const HEADER = "Tap any neighborhood. File the application.";
const CAPTION =
  "Every Black neighborhood in Chicago was redlined. Every tap you just made was a real family's application.";

interface StampMark {
  key: number;
  xPct: number;
  yPct: number;
  rot: number;
  fading: boolean;
}

const clampPct = (v: number) => Math.min(97, Math.max(3, v));

export default function DeclinedMap() {
  const api = useInteractive();
  const frames = useHolcFrames();

  const [taps, setTaps] = useState(0);
  const [stamps, setStamps] = useState<StampMark[]>([]);
  const [done, setDone] = useState(false);

  const doneRef = useRef(false);
  const tapsRef = useRef(0);
  const stampSeq = useRef(0);
  const rngRef = useRef<(() => number) | null>(null);
  if (rngRef.current === null) rngRef.current = makeRng();
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fadeScheduled = useRef(new Set<number>());

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    api.onComplete();
  }, [api]);

  /** counts a tap, arms the dwell timer, completes on the third */
  const recordTap = useCallback(() => {
    tapsRef.current += 1;
    setTaps(tapsRef.current);
    if (!dwellTimer.current) {
      dwellTimer.current = setTimeout(complete, DWELL_MS);
    }
    if (tapsRef.current >= 3) complete();
  }, [complete]);

  // fade-out scheduling for stamps beyond the cap, effect-side so the
  // state updater stays pure
  useEffect(() => {
    for (const s of stamps) {
      if (!s.fading || fadeScheduled.current.has(s.key)) continue;
      fadeScheduled.current.add(s.key);
      const ms = api.reducedMotion ? 0 : motionMs(360);
      fadeTimers.current.push(
        setTimeout(() => {
          setStamps((prev) => prev.filter((x) => x.key !== s.key));
        }, ms)
      );
    }
  }, [stamps, api.reducedMotion]);

  // timer hygiene on unmount
  useEffect(() => {
    const timers = fadeTimers.current;
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      timers.forEach(clearTimeout);
    };
  }, []);

  const handleAreaTap = (area: HolcArea) => {
    api.onInteraction();
    const rng = rngRef.current!;
    const c = area.centroid?.citywide ?? [VIEW_W / 2, VIEW_H / 2];
    const mark: StampMark = {
      key: ++stampSeq.current,
      xPct: clampPct((c[0] / VIEW_W) * 100),
      yPct: clampPct((c[1] / VIEW_H) * 100),
      rot: Math.round((rng() * 12 - 7) * 10) / 10,
      fading: false,
    };
    setStamps((prev) => {
      const next = [...prev, mark];
      const live = next.filter((s) => !s.fading);
      if (live.length > MAX_STAMPS) {
        const oldest = live[0];
        return next.map((s) => (s.key === oldest.key ? { ...s, fading: true } : s));
      }
      return next;
    });
    recordTap();
  };

  // resilient path when the data file is absent (or still loading)
  const mapMissing = !frames.data;
  const handleFallbackTap = () => {
    api.onInteraction();
    recordTap();
    complete();
  };

  const countLabel = `${taps} ${taps === 1 ? "application" : "applications"} filed`;

  const stage = (
    <div className="relative">
      <MapStage frame="citywide" showPlaceholder={mapMissing}>
        {!mapMissing && (
          <HolcLayer frame="citywide" interactive dimUngraded onAreaTap={handleAreaTap} />
        )}
      </MapStage>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {stamps.map((s) => (
          <span
            key={s.key}
            className="absolute"
            style={{
              left: `${s.xPct}%`,
              top: `${s.yPct}%`,
              transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
              opacity: s.fading ? 0 : 1,
              transition: api.reducedMotion ? "none" : `opacity ${motionMs(360)}ms ease-out`,
            }}
          >
            <Stamp text="DECLINED" tone="red" size="md" animate />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          {HEADER}
        </p>
        <p data-testid="declined-count" className="exh-mono text-[11px] text-exh-ink/70">
          {countLabel}
        </p>
      </div>

      {mapMissing ? (
        <button
          type="button"
          onClick={handleFallbackTap}
          aria-label="File the application"
          className="block w-full cursor-pointer text-left"
        >
          {stage}
        </button>
      ) : (
        stage
      )}

      {done && (
        <div className="exh-ledger-in mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4">
          <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">{CAPTION}</p>
          <div className="mt-2">
            <FactValue id="redlining.holc_survey_chicago" />
          </div>
        </div>
      )}
    </div>
  );
}
