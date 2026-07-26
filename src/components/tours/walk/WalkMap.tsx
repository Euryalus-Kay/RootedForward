"use client";

// ------------------------------------------------------------------
// The tour map. A hand-styled SVG built from Census TIGER/Line
// geometry (public domain), drawn in the site palette so it reads
// like a printed museum map rather than an embedded web map. No
// tiles, no tokens, no external requests.
// ------------------------------------------------------------------
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { WalkStop } from "@/lib/tours/walk-types";
import {
  METERS_PER_UNIT,
  WALK_GEOMETRY,
  projectPoint,
} from "@/lib/tours/walk-utils";

interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface WalkMapProps {
  stops: WalkStop[];
  route: [number, number][];
  detourRoutes?: [number, number][][];
  activeIndex: number;
  visitedIds: ReadonlySet<string>;
  userPos: UserPosition | null;
  onSelectStop: (index: number) => void;
}

// The printed base plate under the drawn map: the USGS Jackson Park
// quadrangle, 1929 edition (public domain), reprojected and cropped
// to exactly the geometry frame, flattened onto cream as one ink.
const BASE_MAP_SRC = "/media/hyde-park-walk/map-base-1929.jpg";

// anchored to survive the route-fitted viewBox clamp; keep every
// label inside roughly lng -87.608..-87.576, lat 41.802..41.784
const PLACE_LABELS: { text: string; lat: number; lng: number; size: number }[] = [
  { text: "Lake Michigan", lat: 41.797, lng: -87.5755, size: 13 },
  { text: "Hyde Park", lat: 41.7973, lng: -87.5975, size: 15 },
  { text: "Midway Plaisance", lat: 41.78635, lng: -87.6005, size: 11 },
  { text: "Jackson Park", lat: 41.7867, lng: -87.5805, size: 12 },
  { text: "Woodlawn", lat: 41.7828, lng: -87.5955, size: 11 },
  { text: "Washington Park", lat: 41.7943, lng: -87.6094, size: 10 },
  { text: "University of Chicago", lat: 41.79, lng: -87.5997, size: 9 },
  { text: "Nichols Park", lat: 41.7972, lng: -87.5943, size: 8 },
];

// street names set along their streets, like a printed map's fine type
const STREET_LABELS: { text: string; lat: number; lng: number; rotate: number; size: number }[] = [
  { text: "E Hyde Park Blvd", lat: 41.8026, lng: -87.5948, rotate: 0, size: 8 },
  { text: "E 53rd St", lat: 41.8001, lng: -87.591, rotate: 0, size: 9 },
  { text: "E 55th St", lat: 41.7957, lng: -87.5993, rotate: 0, size: 9 },
  { text: "E 57th St", lat: 41.7921, lng: -87.5911, rotate: 0, size: 9 },
  { text: "E 60th St", lat: 41.7846, lng: -87.599, rotate: 0, size: 8 },
  { text: "E 61st St", lat: 41.78415, lng: -87.6091, rotate: 0, size: 8 },
  { text: "E 63rd St", lat: 41.78055, lng: -87.5989, rotate: 0, size: 8 },
  { text: "Lake Park Ave", lat: 41.7967, lng: -87.58722, rotate: -87, size: 9 },
  { text: "Woodlawn Ave", lat: 41.7938, lng: -87.5968, rotate: -90, size: 9 },
  { text: "Ellis Ave", lat: 41.7958, lng: -87.6015, rotate: -90, size: 8 },
  { text: "University Ave", lat: 41.7942, lng: -87.5986, rotate: -90, size: 8 },
  { text: "Kimbark Ave", lat: 41.7987, lng: -87.5953, rotate: -90, size: 8 },
  { text: "Harper Ave", lat: 41.7972, lng: -87.5889, rotate: -90, size: 8 },
  { text: "Cottage Grove Ave", lat: 41.7935, lng: -87.6069, rotate: -90, size: 8 },
  { text: "Stony Island Ave", lat: 41.7852, lng: -87.5873, rotate: -90, size: 8 },
];

// soft green ground for the parks; boundaries are streets, the lake
// polygon paints over the eastern overhang
const PARK_AREAS: [number, number][][] = [
  // Jackson Park: 56th down past the frame, Stony Island to the lake
  [
    [41.7936, -87.587],
    [41.7936, -87.566],
    [41.7737, -87.556],
    [41.7737, -87.587],
  ],
  // Midway Plaisance strip: 59th to 60th, lake side to Washington Park
  [
    [41.7872, -87.5868],
    [41.7872, -87.613],
    [41.7854, -87.613],
    [41.7854, -87.5868],
  ],
  // Washington Park: west of Cottage Grove
  [
    [41.8045, -87.6063],
    [41.8045, -87.618],
    [41.7815, -87.618],
    [41.7815, -87.6063],
  ],
  // Nichols Park: 53rd to 55th between Kimbark and Kenwood
  [
    [41.7994, -87.5948],
    [41.7994, -87.5935],
    [41.7953, -87.5935],
    [41.7953, -87.5948],
  ],
  // Harold Washington Park: 51st to 53rd east of Hyde Park Blvd
  [
    [41.8032, -87.5827],
    [41.8032, -87.579],
    [41.7994, -87.579],
    [41.7994, -87.5827],
  ],
];

// the university's main quadrangles, tinted the way printed maps mark
// institutions, warm and slightly apart from the parks' green
const CAMPUS_AREAS: [number, number][][] = [
  [
    [41.7921, -87.6014],
    [41.7921, -87.5977],
    [41.7885, -87.5977],
    [41.7885, -87.6014],
  ],
];

// where each stop's name sits relative to its marker; below unless a
// neighbor would collide with the label
const STOP_LABEL_SIDE: Record<string, "below" | "left" | "right"> = {
  "cornells-stone": "left",
  "lake-park-tracks": "right",
  "harper-court": "left",
  "obama-center": "right",
};

const lineD = (pts: number[][]) =>
  "M" + pts.map((p) => `${p[0]},${p[1]}`).join("L");

export default function WalkMap({
  stops,
  route,
  detourRoutes,
  activeIndex,
  visitedIds,
  userPos,
  onSelectStop,
}: WalkMapProps) {
  const geo = WALK_GEOMETRY;
  const reduceMotion = useReducedMotion();

  // hover opens the HTML card above the map; the marker itself only
  // grows slightly. Draw order stays fixed, because re-appending a
  // hovered SVG node fires pointer-leave and kills its own hover.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /** the stop's little photo, same thumbnail the plate index uses */
  const markerThumb = (stop: WalkStop) =>
    (stop.nowImage ?? stop.images[0])?.src.replace(
      /\/media\/([^/]+)\//,
      "/media/$1/thumbs/"
    );

  // frame the view on the MAIN route with generous padding, clamped
  // to the prepared geometry frame. The optional detours sit outside
  // this crop on purpose; their dashed spur exits the bottom edge, so
  // the plate stays zoomed on the walk itself.
  const viewBox = useMemo(() => {
    const pts = [
      ...route.map(([lat, lng]) => projectPoint(lat, lng)),
      ...stops.filter((s) => !s.optional).map((s) => projectPoint(s.lat, s.lng)),
    ];
    if (!pts.length) return `0 0 ${geo.viewBox.w} ${geo.viewBox.h}`;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const pad = 88;
    const x0 = Math.max(0, Math.min(...xs) - pad - 30);
    const y0 = Math.max(0, Math.min(...ys) - pad);
    const x1 = Math.min(geo.viewBox.w, Math.max(...xs) + pad);
    const y1 = Math.min(geo.viewBox.h, Math.max(...ys) + pad);
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [route, stops, geo.viewBox.w, geo.viewBox.h]);

  const routeD = useMemo(
    () => lineD(route.map(([lat, lng]) => { const p = projectPoint(lat, lng); return [p.x, p.y]; })),
    [route]
  );

  const user = userPos ? projectPoint(userPos.lat, userPos.lng) : null;
  const accuracyR = userPos
    ? Math.min(120, Math.max(10, userPos.accuracy / METERS_PER_UNIT))
    : 0;

  const quarterMileUnits = 402.3 / METERS_PER_UNIT;
  const vb = viewBox.split(" ").map(Number);
  const hoveredStop = hoveredId
    ? stops.find((s) => s.id === hoveredId) ?? null
    : null;

  return (
    <div className="relative">
    <svg
      viewBox={viewBox}
      className="block h-auto w-full"
      role="group"
      aria-label="Map of the tour route through Hyde Park with numbered stops. The same stops are listed in order below the map."
    >
      {/* engraver's water: pale wash under fine horizontal hatching,
          the way lagoons are ruled on printed park maps */}
      <defs>
        <pattern id="walk-hatch" patternUnits="userSpaceOnUse" width="8" height="7">
          <line x1="0" y1="3.5" x2="8" y2="3.5" stroke="#4A6B8A" strokeOpacity="0.4" strokeWidth="1.1" />
        </pattern>
      </defs>

      {/* the 1929 survey plate under everything: building fabric,
          shoreline hachures, and lagoon engraving from the year the
          covenants went up */}
      <image
        href={BASE_MAP_SRC}
        x="0"
        y="0"
        width={geo.viewBox.w}
        height={geo.viewBox.h}
        preserveAspectRatio="none"
        aria-hidden="true"
      />

      {/* park ground */}
      <g>
        {PARK_AREAS.map((ring, i) => (
          <path
            key={i}
            d={
              "M" +
              ring
                .map(([lat, lng]) => {
                  const p = projectPoint(lat, lng);
                  return `${p.x},${p.y}`;
                })
                .join("L") +
              "Z"
            }
            fill="#1B3A2D"
            fillOpacity="0.07"
          />
        ))}
        {CAMPUS_AREAS.map((ring, i) => (
          <path
            key={`c${i}`}
            d={
              "M" +
              ring
                .map(([lat, lng]) => {
                  const p = projectPoint(lat, lng);
                  return `${p.x},${p.y}`;
                })
                .join("L") +
              "Z"
            }
            fill="#C9A227"
            fillOpacity="0.07"
            stroke="#C9A227"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* water */}
      <g>
        {geo.water.map((w, i) => (
          <g key={i}>
            <path d={lineD(w.ring) + "Z"} fill="#4A6B8A" fillOpacity="0.14" />
            <path d={lineD(w.ring) + "Z"} fill="url(#walk-hatch)" />
            <path
              d={lineD(w.ring) + "Z"}
              fill="none"
              stroke="#4A6B8A"
              strokeOpacity="0.6"
              strokeWidth="1.6"
            />
          </g>
        ))}
      </g>

      {/* streets, three engraved weights: alley hairlines, local
          streets, then the arterials over them */}
      {/* alleys drop to a whisper now that the 1929 plate carries the
          block fabric underneath */}
      <g stroke="#B5AFA4" strokeOpacity="0.16" strokeWidth="0.6" fill="none">
        {geo.roads.alleys.map((l, i) => (
          <path key={i} d={lineD(l)} />
        ))}
      </g>
      <g stroke="#B5AFA4" strokeOpacity="0.6" strokeWidth="1.3" fill="none">
        {geo.roads.locals.map((l, i) => (
          <path key={i} d={lineD(l)} />
        ))}
      </g>
      <g stroke="#8A8578" strokeOpacity="0.75" strokeWidth="2.6" fill="none">
        {geo.roads.arterials.map((l, i) => (
          <path key={i} d={lineD(l)} />
        ))}
      </g>

      {/* the railroad, drawn the old way: a center line with cross
          ties. The IC embankment is the spine of this tour's story. */}
      <g aria-hidden="true">
        {geo.rails.map((l, i) => (
          <g key={i}>
            <path d={lineD(l)} fill="none" stroke="#6E6A5E" strokeOpacity="0.8" strokeWidth="1.5" />
            <path
              d={lineD(l)}
              fill="none"
              stroke="#6E6A5E"
              strokeOpacity="0.8"
              strokeWidth="7"
              strokeDasharray="1.3 9"
            />
          </g>
        ))}
      </g>

      {/* dashed spurs out to the optional detour stops */}
      {detourRoutes?.map((spur, i) => {
        const d = lineD(
          spur.map(([lat, lng]) => {
            const p = projectPoint(lat, lng);
            return [p.x, p.y];
          })
        );
        return (
          <g key={`detour-${i}`}>
            <path
              d={d}
              fill="none"
              stroke="#F5F0E8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.8"
            />
            {/* green, not the route's rust and not the rails' gray,
                so a detour reads as a choice rather than a wrong turn */}
            <path
              d={d}
              fill="none"
              stroke="#1B3A2D"
              strokeWidth="2.2"
              strokeDasharray="7 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.9"
            />
          </g>
        );
      })}

      {/* route */}
      <path
        d={routeD}
        fill="none"
        stroke="#F5F0E8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.85"
      />
      <path
        d={routeD}
        fill="none"
        stroke="#C45D3E"
        strokeWidth="3.2"
        strokeDasharray="1 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* street names in fine italic, rotated along their streets */}
      <g aria-hidden="true">
        {STREET_LABELS.map((l) => {
          const p = projectPoint(l.lat, l.lng);
          return (
            <text
              key={l.text}
              transform={`translate(${p.x} ${p.y}) rotate(${l.rotate})`}
              fontSize={l.size}
              fill="#8A8578"
              fontStyle="italic"
              fontFamily="var(--font-display), Georgia, serif"
              textAnchor="middle"
              letterSpacing="0.06em"
              paintOrder="stroke"
              stroke="#F5F0E8"
              strokeWidth="2.5"
            >
              {l.text}
            </text>
          );
        })}
      </g>

      {/* place labels sit above the route, with a cream halo so the
          dotted line never cuts through a word */}
      <g aria-hidden="true">
        {PLACE_LABELS.map((l) => {
          const p = projectPoint(l.lat, l.lng);
          return (
            <text
              key={l.text}
              x={p.x}
              y={p.y}
              fontSize={l.size}
              fill="#8A8578"
              fontStyle="italic"
              fontFamily="var(--font-display), Georgia, serif"
              textAnchor="middle"
              letterSpacing="0.08em"
              paintOrder="stroke"
              stroke="#F5F0E8"
              strokeWidth="3"
            >
              {l.text}
            </text>
          );
        })}
      </g>

      {/* user location */}
      {user && (
        <g aria-hidden="true">
          <circle
            cx={user.x}
            cy={user.y}
            r={accuracyR}
            fill="#4A6B8A"
            fillOpacity="0.12"
            stroke="#4A6B8A"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
          <circle className="walk-user-pulse" cx={user.x} cy={user.y} r="16" fill="#4A6B8A" fillOpacity="0.25" />
          <circle cx={user.x} cy={user.y} r="7.5" fill="#4A6B8A" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      )}

      {/* every stop's name, printed under (or beside) its marker the
          way a real map names its landmarks; kept outside the marker
          groups so hover growth never moves the type */}
      <g aria-hidden="true">
        {stops.map((stop, i) => {
          const p = projectPoint(stop.lat, stop.lng);
          const r = i === activeIndex ? 21 : 16;
          const side = STOP_LABEL_SIDE[stop.id] ?? "below";
          const x = side === "left" ? p.x - r - 8 : side === "right" ? p.x + r + 8 : p.x;
          const y = side === "below" ? p.y + r + 13 : p.y + 3.5;
          return (
            <text
              key={stop.id}
              x={x}
              y={y}
              textAnchor={side === "left" ? "end" : side === "right" ? "start" : "middle"}
              fontSize="9.5"
              fontWeight="600"
              fill="#3D3A33"
              fontFamily="var(--font-plat), 'Arial Narrow', sans-serif"
              letterSpacing="0.03em"
              paintOrder="stroke"
              stroke="#F5F0E8"
              strokeWidth="3"
            >
              {stop.mapLabel}
            </text>
          );
        })}
      </g>

      {/* stops: framed photographs of each site, the same pictures as
          the plate index. Hover one and its card opens. */}
      <g>
        {stops.map((stop, i) => {
          const p = projectPoint(stop.lat, stop.lng);
          const active = i === activeIndex;
          const visited = visitedIds.has(stop.id);
          const r = active ? 21 : 16;
          const thumb = markerThumb(stop);
          const bx = p.x + r * 0.72;
          const by = p.y + r * 0.72;
          // hit area stays generous but never reaches into a
          // neighboring medallion's disc; later markers draw on top,
          // so an oversized halo would steal its neighbor's taps
          let nearest = Infinity;
          for (let j = 0; j < stops.length; j++) {
            if (j === i) continue;
            const q = projectPoint(stops[j].lat, stops[j].lng);
            const d = Math.hypot(q.x - p.x, q.y - p.y);
            if (d < nearest) nearest = d;
          }
          const hitR = Math.max(14, Math.min(28, nearest / 2));
          return (
            <motion.g
              key={stop.id}
              role="button"
              tabIndex={0}
              aria-label={`${stop.optional ? "Optional detour" : "Stop"} ${stop.number}. ${stop.title}.${active ? " Current stop." : ""}`}
              onClick={() => onSelectStop(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStop(i);
                }
              }}
              onHoverStart={() => setHoveredId(stop.id)}
              onHoverEnd={() => setHoveredId((h) => (h === stop.id ? null : h))}
              className="walk-marker cursor-pointer"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              whileHover={{
                scale: reduceMotion ? 1 : 1.22,
                transition: { type: "spring", bounce: 0.3, duration: 0.35, delay: 0 },
              }}
            >
              <circle cx={p.x} cy={p.y} r={hitR} fill="transparent" />
              {active && (
                <circle className="walk-stop-pulse" cx={p.x} cy={p.y} r="24" fill="#C45D3E" fillOpacity="0.25" />
              )}
              {/* the photograph in a round engraved frame */}
              <clipPath id={`walk-mk-${stop.id}`}>
                <circle cx={p.x} cy={p.y} r={r - 1} />
              </clipPath>
              <circle cx={p.x} cy={p.y} r={r} fill="#F5F0E8" />
              {thumb && (
                <image
                  href={thumb}
                  x={p.x - r}
                  y={p.y - r}
                  width={r * 2}
                  height={r * 2}
                  clipPath={`url(#walk-mk-${stop.id})`}
                  preserveAspectRatio="xMidYMid slice"
                  pointerEvents="none"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill="none"
                stroke={active ? "#C45D3E" : "#1B3A2D"}
                strokeWidth={active ? 3 : 2}
                // detour stops wear a dashed frame, matching their spur
                strokeDasharray={stop.optional && !active ? "3.5 2.5" : undefined}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={r - 2.2}
                fill="none"
                stroke={active ? "#F5F0E8" : "#C9A227"}
                strokeOpacity={active ? 0.6 : 0.9}
                strokeWidth="1"
              />
              {/* number badge, stamped over the frame's lower corner */}
              <circle
                cx={bx}
                cy={by}
                r={active ? 8.5 : 7.4}
                fill={active ? "#C45D3E" : visited ? "#1B3A2D" : "#F5F0E8"}
                stroke={active ? "#F5F0E8" : "#1B3A2D"}
                strokeWidth="1.3"
              />
              <text
                x={bx}
                y={by}
                dy="0.36em"
                textAnchor="middle"
                fontSize={active ? 10.5 : 9.6}
                fontWeight="600"
                fill={active || visited ? "#F5F0E8" : "#1B3A2D"}
                fontFamily="var(--font-display), Georgia, serif"
                pointerEvents="none"
              >
                {stop.number}
              </text>
            </motion.g>
          );
        })}
      </g>

      {/* plate furniture pinned to the current view: corner trim
          marks, a split scale bar, and a compass rose */}
      <g aria-hidden="true">
        {([[1, 1], [-1, 1], [1, -1], [-1, -1]] as const).map(([sx, sy], i) => {
          const cx = sx > 0 ? vb[0] + 10 : vb[0] + vb[2] - 10;
          const cy = sy > 0 ? vb[1] + 10 : vb[1] + vb[3] - 10;
          return (
            <path
              key={i}
              d={`M${cx} ${cy + sy * 9} V${cy} H${cx + sx * 9}`}
              fill="none"
              stroke="#1A1A1A"
              strokeOpacity="0.3"
              strokeWidth="1.4"
            />
          );
        })}
        {/* where the detour spur leaves the plate, say where it goes */}
        <text
          x={vb[0] + vb[2] / 2}
          y={vb[1] + vb[3] - 8}
          textAnchor="middle"
          fontSize="10"
          fontStyle="italic"
          fill="#6E6A5E"
          fontFamily="var(--font-display), Georgia, serif"
          paintOrder="stroke"
          stroke="#F5F0E8"
          strokeWidth="3"
        >
          Green detours to the Hansberry house and Daley&apos;s continue southwest
        </text>
        <g transform={`translate(${vb[0] + 24}, ${vb[1] + vb[3] - 26})`}>
          <rect x="0" y="-2" width={quarterMileUnits / 2} height="4" fill="#1A1A1A" fillOpacity="0.55" />
          <rect x={quarterMileUnits / 2} y="-2" width={quarterMileUnits / 2} height="4" fill="none" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="1.2" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="1.6" />
          <line x1={quarterMileUnits} y1="-6" x2={quarterMileUnits} y2="6" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="1.6" />
          <text x={quarterMileUnits / 2} y="-10" textAnchor="middle" fontSize="11" fill="#1A1A1A" fillOpacity="0.6" fontStyle="italic" fontFamily="var(--font-display), Georgia, serif">
            1/4 mile
          </text>
        </g>
        <g transform={`translate(${vb[0] + vb[2] - 36}, ${vb[1] + 42})`}>
          <circle r="15" fill="none" stroke="#1A1A1A" strokeOpacity="0.35" strokeWidth="1" />
          <path
            d="M0,-13 L2.6,-2.6 L13,0 L2.6,2.6 L0,13 L-2.6,2.6 L-13,0 L-2.6,-2.6 Z"
            fill="#F5F0E8"
            stroke="#1A1A1A"
            strokeOpacity="0.55"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M0,-13 L2.6,-2.6 L0,0 Z" fill="#C45D3E" fillOpacity="0.85" />
          <circle r="1.6" fill="#1A1A1A" fillOpacity="0.6" />
          <text x="0" y="-19" textAnchor="middle" fontSize="11" fill="#1A1A1A" fillOpacity="0.6" fontFamily="var(--font-display), Georgia, serif">
            N
          </text>
        </g>
      </g>
    </svg>

    {/* the hover card: the stop's photograph and name springing up
        from its marker, a label you can actually see */}
    {hoveredStop &&
      (() => {
        const p = projectPoint(hoveredStop.lat, hoveredStop.lng);
        const leftPct = ((p.x - vb[0]) / vb[2]) * 100;
        const topPct = ((p.y - vb[1]) / vb[3]) * 100;
        const below = topPct < 32;
        const thumb = markerThumb(hoveredStop);
        return (
          <div
            data-testid="walk-hover-card"
            className="pointer-events-none absolute z-10 hidden md:block"
            style={{
              left: `${Math.min(86, Math.max(14, leftPct))}%`,
              top: `${topPct}%`,
              transform: `translate(-50%, ${below ? "30px" : "calc(-100% - 30px)"})`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: below ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", bounce: 0.34, duration: 0.4 }
              }
              className="walk-plate w-44 rounded-[3px] p-1.5"
            >
              {thumb && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumb}
                  alt=""
                  className="aspect-[3/2] w-full rounded-[1px] object-cover"
                />
              )}
              <p className="px-1 pb-0.5 pt-1.5 text-center font-body text-[11px] font-semibold leading-tight text-ink">
                <span className="text-rust">{hoveredStop.number}.</span>{" "}
                {hoveredStop.title}
              </p>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
