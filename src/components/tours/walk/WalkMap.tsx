"use client";

// ------------------------------------------------------------------
// The tour map. A hand-styled SVG built from Census TIGER/Line
// geometry (public domain), drawn in the site palette so it reads
// like a printed museum map rather than an embedded web map. No
// tiles, no tokens, no external requests.
// ------------------------------------------------------------------
import { useMemo } from "react";
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
  activeIndex: number;
  visitedIds: ReadonlySet<string>;
  userPos: UserPosition | null;
  onSelectStop: (index: number) => void;
}

// anchored to survive the route-fitted viewBox clamp; keep every
// label inside roughly lng -87.592..-87.577, lat 41.791..41.778
const PLACE_LABELS: { text: string; lat: number; lng: number; size: number }[] = [
  { text: "Lake Michigan", lat: 41.7896, lng: -87.5795, size: 13 },
  { text: "Midway Plaisance", lat: 41.78635, lng: -87.5901, size: 11 },
  { text: "Wooded Island", lat: 41.7839, lng: -87.5845, size: 11 },
  { text: "Jackson Park", lat: 41.779, lng: -87.5845, size: 15 },
];

// street names set along their streets, like a printed map's fine type
const STREET_LABELS: { text: string; lat: number; lng: number; rotate: number; size: number }[] = [
  { text: "Stony Island Ave", lat: 41.7815, lng: -87.5869, rotate: -90, size: 9 },
  { text: "Cornell Dr", lat: 41.7826, lng: -87.5815, rotate: -75, size: 9 },
  { text: "Hayes Dr", lat: 41.7756, lng: -87.5832, rotate: -7, size: 9 },
];

// soft green ground for the park itself; boundaries are streets, the
// lake polygon paints over the eastern overhang
const PARK_AREAS: [number, number][][] = [
  // Jackson Park: 56th to 67th, Stony Island to the lake
  [
    [41.7936, -87.587],
    [41.7936, -87.566],
    [41.7737, -87.556],
    [41.7737, -87.587],
  ],
  // Midway Plaisance strip: 59th to 60th, west to Cottage Grove
  [
    [41.7872, -87.5868],
    [41.7872, -87.607],
    [41.7854, -87.607],
    [41.7854, -87.5868],
  ],
];

const lineD = (pts: number[][]) =>
  "M" + pts.map((p) => `${p[0]},${p[1]}`).join("L");

export default function WalkMap({
  stops,
  route,
  activeIndex,
  visitedIds,
  userPos,
  onSelectStop,
}: WalkMapProps) {
  const geo = WALK_GEOMETRY;
  const reduceMotion = useReducedMotion();

  // frame the view on the route with generous padding, clamped to the
  // prepared geometry frame
  const viewBox = useMemo(() => {
    const pts = [
      ...route.map(([lat, lng]) => projectPoint(lat, lng)),
      ...stops.map((s) => projectPoint(s.lat, s.lng)),
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

  return (
    <svg
      viewBox={viewBox}
      className="block h-auto w-full"
      role="group"
      aria-label="Map of the tour route through Jackson Park with numbered stops. The same stops are listed in order below the map."
    >
      {/* engraver's water: pale wash under fine horizontal hatching,
          the way lagoons are ruled on printed park maps */}
      <defs>
        <pattern id="walk-hatch" patternUnits="userSpaceOnUse" width="8" height="7">
          <line x1="0" y1="3.5" x2="8" y2="3.5" stroke="#4A6B8A" strokeOpacity="0.4" strokeWidth="1.1" />
        </pattern>
      </defs>

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

      {/* streets */}
      <g stroke="#B5AFA4" strokeOpacity="0.55" strokeWidth="1.4" fill="none">
        {geo.roads.locals.map((l, i) => (
          <path key={i} d={lineD(l)} />
        ))}
      </g>
      <g stroke="#8A8578" strokeOpacity="0.75" strokeWidth="2.6" fill="none">
        {geo.roads.arterials.map((l, i) => (
          <path key={i} d={lineD(l)} />
        ))}
      </g>

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

      {/* stops */}
      <g>
        {stops.map((stop, i) => {
          const p = projectPoint(stop.lat, stop.lng);
          const active = i === activeIndex;
          const visited = visitedIds.has(stop.id);
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
          const hitR = Math.max(13, Math.min(28, nearest / 2));
          return (
            <motion.g
              key={stop.id}
              role="button"
              tabIndex={0}
              aria-label={`Stop ${stop.number}. ${stop.title}.${active ? " Current stop." : ""}`}
              onClick={() => onSelectStop(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStop(i);
                }
              }}
              className="walk-marker cursor-pointer"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              whileHover={{
                scale: reduceMotion ? 1 : 1.14,
                transition: { type: "spring", bounce: 0.4, duration: 0.3, delay: 0 },
              }}
            >
              <circle cx={p.x} cy={p.y} r={hitR} fill="transparent" />
              {active && (
                <circle className="walk-stop-pulse" cx={p.x} cy={p.y} r="24" fill="#C45D3E" fillOpacity="0.25" />
              )}
              {/* medallion: solid disc, then a second hairline ring
                  just inside, like a stamped brass survey marker */}
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 17 : 12}
                fill={active ? "#C45D3E" : visited ? "#1B3A2D" : "#F5F0E8"}
                stroke={active ? "#F5F0E8" : "#1B3A2D"}
                strokeWidth={active ? 2.5 : 2}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 13.5 : 9.5}
                fill="none"
                stroke={active || visited ? "#F5F0E8" : "#C9A227"}
                strokeOpacity={active || visited ? 0.55 : 0.9}
                strokeWidth="1"
              />
              <text
                x={p.x}
                y={p.y}
                dy="0.36em"
                textAnchor="middle"
                fontSize={active ? 15 : 12}
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
  );
}
