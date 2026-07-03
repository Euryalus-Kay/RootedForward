"use client";
/* ------------------------------------------------------------------ */
/*  MapStage, the shared plat-book vector stage. One 2560x1440 svg on  */
/*  linen paper. It owns the four HOLC grade patterns in <defs> so     */
/*  every layer shares them, draws the Hyde Park base geometry when    */
/*  the frame is hydePark and the layers file has loaded, draws a      */
/*  small dashed Hyde Park locator when the frame is citywide, and     */
/*  always carries the attribution line. Children are layer plugins    */
/*  rendered inside the svg; MapStageContext hands them the frame.     */
/*                                                                     */
/*  Grade encoding is triple and colorblind-safe by contract:          */
/*  fill tint + pattern + letter label. exh-red is reserved for D.     */
/* ------------------------------------------------------------------ */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  HYDE_PARK_FRAME,
  makeFrameReprojector,
  ringToPath,
  type RingPoints,
} from "@/lib/exhibit/map/projection";
import {
  useFrameLayers,
  useHolcFrames,
  type FrameId,
  type FrameLayerLabel,
  type FrameLayersDoc,
} from "@/lib/exhibit/map/useExhibitMapData";

export const VIEW_W = 2560;
export const VIEW_H = 1440;

export const MapStageContext = createContext<{ frame: FrameId }>({ frame: "hydePark" });

export function useMapStageFrame(): FrameId {
  return useContext(MapStageContext).frame;
}

/** Folds both label spellings into one renderable record, dropping junk. */
function normalizeLabel(l: FrameLayerLabel): { text: string; x: number; y: number; hero: boolean } | null {
  const text = typeof l.text === "string" ? l.text : typeof l.t === "string" ? l.t : null;
  const x = typeof l.x === "number" ? l.x : Array.isArray(l.xy) ? l.xy[0] : null;
  const y = typeof l.y === "number" ? l.y : Array.isArray(l.xy) ? l.xy[1] : null;
  if (!text || typeof x !== "number" || typeof y !== "number") return null;
  return { text, x, y, hero: l.role === "hero" };
}

/** Accepts a single ring or a list of rings and always returns a list. */
function asRings(geom: RingPoints | RingPoints[] | undefined | null): RingPoints[] {
  if (!geom || !geom.length) return [];
  const first = geom[0] as unknown;
  if (Array.isArray(first) && typeof (first as unknown[])[0] === "number") {
    return [geom as RingPoints];
  }
  return geom as RingPoints[];
}

/* ---------------- HOLC grade patterns (defined once) ----------------
   A  sparse dots on a desaturated blue-gray tint (#7A8B6F at 25%)
   B  thin diagonals on exh-blue at 25%
   C  crosshatch on exh-gold at 25%
   D  dense opposite diagonals on exh-red at 30%
   Tint lives inside each pattern tile, so one <path fill="url(#...)">
   carries tint plus pattern; the letter label is layered by HolcLayer. */
function HolcPatternDefs() {
  const A = "#7A8B6F"; // deliberately not a site green; see design language
  return (
    <defs>
      <pattern id="exh-holc-a" width={36} height={36} patternUnits="userSpaceOnUse">
        <rect width={36} height={36} fill={A} fillOpacity={0.25} />
        <circle cx={9} cy={9} r={3} fill={A} fillOpacity={0.55} />
        <circle cx={27} cy={27} r={3} fill={A} fillOpacity={0.55} />
      </pattern>
      <pattern
        id="exh-holc-b"
        width={28}
        height={28}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={28} height={28} style={{ fill: "var(--color-exh-blue)" }} fillOpacity={0.25} />
        <line
          x1={0}
          y1={0}
          x2={28}
          y2={0}
          style={{ stroke: "var(--color-exh-blue)" }}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
      </pattern>
      <pattern
        id="exh-holc-c"
        width={24}
        height={24}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={24} height={24} style={{ fill: "var(--color-exh-gold)" }} fillOpacity={0.25} />
        <line
          x1={0}
          y1={0}
          x2={24}
          y2={0}
          style={{ stroke: "var(--color-exh-gold)" }}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={24}
          style={{ stroke: "var(--color-exh-gold)" }}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
      </pattern>
      <pattern
        id="exh-holc-d"
        width={12}
        height={12}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width={12} height={12} style={{ fill: "var(--color-exh-red)" }} fillOpacity={0.3} />
        <line
          x1={0}
          y1={0}
          x2={12}
          y2={0}
          style={{ stroke: "var(--color-exh-red)" }}
          strokeOpacity={0.55}
          strokeWidth={2.5}
        />
      </pattern>
    </defs>
  );
}

/* ---------------- base geometry, reusable by layer plugins ---------------- */

export interface MapBaseLayersProps {
  layers: FrameLayersDoc;
  lake?: boolean;
  parks?: boolean;
  boundary?: boolean;
  labels?: boolean;
}

/**
 * The Hyde Park base composition. MapStage renders it for the hydePark
 * frame; LayerSlider re-renders subsets of it inside crossfade groups.
 */
export function MapBaseLayers({
  layers,
  lake = true,
  parks = true,
  boundary = true,
  labels = true,
}: MapBaseLayersProps) {
  const paths = useMemo(
    () => ({
      lake: asRings(layers.lake).map(ringToPath).filter(Boolean).join(" "),
      parks: (layers.parks ?? []).map((p) => ringToPath(p.ring)),
      boundary: asRings(layers.boundary).map(ringToPath).filter(Boolean).join(" "),
      labels: (layers.labels ?? [])
        .map(normalizeLabel)
        .filter((l): l is NonNullable<ReturnType<typeof normalizeLabel>> => l !== null),
    }),
    [layers]
  );
  return (
    <g>
      {lake && paths.lake && (
        <path
          d={paths.lake}
          fillRule="evenodd"
          style={{ fill: "var(--color-exh-blue)" }}
          fillOpacity={0.3}
        />
      )}
      {parks &&
        paths.parks.map((d, i) =>
          d ? (
            <path key={i} d={d} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.12} />
          ) : null
        )}
      {boundary && paths.boundary && (
        <path
          d={paths.boundary}
          fill="none"
          style={{ stroke: "var(--color-exh-ink)" }}
          strokeWidth={2}
          strokeDasharray="8 6"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {labels &&
        paths.labels.map((l, i) => (
          <text
            key={`${l.text}-${i}`}
            x={l.x}
            y={l.y}
            className="exh-plat"
            fontSize={l.hero ? 34 : 28}
            letterSpacing={5}
            textAnchor="middle"
            style={{ fill: "var(--color-exh-ink-soft)" }}
          >
            {l.text.toUpperCase()}
          </text>
        ))}
    </g>
  );
}

/* ---------------- the stage ---------------- */

export interface MapStageProps {
  frame: FrameId;
  children?: ReactNode;
  /** render the base geometry for the frame (default true) */
  showBase?: boolean;
  className?: string;
  /**
   * Callers that know their own data state can force or suppress the quiet
   * "Map data is being prepared" placeholder. When omitted, the stage shows
   * it only when it has nothing at all to draw.
   */
  showPlaceholder?: boolean;
}

export default function MapStage({
  frame,
  children,
  showBase = true,
  className = "",
  showPlaceholder,
}: MapStageProps) {
  const layersState = useFrameLayers();
  const holcState = useHolcFrames();
  const layers = layersState.data;
  const holc = holcState.data;

  const ctx = useMemo(() => ({ frame }), [frame]);

  // Dashed Hyde Park locator for the citywide frame, re-projected from the
  // hydePark pixel space the layers file was generated in.
  const locatorPath = useMemo(() => {
    if (frame !== "citywide" || !layers?.boundary) return "";
    const to = holc?.frames?.citywide;
    if (!to) return "";
    const from = layers.frame ?? holc?.frames?.hydePark ?? HYDE_PARK_FRAME;
    const re = makeFrameReprojector(from, to);
    return asRings(layers.boundary)
      .map((ring) => ringToPath(ring.map(re)))
      .filter(Boolean)
      .join(" ");
  }, [frame, layers, holc]);

  const attribution =
    [layers?.attribution, holc?.attribution].filter(Boolean).join(" · ") ||
    "Base geometry, OpenStreetMap contributors";

  const baseReady = frame === "hydePark" ? Boolean(layers) : Boolean(holc);
  const placeholder = showPlaceholder ?? (!children && !baseReady);

  return (
    <div
      className={`exh-paper relative w-full overflow-hidden rounded-sm border border-exh-ink/25 ${className}`}
    >
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-auto w-full select-none">
        <HolcPatternDefs />
        {showBase && frame === "hydePark" && layers && <MapBaseLayers layers={layers} />}
        <MapStageContext.Provider value={ctx}>{children}</MapStageContext.Provider>
        {showBase && locatorPath && (
          <path
            d={locatorPath}
            fill="none"
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.6}
            strokeWidth={1.5}
            strokeDasharray="6 5"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {placeholder && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="exh-plat text-xs uppercase tracking-[0.25em] text-exh-ink/50">
            Map data is being prepared
          </p>
        </div>
      )}
      <p className="exh-plat pointer-events-none absolute right-2 bottom-1.5 max-w-[72%] text-right text-[10px] leading-tight text-exh-ink/50">
        {attribution}
      </p>
    </div>
  );
}
