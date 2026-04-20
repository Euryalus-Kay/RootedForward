"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Parcel, ParcelType } from "@/lib/game/types";
import { COLS, ROWS } from "@/lib/game/parcels";

/* ------------------------------------------------------------------ */
/*  Isometric projection                                               */
/* ------------------------------------------------------------------ */

const TILE_W = 52;
const TILE_H = 26;

function iso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/* ------------------------------------------------------------------ */
/*  Palettes                                                           */
/* ------------------------------------------------------------------ */

function groundFill(p: Parcel): string {
  // HOLC-inspired tint baked into the ground - strong saturation
  if (p.owner === "speculator") return "#EEA888";
  switch (p.holc) {
    case "A": return "#88C070";
    case "B": return "#7FA8C9";
    case "C": return "#E3B140";
    case "D": return "#CC5E52";
    default: return "#E8DEC9";
  }
}

function groundShadow(p: Parcel): string {
  switch (p.holc) {
    case "A": return "#5E9048";
    case "B": return "#547E9E";
    case "C": return "#A37D1D";
    case "D": return "#8E3C32";
    default: return "#BFB29A";
  }
}

interface BuildingStyle {
  heights: number[];            // stack heights in isometric units
  colors: string[];             // main wall color per layer, top to bottom
  roof?: string;                // roof accent color
  roofShape?: "flat" | "peak" | "dome";
  glyph?: string;               // icon on top face
  trees?: number;               // 0-4 small tree tufts
  garden?: boolean;
  water?: boolean;
}

/** Several palettes per type so different parcels of the same type
 *  look varied. Deterministic pick based on parcel id. */
const STYLE_VARIANTS: Record<ParcelType, BuildingStyle[]> = {
  vacant:              [{ heights: [],       colors: [],                                     trees: 0 }],
  "single-family":     [
    { heights: [26], colors: ["#E6D1AE"], roof: "#8B4523", roofShape: "peak" },
    { heights: [28], colors: ["#D8B894"], roof: "#654321", roofShape: "peak" },
    { heights: [26], colors: ["#F0D8B6"], roof: "#A0522D", roofShape: "peak" },
    { heights: [28], colors: ["#C9A87B"], roof: "#5D2E0D", roofShape: "peak" },
  ],
  "two-flat":          [
    { heights: [38], colors: ["#C78A5A"], roof: "#6B3810", roofShape: "flat" },
    { heights: [40], colors: ["#B4814F"], roof: "#57280A", roofShape: "flat" },
    { heights: [42], colors: ["#D49A67"], roof: "#704019", roofShape: "flat" },
  ],
  "three-flat":        [
    { heights: [54], colors: ["#B07754"], roof: "#5B2B0E", roofShape: "flat" },
    { heights: [58], colors: ["#A06A49"], roof: "#4A230B", roofShape: "flat" },
    { heights: [52], colors: ["#C28660"], roof: "#6A3315", roofShape: "flat" },
  ],
  courtyard:           [
    { heights: [42, 42], colors: ["#C19570", "#B88357"], roof: "#5F2C0A", roofShape: "flat" },
  ],
  tower:               [
    { heights: [130], colors: ["#6F6F6F"], roof: "#3A3A3A", roofShape: "flat" },
    { heights: [120], colors: ["#7A7A7A"], roof: "#2E2E2E", roofShape: "flat" },
  ],
  "rehab-tower":       [
    { heights: [100], colors: ["#668B76"], roof: "#2F4D3B", roofShape: "flat" },
  ],
  commercial:          [
    { heights: [50], colors: ["#B56D27"], roof: "#6E3B10", roofShape: "flat" },
    { heights: [46], colors: ["#A05016"], roof: "#5A260C", roofShape: "flat" },
  ],
  industrial:          [
    { heights: [38], colors: ["#57574F"], roof: "#2C2C26", roofShape: "flat" },
  ],
  school:              [
    { heights: [54], colors: ["#A5432A"], roof: "#5B2108", roofShape: "flat", glyph: "school" },
  ],
  church:              [
    { heights: [50], colors: ["#D8B890"], roof: "#6A3C15", roofShape: "peak" },
  ],
  park:                [
    { heights: [], colors: [], trees: 5, garden: true },
  ],
  transit:             [
    { heights: [42], colors: ["#C54C3A"], roof: "#7A1C14", roofShape: "dome", glyph: "transit" },
  ],
  expressway:          [
    { heights: [8], colors: ["#1A1A1A"], roof: "#0A0A0A", roofShape: "flat" },
  ],
  "land-trust":        [
    { heights: [34], colors: ["#2F6049"], roof: "#183827", roofShape: "flat", trees: 2 },
  ],
  demolished:          [{ heights: [], colors: [], trees: 0 }],
  mural:               [
    { heights: [26], colors: ["#E08560"], roof: "#7A2F1A", roofShape: "flat" },
  ],
  "community-garden":  [
    { heights: [], colors: [], trees: 4, garden: true },
  ],
  library:             [
    { heights: [42], colors: ["#8F6A35"], roof: "#4E3418", roofShape: "flat", glyph: "library" },
  ],
  clinic:              [
    { heights: [44], colors: ["#A5432A"], roof: "#5B2108", roofShape: "flat", glyph: "clinic" },
  ],
};

/** Wall-color palettes by HOLC grade. Each grade has a distinct mood:
 *  A = brightwhite-pastel, B = muted blue, C = yellow-tan, D = faded rust. */
const WALL_PALETTE: Record<string, string[]> = {
  A: ["#F3EAD4", "#E8D8B8", "#F5E6C4", "#EDD9B0"],
  B: ["#C4D4DC", "#B8C8D4", "#CCD8E0", "#B4C4D0"],
  C: ["#E6C878", "#D8B866", "#E8CC80", "#D4B058"],
  D: ["#C08080", "#B07070", "#B88080", "#A86868"],
  ungraded: ["#D4CAB3", "#CCC0A8"],
};

function styleForParcel(p: Parcel): BuildingStyle {
  const variants = STYLE_VARIANTS[p.type];
  if (variants.length === 0) return variants[0];
  const base = variants[p.id % variants.length];
  // For residential types (the dominant ones), tint walls by HOLC.
  const residential: ParcelType[] = ["single-family", "two-flat", "three-flat", "courtyard"];
  if (residential.includes(p.type)) {
    const palette = WALL_PALETTE[p.holc] ?? WALL_PALETTE.ungraded;
    const wall = palette[p.id % palette.length];
    return { ...base, colors: base.colors.map(() => wall) };
  }
  return base;
}

/** Pick a small roof-accent color unique per parcel id so the skyline
 *  looks varied. Keeps palette calm and site-aligned. */
function accentFor(p: Parcel): string {
  const palette = [
    "#A8462A", "#2F5C3D", "#4A4A4A", "#7C5A2E", "#8A5535",
    "#4D4D4D", "#2F6049", "#6A3C15", "#5B2B0E",
  ];
  return palette[p.id % palette.length];
}

function lighten(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.round(r * (1 - amt)));
  g = Math.max(0, Math.round(g * (1 - amt)));
  b = Math.max(0, Math.round(b * (1 - amt)));
  return `rgb(${r},${g},${b})`;
}

/* ------------------------------------------------------------------ */
/*  Building renderer                                                  */
/* ------------------------------------------------------------------ */

function Building({
  style,
  x,
  y,
  highlighted,
  protectedRing,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  style: BuildingStyle;
  x: number;
  y: number;
  highlighted?: boolean;
  protectedRing?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  // Stack multiple layers vertically. Each layer is drawn as a box.
  const layers: React.ReactNode[] = [];
  let currentY = y; // currentY is the top of the topmost layer we've drawn, starting at the ground center

  // We render from top layer down so higher layers paint on top.
  // But visually, layers stack UP from the ground. So we need to draw
  // the bottom layer first (lower in z-order) then layers above.
  const totalHeight = style.heights.reduce((a, b) => a + b, 0);
  let layerTop = y - totalHeight;
  for (let i = 0; i < style.heights.length; i++) {
    const h = style.heights[i];
    const color = style.colors[i];
    layers.push(<Box key={i} x={x} topY={layerTop} height={h} color={color} roof={i === 0 ? style.roof : undefined} roofShape={i === 0 ? style.roofShape : undefined} glyph={i === 0 ? style.glyph : undefined} />);
    layerTop += h;
  }
  // Unused variable cleanup
  void currentY;

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {layers}
      {protectedRing && (
        <ellipse cx={x} cy={y + 2} rx={TILE_W / 2 + 2} ry={TILE_H / 2 + 1} fill="none" stroke="#C45D3E" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.8" />
      )}
      {highlighted && (
        <ellipse cx={x} cy={y + 2} rx={TILE_W / 2 + 3} ry={TILE_H / 2 + 2} fill="none" stroke="#1B3A2D" strokeWidth="2" opacity="0.85">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
        </ellipse>
      )}
    </g>
  );
}

/** A 3D-ish extruded box drawn isometrically. Footprint is smaller
 *  than the full tile so ground shows through as sidewalks. */
function Box({
  x,
  topY,
  height,
  color,
  roof,
  roofShape,
  glyph,
}: {
  x: number;
  topY: number;
  height: number;
  color: string;
  roof?: string;
  roofShape?: "flat" | "peak" | "dome";
  glyph?: string;
}) {
  const half = (TILE_W / 2) * 0.62;   // shrink footprint to leave clear street visible
  const halfY = (TILE_H / 2) * 0.62;
  // Ground points for this box layer (the base of the layer)
  const baseY = topY + height;
  const top = lighten(color, 0.15);
  const right = darken(color, 0.15);
  const left = darken(color, 0.05);

  // Top face (diamond)
  const topPoints = [
    [x, topY - halfY],        // top apex
    [x + half, topY],          // right
    [x, topY + halfY],         // bottom apex
    [x - half, topY],          // left
  ]
    .map((p) => p.join(","))
    .join(" ");

  // Right face (visible, darker)
  const rightPoints = [
    [x, topY + halfY],         // top-near
    [x + half, topY],          // top-right
    [x + half, baseY],         // bottom-right
    [x, baseY + halfY],        // bottom-near
  ]
    .map((p) => p.join(","))
    .join(" ");

  // Left face (visible, slightly lighter than right)
  const leftPoints = [
    [x, topY + halfY],         // top-near
    [x - half, topY],          // top-left
    [x - half, baseY],         // bottom-left
    [x, baseY + halfY],        // bottom-near
  ]
    .map((p) => p.join(","))
    .join(" ");

  return (
    <g>
      {/* Left face */}
      <polygon points={leftPoints} fill={left} />
      {/* Right face */}
      <polygon points={rightPoints} fill={right} />
      {/* Top face */}
      <polygon points={topPoints} fill={roof ?? top} />

      {/* Windows on the right and left faces - subtle grid */}
      {height > 20 && (
        <g opacity="0.45">
          {/* Right face windows (3 rows, 2 cols) */}
          {Array.from({ length: 3 }).map((_, row) => (
            <g key={`rw-${row}`}>
              <rect
                x={x + 4}
                y={topY + 4 + (row * (height / 3)) + (row * 2)}
                width="6"
                height={Math.min(8, (height / 3) - 4)}
                fill={darken(color, 0.4)}
              />
              <rect
                x={x + half - 10}
                y={topY + 6 + (row * (height / 3)) + (row * 2)}
                width="6"
                height={Math.min(8, (height / 3) - 4)}
                fill={darken(color, 0.4)}
              />
            </g>
          ))}
        </g>
      )}

      {/* Roof accents */}
      {roofShape === "peak" && (
        <polygon
          points={`${x},${topY - halfY - 8} ${x + half},${topY} ${x},${topY + halfY} ${x - half},${topY}`}
          fill={darken(roof ?? top, 0.1)}
        />
      )}
      {roofShape === "dome" && (
        <ellipse cx={x} cy={topY - 4} rx={half * 0.7} ry={halfY * 0.9} fill={darken(roof ?? top, 0.1)} />
      )}

      {/* Glyph badges */}
      {glyph === "school" && (
        <text x={x} y={topY + 3} textAnchor="middle" fill="#FFF" fontFamily="sans-serif" fontSize="9" fontWeight="700">S</text>
      )}
      {glyph === "library" && (
        <text x={x} y={topY + 3} textAnchor="middle" fill="#FFF" fontFamily="sans-serif" fontSize="9" fontWeight="700">L</text>
      )}
      {glyph === "clinic" && (
        <text x={x} y={topY + 3} textAnchor="middle" fill="#FFF" fontFamily="sans-serif" fontSize="11" fontWeight="700">+</text>
      )}
      {glyph === "transit" && (
        <text x={x} y={topY + 3} textAnchor="middle" fill="#FFF" fontFamily="sans-serif" fontSize="9" fontWeight="700">M</text>
      )}
    </g>
  );
}

/** Trees and green garden patch on a parcel */
function Garden({ x, y, count, large, lush }: { x: number; y: number; count: number; large?: boolean; lush?: boolean }) {
  const trees = Array.from({ length: count }).map((_, i) => {
    const ox = (i - (count - 1) / 2) * 11;
    const oy = (i % 2) * 5 - 3;
    return <Tree key={i} x={x + ox} y={y + oy} size={large ? 12 : 8} />;
  });
  return (
    <g>
      {lush && (
        <ellipse
          cx={x}
          cy={y + 4}
          rx={TILE_W / 2 - 4}
          ry={TILE_H / 2 - 2}
          fill="#4F8A4A"
          opacity="0.35"
        />
      )}
      {trees}
    </g>
  );
}

function Tree({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <ellipse cx={x + 1.5} cy={y - size + 5} rx={size * 0.7} ry={size} fill="#1B5E28" opacity="0.35" />
      <ellipse cx={x} cy={y - size + 2} rx={size * 0.8} ry={size * 1.1} fill="#2F7A3A" />
      <ellipse cx={x - 1.5} cy={y - size + 1} rx={size * 0.5} ry={size * 0.7} fill="#4CA257" />
      <rect x={x - 1} y={y - 2} width={2.2} height={5} fill="#5D3A1A" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  The main map                                                       */
/* ------------------------------------------------------------------ */

export interface ParcelMap3DProps {
  parcels: Parcel[];
  highlight?: number[];
  onHover?: (p: Parcel | null) => void;
  onClick?: (p: Parcel) => void;
}

export default function ParcelMap3D({ parcels, highlight, onHover, onClick }: ParcelMap3DProps) {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1.15);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Compute overall bounds
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

  const padLeft = 40;
  const padRight = 260; // room for the lake
  const padTop = 140; // room for tallest towers
  const padBottom = 60;
  const mapWidth = bounds.maxX - bounds.minX + padLeft + padRight;
  const mapHeight = bounds.maxY - bounds.minY + padTop + padBottom;
  const offsetX = -bounds.minX + padLeft;
  const offsetY = -bounds.minY + padTop;

  const highlightSet = new Set(highlight ?? []);

  /* ----- draw parcels in painter's order (back to front) -----
     In isometric (col - row, col + row), back-to-front = lower (col + row)
     first. So we sort by row + col ascending. */
  const drawList = useMemo(
    () =>
      parcels
        .slice()
        .sort((a, b) => a.row + a.col - (b.row + b.col)),
    [parcels]
  );

  /* ---------- Event handlers ---------- */
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
    setZoom((z) => Math.max(0.5, Math.min(2.2, z * delta)));
  }

  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border shadow-sm" style={{ background: "linear-gradient(to bottom, #F5F0E8 0%, #EDE6D8 40%, #E0D5BF 100%)" }}>
      {/* Control bar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
          aria-label="Zoom in"
          className="h-8 w-8 rounded-sm border border-border bg-cream font-display text-lg font-bold text-forest shadow-sm hover:bg-cream-dark"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.15))}
          aria-label="Zoom out"
          className="h-8 w-8 rounded-sm border border-border bg-cream font-display text-lg font-bold text-forest shadow-sm hover:bg-cream-dark"
        >
          -
        </button>
        <button
          onClick={() => { setPanX(0); setPanY(0); setZoom(1); }}
          aria-label="Reset view"
          className="h-8 rounded-sm border border-border bg-cream px-2 font-body text-[10px] font-semibold uppercase tracking-widest text-forest shadow-sm hover:bg-cream-dark"
        >
          Reset
        </button>
      </div>

      {/* North arrow */}
      <div className="absolute bottom-2 left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-cream/90 shadow-md">
        <svg viewBox="0 0 32 32" className="h-10 w-10">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#1B3A2D" strokeWidth="0.5" opacity="0.3" />
          <polygon points="16,3 20,16 16,14 12,16" fill="#1B3A2D" />
          <polygon points="16,29 20,16 16,18 12,16" fill="#1B3A2D" opacity="0.25" />
          <text x="16" y="10" textAnchor="middle" fontSize="6" fontFamily="serif" fontWeight="800" fill="#1B3A2D">N</text>
          <text x="16" y="26" textAnchor="middle" fontSize="4" fontFamily="serif" fill="#1B3A2D" opacity="0.4">S</text>
          <text x="26" y="17" textAnchor="middle" fontSize="4" fontFamily="serif" fill="#1B3A2D" opacity="0.4">E</text>
          <text x="6" y="17" textAnchor="middle" fontSize="4" fontFamily="serif" fill="#1B3A2D" opacity="0.4">W</text>
        </svg>
      </div>

      {/* Map title */}
      <div className="absolute left-2 top-2 z-10 rounded-sm bg-cream/90 px-2.5 py-1 shadow-sm">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
          Parkhaven
        </p>
      </div>

      {/* Mini helper bar bottom-center */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-cream/85 px-3 py-1 shadow-sm">
        <p className="font-body text-[10px] text-warm-gray">
          Drag to pan &middot; scroll to zoom &middot; hover a building
        </p>
      </div>

      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="block w-full cursor-grab select-none active:cursor-grabbing"
        style={{ height: "auto", maxHeight: "520px" }}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); onHover?.(null); }}
        onWheel={handleWheel}
      >
        <defs>
          {/* Water pattern */}
          <pattern id="water" x="0" y="0" width="20" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <path d="M0,4 Q5,1 10,4 T20,4" stroke="#4A8FA3" strokeWidth="1.1" fill="none" opacity="0.55" />
          </pattern>
          <linearGradient id="lake" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6FB5C8" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#4A8FA3" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#3E7A8C" stopOpacity="0.8" />
          </linearGradient>
          {/* Parcel shadow */}
          <radialGradient id="parcelShadow">
            <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#000" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky ornaments rendered outside the pan/zoom transform so they stay put */}
        <g>
          {/* Sun */}
          <circle cx={mapWidth - 100} cy={60} r="16" fill="#F5DEB3" opacity="0.7" />
          <circle cx={mapWidth - 100} cy={60} r="22" fill="#F5DEB3" opacity="0.25" />
          {/* Clouds */}
          <g opacity="0.5" fill="#FFFFFF">
            <ellipse cx="180" cy="55" rx="22" ry="8" />
            <ellipse cx="195" cy="50" rx="18" ry="8" />
            <ellipse cx="170" cy="50" rx="14" ry="6" />
          </g>
          <g opacity="0.4" fill="#FFFFFF">
            <ellipse cx="420" cy="40" rx="18" ry="7" />
            <ellipse cx="432" cy="36" rx="14" ry="6" />
          </g>
        </g>

        <g transform={`translate(${panX}, ${panY}) scale(${zoom}) translate(${offsetX}, ${offsetY})`}>
          {/* Lake Michigan east of the grid, with beach and piers */}
          {(() => {
            // East edge follows a wavy shoreline anchored roughly to col=COLS
            const shoreline: [number, number][] = [];
            for (let r = 0; r < ROWS; r++) {
              const p = iso(COLS - 1, r);
              // Shift east a bit and add a gentle wave offset
              const wave = Math.sin(r * 1.2) * 8;
              shoreline.push([p.x + TILE_W / 2 + 20 + wave, p.y - TILE_H / 2]);
              shoreline.push([p.x + TILE_W / 2 + 20 + wave, p.y + TILE_H / 2]);
            }
            const shoreStart = shoreline[0];
            const shoreEnd = shoreline[shoreline.length - 1];
            const lakePath = [
              [shoreStart[0], shoreStart[1] - 40],
              ...shoreline,
              [shoreEnd[0], shoreEnd[1] + 40],
              [bounds.maxX + 500, shoreEnd[1] + 40],
              [bounds.maxX + 500, shoreStart[1] - 40],
            ]
              .map((p) => p.join(","))
              .join(" ");
            // Beach: a thin tan strip inside the shoreline
            const beachPath = shoreline
              .map(([x, y], i) => {
                const inX = x - 4;
                return `${inX},${y}`;
              })
              .concat(shoreline.slice().reverse().map(([x, y]) => `${x},${y}`))
              .join(" ");

            return (
              <g>
                {/* Beach */}
                <polygon points={beachPath} fill="#E8D8B0" opacity="0.9" />
                {/* Lake water */}
                <polygon points={lakePath} fill="url(#lake)" />
                <polygon points={lakePath} fill="url(#water)" />
                {/* Pier 1 */}
                <rect x={shoreline[2][0]} y={shoreline[2][1] - 2} width="90" height="4" fill="#8B5A3C" />
                <rect x={shoreline[2][0] + 85} y={shoreline[2][1] - 10} width="20" height="20" fill="#6F4A30" />
                {/* Pier 2 */}
                <rect x={shoreline[8][0]} y={shoreline[8][1] - 2} width="60" height="3" fill="#8B5A3C" />
                {/* Sailboats */}
                <g transform={`translate(${bounds.maxX + 60}, ${(bounds.maxY + bounds.minY) / 2 - 60})`}>
                  <polygon points="0,-12 0,0 10,0" fill="#F5F0E8" />
                  <rect x="-1" y="-14" width="1.5" height="14" fill="#333" />
                </g>
                <g transform={`translate(${bounds.maxX + 180}, ${(bounds.maxY + bounds.minY) / 2 + 30})`}>
                  <polygon points="0,-10 0,0 8,0" fill="#F5F0E8" />
                  <rect x="-1" y="-12" width="1.5" height="12" fill="#333" />
                </g>
                <g transform={`translate(${bounds.maxX + 120}, ${(bounds.maxY + bounds.minY) / 2 - 10})`}>
                  <polygon points="0,-8 0,0 6,0" fill="#F5F0E8" />
                  <rect x="-1" y="-10" width="1.5" height="10" fill="#333" />
                </g>
                <text
                  x={bounds.maxX + 150}
                  y={(bounds.maxY + bounds.minY) / 2 + 110}
                  textAnchor="middle"
                  fontFamily="serif"
                  fontStyle="italic"
                  fontSize="20"
                  fill="#26607A"
                  opacity="0.75"
                  letterSpacing="4"
                >
                  Lake Michigan
                </text>
              </g>
            );
          })()}

          {/* Full base ground (darker street color under everything) */}
          {(() => {
            const nw = iso(0, 0);
            const ne = iso(COLS - 1, 0);
            const sw = iso(0, ROWS - 1);
            const se = iso(COLS - 1, ROWS - 1);
            const hx = TILE_W / 2;
            const hy = TILE_H / 2;
            const basePoints = [
              [nw.x, nw.y - hy],
              [ne.x + hx, ne.y],
              [se.x, se.y + hy],
              [sw.x - hx, sw.y],
            ].map((p) => p.join(",")).join(" ");
            return <polygon points={basePoints} fill="#7A6E5F" />;
          })()}

          {/* Draw each parcel's ground as a slightly smaller diamond so
              the dark base shows through as streets between tiles. */}
          {parcels.map((p) => {
            const { x, y } = iso(p.col, p.row);
            const half = TILE_W / 2 - 2.5;
            const halfY = TILE_H / 2 - 1.5;
            const groundPoints = [
              [x, y - halfY],
              [x + half, y],
              [x, y + halfY],
              [x - half, y],
            ].map((pt) => pt.join(",")).join(" ");
            return (
              <g key={`ground-${p.id}`}>
                <polygon points={groundPoints} fill={groundFill(p)} stroke={groundShadow(p)} strokeWidth="0.5" />
              </g>
            );
          })}

          {/* Street paint: white dashed centerlines on the main roads */}
          {(() => {
            const lines: React.ReactNode[] = [];
            // A few avenue centerlines running NW-SE and NE-SW
            for (let r = 2; r < ROWS; r += 3) {
              const a = iso(0, r - 0.5);
              const b = iso(COLS - 1, r - 0.5);
              lines.push(
                <line
                  key={`ln-h-${r}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#F5F0E8"
                  strokeWidth="0.8"
                  strokeDasharray="5 5"
                  opacity="0.6"
                />
              );
            }
            for (let c = 2; c < COLS; c += 3) {
              const a = iso(c - 0.5, 0);
              const b = iso(c - 0.5, ROWS - 1);
              lines.push(
                <line
                  key={`ln-v-${c}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#F5F0E8"
                  strokeWidth="0.8"
                  strokeDasharray="5 5"
                  opacity="0.6"
                />
              );
            }
            return lines;
          })()}


          {/* Shadows under every building. Shadow length scales with height */}
          {drawList.map((p) => {
            const style = styleForParcel(p);
            const totalH = style.heights.reduce((a, b) => a + b, 0);
            if (totalH === 0) return null;
            const { x, y } = iso(p.col, p.row);
            const shadowExtent = Math.min(TILE_W * 0.8, totalH * 0.25);
            return (
              <ellipse
                key={`shadow-${p.id}`}
                cx={x + 6 + shadowExtent * 0.3}
                cy={y + 4 + shadowExtent * 0.15}
                rx={TILE_W / 2 - 2 + shadowExtent * 0.25}
                ry={TILE_H / 2 + shadowExtent * 0.1}
                fill="url(#parcelShadow)"
                opacity="0.55"
              />
            );
          })}

          {/* Buildings in painter order (back to front) */}
          {drawList.map((p) => {
            const style = styleForParcel(p);
            const { x, y } = iso(p.col, p.row);
            const totalH = style.heights.reduce((a, b) => a + b, 0);
            return (
              <g key={`b-${p.id}`}>
                {totalH > 80 && (
                  <ellipse cx={x} cy={y - totalH} rx={TILE_W * 0.8} ry={10} fill="#F5DEB3" opacity="0.12" />
                )}
                {style.heights.length > 0 && (
                  <Building
                    style={style}
                    x={x}
                    y={y}
                    highlighted={highlightSet.has(p.id)}
                    protectedRing={p.protected}
                    onMouseEnter={() => onHover?.(p)}
                    onMouseLeave={() => onHover?.(null)}
                    onClick={() => onClick?.(p)}
                  />
                )}
                {(style.trees ?? 0) > 0 && <Garden x={x} y={y + 4} count={style.trees!} large={p.type === "park"} lush={p.type === "park" || p.type === "community-garden"} />}
                {style.heights.length === 0 && !style.trees && p.type !== "vacant" && (
                  /* fallback marker if a type has no style */
                  <circle cx={x} cy={y} r={4} fill="#1B3A2D" opacity="0.2" />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
