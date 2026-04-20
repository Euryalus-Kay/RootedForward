"use client";

import { useMemo, useState, useRef } from "react";
import type { Parcel, ParcelType } from "@/lib/game/types";
import { COLS, ROWS } from "@/lib/game/parcels";

/* ============================================================== *
 *  Isometric city map, v2.
 *
 *  Hand-tuned architectural renderings per parcel type. Footprints
 *  are smaller than the tile so streets and sidewalks read clearly
 *  between parcels. Palette is warm, calm, cream-leaning; highlight
 *  is a subtle beam of light instead of a pulsing ring.
 * ============================================================== */

const TILE_W = 58;
const TILE_H = 29;

function iso(col: number, row: number) {
  return { x: (col - row) * (TILE_W / 2), y: (col + row) * (TILE_H / 2) };
}

/* ------------------ palette helpers ------------------ */
function shade(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  if (amt >= 0) {
    r = Math.min(255, Math.round(r + (255 - r) * amt));
    g = Math.min(255, Math.round(g + (255 - g) * amt));
    b = Math.min(255, Math.round(b + (255 - b) * amt));
  } else {
    r = Math.max(0, Math.round(r * (1 + amt)));
    g = Math.max(0, Math.round(g * (1 + amt)));
    b = Math.max(0, Math.round(b * (1 + amt)));
  }
  return `rgb(${r},${g},${b})`;
}

/* ------------------ ground palette ------------------ */
function groundFill(p: Parcel): string {
  switch (p.holc) {
    case "A": return "#C8DCB8";
    case "B": return "#BBCBDC";
    case "C": return "#E8D28A";
    case "D": return "#D9A098";
    default: return "#E8DCC4";
  }
}
function groundStroke(p: Parcel): string {
  switch (p.holc) {
    case "A": return "#A2BD8F";
    case "B": return "#8FA4BA";
    case "C": return "#C4A353";
    case "D": return "#B87870";
    default: return "#C8BA9A";
  }
}

/* ------------------ wall palettes by HOLC ------------------ */
const WALL: Record<string, string[]> = {
  A: ["#F5EEDB", "#EFE4C6", "#F2E8CF", "#EADDB9"],
  B: ["#D0DBE4", "#C1CEDE", "#D8E1EA", "#C8D5E0"],
  C: ["#E6C46D", "#D8B560", "#E8CB76", "#D4AC58"],
  D: ["#BC7770", "#AE6A64", "#B8726B", "#A56058"],
  ungraded: ["#D4CAB3", "#CBBFA5"],
};

/* ------------------ building shapes ------------------ */
interface BuildingDesign {
  footprint: number;   // 0..1 fraction of tile
  stories: number;     // visible story count
  storyH: number;      // height per story in px
  wallColor?: string;  // if omitted, picked from HOLC palette
  roofColor: string;
  roofStyle: "flat" | "peak" | "gable" | "dome" | "mansard";
  windows?: boolean;
  doorColor?: string;
  accent?: string;     // optional banner color
  glyph?: string;      // small letter/symbol
  hasChimney?: boolean;
  hasAwning?: boolean;
}

const DESIGNS: Partial<Record<ParcelType, BuildingDesign[]>> = {
  "single-family": [
    { footprint: 0.58, stories: 2, storyH: 10, roofColor: "#7A3F1E", roofStyle: "peak", windows: true, doorColor: "#5C2E0C", hasChimney: true },
    { footprint: 0.56, stories: 1, storyH: 11, roofColor: "#6B3312", roofStyle: "gable", windows: true, doorColor: "#40220A" },
    { footprint: 0.60, stories: 2, storyH: 10, roofColor: "#5A2A10", roofStyle: "peak", windows: true, doorColor: "#391C08", hasChimney: true },
  ],
  "two-flat": [
    { footprint: 0.62, stories: 2, storyH: 14, roofColor: "#5E2F12", roofStyle: "flat", windows: true, doorColor: "#2E1508", hasAwning: true },
    { footprint: 0.60, stories: 3, storyH: 12, roofColor: "#4E250F", roofStyle: "flat", windows: true, doorColor: "#2A1307" },
  ],
  "three-flat": [
    { footprint: 0.62, stories: 3, storyH: 14, roofColor: "#3B1E0A", roofStyle: "flat", windows: true, doorColor: "#1E0C04", hasAwning: true },
    { footprint: 0.64, stories: 3, storyH: 13, roofColor: "#55290F", roofStyle: "flat", windows: true, doorColor: "#2D1407" },
  ],
  courtyard: [
    { footprint: 0.72, stories: 4, storyH: 11, roofColor: "#3B1E0A", roofStyle: "flat", windows: true, doorColor: "#1E0C04", hasAwning: true },
  ],
  tower: [
    { footprint: 0.48, stories: 10, storyH: 12, wallColor: "#76797C", roofColor: "#3D3F40", roofStyle: "flat", windows: true },
    { footprint: 0.46, stories: 11, storyH: 11, wallColor: "#868688", roofColor: "#3B3B3B", roofStyle: "flat", windows: true },
  ],
  "rehab-tower": [
    { footprint: 0.50, stories: 8, storyH: 11, wallColor: "#7FA18B", roofColor: "#2F4D3B", roofStyle: "flat", windows: true },
  ],
  commercial: [
    { footprint: 0.70, stories: 2, storyH: 15, wallColor: "#B76A2D", roofColor: "#6F3B10", roofStyle: "flat", windows: true, accent: "#F5F0E8", hasAwning: true, doorColor: "#3E1E07" },
    { footprint: 0.68, stories: 2, storyH: 14, wallColor: "#AD5F20", roofColor: "#6A3710", roofStyle: "flat", windows: true, accent: "#F5F0E8", hasAwning: true, doorColor: "#3E1E07" },
  ],
  industrial: [
    { footprint: 0.78, stories: 2, storyH: 14, wallColor: "#615F58", roofColor: "#2A2925", roofStyle: "flat", windows: false },
  ],
  school: [
    { footprint: 0.74, stories: 2, storyH: 18, wallColor: "#A5432A", roofColor: "#5B2108", roofStyle: "flat", windows: true, glyph: "S", accent: "#F5F0E8" },
  ],
  church: [
    { footprint: 0.60, stories: 2, storyH: 16, wallColor: "#DCC39A", roofColor: "#5E3616", roofStyle: "peak", windows: true, glyph: "+" },
  ],
  transit: [
    { footprint: 0.70, stories: 2, storyH: 14, wallColor: "#C54C3A", roofColor: "#7A1C14", roofStyle: "dome", windows: true, glyph: "M" },
  ],
  expressway: [
    { footprint: 0.95, stories: 1, storyH: 5, wallColor: "#1E1E1E", roofColor: "#111", roofStyle: "flat" },
  ],
  "land-trust": [
    { footprint: 0.58, stories: 2, storyH: 12, wallColor: "#3F6E55", roofColor: "#1B3A2D", roofStyle: "flat", windows: true, accent: "#F5F0E8" },
  ],
  mural: [
    { footprint: 0.64, stories: 2, storyH: 11, wallColor: "#E08560", roofColor: "#7A2F1A", roofStyle: "flat", windows: false, accent: "#1B3A2D" },
  ],
  library: [
    { footprint: 0.68, stories: 2, storyH: 15, wallColor: "#8F6A35", roofColor: "#4E3418", roofStyle: "flat", windows: true, glyph: "L", accent: "#F5F0E8" },
  ],
  clinic: [
    { footprint: 0.68, stories: 2, storyH: 15, wallColor: "#A5432A", roofColor: "#5B2108", roofStyle: "flat", windows: true, glyph: "+", accent: "#F5F0E8" },
  ],
};

function designFor(p: Parcel): BuildingDesign | null {
  const list = DESIGNS[p.type];
  if (!list || list.length === 0) return null;
  return list[p.id % list.length];
}

function wallColorFor(p: Parcel, d: BuildingDesign): string {
  if (d.wallColor) return d.wallColor;
  const palette = WALL[p.holc] ?? WALL.ungraded;
  return palette[p.id % palette.length];
}

/* ============================================================== *
 *  SVG primitives                                                  *
 * ============================================================== */

/** Isometric diamond tile at (x,y) with half-width and half-height */
function Diamond({ x, y, hw, hh, fill, stroke, strokeWidth = 0.6 }: {
  x: number; y: number; hw: number; hh: number; fill: string; stroke?: string; strokeWidth?: number;
}) {
  const points = `${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`;
  return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
}

/** An isometric extruded box layer. x,y is the center of the base. */
function ExtrudedBox({
  x, y, hw, hh, height, color,
}: { x: number; y: number; hw: number; hh: number; height: number; color: string }) {
  const top = shade(color, 0.12);
  const right = shade(color, -0.18);
  const left = shade(color, -0.05);
  const topY = y - height;
  // Left face
  const leftPoints = `${x},${y + hh} ${x - hw},${y} ${x - hw},${topY} ${x},${topY + hh}`;
  // Right face
  const rightPoints = `${x},${y + hh} ${x + hw},${y} ${x + hw},${topY} ${x},${topY + hh}`;
  // Top face
  const topPoints = `${x},${topY - hh} ${x + hw},${topY} ${x},${topY + hh} ${x - hw},${topY}`;
  return (
    <g>
      <polygon points={leftPoints} fill={left} />
      <polygon points={rightPoints} fill={right} />
      <polygon points={topPoints} fill={top} />
    </g>
  );
}

/* Windows on right face of a box, laid out in story rows */
function Windows({ x, topY, hw, hh, stories, storyH, accent }: {
  x: number; topY: number; hw: number; hh: number; stories: number; storyH: number; accent?: string;
}) {
  const out: React.ReactNode[] = [];
  const color = accent ?? "#2A3240";
  const frame = "#F5F0E8";
  // Right face windows (visible side)
  for (let s = 0; s < stories; s++) {
    const rowY = topY + s * storyH + 3;
    // two windows per story
    for (let i = 0; i < 2; i++) {
      const xPos = x + (i * (hw - 6) / 2) + 3;
      const yPos = rowY;
      const yJitter = (i * 0.4 - 0.2) * (hw / hw);
      out.push(
        <g key={`rw-${s}-${i}`}>
          <rect x={xPos} y={yPos + yJitter} width={4.5} height={storyH - 4} fill={frame} opacity="0.2" />
          <rect x={xPos + 0.6} y={yPos + 0.6 + yJitter} width={3.3} height={storyH - 5.2} fill={color} opacity="0.7" />
        </g>
      );
    }
  }
  // Left face (front from camera perspective)
  for (let s = 0; s < stories; s++) {
    const rowY = topY + s * storyH + 3;
    for (let i = 0; i < 2; i++) {
      const xPos = x - hw + (i * (hw - 6) / 2) + 1;
      const yPos = rowY;
      out.push(
        <g key={`lw-${s}-${i}`}>
          <rect x={xPos} y={yPos} width={4} height={storyH - 4} fill={frame} opacity="0.18" />
          <rect x={xPos + 0.5} y={yPos + 0.6} width={3} height={storyH - 5.2} fill={color} opacity="0.65" />
        </g>
      );
    }
  }
  return <>{out}</>;
}

/* ============================================================== *
 *  Building                                                        *
 * ============================================================== */

function Building({ p, centerX, centerY, highlighted, protectedRing }: {
  p: Parcel; centerX: number; centerY: number; highlighted?: boolean; protectedRing?: boolean;
}) {
  const d = designFor(p);
  if (!d) return null;

  const wallColor = wallColorFor(p, d);
  const hw = (TILE_W / 2) * d.footprint;
  const hh = (TILE_H / 2) * d.footprint;
  const totalH = d.stories * d.storyH;
  const topY = centerY - totalH;

  return (
    <g>
      {/* Main extruded body */}
      <ExtrudedBox x={centerX} y={centerY} hw={hw} hh={hh} height={totalH} color={wallColor} />

      {/* Windows */}
      {d.windows && d.stories > 0 && (
        <Windows x={centerX} topY={topY} hw={hw} hh={hh} stories={d.stories} storyH={d.storyH} accent={d.accent} />
      )}

      {/* Awning above ground floor */}
      {d.hasAwning && (
        <polygon
          points={`${centerX - hw - 2},${centerY - d.storyH + hh + 2} ${centerX + hw + 2},${centerY - d.storyH + hh + 2} ${centerX + hw - 1},${centerY - d.storyH + 1} ${centerX - hw + 1},${centerY - d.storyH + 1}`}
          fill={shade(d.roofColor, 0.1)}
          opacity="0.9"
        />
      )}

      {/* Door on the left face, ground floor */}
      {d.doorColor && (
        <rect x={centerX - hw + 2} y={centerY - d.storyH + 3} width={4} height={d.storyH - 3} fill={d.doorColor} />
      )}

      {/* Roof */}
      {d.roofStyle === "peak" && (
        <>
          <polygon
            points={`${centerX - hw},${topY} ${centerX},${topY - hh - 8} ${centerX + hw},${topY} ${centerX},${topY + hh}`}
            fill={d.roofColor}
          />
          <polygon
            points={`${centerX - hw},${topY} ${centerX},${topY + hh} ${centerX},${topY - hh - 8}`}
            fill={shade(d.roofColor, -0.12)}
            opacity="0.85"
          />
        </>
      )}
      {d.roofStyle === "gable" && (
        <>
          <polygon
            points={`${centerX - hw},${topY - 2} ${centerX + hw},${topY - 2} ${centerX + hw - 4},${topY - 7} ${centerX - hw + 4},${topY - 7}`}
            fill={shade(d.roofColor, -0.1)}
          />
          <polygon
            points={`${centerX - hw},${topY} ${centerX},${topY - hh} ${centerX + hw},${topY} ${centerX},${topY + hh}`}
            fill={d.roofColor}
          />
        </>
      )}
      {d.roofStyle === "dome" && (
        <>
          <ellipse cx={centerX} cy={topY - 3} rx={hw * 0.65} ry={hh * 0.9} fill={d.roofColor} />
          <ellipse cx={centerX - hw * 0.15} cy={topY - 5} rx={hw * 0.25} ry={hh * 0.4} fill={shade(d.roofColor, 0.15)} opacity="0.6" />
        </>
      )}
      {d.roofStyle === "flat" && (
        <polygon
          points={`${centerX - hw},${topY} ${centerX},${topY - hh} ${centerX + hw},${topY} ${centerX},${topY + hh}`}
          fill={d.roofColor}
        />
      )}
      {d.roofStyle === "mansard" && (
        <>
          <polygon
            points={`${centerX - hw},${topY} ${centerX},${topY - hh + 2} ${centerX + hw},${topY} ${centerX},${topY + hh}`}
            fill={shade(d.roofColor, -0.1)}
          />
          <polygon
            points={`${centerX - hw * 0.6},${topY - hh * 0.3} ${centerX},${topY - hh + 2} ${centerX + hw * 0.6},${topY - hh * 0.3} ${centerX},${topY + hh * 0.4}`}
            fill={d.roofColor}
          />
        </>
      )}

      {/* Chimney */}
      {d.hasChimney && (
        <rect x={centerX + hw * 0.25} y={topY - hh - 10} width={3} height={7} fill={shade(d.roofColor, -0.15)} />
      )}

      {/* Glyph badge */}
      {d.glyph && (
        <text x={centerX} y={topY - hh * 0.2} textAnchor="middle" fill="#FFFFFF" fontSize={hw * 0.4} fontWeight="800" fontFamily="sans-serif">
          {d.glyph}
        </text>
      )}

      {/* Protected badge: small lock icon floating above */}
      {protectedRing && (
        <g transform={`translate(${centerX},${topY - 16})`}>
          <circle r="5" fill="#C45D3E" />
          <rect x="-1.5" y="-2.2" width="3" height="4.4" rx="0.8" fill="#F5F0E8" />
          <path d="M -1.8 -2.2 q 0 -2.5 1.8 -2.5 t 1.8 2.5" stroke="#F5F0E8" strokeWidth="0.7" fill="none" />
        </g>
      )}

      {/* Highlight: calm golden outline around the base, no pulsing */}
      {highlighted && (
        <g>
          <polygon
            points={`${centerX - hw - 2},${centerY} ${centerX},${centerY - hh - 2} ${centerX + hw + 2},${centerY} ${centerX},${centerY + hh + 2}`}
            fill="none"
            stroke="#E0A94A"
            strokeWidth="1.6"
          />
          <polygon
            points={`${centerX - hw - 4},${centerY} ${centerX},${centerY - hh - 4} ${centerX + hw + 4},${centerY} ${centerX},${centerY + hh + 4}`}
            fill="none"
            stroke="#E0A94A"
            strokeWidth="0.8"
            opacity="0.45"
          />
        </g>
      )}
    </g>
  );
}

/* ============================================================== *
 *  Garden / trees                                                  *
 * ============================================================== */

function Tree({ x, y, size = 9 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <ellipse cx={x + 1.5} cy={y - size + 5} rx={size * 0.72} ry={size * 1.05} fill="#174E23" opacity="0.35" />
      <ellipse cx={x} cy={y - size + 2} rx={size * 0.82} ry={size * 1.12} fill="#2E6B34" />
      <ellipse cx={x - 1.7} cy={y - size + 0.5} rx={size * 0.5} ry={size * 0.72} fill="#4C9A4F" />
      <rect x={x - 1.1} y={y - 1.5} width={2.2} height={5} fill="#5B3312" />
    </g>
  );
}

function Garden({ x, y, count, lush }: { x: number; y: number; count: number; lush?: boolean }) {
  const trees: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const ox = (i - (count - 1) / 2) * 11;
    const oy = (i % 2) * 5 - 3;
    trees.push(<Tree key={i} x={x + ox} y={y + oy} size={lush ? 11 : 8} />);
  }
  return (
    <g>
      {lush && (
        <ellipse cx={x} cy={y + 4} rx={TILE_W / 2 - 5} ry={TILE_H / 2 - 2} fill="#5FA85A" opacity="0.38" />
      )}
      {trees}
    </g>
  );
}

/* ============================================================== *
 *  Lake Michigan                                                   *
 * ============================================================== */

function Lake({ bounds, shoreMinX, sw, ne }: {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  shoreMinX: number;
  sw: { x: number; y: number };
  ne: { x: number; y: number };
}) {
  // Wavy shoreline anchored east of the grid
  const shore: Array<[number, number]> = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = bounds.minY - 30 + t * (bounds.maxY - bounds.minY + 90);
    const wave = Math.sin(i * 0.9) * 6 + Math.cos(i * 1.3) * 3;
    shore.push([shoreMinX + wave, y]);
  }
  const east = bounds.maxX + 520;
  const lakePath = [
    ...shore,
    [east, shore[shore.length - 1][1]],
    [east, shore[0][1]],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  // Beach strip just west of the shoreline
  const beach: Array<[number, number]> = [];
  for (const [x, y] of shore) {
    beach.push([x - 5, y]);
  }
  const beachPath =
    beach.map(([x, y]) => `${x},${y}`).join(" ") +
    " " +
    shore.slice().reverse().map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <g>
      {/* Beach strip */}
      <polygon points={beachPath} fill="#E4D4A8" opacity="0.9" />
      {/* Lake water - gradient + wave pattern */}
      <polygon points={lakePath} fill="url(#lakeGrad)" />
      <polygon points={lakePath} fill="url(#waves2)" opacity="0.8" />
      <polygon points={lakePath} fill="url(#waves)" opacity="0.6" />
      {/* Shoreline stroke */}
      <polyline
        points={shore.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="#3E7A8C"
        strokeWidth="1.4"
        opacity="0.45"
      />
      {/* Piers */}
      <g>
        <rect x={shore[4][0]} y={shore[4][1] - 2} width={80} height={4} fill="#5B3312" />
        <rect x={shore[4][0] + 72} y={shore[4][1] - 8} width={16} height={16} fill="#8B5A3C" />
      </g>
      <g>
        <rect x={shore[12][0]} y={shore[12][1] - 2} width={50} height={3} fill="#5B3312" />
      </g>
      {/* Sailboats */}
      <g>
        <Sailboat x={bounds.maxX + 90} y={shore[6][1] - 10} />
        <Sailboat x={bounds.maxX + 220} y={shore[10][1] + 20} small />
        <Sailboat x={bounds.maxX + 140} y={shore[14][1] + 4} />
      </g>
      {/* Lake Michigan label */}
      <text
        x={bounds.maxX + 180}
        y={(bounds.maxY + bounds.minY) / 2 + 100}
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="22"
        fill="#26607A"
        opacity="0.72"
        letterSpacing="4"
      >
        Lake Michigan
      </text>
      {/* Suppress unused var lint */}
      {null}
      {sw && ne ? null : null}
    </g>
  );
}

function Sailboat({ x, y, small }: { x: number; y: number; small?: boolean }) {
  const s = small ? 0.8 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points={`-6,0 10,0 6,3 -3,3`} fill="#7A4E2E" />
      <polygon points={`0,-14 0,0 8,0`} fill="#FAF6EC" />
      <rect x="-0.8" y="-16" width="1.6" height="16" fill="#333" />
    </g>
  );
}

/* ============================================================== *
 *  Main map                                                        *
 * ============================================================== */

export interface ParcelMap3DProps {
  parcels: Parcel[];
  highlight?: number[];
  onHover?: (p: Parcel | null) => void;
  onClick?: (p: Parcel) => void;
}

export default function ParcelMap3D({ parcels, highlight, onHover, onClick }: ParcelMap3DProps) {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1.05);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<"all" | "housing" | "civic" | "commerce" | "protected" | "land-trust">("all");
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const isFilteredIn = (p: Parcel): boolean => {
    if (filter === "all") return true;
    if (filter === "housing") return ["single-family", "two-flat", "three-flat", "courtyard", "tower", "rehab-tower"].includes(p.type);
    if (filter === "civic") return ["school", "library", "clinic", "church", "park", "community-garden", "mural", "transit"].includes(p.type);
    if (filter === "commerce") return ["commercial", "industrial"].includes(p.type);
    if (filter === "protected") return p.protected;
    if (filter === "land-trust") return p.type === "land-trust" || p.owner === "land-trust";
    return true;
  };

  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = iso(c, r);
        minX = Math.min(minX, x - TILE_W / 2);
        maxX = Math.max(maxX, x + TILE_W / 2);
        minY = Math.min(minY, y - TILE_H / 2);
        maxY = Math.max(maxY, y + TILE_H / 2);
      }
    }
    return { minX, maxX, minY, maxY };
  }, []);

  const padLeft = 50;
  const padRight = 320;
  const padTop = 150;
  const padBottom = 70;
  const mapWidth = bounds.maxX - bounds.minX + padLeft + padRight;
  const mapHeight = bounds.maxY - bounds.minY + padTop + padBottom;
  const offsetX = -bounds.minX + padLeft;
  const offsetY = -bounds.minY + padTop;

  const highSet = useMemo(() => new Set(highlight ?? []), [highlight]);

  const drawList = useMemo(
    () => parcels.slice().sort((a, b) => a.row + a.col - (b.row + b.col)),
    [parcels]
  );

  /* ---- drag / zoom ---- */
  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY };
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    setPanX(dragStart.current.panX + (e.clientX - dragStart.current.x));
    setPanY(dragStart.current.panY + (e.clientY - dragStart.current.y));
  }
  function handleMouseUp() {
    setDragging(false);
    dragStart.current = null;
  }
  function handleWheel(e: React.WheelEvent) {
    const delta = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    setZoom((z) => Math.max(0.55, Math.min(2.4, z * delta)));
  }

  const shoreMinX = iso(COLS - 1, 0).x + TILE_W / 2 + 12;
  const swIso = iso(0, ROWS - 1);
  const neIso = iso(COLS - 1, 0);

  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border shadow-sm"
      style={{ background: "linear-gradient(180deg, #F5F0E8 0%, #EDE5D1 55%, #E2D7BD 100%)" }}
    >
      {/* Filter pill bar */}
      <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 flex flex-wrap gap-1 rounded-full bg-cream/90 p-1 shadow-sm">
        {(["all", "housing", "civic", "commerce", "protected", "land-trust"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-2.5 py-0.5 font-body text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              filter === f ? "bg-forest text-cream" : "text-warm-gray hover:bg-cream-dark"
            }`}
          >
            {f === "land-trust" ? "Land trust" : f}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(2.4, z * 1.12))}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-cream/90 font-display text-base font-bold text-forest shadow-sm hover:bg-cream-dark"
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(0.55, z / 1.12))}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-cream/90 font-display text-base font-bold text-forest shadow-sm hover:bg-cream-dark"
        >−</button>
        <button
          onClick={() => { setPanX(0); setPanY(0); setZoom(1.05); }}
          className="h-8 rounded-sm border border-border bg-cream/90 px-2 font-body text-[10px] font-semibold uppercase tracking-widest text-forest shadow-sm hover:bg-cream-dark"
        >Reset</button>
      </div>

      {/* Title badge */}
      <div className="absolute left-2 top-2 z-10 rounded-sm bg-cream/90 px-2.5 py-1 shadow-sm">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">Parkhaven</p>
      </div>

      {/* Compass */}
      <div className="absolute bottom-2 left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-cream/90 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-9 w-9">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#1B3A2D" strokeWidth="0.5" opacity="0.3" />
          <polygon points="16,3 20,16 16,14 12,16" fill="#1B3A2D" />
          <polygon points="16,29 20,16 16,18 12,16" fill="#1B3A2D" opacity="0.25" />
          <text x="16" y="10" textAnchor="middle" fontSize="6" fontFamily="serif" fontWeight="800" fill="#1B3A2D">N</text>
        </svg>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-cream/80 px-3 py-1 shadow-sm">
        <p className="font-body text-[10px] text-warm-gray">Drag to pan · scroll to zoom</p>
      </div>

      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="block w-full cursor-grab select-none active:cursor-grabbing"
        style={{ height: "auto", maxHeight: "540px" }}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); onHover?.(null); }}
        onWheel={handleWheel}
      >
        <defs>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8EC4D4" />
            <stop offset="50%" stopColor="#4A8FA3" />
            <stop offset="100%" stopColor="#2E6B7F" />
          </linearGradient>
          <pattern id="waves" x="0" y="0" width="24" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-5)">
            <path d="M0,5 Q6,2 12,5 T24,5" stroke="#FAF6EC" strokeWidth="1.1" fill="none" opacity="0.7" />
          </pattern>
          <pattern id="waves2" x="0" y="0" width="32" height="14" patternUnits="userSpaceOnUse">
            <path d="M0,7 Q8,3 16,7 T32,7" stroke="#B4D8E4" strokeWidth="0.8" fill="none" opacity="0.45" />
          </pattern>
          <radialGradient id="parcelShadow">
            <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Subtle cloud wisps */}
        <g opacity="0.35" fill="#FFFFFF">
          <ellipse cx="220" cy="48" rx="40" ry="5" />
          <ellipse cx="470" cy="36" rx="28" ry="4" />
        </g>

        <g transform={`translate(${panX}, ${panY}) scale(${zoom}) translate(${offsetX}, ${offsetY})`}>
          {/* Base plate (street color under tiles) */}
          {(() => {
            const nw = iso(0, 0);
            const ne = iso(COLS - 1, 0);
            const sw = iso(0, ROWS - 1);
            const se = iso(COLS - 1, ROWS - 1);
            const pad = 8;
            const pts = [
              [nw.x - TILE_W / 2 - pad, nw.y - TILE_H / 2 - pad],
              [ne.x + TILE_W / 2 + pad, ne.y - TILE_H / 2 - pad],
              [se.x + TILE_W / 2 + pad, se.y + TILE_H / 2 + pad],
              [sw.x - TILE_W / 2 - pad, sw.y + TILE_H / 2 + pad],
            ]
              .map((p) => p.join(","))
              .join(" ");
            return <polygon points={pts} fill="#6F6459" opacity="0.95" />;
          })()}

          {/* Lake */}
          <Lake bounds={bounds} shoreMinX={shoreMinX} sw={swIso} ne={neIso} />

          {/* Parcel ground tiles */}
          {parcels.map((p) => {
            const { x, y } = iso(p.col, p.row);
            return (
              <Diamond
                key={`g-${p.id}`}
                x={x}
                y={y}
                hw={TILE_W / 2 - 2}
                hh={TILE_H / 2 - 1}
                fill={groundFill(p)}
                stroke={groundStroke(p)}
                strokeWidth={0.55}
              />
            );
          })}

          {/* Street center stripes on major avenues */}
          {(() => {
            const lines: React.ReactNode[] = [];
            for (let r = 2; r < ROWS; r += 3) {
              const a = iso(-0.5, r - 0.5);
              const b = iso(COLS - 0.5, r - 0.5);
              lines.push(
                <line key={`h-${r}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#EDE5D1" strokeWidth="0.9" strokeDasharray="5 5" opacity="0.55" />
              );
            }
            for (let c = 3; c < COLS; c += 3) {
              const a = iso(c - 0.5, -0.5);
              const b = iso(c - 0.5, ROWS - 0.5);
              lines.push(
                <line key={`v-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#EDE5D1" strokeWidth="0.9" strokeDasharray="5 5" opacity="0.55" />
              );
            }
            return lines;
          })()}

          {/* Shadows */}
          {drawList.map((p) => {
            const d = designFor(p);
            if (!d) return null;
            const totalH = d.stories * d.storyH;
            const { x, y } = iso(p.col, p.row);
            const spread = Math.min(TILE_W * 0.65, totalH * 0.22);
            return (
              <ellipse
                key={`sh-${p.id}`}
                cx={x + 4 + spread * 0.35}
                cy={y + 3 + spread * 0.12}
                rx={TILE_W / 2 * d.footprint + spread * 0.3}
                ry={TILE_H / 2 * d.footprint + spread * 0.15}
                fill="url(#parcelShadow)"
                opacity="0.6"
              />
            );
          })}

          {/* Buildings */}
          {drawList.map((p) => {
            const { x, y } = iso(p.col, p.row);
            const inFilter = isFilteredIn(p);
            return (
              <g
                key={`b-${p.id}`}
                onMouseEnter={() => onHover?.(p)}
                onClick={() => onClick?.(p)}
                style={{ cursor: onClick ? "pointer" : "default", opacity: inFilter ? 1 : 0.18 }}
              >
                <Building p={p} centerX={x} centerY={y} highlighted={highSet.has(p.id)} protectedRing={p.protected} />
                {p.type === "park" && <Garden x={x} y={y + 4} count={5} lush />}
                {p.type === "community-garden" && <Garden x={x} y={y + 4} count={4} lush />}
                {p.type === "land-trust" && <Garden x={x + 8} y={y + 2} count={1} />}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
