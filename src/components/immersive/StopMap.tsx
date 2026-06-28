"use client";

import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  StopMap: an interactive locator map of a tour's stops, plotted from */
/*  their real coordinates. Click a point to jump to that chapter.     */
/*  Styled to match the film's locator-map look (ink ground, a hint of  */
/*  the lake on the east, cream and rust markers).                      */
/* ------------------------------------------------------------------ */

interface MapStop {
  id: string;
  title: string;
  lat: number;
  lng: number;
  kicker?: string;
}

const W = 240;
const H = 300;
const PAD = 0.0055;

export default function StopMap({
  stops,
  activeIndex,
  onSelect,
}: {
  stops: MapStop[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(() => {
    if (stops.length === 0) return [];
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats) - PAD;
    const maxLat = Math.max(...lats) + PAD;
    const minLng = Math.min(...lngs) - PAD;
    const maxLng = Math.max(...lngs) + PAD;
    const sx = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * W;
    const sy = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * H;
    return stops.map((s) => ({ x: sx(s.lng), y: sy(s.lat) }));
  }, [stops]);

  if (stops.length === 0) return null;

  const shown = hover ?? activeIndex;
  const gridX = [0.2, 0.4, 0.6, 0.8].map((f) => f * W);
  const gridY = [0.2, 0.4, 0.6, 0.8].map((f) => f * H);

  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="group"
        aria-label="Map of tour stops"
      >
        <rect x={0} y={0} width={W} height={H} fill="#121712" />
        {/* Lake Michigan, hinted on the east edge */}
        <path
          d={`M ${W * 0.8} 0 Q ${W * 0.74} ${H * 0.5} ${W * 0.82} ${H} L ${W} ${H} L ${W} 0 Z`}
          fill="#26403f"
        />
        <text
          x={W * 0.9}
          y={H * 0.5}
          fill="#d2e0de"
          opacity={0.45}
          fontSize={7}
          letterSpacing={2}
          textAnchor="middle"
          transform={`rotate(90 ${W * 0.9} ${H * 0.5})`}
          style={{ fontFamily: "var(--font-body, sans-serif)" }}
        >
          LAKE MICHIGAN
        </text>
        {/* faint street grid */}
        {gridX.map((gx) => (
          <line key={`vx${gx}`} x1={gx} y1={6} x2={gx} y2={H - 6} stroke="#f5f0e8" strokeOpacity={0.05} />
        ))}
        {gridY.map((gy) => (
          <line key={`hy${gy}`} x1={6} y1={gy} x2={W - 6} y2={gy} stroke="#f5f0e8" strokeOpacity={0.05} />
        ))}
        {/* stops, plotted by real coordinates (no connecting path, since
            the chapters are not in geographic order) */}
        {stops.map((s, i) => {
          const p = pts[i];
          const active = i === shown;
          return (
            <g
              key={s.id}
              transform={`translate(${p.x} ${p.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              role="button"
              tabIndex={0}
              aria-label={`Go to ${s.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
            >
              {active && <circle r={9} fill="#c45d3e" opacity={0.22} />}
              <circle
                r={active ? 6 : 4.5}
                fill={active ? "#c45d3e" : "#f5f0e8"}
                stroke="#121712"
                strokeWidth={1.5}
              />
              <text
                y={active ? 1.2 : 1}
                fontSize={active ? 7.5 : 6.5}
                fill={active ? "#fff" : "#121712"}
                textAnchor="middle"
                style={{ fontFamily: "var(--font-body, sans-serif)", fontWeight: 700 }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="border-t border-border bg-cream-dark/60 px-3 py-2">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-rust">
          {String(shown + 1).padStart(2, "0")} {stops[shown]?.kicker ?? ""}
        </p>
        <p className="mt-0.5 font-body text-[13px] leading-snug text-forest">
          {stops[shown]?.title}
        </p>
      </div>
    </div>
  );
}
