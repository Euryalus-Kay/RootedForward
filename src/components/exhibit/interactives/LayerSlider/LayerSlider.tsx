"use client";
/* ------------------------------------------------------------------ */
/*  Four Claims, One Ground, the CH1 layer slider (available,          */
/*  no-pause). One real range input with four detents; above it the    */
/*  hydePark plat stage crossfades between four compositions of the    */
/*  same ground. Layer groups all stay mounted and fade by opacity     */
/*  (instant under reduced motion). Visiting all four detents          */
/*  completes the beat, so the interactive stays completable even      */
/*  while the map data file is still being generated.                  */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import {
  HYDE_PARK_FRAME,
  makeFrameProjector,
} from "@/lib/exhibit/map/projection";
import { useFrameLayers, useHolcFrames } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { MapBaseLayers, VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import { useInteractive } from "../InteractiveContext";

interface Detent {
  label: string;
  caption: string;
  tick: string;
}

const DETENTS: Detent[] = [
  {
    label: "Potawatomi land and marsh, before 1832",
    caption: "The Council of Three Fires holds this ground. No deed exists for it yet.",
    tick: "Before 1832",
  },
  {
    label: "Cornell's suburb, 1853",
    caption: "Paul Cornell holds the deed and plats a railroad suburb on the marsh.",
    tick: "1853",
  },
  {
    label: "The fair-built neighborhood, 1893",
    caption: "Developers and hotel men hold the deeds as the fair packs the blocks.",
    tick: "1893",
  },
  {
    label: "Today",
    caption: "Thousands of separate owners hold the deeds on the same ground.",
    tick: "Today",
  },
];

// 53rd Street at the Illinois Central lakefront line, the station stop
// Cornell's suburb grew around. Approximate by design.
const STATION_LAT = 41.7996;
const STATION_LNG = -87.5878;
// the IC embankment; the built-up blocks sat west of it
const TRACKS_LNG = -87.588;

const RANGE_CSS = `
.exh-era-range { appearance: none; -webkit-appearance: none; display: block; width: 100%; height: 56px; background: transparent; cursor: pointer; }
.exh-era-range:focus-visible { outline: 2px solid var(--color-exh-blue); outline-offset: 2px; }
.exh-era-range::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.exh-era-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -22px; height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: radial-gradient(circle at 35% 30%, var(--color-exh-linen), var(--color-exh-linen-deep)); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
.exh-era-range::-moz-range-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.exh-era-range::-moz-range-thumb { height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: var(--color-exh-linen); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
`;

export default function LayerSlider() {
  const api = useInteractive();
  const layersState = useFrameLayers();
  const holcState = useHolcFrames();
  const layers = layersState.data;

  const [detent, setDetent] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  useEffect(() => {
    if (visited.length === DETENTS.length) complete();
  }, [visited, complete]);

  const select = (v: number) => {
    if (v < 0 || v >= DETENTS.length) return;
    api.onInteraction();
    setDetent(v);
    setVisited((prev) => (prev.includes(v) ? prev : [...prev, v]));
  };

  // station and track positions, projected with the same math that made
  // the layer file (scripts/hp-map-real.py constants as the fallback)
  const frameDef = layers?.frame ?? holcState.data?.frames?.hydePark ?? HYDE_PARK_FRAME;
  const projected = useMemo(() => {
    const proj = makeFrameProjector(frameDef);
    return {
      station: proj.project(STATION_LAT, STATION_LNG),
      tracksX: proj.project(frameDef.centerLat, TRACKS_LNG)[0],
    };
  }, [frameDef]);

  const fade = (on: boolean): CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: api.reducedMotion ? "none" : `opacity ${motionMs(260)}ms ease`,
    pointerEvents: "none",
  });

  const station = (
    <g>
      <circle
        cx={projected.station[0]}
        cy={projected.station[1]}
        r={14}
        style={{ fill: "var(--color-exh-ink)" }}
      />
      <circle
        cx={projected.station[0]}
        cy={projected.station[1]}
        r={28}
        fill="none"
        style={{ stroke: "var(--color-exh-ink)" }}
        strokeOpacity={0.5}
        strokeWidth={3}
      />
      <text
        x={projected.station[0] + 44}
        y={projected.station[1] + 9}
        className="exh-plat"
        fontSize={26}
        letterSpacing={5}
        style={{ fill: "var(--color-exh-ink-soft)" }}
      >
        53RD ST STATION
      </text>
    </g>
  );

  const d = DETENTS[detent];

  return (
    <div className="w-full">
      <MapStage frame="hydePark" showBase={false} showPlaceholder={!layers}>
        {layers && (
          <>
            {/* 0. the ground before the plat, lake and marsh, no boundary */}
            <g style={fade(detent === 0)}>
              <rect
                x={0}
                y={0}
                width={VIEW_W}
                height={VIEW_H}
                style={{ fill: "var(--color-exh-blue)" }}
                fillOpacity={0.1}
              />
              <rect
                x={0}
                y={0}
                width={VIEW_W}
                height={VIEW_H}
                fill="#7A8B6F"
                fillOpacity={0.08}
              />
              <MapBaseLayers layers={layers} parks={false} boundary={false} labels={false} />
            </g>

            {/* 1. Cornell's plat, the boundary and the rail stop */}
            <g style={fade(detent === 1)}>
              <MapBaseLayers layers={layers} parks={false} labels={false} />
              {station}
            </g>

            {/* 2. the fair-built neighborhood, denser layers plus a
                   building-hatch wash west of the tracks */}
            <g style={fade(detent === 2)}>
              <defs>
                <pattern
                  id="exh-build-hatch"
                  width={18}
                  height={18}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={18}
                    y2={0}
                    style={{ stroke: "var(--color-exh-ink)" }}
                    strokeOpacity={0.28}
                    strokeWidth={1.6}
                  />
                </pattern>
              </defs>
              <rect
                x={0}
                y={0}
                width={Math.max(0, projected.tracksX)}
                height={VIEW_H}
                fill="url(#exh-build-hatch)"
                opacity={0.55}
              />
              <MapBaseLayers layers={layers} />
              {station}
            </g>

            {/* 3. today, the full base layout */}
            <g style={fade(detent === 3)}>
              <MapBaseLayers layers={layers} />
            </g>
          </>
        )}
      </MapStage>

      <div className="mt-3">
        <style>{RANGE_CSS}</style>
        <input
          type="range"
          min={0}
          max={DETENTS.length - 1}
          step={1}
          value={detent}
          onChange={(e) => select(Number(e.target.value))}
          aria-label="Era"
          aria-valuetext={`${d.label}. ${d.caption}`}
          className="exh-era-range"
        />
        <div className="flex items-start justify-between">
          {DETENTS.map((det, i) => (
            <button
              key={det.tick}
              type="button"
              onClick={() => select(i)}
              aria-label={det.label}
              aria-current={detent === i ? "true" : undefined}
              className={`exh-plat min-h-12 min-w-12 px-1 text-[10px] tracking-[0.15em] uppercase ${
                detent === i ? "font-semibold text-exh-ink" : "text-exh-ink/50"
              } ${i === 0 ? "text-left" : i === DETENTS.length - 1 ? "text-right" : "text-center"}`}
            >
              {det.tick}
            </button>
          ))}
        </div>
        <p className="exh-plat mt-1 text-xs font-semibold tracking-[0.25em] text-exh-ink uppercase">
          {d.label}
        </p>
        <p className="mt-1 text-sm leading-snug text-exh-ink-soft">{d.caption}</p>
      </div>
    </div>
  );
}
