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
          <path
            key={i}
            d={lineD(w.ring) + "Z"}
            fill="#4A6B8A"
            fillOpacity="0.3"
            stroke="#4A6B8A"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
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
              fontFamily="Georgia, 'Times New Roman', serif"
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
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: reduceMotion ? 1 : 1.14,
                transition: { type: "spring", bounce: 0.4, duration: 0.3, delay: 0 },
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", bounce: 0.4, duration: 0.55, delay: 0.35 + i * 0.07 }
              }
            >
              {/* oversized invisible hit area so markers are easy to tap */}
              <circle cx={p.x} cy={p.y} r="28" fill="transparent" />
              {active && (
                <circle className="walk-stop-pulse" cx={p.x} cy={p.y} r="24" fill="#C45D3E" fillOpacity="0.25" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 17 : 12}
                fill={active ? "#C45D3E" : visited ? "#1B3A2D" : "#F5F0E8"}
                stroke={active ? "#F5F0E8" : visited ? "#1B3A2D" : "#1B3A2D"}
                strokeWidth={active ? 2.5 : 2}
              />
              <text
                x={p.x}
                y={p.y}
                dy="0.36em"
                textAnchor="middle"
                fontSize={active ? 15 : 12}
                fontWeight="700"
                fill={active || visited ? "#F5F0E8" : "#1B3A2D"}
                fontFamily="var(--font-body)"
                pointerEvents="none"
              >
                {stop.number}
              </text>
            </motion.g>
          );
        })}
      </g>

      {/* scale bar and north arrow, pinned to the current view */}
      <g aria-hidden="true">
        <g transform={`translate(${vb[0] + 24}, ${vb[1] + vb[3] - 26})`}>
          <line x1="0" y1="0" x2={quarterMileUnits} y2="0" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="2" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="2" />
          <line x1={quarterMileUnits} y1="-5" x2={quarterMileUnits} y2="5" stroke="#1A1A1A" strokeOpacity="0.55" strokeWidth="2" />
          <text x={quarterMileUnits / 2} y="-9" textAnchor="middle" fontSize="11" fill="#1A1A1A" fillOpacity="0.6" fontFamily="var(--font-body)">
            1/4 mile
          </text>
        </g>
        <g transform={`translate(${vb[0] + vb[2] - 34}, ${vb[1] + 40})`}>
          <path d="M0,10 L6,-10 L0,-4 L-6,-10 Z" fill="#1A1A1A" fillOpacity="0.55" />
          <text x="0" y="26" textAnchor="middle" fontSize="12" fill="#1A1A1A" fillOpacity="0.6" fontFamily="var(--font-body)">
            N
          </text>
        </g>
      </g>
    </svg>
  );
}
