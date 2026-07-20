// ------------------------------------------------------------------
// Hand-drawn plates, one per stop, all drawn with the same pen in an
// engraver's grammar: a heavier contour line, fine interior lines,
// flat-ended hatch strokes for shade, and one quiet accent color.
// They appear at the head of each stop and in the plate index on the
// landing page. Drawn by hand in SVG for this tour; not icons.
// ------------------------------------------------------------------
import type { ReactNode } from "react";

const INK = "#1B3A2D";
const BRASS = "#C9A227";
const RUST = "#C45D3E";
const WATER = "#4A6B8A";

// contour: the heavy outline pen
const contour = {
  stroke: INK,
  strokeWidth: 2.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};
// fine: interior structure lines
const fine = { ...contour, strokeWidth: 1.2 };
// hatch: flat-ended shading strokes, the engraver's tone
const hatch = { ...fine, strokeWidth: 1, strokeLinecap: "butt" as const, strokeOpacity: 0.65 };
const water = { ...fine, stroke: WATER, strokeDasharray: "7 5" };

function Baseline({ x0 = 14, x1 = 106, y = 66 }: { x0?: number; x1?: number; y?: number }) {
  return <path d={`M${x0} ${y}H${x1}`} {...fine} />;
}

/** short diagonal hatch ticks along the ground, to one side of a subject */
function GroundShade({ x = 74, y = 66, n = 5 }: { x?: number; y?: number; n?: number }) {
  const d = Array.from({ length: n }, (_, i) => `M${x + i * 5} ${y} l3.4 -3.4`).join(" ");
  return <path d={d} {...hatch} />;
}

/** a scalloped, hatched tree: canopy of arcs over a trunk */
function SketchTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  // y is the ground line; canopy drawn above it
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-9 -8 C-12 -10 -12 -15 -8 -16 C-8 -21 -2 -23 1 -20 C5 -23 10 -20 9 -16 C13 -14 12 -9 8 -8 C4 -6 -5 -6 -9 -8 Z"
        {...fine}
      />
      <path d="M-5 -11 l4 -4 M-1 -10 l5 -5 M3 -11 l3 -3" {...hatch} />
      <path d="M0 -7 V0" {...fine} />
    </g>
  );
}

/* Stop 1: the Obama Presidential Center tower, the letter crown
   hatched, low museum volumes at its foot */
function ObamaCenter() {
  return (
    <>
      <path d="M53 66 L48 10 L80 10 L74 66" {...contour} />
      {/* the carved letter band near the crown, as texture */}
      <path d="M50 14 H78.5 M50.6 22 H77.6" {...fine} />
      <path
        d="M52 15.5 v5 M56 15.5 v5 M60 15.5 v5 M64 15.5 v5 M68 15.5 v5 M72 15.5 v5 M76 15.5 v5"
        {...hatch}
      />
      {/* facet line down the shaft */}
      <path d="M64 22.5 L61 66" {...fine} strokeOpacity="0.7" />
      {/* low campus volumes */}
      <path d="M74.8 56 H97 V66" {...fine} />
      <path d="M32 59 H53" {...fine} />
      <SketchTree x={24} y={66} s={1} />
      <GroundShade x={80} n={5} />
      <Baseline />
    </>
  );
}

/* Stop 2: the 1893 Ferris wheel over the Midway */
function MidwayPlaisance() {
  const cars = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return { x: 60 + 26 * Math.cos(a), y: 38 + 26 * Math.sin(a) };
  });
  return (
    <>
      <circle cx="60" cy="38" r="26" {...contour} />
      <circle cx="60" cy="38" r="22.5" {...hatch} />
      {cars.map((c, i) => (
        <path key={i} d={`M60 38 L${c.x.toFixed(1)} ${c.y.toFixed(1)}`} {...fine} strokeOpacity="0.7" />
      ))}
      {cars.map((c, i) => (
        <rect key={`c${i}`} x={c.x - 2.6} y={c.y} width="5.2" height="4.2" rx="0.5" {...fine} />
      ))}
      <path d="M60 38 L47 66 M60 38 L73 66" {...contour} />
      <path d="M54 52.8 L66.5 52.8" {...fine} />
      <circle cx="60" cy="38" r="3.2" fill={BRASS} stroke={INK} strokeWidth="1.4" />
      <GroundShade x={78} n={5} />
      <Baseline />
    </>
  );
}

/* Stop 3: the Cheney-Goode memorial bench */
function CheneyGoode() {
  return (
    <>
      <path d="M28 38 Q60 28 92 38" {...contour} />
      <path d="M28 38 V47 M92 38 V47" {...contour} />
      <path d="M28 47 Q60 37 92 47" {...fine} />
      <path d="M33 53 Q60 48 87 53" {...contour} />
      <path d="M37 53 V66 M83 53 V66" {...contour} />
      {/* shade beneath the seat slab */}
      <path d="M42 57 l4 -3 M50 57 l4 -3 M58 56 l4 -3 M66 56 l4 -3 M74 57 l4 -3" {...hatch} />
      <SketchTree x={102} y={66} s={0.85} />
      <circle cx="22" cy="18" r="5" stroke={BRASS} strokeWidth="1.6" fill="none" />
      <GroundShade x={16} n={3} />
      <Baseline />
    </>
  );
}

/* Stop 4: the Museum of Science and Industry dome across the basin */
function ColumbiaBasin() {
  return (
    <>
      <path d="M47 34 A13 13 0 0 1 73 34" {...contour} />
      {/* curved hatch inside the dome's shaded side */}
      <path d="M64 23.5 A12 12 0 0 1 70.5 31 M66.5 25.5 A9 9 0 0 1 71 31.5" {...hatch} />
      <path d="M60 21 v-4" {...fine} />
      <path d="M34 48 V34 H86 V48" {...contour} />
      <path d="M39 37v11M45 37v11M51 37v11M57 37v11M63 37v11M69 37v11M75 37v11M81 37v11" {...fine} strokeOpacity="0.8" />
      <path d="M29 48 H91" {...contour} />
      <path d="M20 56 H100 M26 61 H94 M20 66 H100" {...water} />
    </>
  );
}

/* Stop 5: the Clarence Darrow Bridge, one wide stone arch */
function DarrowBridge() {
  return (
    <>
      <path d="M18 40 H102" {...contour} />
      <path d="M22 33 H98" {...fine} />
      <path d="M26 33v7M34 33v7M42 33v7M50 33v7M58 33v7M66 33v7M74 33v7M82 33v7M90 33v7" {...fine} strokeOpacity="0.8" />
      <path d="M28 40 V58 M92 40 V58" {...contour} />
      <path d="M36 58 A28 15 0 0 1 84 58" {...contour} />
      {/* stone shading under the deck, inside the arch */}
      <path d="M42 49 l4 -4 M50 46.5 l4 -4 M58 45.5 l4 -4 M66 46 l4 -4 M74 48 l4 -4" {...hatch} />
      <path d="M14 62 H50 M62 62 H106 M24 67 H96" {...water} />
    </>
  );
}

/* Stop 6: the moon bridge in the Garden of the Phoenix */
function GardenOfThePhoenix() {
  return (
    <>
      <path d="M24 62 Q60 16 96 62" {...contour} />
      <path d="M30 64 Q60 26 90 64" {...fine} />
      <path d="M33 55 l-3 -5 M43 45 l-3 -5 M53 39 l-2 -5.5 M67 39 l2 -5.5 M77 45 l3 -5 M87 55 l3 -5" {...fine} />
      <path d="M28 50 Q60 8 92 50" {...fine} strokeOpacity="0.9" />
      {/* shade under the far side of the arch */}
      <path d="M70 56 l3.4 -3.4 M76 60 l3.4 -3.4 M82 63 l3.4 -3.4" {...hatch} />
      <path d="M14 70 H52 M66 70 H106" {...water} />
      <path d="M8 10 C22 13 30 17 40 25 M22 13 l2 -5 M32 19 l4 -4" {...fine} />
      <circle cx="26" cy="9" r="1.9" fill={RUST} />
      <circle cx="37" cy="14" r="1.9" fill={RUST} />
      <circle cx="44" cy="22" r="1.9" fill={RUST} />
      <circle cx="16" cy="13" r="1.6" fill={RUST} />
    </>
  );
}

/* Stop 7: a bur oak on Wooded Island, one warbler perched low */
function WoodedIsland() {
  return (
    <>
      <path d="M60 66 V46" {...contour} />
      <path d="M60 52 C52 46 46 42 41 38 M60 49 C68 43 74 39 79 35" {...contour} />
      {/* one scalloped canopy mass instead of three balloons */}
      <path
        d="M36 38 C30 36 29 28 35 25 C34 17 44 12 50 16 C54 8 68 8 72 16 C79 13 87 19 85 26 C90 29 89 37 83 38 C76 42 44 42 36 38 Z"
        {...fine}
      />
      <path d="M44 32 l6 -6 M52 30 l7 -7 M61 29 l7 -7 M70 31 l5 -5" {...hatch} />
      {/* warbler on the left bough */}
      <path d="M40.5 37.5 c-2.6 -0.6 -3.4 -3.4 -1.2 -4.6 c1.8 -1 4 0 4.2 2 l3.6 1.4" {...fine} />
      <circle cx="41.8" cy="33.6" r="0.9" fill={INK} />
      <path d="M20 66 l3 -4 M27 66 l3 -4 M90 66 l3 -4 M97 66 l3 -4" {...hatch} />
      <Baseline />
    </>
  );
}

/* Stop 8: the Statue of the Republic, the Golden Lady: robed figure,
   orb and eagle raised in one hand, staff in the other, tall plinth */
function StatueOfTheRepublic() {
  return (
    <>
      {/* plinth, hatched */}
      <path d="M52 44 H68 M54 44 V66 M66 44 V66 M49 66 H71" {...contour} />
      <path d="M56 50 l6.5 -4 M56 57 l8 -5 M56 64 l8 -5" {...hatch} />
      {/* robe, the only gilded thing in the park */}
      <path
        d="M56.5 44 C56.5 34 57.2 28.5 58.4 24 L61.6 24 C62.8 28.5 63.5 34 63.5 44 Z"
        fill={BRASS}
        fillOpacity="0.4"
        stroke={INK}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="18.6" r="2.8" {...contour} />
      {/* raised arm with the orb, a tiny eagle above it */}
      <path d="M61.5 25 C64.5 21.5 66.5 18.5 67 15.5" {...contour} />
      <circle cx="67.6" cy="13" r="2.4" stroke={INK} strokeWidth="1.4" fill={BRASS} fillOpacity="0.4" />
      <path d="M65.2 9.6 c1 -1.6 2.4 -1.8 3.4 -0.6 M68.6 9 c1 -1.2 2.4 -1 3.2 0.2" {...fine} strokeWidth="1" />
      {/* lowered hand gripping the tall staff */}
      <path d="M58.5 25 C56 27.5 54 29.5 52.5 30.5" {...contour} />
      <path d="M52.5 12 V42" {...fine} />
      <GroundShade x={76} n={4} />
      <Baseline x0={26} x1={94} />
    </>
  );
}

/* Stop 9: the walk itself, a miniature of the loop with the tower
   where it starts and ends */
function BackAtTheCenter() {
  return (
    <>
      {/* the route loop, drawn like the map's own line: south along
          the lagoon, west at the bottom, and back north to the start */}
      <path
        d="M50 24 C60 18 71 22 74 32 C78 45 75 58 65 64 C56 69 45 65 42 54 C39 44 42 30 50 24 Z"
        {...fine}
        strokeWidth="1.6"
      />
      {/* Wooded Island sits inside the loop, hatched like the map */}
      <path d="M58 36 C62.5 40 62.5 51 58 56 C53.5 51 53.5 40 58 36 Z" {...fine} strokeWidth="1.1" />
      <path d="M56.4 42 l3.4 -3.4 M56.4 48 l3.4 -3.4" {...hatch} />
      {/* stop points along the way */}
      <circle cx="74.6" cy="34" r="1.7" {...fine} />
      <circle cx="64" cy="63.6" r="1.7" {...fine} />
      <circle cx="41.6" cy="50" r="1.7" {...fine} />
      {/* the tower at the start, seen again at the end */}
      <path d="M46.5 23 L45 9 L57 9 L55.5 23" {...contour} />
      <path d="M46 11.5 H56 M46.4 15 H55.6" {...hatch} />
      {/* the start medallion, brass like the map's markers */}
      <circle cx="51" cy="24.5" r="3.4" fill={BRASS} fillOpacity="0.5" stroke={INK} strokeWidth="1.4" />
      <GroundShade x={82} y={66} n={4} />
    </>
  );
}

const PLATES: Record<string, () => ReactNode> = {
  "obama-center": ObamaCenter,
  "midway-plaisance": MidwayPlaisance,
  "cheney-goode": CheneyGoode,
  "columbia-basin": ColumbiaBasin,
  "darrow-bridge": DarrowBridge,
  "garden-of-the-phoenix": GardenOfThePhoenix,
  "wooded-island": WoodedIsland,
  "statue-of-the-republic": StatueOfTheRepublic,
  "back-at-the-center": BackAtTheCenter,
};

export default function StopVignette({
  stopId,
  className = "",
}: {
  stopId: string;
  className?: string;
}) {
  const Plate = PLATES[stopId];
  if (!Plate) return null;
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className={className}>
      <Plate />
    </svg>
  );
}
