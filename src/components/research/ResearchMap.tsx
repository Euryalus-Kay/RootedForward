/* ------------------------------------------------------------------ */
/*  ResearchMap                                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Schematic SVG study area map for research articles. Dependency    */
/*  free and self contained. Renders from a JSON config block         */
/*  embedded in the article markdown:                                  */
/*                                                                     */
/*      ```map                                                         */
/*      {                                                              */
/*        "title": "Study area",                                       */
/*        "caption": "Figure 1. Half mile impact zone...",             */
/*        "bounds": { "north": "N", "south": "S" },                    */
/*        "labels": [                                                  */
/*          { "x": 40, "y": 60, "text": "63rd Street", "type": "street" } */
/*        ],                                                           */
/*        "zones": [                                                   */
/*          { "cx": 50, "cy": 55, "r": 14, "name": "Impact zone" }    */
/*        ],                                                           */
/*        "markers": [                                                 */
/*          { "x": 50, "y": 55, "label": "OPC site", "primary": true } */
/*        ]                                                            */
/*      }                                                              */
/*      ```                                                            */
/*                                                                     */
/*  All coordinates are in a 0 to 100 unit space that fills the       */
/*  available viewBox. Map is deliberately schematic rather than a   */
/*  live tile layer, in the tradition of journal figure maps.         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import React from "react";

type LabelType = "street" | "landmark" | "boundary" | "neighborhood";

export interface MapLabel {
  x: number;
  y: number;
  text: string;
  type?: LabelType;
  /** rotation in degrees, useful for street names */
  rotate?: number;
}

export interface MapZone {
  /** center x (0 to 100) */
  cx?: number;
  /** center y (0 to 100) */
  cy?: number;
  /** radius for circular zones, in viewBox units */
  r?: number;
  /** rectangle points */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** SVG polygon points "x1,y1 x2,y2 ..." */
  points?: string;
  name?: string;
  /** fill color, defaults to rust with low opacity */
  fill?: string;
  /** stroke color, defaults to rust */
  stroke?: string;
  style?: "solid" | "dashed";
}

export interface MapMarker {
  x: number;
  y: number;
  label: string;
  primary?: boolean;
}

export interface MapRoad {
  /** polyline points "x1,y1 x2,y2 ..." */
  points: string;
  name?: string;
  /** render as highway (thicker, double stroke) */
  highway?: boolean;
}

export interface MapConfig {
  title?: string;
  caption?: string;
  /** compass orientation labels, default { north: "N" } */
  bounds?: { north?: string; south?: string; east?: string; west?: string };
  labels?: MapLabel[];
  zones?: MapZone[];
  markers?: MapMarker[];
  roads?: MapRoad[];
  /** scale bar: distance label to show */
  scale?: { length: number; label: string };
  /** aspect ratio, default 4:3 */
  aspect?: "4:3" | "16:9" | "1:1";
}

interface ResearchMapProps {
  config: MapConfig;
  figureNumber?: number;
}

const COLORS = {
  background: "#EDE6D8",
  grid: "#DDD6C8",
  road: "#1A1A1A",
  highway: "#2A2A2A",
  zoneFill: "rgba(196, 93, 62, 0.18)",
  zoneStroke: "#C45D3E",
  markerPrimary: "#C45D3E",
  markerSecondary: "#1B3A2D",
  label: "#1A1A1A",
  mutedLabel: "#8A8578",
  compass: "#1B3A2D",
};

/* ------------------------------------------------------------------ */
/*  Sub renderers                                                      */
/* ------------------------------------------------------------------ */

function Background() {
  return (
    <>
      <rect
        x={0}
        y={0}
        width={100}
        height={75}
        fill={COLORS.background}
      />
      {/* Subtle grid */}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={(i + 1) * 20}
          x2={(i + 1) * 20}
          y1={0}
          y2={75}
          stroke={COLORS.grid}
          strokeWidth={0.2}
        />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          x2={100}
          y1={(i + 1) * 15}
          y2={(i + 1) * 15}
          stroke={COLORS.grid}
          strokeWidth={0.2}
        />
      ))}
    </>
  );
}

function Zones({ zones }: { zones: MapZone[] }) {
  return (
    <>
      {zones.map((z, i) => {
        const fill = z.fill ?? COLORS.zoneFill;
        const stroke = z.stroke ?? COLORS.zoneStroke;
        const strokeDasharray = z.style === "dashed" ? "1.5 1" : undefined;

        if (z.points) {
          return (
            <polygon
              key={i}
              points={z.points}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.6}
              strokeDasharray={strokeDasharray}
            />
          );
        }
        if (z.r !== undefined && z.cx !== undefined && z.cy !== undefined) {
          return (
            <circle
              key={i}
              cx={z.cx}
              cy={z.cy}
              r={z.r}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.6}
              strokeDasharray={strokeDasharray}
            />
          );
        }
        if (z.w !== undefined && z.h !== undefined && z.x !== undefined && z.y !== undefined) {
          return (
            <rect
              key={i}
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.6}
              strokeDasharray={strokeDasharray}
            />
          );
        }
        return null;
      })}
    </>
  );
}

function Roads({ roads }: { roads: MapRoad[] }) {
  return (
    <>
      {roads.map((r, i) => (
        <g key={i}>
          {r.highway ? (
            <>
              <polyline
                points={r.points}
                fill="none"
                stroke={COLORS.highway}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={r.points}
                fill="none"
                stroke="#fff"
                strokeWidth={0.4}
                strokeDasharray="0.8 0.8"
                strokeLinecap="round"
              />
            </>
          ) : (
            <polyline
              points={r.points}
              fill="none"
              stroke={COLORS.road}
              strokeWidth={0.45}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          )}
        </g>
      ))}
    </>
  );
}

function Labels({ labels }: { labels: MapLabel[] }) {
  return (
    <>
      {labels.map((l, i) => {
        const color =
          l.type === "street"
            ? COLORS.mutedLabel
            : l.type === "landmark"
              ? COLORS.markerSecondary
              : l.type === "neighborhood"
                ? COLORS.markerSecondary
                : COLORS.label;
        const fontSize =
          l.type === "street"
            ? 2.1
            : l.type === "landmark"
              ? 2.3
              : l.type === "neighborhood"
                ? 2.6
                : 2.2;
        const weight = l.type === "neighborhood" ? 600 : 400;
        return (
          <text
            key={i}
            x={l.x}
            y={l.y}
            fontSize={fontSize}
            fontFamily="var(--font-body)"
            fontWeight={weight}
            fill={color}
            textAnchor="middle"
            transform={l.rotate ? `rotate(${l.rotate}, ${l.x}, ${l.y})` : undefined}
          >
            {l.text}
          </text>
        );
      })}
    </>
  );
}

function Markers({ markers }: { markers: MapMarker[] }) {
  return (
    <>
      {markers.map((m, i) => (
        <g key={i}>
          <circle
            cx={m.x}
            cy={m.y}
            r={m.primary ? 1.8 : 1.3}
            fill={m.primary ? COLORS.markerPrimary : COLORS.markerSecondary}
            stroke="#fff"
            strokeWidth={0.5}
          />
          {m.label && (
            <text
              x={m.x}
              y={m.y + (m.primary ? -3 : 2.6)}
              fontSize={2.2}
              fontFamily="var(--font-body)"
              fontWeight={m.primary ? 600 : 500}
              fill={COLORS.label}
              textAnchor="middle"
            >
              {m.label}
            </text>
          )}
        </g>
      ))}
    </>
  );
}

function Compass({ north = "N" }: { north?: string }) {
  return (
    <g transform="translate(93, 5)">
      <circle r={2.4} fill="#fff" stroke={COLORS.compass} strokeWidth={0.3} />
      <polygon
        points="0,-2 0.8,0 0,0.6 -0.8,0"
        fill={COLORS.compass}
        stroke="none"
      />
      <text
        x={0}
        y={-3.3}
        fontSize={1.8}
        fontFamily="var(--font-body)"
        fontWeight={600}
        fill={COLORS.compass}
        textAnchor="middle"
      >
        {north}
      </text>
    </g>
  );
}

function ScaleBar({
  scale,
}: {
  scale: { length: number; label: string };
}) {
  const x = 5;
  const y = 71;
  const len = Math.max(4, Math.min(30, scale.length));
  return (
    <g>
      <line
        x1={x}
        x2={x + len}
        y1={y}
        y2={y}
        stroke={COLORS.label}
        strokeWidth={0.5}
      />
      <line
        x1={x}
        x2={x}
        y1={y - 0.8}
        y2={y + 0.8}
        stroke={COLORS.label}
        strokeWidth={0.5}
      />
      <line
        x1={x + len}
        x2={x + len}
        y1={y - 0.8}
        y2={y + 0.8}
        stroke={COLORS.label}
        strokeWidth={0.5}
      />
      <text
        x={x + len / 2}
        y={y - 1.3}
        fontSize={1.8}
        fontFamily="var(--font-body)"
        fill={COLORS.mutedLabel}
        textAnchor="middle"
      >
        {scale.label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

export default function ResearchMap({
  config,
  figureNumber,
}: ResearchMapProps) {
  const {
    title,
    caption,
    bounds,
    labels = [],
    zones = [],
    markers = [],
    roads = [],
    scale,
  } = config;

  return (
    <figure
      className="my-4 rounded-sm border border-border bg-cream-dark/30 p-4"
      role="group"
    >
      {title && (
        <p className="mb-2 font-display text-[15px] font-medium leading-snug text-forest">
          {title}
        </p>
      )}

      <svg
        viewBox="0 0 100 75"
        role="img"
        aria-label={title ?? "Study area map"}
        className="w-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <Background />
        <Zones zones={zones} />
        <Roads roads={roads} />
        <Labels labels={labels} />
        <Markers markers={markers} />
        <Compass north={bounds?.north ?? "N"} />
        {scale && <ScaleBar scale={scale} />}
      </svg>

      {(caption || figureNumber) && (
        <figcaption className="mt-3 font-body text-[12.5px] leading-snug text-warm-gray">
          {figureNumber !== undefined ? (
            <span className="font-medium text-ink/70">
              Figure {figureNumber}.{" "}
            </span>
          ) : null}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  Parser                                                             */
/* ------------------------------------------------------------------ */

export function parseMapConfig(raw: string): MapConfig | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as MapConfig;
  } catch {
    return null;
  }
}
